import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
    setBalanceAndAllowance,
    toBigIntUSDC,
  } from "./utils";
import { zeroAddress } from "viem";

describe("FakeStrategy unit testing", function () {

    async function deployFondationFixture() {
    
        const [owner, otherAccount] = await hre.viem.getWalletClients();
        const fondation = await hre.viem.deployContract("MockFondation");
        const mockUSDC = await hre.viem.deployContract("MockERC20");
    
        return { fondation, owner, otherAccount, mockUSDC };
    }

    async function deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture() {
    
        const [owner, otherAccount] = await hre.viem.getWalletClients();
        const fondation = await hre.viem.deployContract("MockFondation");
        const mockUSDC = await hre.viem.deployContract("MockERC20");
        const fakeStrategy = await hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 6]);

        await setBalanceAndAllowance(mockUSDC, fondation.address, fakeStrategy.address, toBigIntUSDC("1000"));

        const publicClient = await hre.viem.getPublicClient();
    
        return { fondation, fakeStrategy, publicClient, owner, otherAccount, mockUSDC };
    }

    describe("constructor", function () {

        it("should revert if the Fondation address is 0", async function () {
            const { mockUSDC } = await loadFixture(deployFondationFixture);
            await expect(hre.viem.deployContract("FakeStrategy", [zeroAddress, mockUSDC.address, 2])).to.be.rejectedWith("Invalid Fondation address");
        });

        it("should revert if the asset address is 0", async function () {
            const { fondation } = await loadFixture(deployFondationFixture);
            await expect(hre.viem.deployContract("FakeStrategy", [fondation.address, zeroAddress, 2])).to.be.rejectedWith("Invalid asset address");
        });

        it("should revert if the decimals are not between 0 and 18", async function () {
            const { fondation, mockUSDC } = await loadFixture(deployFondationFixture);
            await expect(hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 19])).to.be.rejectedWith("Invalid decimals");
        });        
        

        it("should set the correct owner", async function () {
            const { fondation, owner, mockUSDC } = await loadFixture(deployFondationFixture);
            const fakeStrategy = await hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 2]);
            expect((await fakeStrategy.read.owner()).toLocaleLowerCase()).to.equal(owner.account.address);
        });

        it("should set the correct asset", async function () {
            const { fondation, mockUSDC } = await loadFixture(deployFondationFixture);
            const fakeStrategy = await hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 2]);
            expect((await fakeStrategy.read.getAsset()).toLocaleLowerCase()).to.equal(mockUSDC.address);
        });

        it("should set the correct decimals", async function () {
            const { fondation, mockUSDC } = await loadFixture(deployFondationFixture);
            const fakeStrategy = await hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 2]);
            expect(await fakeStrategy.read.getDecimals()).to.equal(2);
        });

        it("should set the correct Fondation", async function () {
            const { fondation, mockUSDC } = await loadFixture(deployFondationFixture);
            const fakeStrategy = await hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 2]);
            expect((await fakeStrategy.read.getFondation()).toLocaleLowerCase()).to.equal(fondation.address);
        });

        it("should have yield to 0 at creation", async function () {
            const { fondation, mockUSDC } = await loadFixture(deployFondationFixture);
            const fakeStrategy = await hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 2]);
            expect(await fakeStrategy.read.getYieldAmount()).to.equal(0n);
        });

        it("should have yield to 0 at creation, with balance", async function () {
            const { fondation, mockUSDC } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            const fakeStrategy = await hre.viem.deployContract("FakeStrategy", [fondation.address, mockUSDC.address, 2]);
            expect(await fakeStrategy.read.getYieldAmount()).to.equal(0n);
        });
    });

    describe("deposit", function () {

        it("should revert if the caller is not the Fondation contract", async function () {
            const { fakeStrategy, owner, otherAccount } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            await expect(fakeStrategy.write.deposit([toBigIntUSDC("500")], { account: owner.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
            await expect(fakeStrategy.write.deposit([toBigIntUSDC("500")], { account: otherAccount.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
        });

        it("should not revert if the caller is the Fondation contract", async function () {
            const { fondation, fakeStrategy, publicClient } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            const amount = toBigIntUSDC("500");
            await publicClient.simulateContract({
                address: fakeStrategy.address,
                abi: fakeStrategy.abi,
                functionName: "deposit",
                args: [amount],
                account: fondation.address
            });
        });
    });

    describe("retrieveYield", function () {
        
        it("should revert if the caller is not the Fondation contract", async function () {
            const { fakeStrategy, owner, otherAccount } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            await expect(fakeStrategy.write.retrieveYield({ account: owner.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
            await expect(fakeStrategy.write.retrieveYield({ account: otherAccount.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
        });

        it("should not revert if the caller is the Fondation contract", async function () {
            const { fondation, fakeStrategy, publicClient } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            await publicClient.simulateContract({
                address: fakeStrategy.address,
                abi: fakeStrategy.abi,
                functionName: "retrieveYield",
                args: [],
                account: fondation.address
            });
        });

    });

    describe("decommission", function () {

        it("should revert if the caller is not the Fondation contract", async function () {
            const { fakeStrategy, owner, otherAccount } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            await expect(fakeStrategy.write.decommission({ account: owner.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
            await expect(fakeStrategy.write.decommission({ account: otherAccount.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
        });

        it("should not revert if the caller is the Fondation contract", async function () {
            const { fondation, fakeStrategy, publicClient } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            await publicClient.simulateContract({
                address: fakeStrategy.address,
                abi: fakeStrategy.abi,
                functionName: "decommission",
                args: [],
                account: fondation.address
            });
        });

    });

    describe("addFakeYield", function () {

        it("should revert if the caller is not the contract owner", async function () {
            const { fakeStrategy, owner, otherAccount } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            await expect(fakeStrategy.write.retrieveYield({ account: owner.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
            await expect(fakeStrategy.write.retrieveYield({ account: otherAccount.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
        });

        it("should add the right amount of yield", async function () {
            const { fakeStrategy, owner, mockUSDC } = await loadFixture(deployFondationWithStrategyAnd1000USDCOwnerAllowanceFixture);
            const amount = toBigIntUSDC("10");
            await setBalanceAndAllowance(mockUSDC, owner.account.address, fakeStrategy.address, amount);
            await fakeStrategy.write.addFakeYield([amount], { account: owner.account.address });
            expect(await fakeStrategy.read.getYieldAmount()).to.equal(amount);
            expect(await mockUSDC.read.balanceOf([fakeStrategy.address])).to.equal(amount);
        });

    });
});