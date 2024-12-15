import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Address, decodeEventLog, getAddress, Log } from "viem";
import { IERC20$Type } from "../artifacts/@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol/IERC20";

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

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockStBTC.write.setBalance([otherAccount.account.address, 20n]);
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

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockStBTC.write.setBalance([otherAccount.account.address, 20n]);
    await mockStBTC.write.setTotalSupply([20n]);
    await mockAWBTC.write.setBalance([contract.address, 24n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2() {

    const fees = 2500;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool");
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address]);
    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockStBTC.write.setBalance([otherAccount.account.address, 20n]);
    await mockStBTC.write.setTotalSupply([20n]);
    await mockAWBTC.write.setBalance([contract.address, 28n]);

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

    it("should update totalStaked value accordingly (exchangeRate = 1.00, no stake)", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await mockWBTC.write.setBalance([otherAccount.account.address, amount]);
      await mockWBTC.write.setAllowance([otherAccount.account.address, contract.address, amount]);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(amount);
    });

    it("should update totalStaked value accordingly (exchangeRate = 1.00, with stake of 20)", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 100n;
      await mockWBTC.write.setBalance([otherAccount.account.address, amount]);
      await mockWBTC.write.setAllowance([otherAccount.account.address, contract.address, amount]);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(20n + amount);
    });

    it("should update totalStaked value accordingly (exchangeRate = 1.15, with stake of 20)", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(20n + amount);
    });

    it("should emit the Staked event", async function () {
      const { contract, otherAccount, publicClient, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 150n;
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
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

    it("should revert if the amount is not allowed to be spend by the contract", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await mockWBTC.write.setBalance([otherAccount.account.address, amount]);
      await expect(contract.write.stake([amount], { account: otherAccount.account.address })).to.be.rejectedWith("ERC20: spender not allowed for amount");
    });

    it("should revert if the amount is higher than user balance", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      const balance = 50n;
      await mockWBTC.write.setBalance([otherAccount.account.address, balance]);
      await mockWBTC.write.setAllowance([otherAccount.account.address, contract.address, amount]);
      await expect(contract.write.stake([amount], { account: otherAccount.account.address })).to.be.rejectedWith("ERC20: transfer amount exceeds balance");
    });

    it("should transfer the staked amount of wBTC from the user to the Fondation contract", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockWBTC.read.transferedFromFrom()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockWBTC.read.transferedFromTo()).toLowerCase()).to.equal(contract.address);
      expect(await mockWBTC.read.transferedFromAmount()).to.equal(amount);
    });

    it("should approve Pool contract to spend the staked amount of wBTC on behalf of the Fondation contract", async function () {
      const { contract, otherAccount, mockWBTC, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockWBTC.read.approvedSpender()).toLowerCase()).to.equal(mockAavePool.address);
      expect(await mockWBTC.read.approvedAmount()).to.equal(amount);
    });

    it("should supply the staked amount of wBTC in the Pool contract", async function () {
      const { contract, otherAccount, mockWBTC, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockAavePool.read.suppliedAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect((await mockAavePool.read.suppliedOnBehalfOf()).toLowerCase()).to.equal(contract.address);
      expect(await mockAavePool.read.suppliedAmount()).to.equal(amount);
      expect(await mockAavePool.read.suppliedReferralCode()).to.equal(0);
    });

    it("should mint the corresponding amount of stBTC to the user (exchangeRate = 1.00)", async function () {
      const { contract, otherAccount, mockStBTC, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockStBTC.read.mintedTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect(await mockStBTC.read.mintedAmount()).to.equal(amount);
    });

    it("should mint the corresponding amount of stBTC to the user (exchangeRate = 1.15)", async function () {
      const { contract, otherAccount, mockStBTC, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockStBTC.read.mintedTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect(await mockStBTC.read.mintedAmount()).to.equal(86n); // 86.9565217 truncated
    });

  });

  describe("unstake", function () {

    it("should revert if user stBTC balance is 0", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 5n;
      await expect(contract.write.unstake([amount], { account: otherAccount.account.address })).to.be.rejectedWith("stBTC: burn amount exceeds balance");
    });

    it("should update totalStaked value accordingly (exchangeRate = 1.00, with stake of 20)", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 10n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(20n - amount);
    });

    it("should withdraw the correct amount of wBTC to the user (exchangeRate = 1.00, with stake of 20)", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 10n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect((await mockAavePool.read.withdrawnTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockAavePool.read.withdrawnAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect(await mockAavePool.read.withdrawnAmount()).to.equal(amount);
    });

    it("should update totalStaked value accordingly (exchangeRate = 1.15, with stake of 20, unstake of 15)", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 15n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(20n - amount);
    });

    it("should withdraw the correct amount of wBTC to the user (exchangeRate = 1.15, with stake of 20, unstake of 15)", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 15n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect((await mockAavePool.read.withdrawnTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockAavePool.read.withdrawnAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect(await mockAavePool.read.withdrawnAmount()).to.equal(17n);  // 15 * 1.15 = 17.25 truncated to 17
    });

    it("should withdraw the correct amount of wBTC to the user (exchangeRate = 1.15, with stake of 20, unstake of 20)", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 20n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect((await mockAavePool.read.withdrawnTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockAavePool.read.withdrawnAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect(await mockAavePool.read.withdrawnAmount()).to.equal(23n);  // 20 * 1.15 = 23
    });

    it("should update totalStaked value accordingly (exchangeRate = 1.15, with stake of 20, unstake of 20)", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 20n;
      await contract.write.unstake([amount], { account: otherAccount.account.address });
      expect(await contract.read.totalStaked()).to.equal(0n);
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
      expect(event.args.amount).to.equal(amount);
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

  });

  describe("exchangeRate", function () {

    it("should be 100 (1.00) if there is no stake", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFees);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([100n, 0n, 0n]);
    });

    it("should be 100 (1.00) if there is no yield", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([100n, 0n, 0n]);
    });

    it("should be 115 (1.15) if there is a customer yield of 15%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([115n, 1n, 3n]);
    });

    it("should be 130 (1.30) if there is a customer yield of 30%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([130n, 2n, 6n]);
    });

  });

  describe("payout", function () {

    it("should revert if the caller is not the owner of the contract", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFees);
      await expect(contract.write.payout({ account: otherAccount.account.address })).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("should send the correct amount of aWBTC to the owner (no yield)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      await contract.write.payout({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(0n);
    });

    it("should send the correct amount of aWBTC to the owner (no yield, 20 staked)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      await contract.write.payout({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(0n);
    });

    it("should send the correct amount of aWBTC to the owner (20 staked, with 30% yield)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      await contract.write.payout({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(2n);
    });

    it("should send nothing the second time it's called if yield didn't increase (no change in staking between calls)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      await contract.write.payout({ account: owner.account.address });
      await contract.write.payout({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(2n);
    });

    it("should emit the FeesPaid event", async function () {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.payout({ account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("FeesPaid");
      expect(event.args.amount).to.equal(1n);
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

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

async function setBalanceAndAllowance(token: any, owner: Address, spender: Address, amount: bigint){
  await token.write.setBalance([owner, amount]);
  await token.write.setAllowance([owner, spender, amount]);
}
