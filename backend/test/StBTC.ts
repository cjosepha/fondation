import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("stBTC unit testing", function () {

    async function deployFondationFixture() {
    
        const [owner, otherAccount] = await hre.viem.getWalletClients();
        const contract = await hre.viem.deployContract("MockFondation");
    
        return { contract, owner, otherAccount };
    }

    describe("constructor", function () {

        it("should set the correct owner", async function () {
            const { contract, owner } = await loadFixture(deployFondationFixture);
            const stBTC = await hre.viem.deployContract("stBTC", [contract.address]);
            expect((await stBTC.read.owner()).toLocaleLowerCase()).to.equal(owner.account.address);
        });

        it("should set the correct Fondation contract", async function () {
            const { contract } = await loadFixture(deployFondationFixture);
            const stBTC = await hre.viem.deployContract("stBTC", [contract.address]);
            expect((await stBTC.read.fondation()).toLocaleLowerCase()).to.equal(contract.address);
        });
    });

    describe("mint", function () {

        it("should mint the correct amount of stBTC", async function () {
            const { contract, otherAccount } = await loadFixture(deployFondationFixture);
            const stBTC = await hre.viem.deployContract("stBTC", [contract.address]);
            expect(await stBTC.read.balanceOf([otherAccount.account.address])).to.equal(0n);
            await stBTC.write.mint([otherAccount.account.address, 100n], { account: contract.address });
            expect(await stBTC.read.balanceOf([otherAccount.account.address])).to.equal(100n);
        });


    });

    describe("burn", function () {

        it("should burn the correct amount of stBTC", async function () {
            const { contract, otherAccount } = await loadFixture(deployFondationFixture);
            const stBTC = await hre.viem.deployContract("stBTC", [contract.address]);
            await stBTC.write.mint([otherAccount.account.address, 100n], { account: contract.address });
            expect(await stBTC.read.balanceOf([otherAccount.account.address])).to.equal(100n);
            await stBTC.write.burn([otherAccount.account.address, 100n], { account: contract.address });
            expect(await stBTC.read.balanceOf([otherAccount.account.address])).to.equal(0n);
        });

    });

});