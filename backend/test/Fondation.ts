import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { decodeEventLog, getAddress, Log } from "viem";

describe("Fondation", function () {
  
  async function deployFondationFixtureOnePercentFees() {
    
    const fees = 100;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool");
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address]);
    const publicClient = await hre.viem.getPublicClient();

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool };
  }

  async function deployFondationFixtureOnePercentFeesWithStake() {

    const fees = 100;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool");
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address]);
    const publicClient = await hre.viem.getPublicClient();

    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockStBTC.write.setTotalSupply([20n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield() {

    const fees = 2500;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool");
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address]);
    const publicClient = await hre.viem.getPublicClient();

    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockStBTC.write.setTotalSupply([20n]);
    await mockAWBTC.write.setBalance([contract.address, 24n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool };

  }
    

  describe("constructor", function () {

    it("Should have the correct owner", async function () {
      const { contract, owner } = await loadFixture(deployFondationFixtureOnePercentFees);
      const address = getAddress(owner.account.address);
      expect(await contract.read.owner()).to.equal(address);
    });

    it("Should have nothing staked", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFees);
      expect(await contract.read.totalStaked()).to.equal(0n);
    });

    it("Should have the right fees (1%)", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFees);
      expect(await contract.read.feesRate()).to.equal(100n);
    });

  });

  describe("stake", function () {

    it("should update totalStaked value", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(amount);
    });

    it("should emit the Staked event", async function () {
      const { contract, otherAccount, publicClient } = await loadFixture(deployFondationFixtureOnePercentFees);
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

    it("should revert if the amount is 0", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFees);
      await expect(contract.write.stake([0], { account: otherAccount.account.address })).to.be.rejectedWith("You must specify an amount greater than 0");
    });

    it("should transfer the staked amount of wBTC from the user to the Fondation contract", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockWBTC.read.transferedFromFrom()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockWBTC.read.transferedFromTo()).toLowerCase()).to.equal(contract.address);
      expect(await mockWBTC.read.transferedFromAmount()).to.equal(amount);
    });

    it("should approve Pool contract to spend the staked amount of wBTC on behalf of the Fondation contract", async function () {
      const { contract, otherAccount, mockWBTC, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockWBTC.read.approvedSpender()).toLowerCase()).to.equal(mockAavePool.address);
      expect(await mockWBTC.read.approvedAmount()).to.equal(amount);
    });

    it("should supply the staked amount of wBTC in the Pool contract", async function () {
      const { contract, otherAccount, mockWBTC, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockAavePool.read.suppliedAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect((await mockAavePool.read.suppliedOnBehalfOf()).toLowerCase()).to.equal(contract.address);
      expect(await mockAavePool.read.suppliedAmount()).to.equal(amount);
      expect(await mockAavePool.read.suppliedReferralCode()).to.equal(0);
    });

    it("should mint the corresponding amount of stBTC to the user", async function () {
      const { contract, otherAccount, mockStBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockStBTC.read.mintedTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect(await mockStBTC.read.mintedAmount()).to.equal(amount);
    });

  });

  describe("unstake", function () {

    it("should update totalStaked value", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 5n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(20n - amount); // TODO: calculate the correct expected value
    });

    it("should emit the Unstaked event", async function () {
      const { contract, otherAccount, publicClient } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
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

    it("should be 100 (1.00%) if there is no stake", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFees);
      expect(await contract.read.exchangeRate()).to.equal(100n);
    });

    it("should be 100 (1.00%) if there is no yield", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      expect(await contract.read.exchangeRate()).to.equal(100n);
    });

    it("should be 115 (1.15%) if there is a customer yield of 15%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      expect(await contract.read.exchangeRate()).to.equal(115n);
    });

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
