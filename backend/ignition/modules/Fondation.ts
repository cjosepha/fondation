// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { AaveV3Sepolia } from "@bgd-labs/aave-address-book";

const FEES_RATE_0_01 = 10;
const WBTC_ADDRESS = "0x29f2D40B0605204364af54EC677bD022dA425d03"; // WBTC Sepolia Testnet
const AWBTC_ADDRESS = "0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF"; // aWBTC Sepolia Testnet
const AAVE_POOL_ADDRESS = AaveV3Sepolia.POOL; // Aave Pool Sepolia Testnet

const FondationModule = buildModule("FondationModule", (m) => {
  const feesRate = m.getParameter("feesRate", FEES_RATE_0_01);
  const wBTCAddress = m.getParameter("wBTCAddress", WBTC_ADDRESS);
  const aWBTCAddress = m.getParameter("aWBTCAddress", AWBTC_ADDRESS);
  const aavePoolAddress = m.getParameter("aavePoolAddress", AAVE_POOL_ADDRESS);

  const stBTC = m.contract("stBTC");
  const wBTC = m.contractAt("wBTC", wBTCAddress);
  const aWBTC = m.contractAt("aWBTC", aWBTCAddress);
  const aavePool = m.contractAt("Pool", aavePoolAddress);

  const fondation = m.contract("Fondation", [feesRate, wBTC, aWBTC, stBTC, aavePool]);

  return { fondation };
});

export default FondationModule;
