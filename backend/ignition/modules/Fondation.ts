// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { AaveV3Sepolia } from "@bgd-labs/aave-address-book";

const FEES_RATE_0_01 = 10;
const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // USDC Sepolia Testnet
const WBTC_ADDRESS = "0x29f2D40B0605204364af54EC677bD022dA425d03"; // WBTC Sepolia Testnet
const AWBTC_ADDRESS = "0x1804Bf30507dc2EB3bDEbbbdd859991EAeF6EefF"; // aWBTC Sepolia Testnet
const AAVE_POOL_ADDRESS = AaveV3Sepolia.POOL; // Aave Pool Sepolia Testnet
const AAVE_ORACLE_ADDRESS = AaveV3Sepolia.ORACLE; // Aave Oracle Sepolia Testnet
const CHAINLINK_BTC_USD = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43"; // Chainlink BTC/USD Sepolia Testnet

const FondationModule = buildModule("FondationModule", (m) => {
  const feesRate = m.getParameter("feesRate", FEES_RATE_0_01);
  const USDCAddress = m.getParameter("USDCAddress", USDC_ADDRESS);
  const wBTCAddress = m.getParameter("wBTCAddress", WBTC_ADDRESS);
  const aWBTCAddress = m.getParameter("aWBTCAddress", AWBTC_ADDRESS);
  const aavePoolAddress = m.getParameter("aavePoolAddress", AAVE_POOL_ADDRESS);
  const chainlinkBTCUSDAddress = m.getParameter("chainlinkBTCUSDAddress", CHAINLINK_BTC_USD);
  const aaveOracleAddress = m.getParameter("aaveOracleAddress", AAVE_ORACLE_ADDRESS);

  const stBTC = m.contract("stBTC");
  const USDC = m.contractAt("USDC", USDCAddress);
  const wBTC = m.contractAt("wBTC", wBTCAddress);
  const aWBTC = m.contractAt("aWBTC", aWBTCAddress);
  const aavePool = m.contractAt("AavePool", aavePoolAddress);
  const aaveOracle = m.contractAt("AaveOracle", aaveOracleAddress);
  const chainlinkBTCUSD = m.contractAt("PriceFeed", chainlinkBTCUSDAddress);

  const fondation = m.contract("Fondation", [feesRate, wBTC, aWBTC, stBTC, aavePool, aaveOracle]);
  
  const fakeStrategy = m.contract("FakeStrategy", [fondation, USDC, chainlinkBTCUSD]);

  m.call(fondation, "setStrategy", [fakeStrategy]);

  return { fondation };
});

export default FondationModule;
