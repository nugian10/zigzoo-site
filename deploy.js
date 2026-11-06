// Zigzoo — browser-wallet deploy page logic (owner tool).
// Uses ONLY the connected browser wallet (MetaMask / injected
// provider) to sign. This page NEVER asks for, accepts, or
// handles a seed phrase or private key. Every transaction
// needs the user's explicit click + wallet confirmation.
//
// Requires ethers v6 (UMD build) loaded from CDN before this
// file, and zigzoo-artifact.json (ABI + bytecode) next to
// deploy.html. See scripts/sync-deploy-artifact.py.
(function () {
  "use strict";

  // ---- Locked deployment parameters (verified against
  // contracts/Zigzoo.sol, scripts/deck.json and
  // scripts/deploy.js — do not change here) ----
  var OWNER = "0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097"; // My Wallet (owner)
  var REVENUE = "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7"; // Binance Agentic Wallet
  var REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F"; // SPACE ID Agent ID registry
  var BASE_URI = "https://zigzoo.xyz/metadata/"; // metadata folder, must end with "/"
  var DECK_HASH = "0x4e5e9cf69f907caacc6a4347eca38114d2b31afeaa46e0578ed94826307b4e77"; // keccak256("ZIGZOO-DECK-SEED-2026-11-06")
  var BSC_CHAIN_ID = 56n;
  var BSC_CHAIN_HEX = "0x38";
  var MEASURED_DEPLOY_GAS = 2124917; // hardhat measurement (contract rework, Nov 2026)
  var MEASURED_ACTIVATE_GAS = 29876; // hardhat measurement for setMintActive(true)
  var BNB_IDR_REF = 12500000; // reference rate only, for the estimate display

  // ---- State ----
  var provider = null;
  var signer = null;
  var account = null;
  var artifact = null; // { abi, bytecode }
  var deployedAddress = null;

  // ---- DOM helpers ----
  function $(id) { return document.getElementById(id); }
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }
  function show(id) { var el = $(id); if (el) el.classList.remove("hidden"); }
  function hide(id) { var el = $(id); if (el) el.classList.add("hidden"); }
  function setStep(n, state) {
    // state: "todo" | "active" | "done" | "blocked"
    var el = $("step-" + n);
    if (!el) return;
    el.classList.remove("todo", "active", "done", "blocked");
    el.classList.add(state);
  }
  function note(msg, kind) {
    var el = $("note");
    if (!el) return;
    el.textContent = msg;
    el.className = "note-box " + (kind || "info");
    show("note");
  }
  function short(addr) {
    return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "";
  }
  function bscscanTx(hash) { return "https://bscscan.com/tx/" + hash; }
  function bscscanAddr(addr) { return "https://bscscan.com/address/" + addr; }
  function fmtBnb(wei) {
    try { return ethers.formatEther(wei); } catch (e) { return "?"; }
  }
  function fmtIdr(bnbWei) {
    try {
      var bnb = parseFloat(ethers.formatEther(bnbWei));
      return "Rp " + Math.round(bnb * BNB_IDR_REF).toLocaleString("en-US");
    } catch (e) { return "—"; }
  }

  // ---- Page boot: load artifact, check for a wallet ----
  async function boot() {
    setStep(1, "active");
    if (typeof ethers === "undefined") {
      note("Could not load ethers.js from the CDN. Check your internet connection and reload the page.", "error");
      return;
    }
    try {
      var res = await fetch("zigzoo-artifact.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      artifact = await res.json();
      if (!artifact || !artifact.abi || !artifact.bytecode) {
        throw new Error("artifact file is missing abi/bytecode");
      }
      setText("artifact-status", "Loaded — " + artifact.contractName +
        " (" + artifact.abi.length + " ABI entries, " +
        artifact.bytecode.length + " hex chars of bytecode)");
    } catch (e) {
      note("Could not load zigzoo-artifact.json (" + e.message + "). " +
        "If you opened this file directly from disk, open it through a web server " +
        "instead (or through the deployed site) — browsers block local file loading. " +
        "Nothing has been sent anywhere.", "error");
      return;
    }
    if (!window.ethereum) {
      note("No browser wallet found. Install MetaMask (or another injected wallet), " +
        "then reload this page. This page will never ask for your seed phrase or private key.", "error");
      return;
    }
    // Re-validate if the user changes account / network in the wallet.
    window.ethereum.on("accountsChanged", function () { connect({ silent: true }); });
    window.ethereum.on("chainChanged", function () { connect({ silent: true }); });
    setText("wallet-status", "Wallet detected. Click “Connect Wallet”.");
  }

  // ---- Step 1: connect + chain check ----
  async function connect(opts) {
    opts = opts || {};
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      var accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) throw new Error("no account returned");
      account = ethers.getAddress(accounts[0]);
      signer = await provider.getSigner();
      setText("wallet-status", "Connected: " + account);
      setText("wallet-address", account);
      show("wallet-address-row");
      await checkChain();
    } catch (e) {
      if (!opts.silent) note("Wallet connection failed: " + (e && e.message ? e.message : e), "error");
    }
  }

  async function checkChain() {
    var net = await provider.getNetwork();
    if (net.chainId === BSC_CHAIN_ID) {
      setText("chain-status", "BNB Smart Chain (chain 56) ✓");
      hide("switch-row");
      setStep(1, "done");
      setStep(2, "active");
      await checkOwner();
      return true;
    }
    setText("chain-status", "Wrong network: chain " + net.chainId.toString() +
      " — this contract deploys ONLY on BNB Smart Chain (56).");
    show("switch-row");
    setStep(1, "blocked");
    note("You are on the wrong network. Click “Switch to BNB Smart Chain” and confirm in your wallet.", "warn");
    return false;
  }

  async function switchChain() {
    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: BSC_CHAIN_HEX }]);
      await checkChain();
    } catch (e) {
      if (e && e.code === 4902) {
        // Chain not added to the wallet yet — add it, then switch.
        try {
          await provider.send("wallet_addEthereumChain", [{
            chainId: BSC_CHAIN_HEX,
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com"]
          }]);
          await checkChain();
        } catch (e2) {
          note("Could not add BNB Smart Chain to your wallet: " + (e2 && e2.message ? e2.message : e2), "error");
        }
      } else {
        note("Network switch failed: " + (e && e.message ? e.message : e), "error");
      }
    }
  }

  // ---- Step 2: owner check ----
  async function checkOwner() {
    var ok = account && account.toLowerCase() === OWNER.toLowerCase();
    setText("owner-expected", OWNER);
    setText("owner-connected", account || "—");
    var badge = $("owner-badge");
    if (ok) {
      badge.textContent = "MATCH ✓ — this wallet is the owner";
      badge.className = "badge ok";
      hide("owner-warning");
      setStep(2, "done");
      setStep(3, "active");
      await refreshEstimate();
    } else {
      badge.textContent = "MISMATCH — this is not the owner wallet";
      badge.className = "badge bad";
      show("owner-warning");
      setStep(2, "blocked");
      note("STOP: the connected wallet is not My Wallet (" + OWNER + "). " +
        "The contract owner MUST be My Wallet. Switch accounts in your wallet and reconnect. " +
        "Deploy is disabled until the owner wallet is connected.", "error");
    }
    updateDeployButton();
  }

  // ---- Step 3: cost estimate (live gas price + live estimate) ----
  async function refreshEstimate() {
    if (!provider || !artifact) return;
    setText("estimate-status", "Estimating…");
    try {
      var fee = await provider.getFeeData();
      var gasPrice = fee.gasPrice || fee.maxFeePerGas;
      if (!gasPrice) throw new Error("no gas price from network");
      var gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
      setText("gas-price", parseFloat(gasPriceGwei).toFixed(4) + " gwei");

      var gas = null;
      try {
        var factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
        var tx = await factory.getDeployTransaction(OWNER, REVENUE, REGISTRY, BASE_URI, DECK_HASH);
        tx.from = account;
        gas = await provider.estimateGas(tx);
      } catch (e) {
        // estimateGas can fail before deploy (e.g. RPC hiccup) — fall back to the measured value.
        gas = null;
      }
      var gasUsed = gas ? Number(gas) : MEASURED_DEPLOY_GAS;
      var costWei = gasPrice * BigInt(gasUsed);
      setText("gas-estimate", gasUsed.toLocaleString("en-US") + " gas" +
        (gas ? " (live estimate)" : " (measured reference — live estimate unavailable)"));
      setText("cost-bnb", fmtBnb(costWei) + " BNB");
      setText("cost-idr", fmtIdr(costWei) + " (approx., at Rp " +
        BNB_IDR_REF.toLocaleString("en-US") + " / BNB)");
      setText("estimate-status", "Estimate ready. Measured deploy gas was " +
        MEASURED_DEPLOY_GAS.toLocaleString("en-US") + " gas " +
        "(≈ 0.00010774 BNB / ≈ Rp 1,347 at 0.05 gwei). " +
        "Activation (setMintActive) is a separate small transaction afterwards, " +
        "measured at " + MEASURED_ACTIVATE_GAS.toLocaleString("en-US") + " gas.");
      setStep(3, "done");
      setStep(4, "active");
    } catch (e) {
      setText("estimate-status", "Estimate failed: " + (e && e.message ? e.message : e));
      note("Could not estimate the deployment cost: " + (e && e.message ? e.message : e) +
        ". Check your connection and try “Refresh estimate”.", "error");
    }
    updateDeployButton();
  }

  function readyToDeploy() {
    return !!(provider && signer && account &&
      account.toLowerCase() === OWNER.toLowerCase() && artifact);
  }

  function updateDeployButton() {
    var btn = $("deploy-btn");
    if (!btn) return;
    btn.disabled = !readyToDeploy();
  }

  // ---- Step 4: deploy ----
  async function deploy() {
    if (!readyToDeploy()) {
      note("Deploy is not ready yet — connect My Wallet on BNB Smart Chain first.", "warn");
      return;
    }
    var btn = $("deploy-btn");
    btn.disabled = true;
    setText("deploy-status", "Sending deployment transaction… confirm it in your wallet.");
    try {
      var factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
      var contract = await factory.deploy(OWNER, REVENUE, REGISTRY, BASE_URI, DECK_HASH);
      var tx = contract.deploymentTransaction();
      setText("deploy-tx", tx.hash);
      $("deploy-tx-link").href = bscscanTx(tx.hash);
      show("deploy-tx-row");
      setText("deploy-status", "Transaction sent. Waiting for confirmation on BNB Smart Chain…");
      await contract.waitForDeployment();
      deployedAddress = await contract.getAddress();
      setText("deployed-address", deployedAddress);
      $("deployed-address-link").href = bscscanAddr(deployedAddress);
      $("deployed-bscscan-link").href = bscscanAddr(deployedAddress);
      show("deployed-row");
      setText("deploy-status", "Deployed ✓ — contract is live at " + deployedAddress +
        ". Minting is still OFF (mintActive = false) until you activate it below.");
      setStep(4, "done");
      setStep(5, "active");
      $("activate-address").value = deployedAddress;
      await refreshActivateEstimate();
      note("Deployed! Next: verify the source on BscScan, then activate minting below. " +
        "Update the site files (index.html, llms.txt, agent-skill.md) with the new address afterwards.", "ok");
    } catch (e) {
      btn.disabled = false;
      setText("deploy-status", "Deployment failed or was rejected in your wallet: " +
        (e && e.message ? e.message : e));
      note("Deployment did not complete: " + (e && e.message ? e.message : e) +
        ". No contract was deployed. You can try again.", "error");
    }
  }

  // ---- Step 5: activate mint (setMintActive(true)) ----
  async function refreshActivateEstimate() {
    var addr = $("activate-address").value.trim();
    var btn = $("activate-btn");
    btn.disabled = true;
    if (!addr || !ethers.isAddress(addr)) {
      setText("activate-estimate", "Enter the deployed contract address first.");
      return;
    }
    if (!provider) {
      setText("activate-estimate", "Connect your wallet first.");
      return;
    }
    try {
      var fee = await provider.getFeeData();
      var gasPrice = fee.gasPrice || fee.maxFeePerGas;
      var gas = null;
      try {
        var c = new ethers.Contract(addr, artifact.abi, signer);
        gas = await c.setMintActive.estimateGas(true);
      } catch (e) { gas = null; }
      var gasUsed = gas ? Number(gas) : MEASURED_ACTIVATE_GAS;
      var costWei = gasPrice * BigInt(gasUsed);
      setText("activate-estimate", "Estimated: " + gasUsed.toLocaleString("en-US") + " gas ≈ " +
        fmtBnb(costWei) + " BNB (" + fmtIdr(costWei) + " approx.) at " +
        parseFloat(ethers.formatUnits(gasPrice, "gwei")).toFixed(4) + " gwei" +
        (gas ? "" : " — measured reference, live estimate unavailable") + ".");
      btn.disabled = false;
    } catch (e) {
      setText("activate-estimate", "Estimate failed: " + (e && e.message ? e.message : e));
    }
  }

  async function activate() {
    var addr = $("activate-address").value.trim();
    if (!ethers.isAddress(addr)) {
      note("The contract address is not valid.", "error");
      return;
    }
    if (!account || account.toLowerCase() !== OWNER.toLowerCase()) {
      note("Only the owner wallet (My Wallet) can activate minting.", "error");
      return;
    }
    var btn = $("activate-btn");
    btn.disabled = true;
    setText("activate-status", "Sending setMintActive(true)… confirm it in your wallet.");
    try {
      var c = new ethers.Contract(addr, artifact.abi, signer);
      var tx = await c.setMintActive(true);
      setText("activate-tx", tx.hash);
      $("activate-tx-link").href = bscscanTx(tx.hash);
      show("activate-tx-row");
      setText("activate-status", "Transaction sent. Waiting for confirmation…");
      await tx.wait();
      var onChain = await c.mintActive();
      if (onChain) {
        setText("activate-status", "Minting is now ACTIVE ✓ — mintActive = true. The collection is live.");
        setStep(5, "done");
        show("done-box");
        note("Done — minting is live. Next: update the site with the contract address " +
          "and announce the launch.", "ok");
      } else {
        setText("activate-status", "Transaction confirmed but mintActive is still false. Check BscScan.");
        btn.disabled = false;
      }
    } catch (e) {
      btn.disabled = false;
      setText("activate-status", "Activation failed or was rejected in your wallet: " +
        (e && e.message ? e.message : e));
      note("Activation did not complete: " + (e && e.message ? e.message : e) + ". You can try again.", "error");
    }
  }

  function copyText(text, btn) {
    var done = function () { if (btn) { btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = "Copy"; }, 2000); } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  // ---- Wire up buttons once the DOM is ready ----
  document.addEventListener("DOMContentLoaded", function () {
    $("connect-btn").addEventListener("click", function () { connect(); });
    $("switch-btn").addEventListener("click", switchChain);
    $("refresh-estimate-btn").addEventListener("click", refreshEstimate);
    $("deploy-btn").addEventListener("click", deploy);
    $("activate-btn").addEventListener("click", activate);
    $("refresh-activate-btn").addEventListener("click", refreshActivateEstimate);
    $("activate-address").addEventListener("input", refreshActivateEstimate);
    $("copy-address-btn").addEventListener("click", function () {
      copyText(deployedAddress || $("activate-address").value, this);
    });
    boot();
  });
})();
