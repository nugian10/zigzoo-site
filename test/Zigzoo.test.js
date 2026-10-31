const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Zigzoo", function () {
  async function deploy() {
    const [owner, agent, stranger] = await ethers.getSigners();
    const Zigzoo = await ethers.getContractFactory("Zigzoo");
    const c = await Zigzoo.deploy("ipfs://CONTOH-CID/");
    return { c, owner, agent, stranger };
  }

  it("punya supply 1.111 dan harga 0.0004 BNB", async function () {
    const { c } = await deploy();
    expect(await c.MAX_SUPPLY()).to.equal(1111);
    expect(await c.MINT_PRICE()).to.equal(ethers.parseEther("0.0004"));
    expect(await c.totalSupply()).to.equal(0);
  });

  it("menolak mint dari wallet yang belum terotorisasi", async function () {
    const { c, stranger } = await deploy();
    await expect(
      c.connect(stranger).mint(1, { value: ethers.parseEther("0.0004") })
    ).to.be.revertedWithCustomError(c, "NotAuthorizedAgent");
  });

  it("agent terotorisasi bisa multiple mint dan membayar tepat", async function () {
    const { c, agent } = await deploy();
    await c.setAgentAuthorization(agent.address, true);
    await expect(c.connect(agent).mint(3, { value: ethers.parseEther("0.0012") }))
      .to.emit(c, "Minted");
    expect(await c.totalSupply()).to.equal(3);
    expect(await c.balanceOf(agent.address)).to.equal(3);
    expect(await c.ownerOf(1)).to.equal(agent.address);
    expect(await c.tokenURI(1)).to.equal("ipfs://CONTOH-CID/1.json");
  });

  it("menolak pembayaran kurang", async function () {
    const { c, agent } = await deploy();
    await c.setAgentAuthorization(agent.address, true);
    await expect(
      c.connect(agent).mint(2, { value: ethers.parseEther("0.0004") })
    ).to.be.revertedWithCustomError(c, "InsufficientPayment");
  });

  it("mengembalikan kelebihan pembayaran", async function () {
    const { c, agent } = await deploy();
    await c.setAgentAuthorization(agent.address, true);
    const before = await ethers.provider.getBalance(await c.getAddress());
    await c.connect(agent).mint(1, { value: ethers.parseEther("0.01") });
    const after = await ethers.provider.getBalance(await c.getAddress());
    expect(after - before).to.equal(ethers.parseEther("0.0004"));
  });

  it("mencabut otorisasi menghentikan mint berikutnya", async function () {
    const { c, agent } = await deploy();
    await c.setAgentAuthorization(agent.address, true);
    await c.connect(agent).mint(1, { value: ethers.parseEther("0.0004") });
    await c.setAgentAuthorization(agent.address, false);
    expect(await c.isAuthorizedAgent(agent.address)).to.equal(false);
    await expect(
      c.connect(agent).mint(1, { value: ethers.parseEther("0.0004") })
    ).to.be.revertedWithCustomError(c, "NotAuthorizedAgent");
  });

  it("menegakkan batas supply 1.111", async function () {
    const { c, agent } = await deploy();
    await c.setAgentAuthorization(agent.address, true);
    const price = ethers.parseEther("0.0004");
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

  it("hanya owner yang bisa withdraw dan mengubah baseURI", async function () {
    const { c, agent, stranger } = await deploy();
    await c.setAgentAuthorization(agent.address, true);
    await c.connect(agent).mint(2, { value: ethers.parseEther("0.0008") });
    await expect(c.connect(stranger).withdraw()).to.be.reverted;
    await expect(c.connect(stranger).setBaseURI("ipfs://lain/")).to.be.reverted;
    await expect(c.withdraw()).to.emit(c, "Withdrawn");
    expect(await ethers.provider.getBalance(await c.getAddress())).to.equal(0);
  });
});
