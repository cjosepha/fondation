import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Address, decodeEventLog, getAddress, Log, parseUnits } from "viem";

describe("Fondation", function () {
  
  async function deployFondationFixtureOnePercentFees() {
    
    const fees = 100;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockStBTC.address]);
    const strategy = await hre.viem.deployContract("SimpleAavePoolStrategy", [contract.address, mockWBTC.address, mockAWBTC.address, mockAavePool.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, strategy };
  }

  async function deployFondationFixtureOnePercentFeesWithStake() {

    const fees = 100;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockStBTC.address]);
    const strategy = await hre.viem.deployContract("SimpleAavePoolStrategy", [contract.address, mockWBTC.address, mockAWBTC.address, mockAavePool.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await contract.write.stake([20n], { account: otherAccount.account.address });

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield() {

    const fees = 2500;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockStBTC.address]);
    const strategy = await hre.viem.deployContract("SimpleAavePoolStrategy", [contract.address, mockWBTC.address, mockAWBTC.address, mockAavePool.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockAWBTC.write.addInterest([contract.address, 4n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 4n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2() {

    const fees = 2500;
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockStBTC.address]);
    const strategy = await hre.viem.deployContract("SimpleAavePoolStrategy", [contract.address, mockWBTC.address, mockAWBTC.address, mockAavePool.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockAWBTC.write.addInterest([contract.address, 8n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 8n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_3() {

    const fees = 2500;
    const [owner, staker1, staker2, unstaker] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockStBTC.address]);
    const strategy = await hre.viem.deployContract("SimpleAavePoolStrategy", [contract.address, mockWBTC.address, mockAWBTC.address, mockAavePool.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, staker1.account.address, contract.address, 500n);
    await contract.write.stake([500n], { account: staker1.account.address });
    await mockAWBTC.write.addInterest([contract.address, 4n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 4n]);
    await mockStBTC.write.transfer([unstaker.account.address, 200n], { account: staker1.account.address });

    return { contract, owner, staker1, staker2, unstaker, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, strategy };

  }

  async function deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield() {

    const fees = 2000;
    const [owner, user1, user2, user3] = await hre.viem.getWalletClients();
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockStBTC.address]);
    const strategy = await hre.viem.deployContract("SimpleAavePoolStrategy", [contract.address, mockWBTC.address, mockAWBTC.address, mockAavePool.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, user1.account.address, contract.address, toBigInt('100'));
    await contract.write.stake([parseUnits('100', 8)], { account: user1.account.address });
    await mockAWBTC.write.addInterest([contract.address, parseUnits('20', 8)]);
    await mockWBTC.write.addInterest([mockAavePool.address, parseUnits('20', 8)]);

    return { contract, owner, user1, user2, user3, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, strategy };

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
      expect(await mockWBTC.read.balanceOf([otherAccount.account.address])).to.equal(0n);
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
      const { contract, otherAccount, mockWBTC, mockAavePool, strategy } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockAavePool.read.suppliedAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect((await mockAavePool.read.suppliedOnBehalfOf()).toLowerCase()).to.equal(strategy.address);
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

    it("should mint the corresponding amount of stBTC to the user (exchangeRate = 1.30)", async function () {
      const { contract, otherAccount, mockStBTC, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockStBTC.read.mintedTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect(await mockStBTC.read.mintedAmount()).to.equal(76n); // 76,9230769 truncated
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

    it("should update totalStaked value accordingly (exchangeRate = 1.05, with stake of 500, unstake of 28)", async function () {
      const { contract, unstaker } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_3);
      const amount = 28n;
      await contract.write.unstake([amount], { account: unstaker.account.address });
      expect(await contract.read.totalStaked()).to.equal(500n - amount);
    });

    it("should update totalStaked value accordingly (exchangeRate = 1.05, with stake of 500, unstake of 150)", async function () {
      const { contract, unstaker } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_3);
      const amount = 150n;
      await contract.write.unstake([amount], { account: unstaker.account.address });
      expect(await contract.read.totalStaked()).to.equal(500n - amount);
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
      expect(await contract.read.exchangeRate()).to.equal([100000000n]);
      expect(await contract.read.fees()).to.equal([0n]);
      expect(await contract.read.yield()).to.equal([0n]);
    });

    it("should be 100 (1.00) if there is no yield", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([100000000n, 0n, 0n]);
    });

    it("should be 1150000 (1.15) if there is a customer yield of 15%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([115000000n, 1n, 3n]);
    });

    it("should be 1300000 (1.30) if there is a customer yield of 30%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([130000000n, 2n, 6n]);
    });

    it("should be 100600 (1.006) if there is a customer yield of 0.006%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_3);
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([100600000n, 1n, 3n]);
    });

    it("should be 1000000 (1.00) if there is no yield, with additional stake", async function () {
      const { contract, mockWBTC, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([100000000n, 0n, 0n]);
    });

    it("should be 1160377 (1.160377) if there is a yield of 16.0377%, with additional stake", async function () {
      const { contract, mockWBTC, otherAccount } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([116037735n, 1n, 3n]);
    });

    it("should be 1312500 (1.30) if there is a customer yield of 30%, with additional stake", async function () {
      const { contract, mockWBTC, otherAccount } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([131250000n, 2n, 6n]);
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

  describe("various scenarios", function () {

    it("payout then stake then payout", async function () {
      
      const { contract, owner, otherAccount, mockWBTC, mockAWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);

      // Owner takes the payout and then retrieve the fees corresponding to the current revenues
      await contract.write.payout({ account: owner.account.address });

      // A user stakes 20 wBTC
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
      await contract.write.stake([20n], { account: otherAccount.account.address });

      // Owner takes the payout and then retrieve the fees corresponding to the current revenues
      await contract.write.payout({ account: owner.account.address });

      // Owner should have 2 aWBTC
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(2n);

      // Total staked should be 40 wBTC
      expect(await contract.read.totalStaked()).to.equal(40n);

    });

    it("stake 100 wBTC, then revenues 20 aWBTC, then unstake 100 stBTC, then payout", async function () {

      const { contract, owner, user1, mockStBTC, mockAWBTC, mockWBTC } = await loadFixture(deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield);

      // The owner should have 0 aWBTC
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(0n);

      // The user should have 100 stBTC
      expect(await mockStBTC.read.balanceOf([user1.account.address])).to.equal(toBigInt('100'));

      // The contract should have 100+20 aWBTC
      expect(await mockAWBTC.read.balanceOf([contract.address])).to.equal(toBigInt('120'));

      // The contract totalStaked value should be 100
      expect(await contract.read.totalStaked()).to.equal(toBigInt('100'));

      // The exchange rate should be 1.16, the fees 4 wBTC and the yield 16 wBTC
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([116000000n, toBigInt('4'), toBigInt('16')]);

      // Total supply of stBTC should be 100
      expect(await mockStBTC.read.totalSupply()).to.equal(toBigInt('100'));

      // Total supply of aWBTC should be 120
      expect(await mockAWBTC.read.totalSupply()).to.equal(toBigInt('120'));
      
      // Unstake 100 stBTC (the whole user stake)
      await contract.write.unstake([toBigInt('100')], { account: user1.account.address });
      
      // The contract totalStaked value should be 0 wBTC
      expect(await contract.read.totalStaked()).to.equal(0n);

      // The exchange rate should be 1.00, the fees 4 wBTC and the yield 16 wBTC
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([100000000n, toBigInt('4'), toBigInt('0')]);
     
      // The user should have 0 stBTC
      expect(await mockStBTC.read.balanceOf([user1.account.address])).to.equal(0n);

      // The user should have 100+16 wBTC
      expect(await mockWBTC.read.balanceOf([user1.account.address])).to.equal(toBigInt('116'));

      // Total supply of stBTC should be 0
      expect(await mockStBTC.read.totalSupply()).to.equal(0n);

      // The contract should only have the 4 aWBTC of the fees
      expect(await mockAWBTC.read.balanceOf([contract.address])).to.equal(toBigInt('4'));

      // The owner retrieves the fees
      await contract.write.payout({ account: owner.account.address });

      // The owner should have 4 aWBTC
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(toBigInt('4'));

    });

    it("stake 100 wBTC, then revenues 20 aWTC, then stake 200 wBTC, then unstake the last stake", async function () {

      const { contract, owner, user1, user2, mockStBTC, mockWBTC, mockAWBTC } = await loadFixture(deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield);

      // Stake 200 wBTC (user2)
      await setBalanceAndAllowance(mockWBTC, user2.account.address, contract.address, toBigInt('200'));
      await contract.write.stake([toBigInt('200')], { account: user2.account.address });

      // The user2 should have 172.4137931 stBTC
      expect(await mockStBTC.read.balanceOf([user2.account.address])).to.equal(toBigInt('172.4137931'));

      // The user2 should have 0 wBTC
      expect(await mockWBTC.read.balanceOf([user2.account.address])).to.equal(0n);
      
      // The contract totalStaked value should be 300 wBTC
      expect(await contract.read.totalStaked()).to.equal(parseUnits('300', 8));

      // The exchange rate should be 1.16, the fees 4 wBTC and the yield 16 wBTC
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([116000000n, toBigInt('4'), toBigInt('16')]);

      // Unstake 172.4137931 stBTC (user2)
      await contract.write.unstake([parseUnits('172.4137931', 8)], { account: user2.account.address });

      // The user2 should have 0 stBTC
      expect(await mockStBTC.read.balanceOf([user2.account.address])).to.equal(0n);

      // The user2 should have 200 wBTC
      expect(await mockWBTC.read.balanceOf([user2.account.address])).to.equal(toBigInt('199.99999999')); // ERROR : not exactly 200 wBTC

      // Total supply of stBTC should be 100
      expect(await mockStBTC.read.totalSupply()).to.equal(toBigInt('100'));

      // Total supply of aWBTC should be 120
      expect(await mockAWBTC.read.totalSupply()).to.equal(toBigInt('120.00000001'));

      // The exchange rate should be 1.16, the fees 4 wBTC and the yield 16 wBTC
      expect(await contract.read.exchangeRateAndYield()).to.deep.equal([116000000n, toBigInt('4'), toBigInt('16')]); // ERROR :  all 3 values has changed.
      
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

function toBigInt(stringNumber: string): bigint {
  return parseUnits(stringNumber, 8);
}
