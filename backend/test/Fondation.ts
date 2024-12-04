import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { decodeEventLog, getAddress, Log } from "viem";

describe("Fondation", function () {
  
  async function deployOnePercentFeesFondationFixture() {
    
    const fees = 100;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const contract = await hre.viem.deployContract("Fondation", [fees]);
    const publicClient = await hre.viem.getPublicClient();

    return { contract, owner, otherAccount, publicClient};
  }

  async function deployFifteenPercentFeesFondationFixture() {
    const fees = 1500;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const contract = await hre.viem.deployContract("Fondation", [fees]);
    const publicClient = await hre.viem.getPublicClient();

    return { contract, owner, otherAccount, publicClient};
  }

  async function deployOnePercentFeesFondationFixtureWithTenStaked() {
    const fees = 100;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const contract = await hre.viem.deployContract("Fondation", [fees]);
    const publicClient = await hre.viem.getPublicClient();
    
    await contract.write.stake([10], { account: otherAccount.account.address });

    return { contract, owner, otherAccount, publicClient};
  }

  describe("constructor", function () {

    it("Should have the correct owner", async function () {
      const { contract, owner } = await loadFixture(deployOnePercentFeesFondationFixture);
      const address = getAddress(owner.account.address);
      expect(await contract.read.owner()).to.equal(address);
    });

    it("Should have nothing staked", async function () {
      const { contract } = await loadFixture(deployOnePercentFeesFondationFixture);
      expect(await contract.read.totalStaked()).to.equal(0n);
    });

    it("Should have the right fees (1%)", async function () {
      const { contract } = await loadFixture(deployOnePercentFeesFondationFixture);
      expect(await contract.read.feesRate()).to.equal(100n);
    });

    it("Should have the right fees (15%)", async function () {
      const { contract } = await loadFixture(deployFifteenPercentFeesFondationFixture);
      expect(await contract.read.feesRate()).to.equal(1500n);
    });

  });

  describe("stake", function () {

    it("should update totalStaked value", async function () {
      const { contract, otherAccount } = await loadFixture(deployOnePercentFeesFondationFixture);
      const amount = 100n;
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(amount);
    });

    it("should emit the Staked event", async function () {
      const { contract, otherAccount, publicClient } = await loadFixture(deployOnePercentFeesFondationFixture);
      const amount = 150n;
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.stake([amount], { account: otherAccount.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("Staked");
      expect(event.args.amount).to.equal(amount);
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

  });

  describe("unstake", function () {

    it("should update totalStaked value", async function () {
      const { contract, otherAccount } = await loadFixture(deployOnePercentFeesFondationFixtureWithTenStaked);
      const amount = 5n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(10n - amount); // TODO: calculate the correct expected value
    });

    it("should emit the Unstaked event", async function () {
      const { contract, otherAccount, publicClient } = await loadFixture(deployOnePercentFeesFondationFixtureWithTenStaked);
      const amount = 3n;
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.unstake([amount], { account: otherAccount.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("Unstaked");
      expect(event.args.amount).to.equal(amount); // TODO: calculate the correct expected value
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

  });

  describe("exchangeRate", function () {
  });

  describe("payout", function () {
  });

});

interface Event {
  eventName: string;
  args: any;
}

function decodeEventFromLogs(logs: Log[], index: number, contract: any): Event {
  return decodeEventLog({
    abi: contract.abi,
    data: logs[index].data,
    topics: logs[index].topics
  });
}
