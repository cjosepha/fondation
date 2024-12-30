import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Address, decodeEventLog, getAddress, Log, parseUnits } from "viem";

import { AaveV3Sepolia } from "@bgd-labs/aave-address-book";

const WBTC_ADDRESS = "0x29f2D40B0605204364af54EC677bD022dA425d03"; // WBTC Sepolia Testnet
const AWBTC_ADDRESS = "0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF"; // aWBTC Sepolia Testnet
const AAVE_POOL_ADDRESS = AaveV3Sepolia.POOL; // Aave Pool Sepolia Testnet

import poolArtifacts from "../artifacts/contracts/Pool.sol/Pool.json";
import wBTCArtifacts from "../artifacts/contracts/wBTC.sol/wBTC.json";
import aWBTCArtifacts from "../artifacts/contracts/aWBTC.sol/aWBTC.json";

describe("Fondation", function () {

    async function deployFondationFixture() {
        const publicClient = await hre.viem.getPublicClient();

        const fees = 100;
        const [owner, otherAccount] = await hre.viem.getWalletClients();
        const mockStBTC = await hre.viem.deployContract("MockStBTC");
        const wBTC = await hre.viem.getContractAt("wBTC", WBTC_ADDRESS, { client: publicClient });
        const aWBTC = await hre.viem.getContractAt("aWBTC", AWBTC_ADDRESS, { client: publicClient });
        const aavePool = await hre.viem.getContractAt("AavePool", AAVE_POOL_ADDRESS, { client: publicClient });
        const contract = await hre.viem.deployContract("Fondation", [fees, wBTC.address, mockStBTC.address]);
        const strategy = await hre.viem.deployContract("SimpleAavePoolStrategy", [contract.address, wBTC.address, aWBTC.address, aavePool.address]);

        // Set the strategy on the main contract
        await contract.write.setStrategy([strategy.address], { account: owner.account.address });


        return { contract, owner, otherAccount, publicClient, wBTC, aWBTC, mockStBTC, aavePool };
    }

});