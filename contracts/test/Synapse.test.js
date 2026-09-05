const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Synapse", function () {
  it("runs a full epoch: start, stake, resolve, claim", async function () {
    const [deployer, alice, bob] = await ethers.getSigners();
    const Synapse = await ethers.getContractFactory("Synapse");
    const synapse = await Synapse.deploy();
    await synapse.waitForDeployment();

    expect(await synapse.treasury()).to.equal(deployer.address);
    expect(await synapse.epochId()).to.equal(0n);

    await synapse.startEpoch();
    expect(await synapse.epochId()).to.equal(1n);

    const stake = ethers.parseEther("1");
    await synapse.connect(alice).predict(true, { value: stake });
    await synapse.connect(bob).predict(false, { value: stake });

    await expect(synapse.resolveEpoch()).to.be.revertedWith("staking still open");

    await network.provider.send("evm_increaseTime", [301]);
    await network.provider.send("evm_mine");

    const beforeAcc = await synapse.accuracyBps();
    expect(beforeAcc).to.equal(0n);

    await expect(synapse.resolveEpoch()).to.emit(synapse, "EpochResolved");

    expect(await synapse.totalCount()).to.equal(1n);
    const label = Number((await synapse.epochAt(1)).trueLabel);

    const winner = label === 1 ? alice : bob;
    const loser = label === 1 ? bob : alice;

    const balBefore = await ethers.provider.getBalance(winner.address);
    const tx = await synapse.connect(winner).claim(1);
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(winner.address);
    expect(balAfter + gasCost - balBefore).to.be.gt(stake);

    await expect(synapse.connect(loser).claim(1)).to.be.revertedWith("nothing to claim");
    await expect(synapse.connect(winner).claim(1)).to.be.revertedWith("already claimed");

    await expect(synapse.startEpoch()).to.emit(synapse, "EpochStarted");
    expect(await synapse.epochId()).to.equal(2n);
  });

  it("refunds everyone when nobody is on the winning side", async function () {
    const [, alice, bob] = await ethers.getSigners();
    const Synapse = await ethers.getContractFactory("Synapse");
    const synapse = await Synapse.deploy();
    await synapse.waitForDeployment();

    await synapse.startEpoch();

    const stake = ethers.parseEther("1");
    await synapse.connect(alice).predict(true, { value: stake });
    await synapse.connect(bob).predict(true, { value: stake });

    await network.provider.send("evm_increaseTime", [301]);
    await network.provider.send("evm_mine");
    await synapse.resolveEpoch();

    const epoch = await synapse.epochAt(1);
    if (Number(epoch.trueLabel) === 0) {
      // everyone staked yes, but label is no -> nobody won -> full refund
      const balBefore = await ethers.provider.getBalance(alice.address);
      const tx = await synapse.connect(alice).claim(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(alice.address);
      expect(balAfter + gasCost - balBefore).to.equal(stake);
    } else {
      // everyone won -> payout equals stake plus their pro-rata share of empty losing pool (0 fee)
      const balBefore = await ethers.provider.getBalance(alice.address);
      const tx = await synapse.connect(alice).claim(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(alice.address);
      expect(balAfter + gasCost - balBefore).to.equal(stake);
    }
  });
});
