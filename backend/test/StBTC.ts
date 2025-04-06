import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { zeroAddress } from "viem";
describe("stBTC unit testing", function () {

    async function deployFondationFixture() {
    
        const [owner, otherAccount] = await hre.viem.getWalletClients();
        const fondation = await hre.viem.deployContract("MockFondation");
    
        return { fondation, owner, otherAccount };
    }

    async function deployFondationWithStBTCFixture() {
    
        const [owner, otherAccount] = await hre.viem.getWalletClients();
        const fondation = await hre.viem.deployContract("MockFondation");
        const stBTC = await hre.viem.deployContract("stBTC", [fondation.address]);

        const publicClient = await hre.viem.getPublicClient();
    
        return { fondation, stBTC, publicClient, owner, otherAccount };
    }

    describe("constructor", function () {

        it("should set the correct owner", async function () {
            const { fondation, owner } = await loadFixture(deployFondationFixture);
            const stBTC = await hre.viem.deployContract("stBTC", [fondation.address]);
            expect((await stBTC.read.owner()).toLocaleLowerCase()).to.equal(owner.account.address);
        });

        it("should revert if the Fondation address is zero", async function () {
            await expect(hre.viem.deployContract("stBTC", [zeroAddress])).to.be.rejectedWith("Invalid Fondation address");
        });

        it("should set the correct Fondation contract", async function () {
            const { fondation } = await loadFixture(deployFondationFixture);
            const stBTC = await hre.viem.deployContract("stBTC", [fondation.address]);
            expect((await stBTC.read.fondation()).toLocaleLowerCase()).to.equal(fondation.address);
        });
    });

    describe("mint", function () {

        it("should revert if the caller is not the Fondation contract", async function () {
            const { stBTC, owner, otherAccount } = await loadFixture(deployFondationWithStBTCFixture);
            await expect(stBTC.write.mint([otherAccount.account.address, 100n], { account: owner.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
        })

        it("should not revert if the caller is the Fondation contract", async function () {
            const { fondation, stBTC, publicClient, otherAccount } = await loadFixture(deployFondationWithStBTCFixture);
            await publicClient.simulateContract({
                address: stBTC.address,
                abi: stBTC.abi,
                functionName: "mint",
                args: [otherAccount.account.address, 100n],
                account: fondation.address
            });
        });
    });

    describe("burn", function () {

        it("should revert if the caller is not the Fondation contract", async function () {
            const { stBTC, owner, otherAccount } = await loadFixture(deployFondationWithStBTCFixture);
            await expect(stBTC.write.burn([otherAccount.account.address, 100n], { account: owner.account.address })).to.be.rejectedWith("Caller must be the Fondation contract");
        })

        it("should revert if the account to burn from has not enough balance", async function () {
            const { fondation, stBTC, publicClient, otherAccount } = await loadFixture(deployFondationWithStBTCFixture);
            await expect(publicClient.simulateContract({
                address: stBTC.address,
                abi: stBTC.abi,
                functionName: "burn",
                args: [otherAccount.account.address, 100n],
                account: fondation.address
            })).to.be.rejected;
        });

    });

});