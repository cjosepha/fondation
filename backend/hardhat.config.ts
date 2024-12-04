import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from "dotenv";

dotenv.config();

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const PK = process.env.PK;
const RPC_URL = process.env.INFURA_URL;
const ETHER_SCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  gasReporter: {
    enabled: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: "USD",
    gasPrice: 20
  },
  networks:{
    holesky : {
      url: RPC_URL ,
      chainId: 17000,
      accounts: [`0x${PK}`]
    }
  },
  etherscan:{
    apiKey:{
      holesky:ETHER_SCAN_API_KEY
    }
  }
};

export default config;
