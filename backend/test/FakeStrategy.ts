import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("FakeStrategy unit testing", function () {

    async function deployFondationFixture() {
    
        const [owner, otherAccount] = await hre.viem.getWalletClients();
        const contract = await hre.viem.deployContract("MockFondation");
        const mockUSDC = await hre.viem.deployContract("MockERC20");
    
        return { contract, owner, otherAccount, mockUSDC };
    }

    describe("constructor", function () {

        it("should set the correct owner", async function () {
            const { contract, owner, mockUSDC } = await loadFixture(deployFondationFixture);
            const FakeStrategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 2]);
            expect((await FakeStrategy.read.owner()).toLocaleLowerCase()).to.equal(owner.account.address);
        });

        it("should set the correct asset", async function () {
            const { contract, mockUSDC } = await loadFixture(deployFondationFixture);
            const FakeStrategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 2]);
            expect((await FakeStrategy.read.getAsset()).toLocaleLowerCase()).to.equal(mockUSDC.address);
        });

        it("should set the correct decimals", async function () {
            const { contract, mockUSDC } = await loadFixture(deployFondationFixture);
            const FakeStrategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 2]);
            expect(await FakeStrategy.read.getDecimals()).to.equal(2);
        });

        it("should have yield to 0 at creation", async function () {
            const { contract, mockUSDC } = await loadFixture(deployFondationFixture);
            const FakeStrategy = await hre.viem.deployContract("FakeStrategy", [contract.address, mockUSDC.address, 2]);
            expect(await FakeStrategy.read.getYieldAmount()).to.equal(0n);
        });
    });
});