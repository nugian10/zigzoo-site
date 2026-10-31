/* ZIGZOO frontend — Web3 logic (ethers v6 via CDN).
 * Security principles enforced here:
 * 1. NO simulated mint. The Mint button is only active when the contract
 *    is configured, the wallet is connected on Chain ID 56, and the contract
 *    says the wallet is authorized as an agent.
 * 2. NO fake counters. Minted/remaining numbers are only read from
 *    the contract via totalSupply(). If the contract is not set, show "—".
 * 3. NO "Binance Agentic Wallet" detection from the address alone.
 *    Authorization = the authorizedAgents mapping in the contract (see Zigzoo.sol).
 *    An ordinary wallet that is not authorized is rejected clearly.
 * 4. A transaction is only shown as successful after its receipt is confirmed
 *    on-chain (tx.wait()), with its hash + BscScan link.
 */
(function () {
  'use strict';
  var CFG = window.ZIGZOO_CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  var ABI = [
    'function totalSupply() view returns (uint256)',
    'function MAX_SUPPLY() view returns (uint256)',
    'function MINT_PRICE() view returns (uint256)',
    'function authorizedAgents(address) view returns (bool)',
    'function isAuthorizedAgent(address) view returns (bool)',
    'function balanceOf(address) view returns (uint256)',
    'function ownerOf(uint256) view returns (address)',
    'function mint(uint256 quantity) payable'
  ];

  var state = { provider: null, signer: null, account: null, chainOk: false, authorized: null, contract: null, minted: null, remaining: null, qty: 1, shown: 0 };

  // Real characters from the ZIGZOO character sheets (cropped tiles).
  // Tokens 1-100 use these images on the site. The generative preview system was removed.
  var REAL_CHARACTERS = [
    { id: 1, name: 'Spiral Horn', file: 'artwork/characters/zigzoo-01.webp' },
    { id: 2, name: 'Jar', file: 'artwork/characters/zigzoo-02.webp' },
    { id: 3, name: 'Crystal Coffin', file: 'artwork/characters/zigzoo-03.webp' },
    { id: 4, name: 'Berry Cloud', file: 'artwork/characters/zigzoo-04.webp' },
    { id: 5, name: 'Spring Robot', file: 'artwork/characters/zigzoo-05.webp' },
    { id: 6, name: 'Ink Drop', file: 'artwork/characters/zigzoo-06.webp' },
    { id: 7, name: 'Puzzle', file: 'artwork/characters/zigzoo-07.webp' },
    { id: 8, name: 'Padlock', file: 'artwork/characters/zigzoo-08.webp' },
    { id: 9, name: 'Acorn', file: 'artwork/characters/zigzoo-09.webp' },
    { id: 10, name: 'Rocket', file: 'artwork/characters/zigzoo-10.webp' },
    { id: 11, name: 'Compass Star', file: 'artwork/characters/zigzoo-11.webp' },
    { id: 12, name: 'Vine Tangle', file: 'artwork/characters/zigzoo-12.webp' },
    { id: 13, name: 'Lighthouse', file: 'artwork/characters/zigzoo-13.webp' },
    { id: 14, name: 'Teapot', file: 'artwork/characters/zigzoo-14.webp' },
    { id: 15, name: 'Umbrella', file: 'artwork/characters/zigzoo-15.webp' },
    { id: 16, name: 'Clock', file: 'artwork/characters/zigzoo-16.webp' },
    { id: 17, name: 'Cactus', file: 'artwork/characters/zigzoo-17.webp' },
    { id: 18, name: 'Open Book', file: 'artwork/characters/zigzoo-18.webp' },
    { id: 19, name: 'Balloon', file: 'artwork/characters/zigzoo-19.webp' },
    { id: 20, name: 'Guitar', file: 'artwork/characters/zigzoo-20.webp' },
    { id: 21, name: 'Camera', file: 'artwork/characters/zigzoo-21.webp' },
    { id: 22, name: 'Anchor', file: 'artwork/characters/zigzoo-22.webp' },
    { id: 23, name: 'Pineapple', file: 'artwork/characters/zigzoo-23.webp' },
    { id: 24, name: 'Snowman', file: 'artwork/characters/zigzoo-24.webp' },
    { id: 25, name: 'Rotary Telephone', file: 'artwork/characters/zigzoo-25.webp' },
    { id: 26, name: 'Lamp', file: 'artwork/characters/zigzoo-26.webp' },
    { id: 27, name: 'Dice', file: 'artwork/characters/zigzoo-27.webp' },
    { id: 28, name: 'Magnet', file: 'artwork/characters/zigzoo-28.webp' },
    { id: 29, name: 'Battery', file: 'artwork/characters/zigzoo-29.webp' },
    { id: 30, name: 'Feather', file: 'artwork/characters/zigzoo-30.webp' },
    { id: 31, name: 'Seashell', file: 'artwork/characters/zigzoo-31.webp' },
    { id: 32, name: 'Mushroom', file: 'artwork/characters/zigzoo-32.webp' },
    { id: 33, name: 'Carrot', file: 'artwork/characters/zigzoo-33.webp' },
    { id: 34, name: 'Donut', file: 'artwork/characters/zigzoo-34.webp' },
    { id: 35, name: 'Pretzel', file: 'artwork/characters/zigzoo-35.webp' },
    { id: 36, name: 'Chess Pawn', file: 'artwork/characters/zigzoo-36.webp' },
    { id: 37, name: 'Tire Wheel', file: 'artwork/characters/zigzoo-37.webp' },
    { id: 38, name: 'Mailbox', file: 'artwork/characters/zigzoo-38.webp' },
    { id: 39, name: 'Pencil', file: 'artwork/characters/zigzoo-39.webp' },
    { id: 40, name: 'Scissors', file: 'artwork/characters/zigzoo-40.webp' },
    { id: 41, name: 'Traffic Cone', file: 'artwork/characters/zigzoo-41.webp' },
    { id: 42, name: 'Ice Cream Cone', file: 'artwork/characters/zigzoo-42.webp' },
    { id: 43, name: 'Watermelon Slice', file: 'artwork/characters/zigzoo-43.webp' },
    { id: 44, name: 'Butterfly', file: 'artwork/characters/zigzoo-44.webp' },
    { id: 45, name: 'Crescent Moon', file: 'artwork/characters/zigzoo-45.webp' },
    { id: 46, name: 'Rain Cloud', file: 'artwork/characters/zigzoo-46.webp' },
    { id: 47, name: 'Volcano', file: 'artwork/characters/zigzoo-47.webp' },
    { id: 48, name: 'Castle Tower', file: 'artwork/characters/zigzoo-48.webp' },
    { id: 49, name: 'Train Locomotive', file: 'artwork/characters/zigzoo-49.webp' },
    { id: 50, name: 'Submarine', file: 'artwork/characters/zigzoo-50.webp' },
    { id: 51, name: 'Hot Air Balloon', file: 'artwork/characters/zigzoo-51.webp' },
    { id: 52, name: 'Tent', file: 'artwork/characters/zigzoo-52.webp' },
    { id: 53, name: 'Igloo', file: 'artwork/characters/zigzoo-53.webp' },
    { id: 54, name: 'Windmill', file: 'artwork/characters/zigzoo-54.webp' },
    { id: 55, name: 'Ferris Wheel', file: 'artwork/characters/zigzoo-55.webp' },
    { id: 56, name: 'Drum', file: 'artwork/characters/zigzoo-56.webp' },
    { id: 57, name: 'Trumpet', file: 'artwork/characters/zigzoo-57.webp' },
    { id: 58, name: 'Violin', file: 'artwork/characters/zigzoo-58.webp' },
    { id: 59, name: 'Typewriter', file: 'artwork/characters/zigzoo-59.webp' },
    { id: 60, name: 'Satellite', file: 'artwork/characters/zigzoo-60.webp' }
 ,
    { id: 61, name: 'Penguin', file: 'artwork/characters/zigzoo-61.webp' },
    { id: 62, name: 'Fox', file: 'artwork/characters/zigzoo-62.webp' },
    { id: 63, name: 'Owl', file: 'artwork/characters/zigzoo-63.webp' },
    { id: 64, name: 'Frog', file: 'artwork/characters/zigzoo-64.webp' },
    { id: 65, name: 'Bee', file: 'artwork/characters/zigzoo-65.webp' },
    { id: 66, name: 'Ladybug', file: 'artwork/characters/zigzoo-66.webp' },
    { id: 67, name: 'Crab', file: 'artwork/characters/zigzoo-67.webp' },
    { id: 68, name: 'Octopus', file: 'artwork/characters/zigzoo-68.webp' },
    { id: 69, name: 'Turtle', file: 'artwork/characters/zigzoo-69.webp' },
    { id: 70, name: 'Shark', file: 'artwork/characters/zigzoo-70.webp' },
    { id: 71, name: 'Elephant', file: 'artwork/characters/zigzoo-71.webp' },
    { id: 72, name: 'Lion', file: 'artwork/characters/zigzoo-72.webp' },
    { id: 73, name: 'Astronaut', file: 'artwork/characters/zigzoo-73.webp' },
    { id: 74, name: 'Pirate', file: 'artwork/characters/zigzoo-74.webp' },
    { id: 75, name: 'Wizard', file: 'artwork/characters/zigzoo-75.webp' },
    { id: 76, name: 'Chef', file: 'artwork/characters/zigzoo-76.webp' },
    { id: 77, name: 'Firefighter', file: 'artwork/characters/zigzoo-77.webp' },
    { id: 78, name: 'Doctor', file: 'artwork/characters/zigzoo-78.webp' },
    { id: 79, name: 'Farmer', file: 'artwork/characters/zigzoo-79.webp' },
    { id: 80, name: 'Sailor', file: 'artwork/characters/zigzoo-80.webp' },
    { id: 81, name: 'Superhero', file: 'artwork/characters/zigzoo-81.webp' },
    { id: 82, name: 'Ninja', file: 'artwork/characters/zigzoo-82.webp' },
    { id: 83, name: 'Knight', file: 'artwork/characters/zigzoo-83.webp' },
    { id: 84, name: 'Clown', file: 'artwork/characters/zigzoo-84.webp' },
    { id: 85, name: 'Cottage House', file: 'artwork/characters/zigzoo-85.webp' },
    { id: 86, name: 'Water Tower', file: 'artwork/characters/zigzoo-86.webp' },
    { id: 87, name: 'Mountain', file: 'artwork/characters/zigzoo-87.webp' },
    { id: 88, name: 'Beach Ball', file: 'artwork/characters/zigzoo-88.webp' },
    { id: 89, name: 'Surfboard', file: 'artwork/characters/zigzoo-89.webp' },
    { id: 90, name: 'Skateboard', file: 'artwork/characters/zigzoo-90.webp' },
    { id: 91, name: 'Bicycle', file: 'artwork/characters/zigzoo-91.webp' },
    { id: 92, name: 'Car', file: 'artwork/characters/zigzoo-92.webp' },
    { id: 93, name: 'Airplane', file: 'artwork/characters/zigzoo-93.webp' },
    { id: 94, name: 'Boat', file: 'artwork/characters/zigzoo-94.webp' },
    { id: 95, name: 'Hot Dog', file: 'artwork/characters/zigzoo-95.webp' },
    { id: 96, name: 'Cupcake', file: 'artwork/characters/zigzoo-96.webp' },
    { id: 97, name: 'Popcorn', file: 'artwork/characters/zigzoo-97.webp' },
    { id: 98, name: 'Soda Can', file: 'artwork/characters/zigzoo-98.webp' },
    { id: 99, name: 'Pizza Slice', file: 'artwork/characters/zigzoo-99.webp' },
    { id: 100, name: 'Cookie', file: 'artwork/characters/zigzoo-100.webp' },
    { id: 101, name: 'Telescope', file: 'artwork/characters/zigzoo-101.webp' },
    { id: 102, name: 'Snow Globe', file: 'artwork/characters/zigzoo-102.webp' },
    { id: 103, name: 'Kite', file: 'artwork/characters/zigzoo-103.webp' },
    { id: 104, name: 'Crown', file: 'artwork/characters/zigzoo-104.webp' },
    { id: 105, name: 'Yo-Yo', file: 'artwork/characters/zigzoo-105.webp' },
    { id: 106, name: 'Treasure Chest', file: 'artwork/characters/zigzoo-106.webp' },
    { id: 107, name: 'Cauldron', file: 'artwork/characters/zigzoo-107.webp' },
    { id: 108, name: 'Phoenix', file: 'artwork/characters/zigzoo-108.webp' },
    { id: 109, name: 'Magic Wand', file: 'artwork/characters/zigzoo-109.webp' },
    { id: 110, name: 'Dragon', file: 'artwork/characters/zigzoo-110.webp' },
    { id: 111, name: 'Unicorn', file: 'artwork/characters/zigzoo-111.webp' },
    { id: 112, name: 'Crystal Ball', file: 'artwork/characters/zigzoo-112.webp' }
  ];function realChar(id) { return REAL_CHARACTERS[id - 1] || null; }

  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function shortAddr(a) { return a ? a.slice(0, 6) + '…' + a.slice(-4) : '—'; }
  function setStatus(el, kind, html) { el.className = 'status ' + kind; el.innerHTML = html; }

  function renderMintNumbers() {
    $('mintedVal').textContent = state.minted === null ? '—' : fmt(state.minted);
    $('remainingVal').textContent = state.remaining === null ? '—' : fmt(state.remaining);
    $('totalPrice').textContent = (state.qty * parseFloat(CFG.MINT_PRICE_BNB)).toFixed(4) + ' BNB';
    if ($('qtyInput')) $('qtyInput').value = state.qty;
    var boxes = document.querySelectorAll('.qty-box');
    boxes.forEach(function (b) { b.classList.toggle('sel', Number(b.getAttribute('data-qty')) === state.qty); });
    // Progress (Subsonic-style panel) — hanya dari chain, tidak pernah ditebak.
    if ($('progressPct')) {
      if (state.minted === null) {
        $('progressPct').textContent = '—%';
        $('progressFill').style.width = '0%';
        document.querySelectorAll('#markers div').forEach(function (m) { m.classList.remove('hit'); });
        setStatus($('progressStatus'), 'muted', 'Reading the chain… The contract is not configured yet, so progress cannot be shown.');
      } else {
        var pct = (state.minted / CFG.MAX_SUPPLY) * 100;
        $('progressPct').textContent = pct.toFixed(1) + '%';
        $('progressFill').style.width = pct + '%';
        document.querySelectorAll('#markers div').forEach(function (m) { m.classList.toggle('hit', pct >= Number(m.getAttribute('data-mark'))); });
        setStatus($('progressStatus'), 'ok', fmt(state.minted) + ' / ' + fmt(CFG.MAX_SUPPLY) + ' minted. Remaining: ' + fmt(state.remaining) + '.');
      }
    }
    updateAgentPrompt();
    refreshMintButton();
  }

  function updateAgentPrompt() {
    var el = $('agentPrompt');
    if (!el) return;
    var addr = CFG.CONTRACT_ADDRESS || '[ALAMAT KONTRAK SETELAH DEPLOYMENT]';
    el.textContent = 'Mint ZIGZOO for me on BNB Smart Chain (Chain ID 56).\n' +
      'Contract: ' + addr + '\n' +
      'Quantity: ' + state.qty + ' NFT, price ' + CFG.MINT_PRICE_BNB + ' BNB per NFT.\n' +
      'IMPORTANT: continue only if this wallet is authorized as an agent in the contract (check isAuthorizedAgent). If it is not authorized, stop and report it — do not force a mint.';
  }

  function refreshMintButton() {
    // Manual mint was removed: minting happens only through an authorized agent.
    // This function is kept so other code can call it safely; it does nothing now.
    return;
  }

  async function readOnChain() {
    if (!CFG.CONTRACT_ADDRESS) {
      setStatus($('contractStatus'), 'warn', '<b>Contract not configured yet.</b> This project is deliberately NOT deployed automatically and uses no BNB. After manual deployment, fill in <span class="mono">CONTRACT_ADDRESS</span> di <span class="mono">frontend/config.js</span>, and the numbers on this page will then be read directly from the blockchain.');
      setStatus($('agentStatus'), 'muted', 'Agent status cannot be verified until the contract address is filled in.');
      state.minted = null; state.remaining = null; renderMintNumbers(); return;
    }
    try {
      var provider = state.provider || new window.ethers.JsonRpcProvider(CFG.RPC_URL);
      var c = new window.ethers.Contract(CFG.CONTRACT_ADDRESS, ABI, provider);
      state.contract = c;
      var minted = await c.totalSupply();
      var max = await c.MAX_SUPPLY();
      state.minted = Number(minted); state.remaining = Number(max) - state.minted;
      setStatus($('contractStatus'), 'ok', 'Kontrak aktif di BNB Smart Chain. Alamat: <a class="mono" target="_blank" rel="noopener" href="' + CFG.EXPLORER_ADDRESS + CFG.CONTRACT_ADDRESS + '">' + CFG.CONTRACT_ADDRESS + '</a>');
      renderMintNumbers(); renderMarket();
      if (state.account) await checkAuthorization();
    } catch (e) {
      console.error(e);
      setStatus($('contractStatus'), 'err', 'Tidak bisa membaca kontrak dari chain. Periksa alamat kontrak dan koneksi RPC. Detail: ' + (e && e.message ? e.message.slice(0, 220) : 'unknown'));
      state.minted = null; state.remaining = null; renderMintNumbers();
    }
  }

  async function checkAuthorization() {
    if (!CFG.CONTRACT_ADDRESS || !state.account || !state.contract) return;
    state.authorized = null; refreshMintButton();
    try {
      var ok = false;
      try { ok = await state.contract.isAuthorizedAgent(state.account); }
      catch (e) { ok = await state.contract.authorizedAgents(state.account); }
      state.authorized = !!ok;
      if (ok) {
        setStatus($('agentStatus'), 'ok', '<b>Agent verified.</b> Wallet <span class="mono">' + shortAddr(state.account) + '</span> is registered as an authorized agent in the contract. You can mint.');
      } else {
        setStatus($('agentStatus'), 'err', '<b>This wallet is not authorized as an agent.</b> Connecting a wallet alone is NOT proof of authorization. The project owner must authorize this address via <span class="mono">setAgentAuthorization</span> in the contract before minting can happen. Public minting is not available on ZIGZOO.');
      }
    } catch (e) {
      console.error(e);
      state.authorized = false;
      setStatus($('agentStatus'), 'err', 'Failed to check agent authorization in the contract. Minting is disabled until verification succeeds.');
    }
    refreshMintButton();
  }

  async function connect() {
    var el = $('walletStatus');
    try {
      if (!window.ethereum) {
        setStatus(el, 'warn', 'No EIP-1193 wallet found in this browser. Open this page from Binance Agentic Wallet / a compatible BNB Chain wallet, or install a wallet that supports BNB Smart Chain, then try again.');
        return;
      }
      if (!window.ethers) { setStatus(el, 'err', 'The ethers library failed to load from the CDN. Check your internet connection, then reload the page.'); return; }
      state.provider = new window.ethers.BrowserProvider(window.ethereum);
      var accounts = await state.provider.send('eth_requestAccounts', []);
      state.signer = await state.provider.getSigner();
      state.account = accounts[0];
      var net = await state.provider.getNetwork();
      state.chainOk = Number(net.chainId) === CFG.CHAIN_ID;
      $('connectBtn').textContent = 'Connected: ' + shortAddr(state.account);
      $('walletPill').textContent = shortAddr(state.account);
      if (!state.chainOk) {
        setStatus(el, 'warn', 'Wallet connected, but the current network is not BNB Smart Chain (Chain ID 56). Click “Switch to BNB Chain” to switch networks.');
        $('switchBtn').style.display = 'inline-flex';
      } else {
        setStatus(el, 'ok', 'Wallet connected on BNB Smart Chain (56). Address: <span class="mono">' + state.account + '</span>');
        $('switchBtn').style.display = 'none';
      }
      await readOnChain();
    } catch (e) {
      console.error(e);
      var msg = (e && e.code === 4001) ? 'Connection rejected in the wallet.' : 'Failed to connect wallet: ' + (e && e.message ? e.message.slice(0, 220) : 'unknown');
      setStatus(el, 'err', msg);
    }
    refreshMintButton();
  }

  async function switchChain() {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
      await connect();
    } catch (e) {
      if (e && e.code === 4902) {
        try {
          await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x38', chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: [CFG.RPC_URL], blockExplorerUrls: ['https://bscscan.com'] }] });
          await connect();
        } catch (e2) { setStatus($('walletStatus'), 'err', 'Failed to add the BNB Smart Chain network: ' + (e2.message || '').slice(0, 200)); }
      } else if (e && e.code === 4001) {
        setStatus($('walletStatus'), 'warn', 'Network switch rejected in the wallet.');
      } else {
        setStatus($('walletStatus'), 'err', 'Failed to switch networks: ' + (e.message || '').slice(0, 200));
      }
    }
  }

  // ---- Gallery ----
  function openModal(id) {
    var real = realChar(id);
    if (real) {
      $('modalArt').innerHTML = '<img src="' + real.file + '" alt="ZIGZOO #' + id + ' — ' + real.name + ' Monster">';
      $('modalTitle').textContent = 'ZIGZOO #' + id;
      $('modalTraits').innerHTML = '<li><b>Character:</b> ' + real.name + ' Monster</li><li><b>Source:</b> ZIGZOO character sheet</li><li><b>Style:</b> Retro vintage cartoon, black silhouette, distressed print, warm cream background</li>';
      $('modalMeta').textContent = JSON.stringify({ name: 'ZIGZOO #' + id, description: 'An experimental collection of original cartoon monster characters on BNB Smart Chain.', image: real.file, attributes: [{ trait_type: 'Character', value: real.name }] }, null, 2);
      $('modalNote').textContent = 'This is a real character from the ZIGZOO character sheet. Final token metadata and IPFS CID are filled in after artwork production and metadata upload are complete.';
      $('monsterModal').showModal();
      return;
    }
    return;
  }

  function renderGallery(count) {
    var grid = $('gallery');
    for (var id = state.shown + 1; id <= count; id++) {
      (function (tokenId) {
        var btn = document.createElement('button');
        btn.className = 'gcard c' + (tokenId % 4); btn.type = 'button'; btn.setAttribute('aria-label', 'View ZIGZOO #' + tokenId);
        var rc = realChar(tokenId);
        if (!rc) return;
        btn.innerHTML = '<img src="' + rc.file + '" alt="ZIGZOO #' + tokenId + ' — ' + rc.name + ' Monster" loading="lazy">' + '<span class="gmeta"><b>ZIGZOO #' + tokenId + '</b><span>' + rc.name + '</span></span>';
        btn.addEventListener('click', function () { openModal(tokenId); });
        grid.appendChild(btn);
      })(id);
    }
    state.shown = count;
    $('loadMoreBtn').style.display = count >= 20 ? 'none' : '';
    $('galleryNote').textContent = 'Showing ' + count + ' featured ZIGZOO characters. The full collection has 112 designs, each with up to 10 editions, for a total supply of 1,111 — available through mint.';
  }

  function renderFooter() {
    $('contractFooter').textContent = CFG.CONTRACT_ADDRESS || 'Not deployed yet — the contract address will appear here after manual deployment and verification.';
    var s = CFG.SOCIALS || {};
    var links = [];
    if (s.x) links.push('<a class="btn small ghost" target="_blank" rel="noopener" href="' + s.x + '">X</a>');
    if (s.discord) links.push('<a class="btn small ghost" target="_blank" rel="noopener" href="' + s.discord + '">Discord</a>');
    if (s.telegram) links.push('<a class="btn small ghost" target="_blank" rel="noopener" href="' + s.telegram + '">Telegram</a>');
    $('socials').innerHTML = links.length ? links.join(' ') : '<span class="pill">Official links will be announced</span>';
  }



  function openMenu() { $('sideMenu').classList.add('open'); $('sideMenu').setAttribute('aria-hidden', 'false'); $('menuBackdrop').hidden = false; $('burgerBtn').setAttribute('aria-expanded', 'true'); }
  function closeMenu() { $('sideMenu').classList.remove('open'); $('sideMenu').setAttribute('aria-hidden', 'true'); $('menuBackdrop').hidden = true; $('burgerBtn').setAttribute('aria-expanded', 'false'); }

  function renderMarket() {
    if ($('marketMinted')) $('marketMinted').textContent = state.minted === null ? '—' : fmt(state.minted);
    if ($('marketOwners')) $('marketOwners').textContent = '—';
    var wrap = $('marketBscScanWrap');
    if (wrap) {
      if (CFG.CONTRACT_ADDRESS) {
        wrap.innerHTML = '<a class="btn ghost" target="_blank" rel="noopener" href="' + CFG.EXPLORER_ADDRESS + CFG.CONTRACT_ADDRESS + '">Contract on BscScan</a>';
      } else {
        wrap.innerHTML = '<span class="pill">Contract on BscScan — not deployed yet</span>';
      }
    }
  }

  async function marketSearch(e) {
    if (e) e.preventDefault();
    var out = $('marketSearchResult'); if (!out) return;
    var q = ($('marketSearchInput').value || '').trim();
    if (!q) { out.textContent = 'Enter a token number (for example 42) or a wallet address starting with 0x.'; return; }
    if (!CFG.CONTRACT_ADDRESS) { out.textContent = 'Market search will be available after deployment. Minted tokens and owners are read on-chain, so no results are shown yet.'; return; }
    if (!window.ethers) { out.textContent = 'The ethers library failed to load. Check your connection and try again.'; return; }
    try {
      var provider = state.provider || new window.ethers.JsonRpcProvider(CFG.RPC_URL);
      var c = state.contract || new window.ethers.Contract(CFG.CONTRACT_ADDRESS, ABI, provider);
      if (/^0x[0-9a-fA-F]{40}$/.test(q)) {
        var bal = await c.balanceOf(q);
        out.textContent = 'Wallet ' + q + ' owns ' + Number(bal) + ' ZIGZOO.';
      } else if (/^\d+$/.test(q)) {
        var id = Number(q);
        var minted = await c.totalSupply();
        if (id < 1 || id > Number(minted)) { out.textContent = 'Token #' + id + ' has not been minted yet.'; return; }
        var owner = await c.ownerOf(id);
        out.textContent = 'Token #' + id + ' — Owner: ' + owner;
      } else {
        out.textContent = 'Enter a token number (for example 42) or a wallet address starting with 0x.';
      }
    } catch (err) {
      console.error(err);
      out.textContent = 'Could not read that from the chain yet. Check the number or address and try again.';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderFooter();
    renderMarket();
    document.querySelectorAll('.acc-btn').forEach(function (b) { b.addEventListener('click', function () { var item = b.closest('.acc-item'); var open = item.classList.toggle('open'); b.setAttribute('aria-expanded', open ? 'true' : 'false'); }); });
    if ($('marketSearchForm')) $('marketSearchForm').addEventListener('submit', marketSearch);
    if ($('burgerBtn')) $('burgerBtn').addEventListener('click', function () { if ($('sideMenu').classList.contains('open')) { closeMenu(); } else { openMenu(); } });
    if ($('menuCloseBtn')) $('menuCloseBtn').addEventListener('click', closeMenu);
    if ($('menuBackdrop')) $('menuBackdrop').addEventListener('click', closeMenu);
    document.querySelectorAll('#sideMenu nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    renderGallery(12);
    renderMintNumbers();
    readOnChain();
    $('connectBtn').addEventListener('click', connect);
    $('switchBtn').addEventListener('click', switchChain);
    $('loadMoreBtn').addEventListener('click', function () { renderGallery(Math.min(20, state.shown + 12)); });
    $('closeModal').addEventListener('click', function () { $('monsterModal').close(); });
    document.querySelectorAll('.qty-box').forEach(function (b) {
      b.addEventListener('click', function () { state.qty = Number(b.getAttribute('data-qty')); renderMintNumbers(); });
    });
    $('qtyInput').addEventListener('change', function () { var v = parseInt($('qtyInput').value, 10); if (!isFinite(v) || v < 1) v = 1; var cap = state.remaining !== null ? state.remaining : 1111; state.qty = Math.min(cap, v); renderMintNumbers(); });
    var copyBtn = $('copyPromptBtn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var text = $('agentPrompt').textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { copyBtn.textContent = 'Copied ✓'; setTimeout(function () { copyBtn.textContent = 'Copy Command'; }, 2000); });
      } else {
        var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); copyBtn.textContent = 'Copied ✓';
      }
    });
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', function () { state.account = null; state.authorized = null; connect(); });
      window.ethereum.on('chainChanged', function () { connect(); });
    }
  });
})();
