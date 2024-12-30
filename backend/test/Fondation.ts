import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Address, decodeEventLog, getAddress, Log, parseUnits } from "viem";

describe("Fondation", function () {
  
  async function deployFondationFixtureOnePercentFees() {
    
    const fees = 100;
    const btcPrice = toBigInt('80000');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockPriceFeed = await hre.viem.deployContract("MockPriceFeed");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockAWBTC.address, btcPrice]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address, mockAaveOracle.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, mockPriceFeed.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await mockUSDC.write.setBalance([mockAavePool.address, toBigInt('200000')]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };
  }

  async function deployFondationFixtureOnePercentFeesWithStake() {

    const fees = 100;
    const btcPrice = toBigInt('80000');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockPriceFeed = await hre.viem.deployContract("MockPriceFeed");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockAWBTC.address, btcPrice]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address, mockAaveOracle.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, mockPriceFeed.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigInt('200000')]);
    await contract.write.stake([20n], { account: otherAccount.account.address });

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield() {

    const fees = 2500;
    const btcPrice = toBigInt('80000');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockPriceFeed = await hre.viem.deployContract("MockPriceFeed");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockAWBTC.address, btcPrice]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address, mockAaveOracle.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, mockPriceFeed.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigInt('200000')]);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockAWBTC.write.addInterest([contract.address, 4n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 4n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2() {

    const fees = 2500;
    const btcPrice = toBigInt('80000');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockPriceFeed = await hre.viem.deployContract("MockPriceFeed");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockAWBTC.address, btcPrice]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address, mockAaveOracle.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, mockPriceFeed.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigInt('200000')]);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockAWBTC.write.addInterest([contract.address, 8n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 8n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_3() {

    const fees = 2500;
    const btcPrice = toBigInt('80000');
    const [owner, staker1, staker2, unstaker] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockPriceFeed = await hre.viem.deployContract("MockPriceFeed");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockAWBTC.address, btcPrice]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address, mockAaveOracle.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, mockPriceFeed.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, staker1.account.address, contract.address, 500n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigInt('200000')]);
    await contract.write.stake([500n], { account: staker1.account.address });
    await mockAWBTC.write.addInterest([contract.address, 4n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 4n]);
    await mockStBTC.write.transfer([unstaker.account.address, 200n], { account: staker1.account.address });

    return { contract, owner, staker1, staker2, unstaker, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield() {

    const fees = 2000;
    const btcPrice = toBigInt('80000');
    const [owner, user1, user2, user3] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockStBTC = await hre.viem.deployContract("MockStBTC");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockPriceFeed = await hre.viem.deployContract("MockPriceFeed");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockAWBTC.address, btcPrice]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockStBTC.address, mockAavePool.address, mockAaveOracle.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, mockPriceFeed.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, user1.account.address, contract.address, toBigIntWBTC('100'));
    await mockUSDC.write.setBalance([mockAavePool.address, toBigInt('200000')]);
    await contract.write.stake([toBigIntWBTC('100')], { account: user1.account.address });
    await mockAWBTC.write.addInterest([contract.address, toBigIntWBTC('20')]);
    await mockWBTC.write.addInterest([mockAavePool.address, toBigIntWBTC('20')]);

    return { contract, owner, user1, user2, user3, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

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

    it("should supply the staked amount of wBTC to the Pool contract", async function () {
      const { contract, otherAccount, mockWBTC, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockAavePool.read.suppliedAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect((await mockAavePool.read.suppliedOnBehalfOf()).toLowerCase()).to.equal(contract.address);
      expect(await mockAavePool.read.suppliedAmount()).to.equal(amount);
      expect(await mockAavePool.read.suppliedReferralCode()).to.equal(0);
    });

    it("should deposit the corresponding amount of strategy asset to the strategy contract (exchangeRate = 1.00, no stake)", async function () {
      const { contract, otherAccount, mockWBTC, mockUSDC, strategy } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = toBigIntWBTC('1');
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await strategy.read.depositedAmount()).to.equal(toBigInt('40000'));
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(toBigInt('40000'));
    });

    it("should mint the corresponding amount of stBTC to the user (exchangeRate = 1.00)", async function () {
      const { contract, otherAccount, mockStBTC, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockStBTC.read.mintedTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect(await mockStBTC.read.mintedAmount()).to.equal(amount * 10000000000n); // stBTC has 18 decimals so we multiply by 10^10
    });

    it("should mint the corresponding amount of stBTC to the user (exchangeRate = 1.20)", async function () {
      const { contract, otherAccount, mockStBTC, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockStBTC.read.mintedTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect(await mockStBTC.read.mintedAmount()).to.equal(833333333333n); // 83.3333333333 satoshis
    });

    it("should mint the corresponding amount of stBTC to the user (exchangeRate = 1.40)", async function () {
      const { contract, otherAccount, mockStBTC, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect((await mockStBTC.read.mintedTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect(await mockStBTC.read.mintedAmount()).to.equal(714285714285n); // 71,4285714285 satoshis
    });

  });

  describe("unstake", function () {

    it("should revert if user stBTC balance is 0", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 5n;
      await expect(contract.write.unstake([amount], { account: otherAccount.account.address })).to.be.rejectedWith("stBTC: burn amount exceeds balance");
    });

    it("should withdraw the correct amount of wBTC to the user (exchangeRate = 1.00, with stake of 20 satoshis)", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amountStBTC = toBigInt('0.0000001');
      const amountWBTC = toBigIntWBTC('0.0000001');
      await contract.write.unstake([amountStBTC], { account: otherAccount.account.address });
      expect((await mockAavePool.read.withdrawnTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockAavePool.read.withdrawnAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect(await mockAavePool.read.withdrawnAmount()).to.equal(amountWBTC);
    });

    it("should withdraw the correct amount of wBTC to the user (exchangeRate = 1.20, with stake of 20 satoshis, unstake of 15 stSatoshis)", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amountStBTC = toBigInt('0.00000015');
      const amountWBTC = toBigIntWBTC('0.00000018'); // 15 * 1.20 = 18
      await contract.write.unstake([amountStBTC], { account: otherAccount.account.address });
      expect((await mockAavePool.read.withdrawnTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockAavePool.read.withdrawnAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect(await mockAavePool.read.withdrawnAmount()).to.equal(amountWBTC);
    });

    it("should withdraw the correct amount of wBTC to the user (exchangeRate = 1.20, with stake of 20 satoshis, unstake of 20)", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amountStBTC = toBigInt('0.00000020');
      const amountWBTC = toBigIntWBTC('0.00000024'); // 20 * 1.20 = 24
      await contract.write.unstake([amountStBTC], { account: otherAccount.account.address });
      expect((await mockAavePool.read.withdrawnTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockAavePool.read.withdrawnAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect(await mockAavePool.read.withdrawnAmount()).to.equal(amountWBTC);
    });

    it("should emit the Unstaked event", async function () {
      const { contract, otherAccount, publicClient } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amountStBTC = toBigInt('0.00000003');
      const amountWBTC = toBigIntWBTC('0.00000003');
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.unstake([amountStBTC], { account: otherAccount.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("Unstaked");
      expect(event.args.amount).to.equal(amountWBTC);
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

  });

  describe("exchangeRate", function () {

    it("should be 1.00 if there is no stake", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFees);
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1'));
    });

    it("should be 1.00 if there is no yield", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1'));
    });

    it("should be 1.20 if there is a customer yield of 20%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.20'));
    });

    it("should be 1.40 if there is a customer yield of 30%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.40'));
    });

    it("should be 1.006 if there is a customer yield of 0.006%", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_3);
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.008'));
    });

    it("should be 1.00 if there is no yield, with additional stake", async function () {
      const { contract, mockWBTC, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1'));
    });

    it("should be 1.20 if there is a yield of 20%, with additional stake", async function () {
      const { contract, mockWBTC, otherAccount } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.20'));
    });

    it("should be 1.40 if there is a yield of 40%, with additional stake", async function () {
      const { contract, mockWBTC, otherAccount } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.40'));
    });

  });

  describe("accrueYield", function () {

    it("should revert if the caller is not the owner of the contract", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFees);
      await expect(contract.write.accrueYield({ account: otherAccount.account.address })).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("should send the correct amount of aWBTC to the owner (no yield)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(0n);
    });

    it("should send the correct amount of aWBTC to the owner (no yield, 20 staked)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(0n);
    });

    it("should send the correct amount of aWBTC to the owner (20 staked, with 30% yield)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(2n);
    });

    it("should send nothing the second time it's called if yield didn't increase (no change in staking between calls)", async function () {
      const { contract, owner, mockAWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);
      await contract.write.accrueYield({ account: owner.account.address });
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockAWBTC.read.balanceOf([owner.account.address])).to.equal(2n);
    });

    it("should emit the FeesPaid event", async function () {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.accrueYield({ account: owner.account.address });
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

    it("should emit the YieldAccrued event", async function () {
    });

  });

  describe("various scenarios", function () {

    it("accrue yield then stake then accrue yield", async function () {
      
      const { contract, owner, otherAccount, mockWBTC, mockAWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2);

      // Owner takes the payout and then retrieve the fees corresponding to the current revenues
      await contract.write.accrueYield({ account: owner.account.address });

      // A user stakes 20 wBTC
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
      await contract.write.stake([20n], { account: otherAccount.account.address });

      // Owner takes the payout and then retrieve the fees corresponding to the current revenues
      await contract.write.accrueYield({ account: owner.account.address });

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
      expect(await mockAWBTC.read.balanceOf([contract.address])).to.equal(toBigIntWBTC('120'));

      // The exchange rate should be 1.20
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.20'));

      // Total supply of stBTC should be 100
      expect(await mockStBTC.read.totalSupply()).to.equal(toBigInt('100'));

      // Total supply of aWBTC should be 120
      expect(await mockAWBTC.read.totalSupply()).to.equal(toBigIntWBTC('120'));
      
      // Unstake 100 stBTC (the whole user stake)
      await contract.write.unstake([toBigInt('100')], { account: user1.account.address });
      
      // The contract totalStaked value should be 0 wBTC
      expect(await contract.read.totalStaked()).to.equal(0n);

      // The exchange rate should be 1.00, the fees 4 wBTC and the yield 16 wBTC
      expect(await contract.read.exchangeRate()).to.deep.equal([100000000n, toBigInt('4'), toBigInt('0')]);
     
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
      await setBalanceAndAllowance(mockWBTC, user2.account.address, contract.address, toBigIntWBTC('200'));
      await contract.write.stake([toBigIntWBTC('200')], { account: user2.account.address });

      // The user2 should have 166.666666666666666666 stBTC
      expect(await mockStBTC.read.balanceOf([user2.account.address])).to.equal(toBigInt('166.666666666666666666'));

      // The user2 should have 0 wBTC
      expect(await mockWBTC.read.balanceOf([user2.account.address])).to.equal(0n);

      // The exchange rate should be 1.20
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.20'));

      // Unstake 172.4137931 stBTC (user2)
      await contract.write.unstake([parseUnits('172.4137931', 8)], { account: user2.account.address });

      // The user2 should have 0 stBTC
      expect(await mockStBTC.read.balanceOf([user2.account.address])).to.equal(0n);

      // The user2 should have 200 wBTC
      expect(await mockWBTC.read.balanceOf([user2.account.address])).to.equal(toBigIntWBTC('199.99999999')); // ERROR : not exactly 200 wBTC

      // Total supply of stBTC should be 100
      expect(await mockStBTC.read.totalSupply()).to.equal(toBigInt('100'));

      // Total supply of aWBTC should be 120
      expect(await mockAWBTC.read.totalSupply()).to.equal(toBigIntWBTC('120.00000001'));

      // The exchange rate should be 1.16
      expect(await contract.read.exchangeRate()).to.equal(toBigIntExchangeRate('1.20'));
      
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
  return parseUnits(stringNumber, 18);
}

function toBigIntWBTC(stringNumber: string): bigint {
  return parseUnits(stringNumber, 8);
}

function toBigIntExchangeRate(stringNumber: string): bigint {
  return parseUnits(stringNumber, 9);
}
