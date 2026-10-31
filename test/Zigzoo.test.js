const { expect } = require("chai");
const { ethers } = require("hardhat");

// Model baru (2026-11-01, referensi OOBIX, perintah Bryan):
// - Supply 1.111 tetap, harga flat 0.0005 BNB tetap, refund kelebihan.
// - Otorisasi owner DIHAPUS, diganti cek SPACE ID (holdsAgentId).
// - Pembayaran mint langsung ke revenue wallet, tidak mengendap di kontrak.
// - Artwork acak lewat metadata shuffle, tanpa reveal/gacha di kontrak.
describe("Zigzoo", function () {
  async function deploy() {
    const [owner, agent, stranger, revenue] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("MockAgentIdRegistry");
    const registry = await Registry.deploy();
    const Zigzoo = await ethers.getContractFactory("Zigzoo");
    const c = await Zigzoo.deploy(
      "ipfs://CONTOH-CID/",
      revenue.address,
      await registry.getAddress()
    );
    // Beri Agent ID ke `agent` saja (stranger tidak punya).
    await registry.mintAgentId(agent.address);
    return { c, registry, owner, agent, stranger, revenue };
  }

  it("punya supply 1.111 dan harga flat 0.0005 BNB", async function () {
    const { c } = await deploy();
    expect(await c.MAX_SUPPLY()).to.equal(1111);
    expect(await c.MINT_PRICE()).to.equal(ethers.parseEther("0.0005"));
    expect(await c.totalSupply()).to.equal(0);
    expect(await c.remainingSupply()).to.equal(1111);
  });

  it("menolak mint dari wallet tanpa SPACE ID Agent ID", async function () {
    const { c, stranger } = await deploy();
    expect(await c.holdsAgentId(stranger.address)).to.equal(false);
    await expect(
      c.connect(stranger).mint(1, { value: ethers.parseEther("0.0005") })
    ).to.be.revertedWithCustomError(c, "NoAgentId");
  });

  it("pemegang SPACE ID bisa multiple mint, bayar langsung ke revenue wallet", async function () {
    const { c, agent, revenue } = await deploy();
    expect(await c.holdsAgentId(agent.address)).to.equal(true);
    const beforeRevenue = await ethers.provider.getBalance(revenue.address);
    const beforeContract = await ethers.provider.getBalance(await c.getAddress());
    await expect(c.connect(agent).mint(3, { value: ethers.parseEther("0.0015") }))
      .to.emit(c, "Minted");
    expect(await c.totalSupply()).to.equal(3);
    expect(await c.balanceOf(agent.address)).to.equal(3);
    expect(await c.ownerOf(1)).to.equal(agent.address);
    expect(await c.tokenURI(1)).to.equal("ipfs://CONTOH-CID/1.json");
    // Dana mint langsung ke revenue, kontrak tidak menampung apa pun.
    const afterRevenue = await ethers.provider.getBalance(revenue.address);
    const afterContract = await ethers.provider.getBalance(await c.getAddress());
    expect(afterRevenue - beforeRevenue).to.equal(ethers.parseEther("0.0015"));
    expect(afterContract).to.equal(beforeContract);
    expect(afterContract).to.equal(0);
  });

  it("menolak pembayaran kurang", async function () {
    const { c, agent } = await deploy();
    await expect(
      c.connect(agent).mint(2, { value: ethers.parseEther("0.0005") })
    ).to.be.revertedWithCustomError(c, "InsufficientPayment");
  });

  it("mengembalikan kelebihan pembayaran, revenue hanya terima harga", async function () {
    const { c, agent, revenue } = await deploy();
    const beforeRevenue = await ethers.provider.getBalance(revenue.address);
    await c.connect(agent).mint(1, { value: ethers.parseEther("0.01") });
    const afterRevenue = await ethers.provider.getBalance(revenue.address);
    const afterContract = await ethers.provider.getBalance(await c.getAddress());
    // Revenue terima tepat 0.0005, sisanya kembali ke minter, kontrak 0.
    expect(afterRevenue - beforeRevenue).to.equal(ethers.parseEther("0.0005"));
    expect(afterContract).to.equal(0);
    expect(await c.totalSupply()).to.equal(1);
  });

  it("menegakkan batas supply 1.111", async function () {
    const { c, agent } = await deploy();
    const price = ethers.parseEther("0.0005");
    // 10 batch x 111 = 1.110, lalu 1 lagi = 1.111 penuh.
    for (let i = 0; i < 10; i++) {
      await c.connect(agent).mint(111, { value: price * 111n });
    }
    await c.connect(agent).mint(1, { value: price });
    expect(await c.totalSupply()).to.equal(1111);
    await expect(
      c.connect(agent).mint(1, { value: price })
    ).to.be.revertedWithCustomError(c, "MaxSupplyExceeded");
  });

  it("owner bisa ubah revenue wallet, registry, dan baseURI — bukan owner yang otorisasi agent", async function () {
    const { c, owner, agent, stranger } = await deploy();
    await expect(c.connect(stranger).setRevenueWallet(stranger.address)).to.be.reverted;
    await expect(c.connect(stranger).setAgentIdRegistry(stranger.address)).to.be.reverted;
    await expect(c.connect(stranger).setBaseURI("ipfs://lain/")).to.be.reverted;
    await c.setRevenueWallet(stranger.address);
    expect(await c.revenueWallet()).to.equal(stranger.address);
    // Mint 1 token, lalu ubah baseURI dan pastikan tokenURI ikut berubah.
    await c.connect(agent).mint(1, { value: ethers.parseEther("0.0005") });
    expect(await c.tokenURI(1)).to.equal("ipfs://CONTOH-CID/1.json");
    await c.setBaseURI("ipfs://baru/");
    expect(await c.tokenURI(1)).to.equal("ipfs://baru/1.json");
    // Kontrak baru ini TIDAK punya fungsi otorisasi owner lagi.
    expect(c.setAgentAuthorization).to.equal(undefined);
    expect(c.isAuthorizedAgent).to.equal(undefined);
  });

  it("withdraw hanya katup pengaman: revert kalau saldo kontrak 0", async function () {
    const { c, agent, stranger } = await deploy();
    await c.connect(agent).mint(2, { value: ethers.parseEther("0.0010") });
    // Dana mint sudah langsung ke revenue, jadi kontrak kosong.
    expect(await ethers.provider.getBalance(await c.getAddress())).to.equal(0);
    await expect(c.connect(stranger).withdraw()).to.be.reverted;
    await expect(c.withdraw()).to.be.revertedWithCustomError(c, "NoFunds");
  });
});
