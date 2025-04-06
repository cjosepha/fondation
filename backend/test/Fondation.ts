import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, zeroAddress } from "viem";
import {
  decodeEventFromLogs,
  setBalanceAndAllowance,
  toBigIntAaveBaseCurrency,
  toBigIntExchangeRate,
  toBigIntUSDC,
  toBigIntWBTC,
  toBigInt,
  toBigIntRate
} from "./utils";

describe("Fondation unit testing", function () {

  async function deployFondationFixtureIncomplete() {
    
    const fees = 100;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('1.0');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);

    const publicClient = await hre.viem.getPublicClient();

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockAavePool, mockUSDC, mockAaveOracle, mockUniSwapRouter, fees };
  }
  
  async function deployFondationFixtureOnePercentFees() {
    
    const fees = 100;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('1.0');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
    const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });
    await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('5000000')]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };
  }

  async function deployFondationFixtureOnePercentFeesWithStake() {

    const fees = 100;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('0.987');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
    const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });
    await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('200000')]);
    await contract.write.stake([20n], { account: otherAccount.account.address });

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield() {

    const fees = 2500;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('0.987');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
    const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });
    await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('200000')]);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockAWBTC.write.addInterest([contract.address, 4n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 4n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_2() {

    const fees = 2500;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('0.987');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
    const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });
    await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, 20n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('200000')]);
    await contract.write.stake([20n], { account: otherAccount.account.address });
    await mockAWBTC.write.addInterest([contract.address, 8n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 8n]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield_3() {

    const fees = 2500;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('0.987');
    const [owner, staker1, staker2, unstaker] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
    const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });
    await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, staker1.account.address, contract.address, 500n);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('200000')]);
    await contract.write.stake([500n], { account: staker1.account.address });
    await mockAWBTC.write.addInterest([contract.address, 4n]);
    await mockWBTC.write.addInterest([mockAavePool.address, 4n]);
    await mockStBTC.write.transfer([unstaker.account.address, 200n], { account: staker1.account.address });

    return { contract, owner, staker1, staker2, unstaker, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield() {

    const fees = 2000;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('0.987');
    const [owner, user1, user2, user3] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
    const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });
    await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    await setBalanceAndAllowance(mockWBTC, user1.account.address, contract.address, toBigIntWBTC('100'));
    await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('200000')]);
    await contract.write.stake([toBigIntWBTC('100')], { account: user1.account.address });
    await mockAWBTC.write.addInterest([contract.address, toBigIntWBTC('20')]);
    await mockWBTC.write.addInterest([mockAavePool.address, toBigIntWBTC('20')]);

    return { contract, owner, user1, user2, user3, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }

  async function deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield() {

    const fees = 2500;
    const btcPrice = toBigIntAaveBaseCurrency('80000');
    const usdcPrice = toBigIntAaveBaseCurrency('1.0');
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const mockUSDC = await hre.viem.deployContract("MockERC20");
    const mockWBTC = await hre.viem.deployContract("MockERC20");
    const mockAWBTC = await hre.viem.deployContract("MockAWBTC");
    const mockAaveOracle = await hre.viem.deployContract("MockAaveOracle", [mockWBTC.address, btcPrice, mockUSDC.address, usdcPrice]);
    const mockUniSwapRouter = await hre.viem.deployContract("MockUniSwapRouter", [mockUSDC.address, mockWBTC.address, mockAaveOracle.address]);
    const mockAavePool = await hre.viem.deployContract("MockAavePool", [mockAWBTC.address, mockWBTC.address, mockUSDC.address, btcPrice, usdcPrice]);
    const contract = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
    const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
    const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);

    // Set the strategy on the main contract
    await contract.write.setStrategy([strategy.address], { account: owner.account.address });
    await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });

    const publicClient = await hre.viem.getPublicClient();

    const amountStaked = toBigIntWBTC('0.05');

    await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amountStaked);
    await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('20000000')]);
    await contract.write.stake([amountStaked], { account: otherAccount.account.address });

    // Adding the yield to the strategy contract in USDC (strategy asset)
    const amountYield = toBigIntUSDC('20');
    await setBalanceAndAllowance(mockUSDC, owner.account.address, strategy.address, amountYield);
    await strategy.write.addFakeYield([amountYield], { account: owner.account.address });

    // Adding some wBTC to the UniSwap Router
    await mockWBTC.write.setBalance([mockUniSwapRouter.address, toBigIntWBTC('10')]);

    return { contract, owner, otherAccount, publicClient, mockWBTC, mockAWBTC, mockStBTC, mockAavePool, mockUSDC, strategy };

  }
    

  describe("constructor", function () {

    it("Should have the correct owner", async function () {
      const { contract, owner } = await loadFixture(deployFondationFixtureOnePercentFees);
      const address = getAddress(owner.account.address);
      expect(await contract.read.owner()).to.equal(address);
    });

    it("Should revert if wBTC address is 0", async function () {
      const { mockAWBTC, mockAavePool, mockAaveOracle, mockUniSwapRouter, fees } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(hre.viem.deployContract("Fondation", [fees, zeroAddress, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address])).to.be.rejectedWith("Invalid wBTC address");
    });

    it("Should revert if aWBTC address is 0", async function () {
      const { mockWBTC, mockAavePool, mockAaveOracle, mockUniSwapRouter, fees } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(hre.viem.deployContract("Fondation", [fees, mockWBTC.address, zeroAddress, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address])).to.be.rejectedWith("Invalid aWBTC address");
    });

    it("Should revert if aavePool address is 0", async function () {
      const { mockWBTC, mockAWBTC, mockAaveOracle, mockUniSwapRouter, fees } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, zeroAddress, mockAaveOracle.address, mockUniSwapRouter.address])).to.be.rejectedWith("Invalid aavePool address");
    }); 

    it("Should revert if aaveOracle address is 0", async function () {
      const { mockWBTC, mockAWBTC, mockAavePool, mockUniSwapRouter, fees } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, zeroAddress, mockUniSwapRouter.address])).to.be.rejectedWith("Invalid aaveOracle address");
    });

    it("Should revert if swapRouter address is 0", async function () {
      const { mockWBTC, mockAWBTC, mockAavePool, mockAaveOracle, fees } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, zeroAddress])).to.be.rejectedWith("Invalid swapRouter address");
    });

    it("Should revert if fees rate is higher than 9999", async function () {
      const { mockWBTC, mockAWBTC, mockAavePool, mockAaveOracle, mockUniSwapRouter } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(hre.viem.deployContract("Fondation", [10000, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address])).to.be.rejectedWith("fees rate should be between 1 and 9999");
    });

    it("Should revert if fees rate is lower than 1", async function () {
      const { mockWBTC, mockAWBTC, mockAavePool, mockAaveOracle, mockUniSwapRouter } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(hre.viem.deployContract("Fondation", [0, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address])).to.be.rejectedWith("fees rate should be between 1 and 9999");
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

    it("should revert if the transfer fails", async function () {
      const { contract, otherAccount, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = 100n;
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await mockWBTC.write.setTransactionShouldFail([true]);
      await expect(contract.write.stake([amount], { account: otherAccount.account.address })).to.be.rejected;
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
      expect(await strategy.read.depositedAmount()).to.equal(toBigIntUSDC('16000'));
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(toBigIntUSDC('16000'));
    });

    it("should deposit the corresponding amount of strategy asset to the strategy contract, no max borrow limit", async function () {
      const { contract, otherAccount, mockWBTC, mockUSDC, strategy } = await loadFixture(deployFondationFixtureOnePercentFees);
      const amount = toBigIntWBTC('120');
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await strategy.read.depositedAmount()).to.equal(toBigIntUSDC('1920000'));
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(toBigIntUSDC('1920000'));
    });

    it("should deposit the corresponding amount of strategy asset to the strategy contract, max borrow limit is 1000000 USDC", async function () {
      const { contract, otherAccount, mockWBTC, mockUSDC, strategy, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFees);
      await mockUSDC.write.setBalance([mockAavePool.address, toBigIntUSDC('1000000')]);
      const amount = toBigIntWBTC('120');
      await setBalanceAndAllowance(mockWBTC, otherAccount.account.address, contract.address, amount);
      await contract.write.stake([amount], { account: otherAccount.account.address });
      expect(await strategy.read.depositedAmount()).to.equal(toBigIntUSDC('950000')); // The contract takes a 5% margin on the limit
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(toBigIntUSDC('950000')); // The contract takes a 5% margin on the limit
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
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(20n);
      const amountStBTC = toBigInt('0.000000100000000000');
      const amountWBTC = toBigIntWBTC('0.0000001');
      await contract.write.unstake([amountStBTC], { account: otherAccount.account.address });
      expect((await mockAavePool.read.withdrawnTo()).toLowerCase()).to.equal(otherAccount.account.address);
      expect((await mockAavePool.read.withdrawnAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect(await mockAavePool.read.withdrawnAmount()).to.equal(amountWBTC);
    });

    it("should revert if the AAVE withdraw is not equal to the expected amount", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      await mockAavePool.write.setTransactionShouldFail([true]);
      const amountStBTC = toBigInt('0.000000100000000000');
      await expect(contract.write.unstake([amountStBTC], { account: otherAccount.account.address })).to.be.rejectedWith("Withdraw failed");
    });

    it("should withdraw the correct amount of wBTC to the user (exchangeRate = 1.20, with stake of 20 satoshis, unstake of 15 stSatoshis)", async function () {
      const { contract, otherAccount, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(24n);
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

  describe("getMaximumPossibleWithdraw", function () {
    
    it("should return 0 if there is nothing staked", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFees);
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(0n);
    });

    it("should return 20 if the contract has 20 with no yield and no debt", async function () {
      const { contract } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(20n);
    });

    it("should return 24 if the contract has 20 with 4 of yield and no debt", async function () {
      const { contract } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(24n);
    });

    it("should return 0 if the contract has a debt of 50%", async function () {
      const { contract, mockAavePool } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndYield);
      const debtRate = toBigIntRate('0.50');
      await mockAavePool.write.setFakeDebtRate([debtRate]);
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(0n);
    });

    it("should return 90 if the contract has 120 in total,and a debt of 10%", async function () {
      const { contract, mockAavePool } = await loadFixture(deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield);
      const debtRate = toBigIntRate('0.10');
      await mockAavePool.write.setFakeDebtRate([debtRate]);
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(toBigIntWBTC('90'));
    });

    it("should return 0 if the contract has 120 in total, and a debt of 40%", async function () {
      const { contract, mockAavePool } = await loadFixture(deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield);
      const debtRate = toBigIntRate('0.40');
      await mockAavePool.write.setFakeDebtRate([debtRate]);
      // The minimumHealthFactor is 2 so the contract can only have a debt of 40% maximum
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(0n); 
    });

    it("should return 0 if the contract has 120 in total, and a debt of 80%", async function () {
      const { contract, mockAavePool } = await loadFixture(deployFondationFixtureTwentyTwentyPercentFeesWithStakeAndYield);
      const debtRate = toBigIntRate('0.80');
      await mockAavePool.write.setFakeDebtRate([debtRate]);
      // The minimumHealthFactor is 2 so the contract can only have a debt of 40% maximum
      expect(await contract.read.getMaximumPossibleWithdraw()).to.equal(0n);
    });

  });

  describe("accrueYield", function () {

    it("should revert if the caller is not the owner of the contract", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureOnePercentFees);
      await expect(contract.write.accrueYield({ account: otherAccount.account.address })).to.be.rejected;
    });

    it("should send the correct amount of fees to the owner (no yield)", async function () {
      const { contract, owner, mockUSDC } = await loadFixture(deployFondationFixtureOnePercentFees);
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockUSDC.read.balanceOf([owner.account.address])).to.equal(0n);
    });

    it("should send the correct amount of fees to the owner (no yield, 20 staked)", async function () {
      const { contract, owner, mockUSDC } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockUSDC.read.balanceOf([owner.account.address])).to.equal(0n);
    });

    it("should send the correct amount of fees to the owner (with yield)", async function () {
      const { contract, owner, mockUSDC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield); // 20 USDC of yield
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockUSDC.read.balanceOf([owner.account.address])).to.equal(toBigIntUSDC('5'));
    });

    it("should supply the correct amount of yield to the pool (no yield)", async function () {
      const { contract, owner, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFees);
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockAavePool.read.suppliedAmount()).to.equal(0n);
    });

    it("should supply the correct amount of yield to the pool (no yield, 20 staked)", async function () {
      const { contract, owner, mockAavePool } = await loadFixture(deployFondationFixtureOnePercentFeesWithStake);
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockAavePool.read.suppliedAmount()).to.equal(20n);
    });

    it("should supply the correct amount of yield to the pool (with yield)", async function () {
      const { contract, owner, mockAavePool, mockWBTC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield); // 20 USDC of yield
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockAavePool.read.suppliedAmount()).to.equal(toBigIntWBTC('0.0001875'));
      expect((await mockAavePool.read.suppliedAsset()).toLowerCase()).to.equal(mockWBTC.address);
      expect((await mockAavePool.read.suppliedOnBehalfOf()).toLowerCase()).to.equal(contract.address);
      expect(await mockAavePool.read.suppliedReferralCode()).to.equal(0);
    });

    it("should send nothing the second time it's called if yield didn't increase (no change in yield between calls)", async function () {
      const { contract, owner, mockUSDC } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield); // 20 USDC of yield
      await contract.write.accrueYield({ account: owner.account.address });
      await contract.write.accrueYield({ account: owner.account.address });
      expect(await mockUSDC.read.balanceOf([owner.account.address])).to.equal(toBigIntUSDC('5'));
    });

    it("should emit the FeesPaid event", async function () {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield);
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.accrueYield({ account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(2);
      expect(event.eventName).to.equal("FeesPaid");
      expect(event.args.amount).to.equal(toBigIntUSDC('5'));
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

    it("should emit the YieldAccrued event", async function () {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield);
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.accrueYield({ account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 1, contract);
      
      expect(logs.length).to.equal(2);
      expect(event.eventName).to.equal("YieldAccrued");
      expect(event.args.amount).to.equal(toBigIntWBTC('0.0001875'));
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

  });

  describe("setStrategy", function () {

    it("should revert if the caller is not the owner of the contract", async function () {
      const { contract, otherAccount, mockUSDC } = await loadFixture(deployFondationFixtureIncomplete);
      const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
      await expect(contract.write.setStrategy([strategy.address], { account: otherAccount.account.address })).to.be.rejected;
    });

    it("should revert if the argument is the zero address", async function () {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(contract.write.setStrategy([zeroAddress], { account: owner.account.address })).to.be.rejectedWith("Invalid strategy address");
    });

    it("should revert if the argument is not a contract", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(contract.write.setStrategy([otherAccount.account.address], { account: owner.account.address })).to.be.rejectedWith("Strategy must be a contract");
    });

    it("should revert if the argument is a contract which does not implement IERC165", async function () {
      const { contract, owner, mockUSDC } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(contract.write.setStrategy([mockUSDC.address], { account: owner.account.address })).to.be.rejectedWith("Strategy must implement IERC165");
    });

    it("should revert if the argument is a contract which does not implement IFondationStrategy", async function () {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const notAFondationStrategy = await hre.viem.deployContract("NotAFondationStrategy", []);
      await expect(contract.write.setStrategy([notAFondationStrategy.address], { account: owner.account.address })).to.be.rejectedWith("Strategy must implement IFondationStrategy");
    });

    it("should revert if the strategy is bound to another Fondation", async function () {
      const { contract, owner, mockUSDC, mockWBTC, mockAWBTC, mockAavePool, mockAaveOracle, mockUniSwapRouter, fees } = await loadFixture(deployFondationFixtureIncomplete);
      const anotherFondation = await hre.viem.deployContract("Fondation", [fees, mockWBTC.address, mockAWBTC.address, mockAavePool.address, mockAaveOracle.address, mockUniSwapRouter.address]);
      const strategy = await hre.viem.deployContract("FakeStrategy", [anotherFondation.address, mockUSDC.address, 6]);
      await expect(contract.write.setStrategy([strategy.address], { account: owner.account.address })).to.be.rejectedWith("Strategy is bound to another Fondation");
    });

    it("should set the strategy contract address", async function () {
      const { contract, owner, mockUSDC } = await loadFixture(deployFondationFixtureIncomplete);
      const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
      await contract.write.setStrategy([strategy.address], { account: owner.account.address });
      expect((await contract.read.strategy()).toLowerCase()).to.equal(strategy.address);
    });

    it("should decommission the previous strategy", async function () {
      const { contract, owner, strategy, mockUSDC, mockAavePool } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield);
      expect(await strategy.read.getYieldAmount({ account: owner.account.address })).to.equal(toBigIntUSDC('20')); // Yield 20
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(toBigIntUSDC('820')); // First deposit on strategy is 800 + 20 of yield
      expect(await mockUSDC.read.balanceOf([contract.address])).to.equal(0n);
      const newStrategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
      await contract.write.setStrategy([newStrategy.address], { account: owner.account.address });
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(0n);
      expect(await mockAavePool.read.repaidAmount()).to.equal(toBigIntUSDC('820'));
    });

    it("should emit the StrategyChanged event when initializing the strategy", async function () {
      const { contract, owner, publicClient, mockUSDC } = await loadFixture(deployFondationFixtureIncomplete);
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const strategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
      const tx = await contract.write.setStrategy([strategy.address], { account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("StrategyChanged");
      expect(event.args.previousStrategy).to.equal(zeroAddress);
      expect(event.args.newStrategy.toLowerCase()).to.equal(strategy.address);
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

    it("should emit the StrategyChanged event when replacing the strategy", async function () {
      const { contract, owner, publicClient, mockUSDC, strategy } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield);
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const newStrategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 6]);
      const tx = await contract.write.setStrategy([newStrategy.address], { account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("StrategyChanged");
      expect(event.args.previousStrategy.toLowerCase()).to.equal(strategy.address);
      expect(event.args.newStrategy.toLowerCase()).to.equal(newStrategy.address);
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

  });

  describe("disableStrategy", function () {

    it("should revert if the caller is not the owner of the contract", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield);
      await expect(contract.write.disableStrategy({ account: otherAccount.account.address })).to.be.rejected;
    });

    it("should not emit any event if the strategy is not set", async function () {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureIncomplete);
      const tx = await contract.write.disableStrategy({ account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      expect(logs.length).to.equal(0);
    });

    it("should decommission the previous strategy", async function () {
      const { contract, owner, strategy, mockUSDC, mockAavePool } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield);
      expect(await strategy.read.getYieldAmount({ account: owner.account.address })).to.equal(toBigIntUSDC('20')); // Yield 20
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(toBigIntUSDC('820')); // First deposit on strategy is 800 + 20 of yield
      expect(await mockUSDC.read.balanceOf([contract.address])).to.equal(0n);
      await contract.write.disableStrategy({ account: owner.account.address });
      expect(await mockUSDC.read.balanceOf([strategy.address])).to.equal(0n);
      expect(await mockAavePool.read.repaidAmount()).to.equal(toBigIntUSDC('820'));
    });
    
    it("should emit the StrategyChanged event when disabling strategy", async function () {
      const { contract, owner, publicClient, mockUSDC, strategy } = await loadFixture(deployFondationFixtureTwentyFivePercentFeesWithStakeAndStrategyYield);
      
      // Get the current block before the transaction
      const blockBefore = await publicClient.getBlock({ blockTag: "latest" });
      const before = blockBefore.timestamp; // Get the timestamp of the block
      
      const tx = await contract.write.disableStrategy({ account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Get the current block after the transaction
      const blockAfter = await publicClient.getBlock({ blockTag: "latest" });
      const after = blockAfter.timestamp; // Get the timestamp of the block
      
      const event = decodeEventFromLogs(logs, 0, contract);
      
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("StrategyChanged");
      expect(event.args.previousStrategy.toLowerCase()).to.equal(strategy.address);
      expect(event.args.newStrategy).to.equal(zeroAddress);
      expect(Number(event.args.when)).to.be.greaterThanOrEqual(Number(before));
      expect(Number(event.args.when)).to.be.lessThanOrEqual(Number(after));
    });

  });

  describe("setStBTC", function () {

    it("should revert if the caller is not the owner of the contract", async function () {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureIncomplete);
      const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);
      await expect(contract.write.setStBTC([mockStBTC.address], { account: otherAccount.account.address })).to.be.rejected;
    });

    it("should set the stBTC contract address", async function () {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const mockStBTC = await hre.viem.deployContract("MockStBTC", [contract.address]);
      await contract.write.setStBTC([mockStBTC.address], { account: owner.account.address });
      expect((await contract.read.stBTC()).toLowerCase()).to.equal(mockStBTC.address);
    });

    it("should set the stBTC contract address only once", async function () {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const mockStBTC1 = await hre.viem.deployContract("MockStBTC", [contract.address]);
      const mockStBTC2 = await hre.viem.deployContract("MockStBTC", [contract.address]);
      await contract.write.setStBTC([mockStBTC1.address], { account: owner.account.address });
      await expect(contract.write.setStBTC([mockStBTC2.address], { account: owner.account.address })).to.be.rejectedWith("stBTC can be set only once");
    });
  });

  describe("setBorrowHealthFactor", function() {

    it("should revert if the caller is not the owner of the contract", async function() {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('6');
      await expect(contract.write.setBorrowMinHealthFactor([healthFactor], { account: otherAccount.account.address })).to.be.rejected;
    });

    it("should revert if the health factor is less than 1", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('0.9');
      await expect(contract.write.setBorrowMinHealthFactor([healthFactor], { account: owner.account.address })).to.be.rejectedWith("Health factor must be greater than 1.0");
    });

    it("should revert if the health factor is 1", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('1');
      await expect(contract.write.setBorrowMinHealthFactor([healthFactor], { account: owner.account.address })).to.be.rejectedWith("Health factor must be greater than 1.0");
    });

    it("should revert if the borrow health factor is less than twice the withdraw health factor", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('3');
      await expect(contract.write.setBorrowMinHealthFactor([healthFactor], { account: owner.account.address })).to.be.rejectedWith("The minimum borrow HF must be at least twice the minimum withdraw HF");
    });
    
    it("should set the borrow health factor", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('6');
      await contract.write.setBorrowMinHealthFactor([healthFactor], { account: owner.account.address });
      expect(await contract.read.minimumHealthFactorBorrow()).to.equal(healthFactor);
    });

    it("should emit the BorrowHealthFactorUpdated event", async function() {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('6');
      const tx = await contract.write.setBorrowMinHealthFactor([healthFactor], { account: owner.account.address });
        const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      const event = decodeEventFromLogs(logs, 0, contract);
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("BorrowHealthFactorUpdated");
      expect(event.args.oldValue).to.equal(toBigInt('4'));
      expect(event.args.newValue).to.equal(healthFactor);
    });
    
  });

  describe("setWithdrawHealthFactor", function() {

    it("should revert if the caller is not the owner of the contract", async function() {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('1.8');
      await expect(contract.write.setWithdrawMinHealthFactor([healthFactor], { account: otherAccount.account.address })).to.be.rejected;
    });

    it("should revert if the health factor is less than 1", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('0.9');
      await expect(contract.write.setWithdrawMinHealthFactor([healthFactor], { account: owner.account.address })).to.be.rejectedWith("Health factor must be greater than 1.0");
    });

    it("should revert if the health factor is 1", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('1');
      await expect(contract.write.setWithdrawMinHealthFactor([healthFactor], { account: owner.account.address })).to.be.rejectedWith("Health factor must be greater than 1.0");
    });

    it("should revert if the withdraw health factor is more than half the borrow health factor", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('3');
      await expect(contract.write.setWithdrawMinHealthFactor([healthFactor], { account: owner.account.address })).to.be.rejectedWith("The minimum withdraw HF must be at most half the minimum borrow HF");
    });

    it("should set the withdraw health factor", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('1.8');
      await contract.write.setWithdrawMinHealthFactor([healthFactor], { account: owner.account.address });
      expect(await contract.read.minimumHealthFactorWithdraw()).to.equal(healthFactor);
    });

    it("should emit the WithdrawHealthFactorUpdated event", async function() {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureIncomplete);
      const healthFactor = toBigInt('1.8');
      const tx = await contract.write.setWithdrawMinHealthFactor([healthFactor], { account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      const event = decodeEventFromLogs(logs, 0, contract);
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("WithdrawHealthFactorUpdated");
      expect(event.args.oldValue).to.equal(toBigInt('2'));
      expect(event.args.newValue).to.equal(healthFactor);
    }); 

  });

  describe("setSwapMaxSlippage", function() {

    it("should revert if the caller is not the owner of the contract", async function() {
      const { contract, otherAccount } = await loadFixture(deployFondationFixtureIncomplete);
      await expect(contract.write.setSwapMaxSlippagePercent([1n], { account: otherAccount.account.address })).to.be.rejected;
    });

    it("should set the swap max slippage", async function() {
      const { contract, owner } = await loadFixture(deployFondationFixtureIncomplete);
      await contract.write.setSwapMaxSlippagePercent([1n], { account: owner.account.address });
      expect(await contract.read.swapMaxSlippagePercent()).to.equal(1n);
    });

    it("should emit the SwapMaxSlippagePercentUpdated event", async function() {
      const { contract, owner, publicClient } = await loadFixture(deployFondationFixtureIncomplete);
      const slippagePercent = 1n;
      const tx = await contract.write.setSwapMaxSlippagePercent([slippagePercent], { account: owner.account.address });
      const { logs } = await publicClient.waitForTransactionReceipt({ hash: tx });
      const event = decodeEventFromLogs(logs, 0, contract);
      expect(logs.length).to.equal(1);
      expect(event.eventName).to.equal("SwapMaxSlippagePercentUpdated");
      expect(event.args.oldValue).to.equal(5n);
      expect(event.args.newValue).to.equal(slippagePercent);
    });
  });

});


