import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from "dotenv";

dotenv.config();

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const RPC_API_KEY = process.env.RPC_API_KEY;
const RPC_URL = process.env.RPC_URL;
const PK_SEPOLIA_AAVE = process.env.PK_SEPOLIA_AAVE;
const ETHER_SCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

console.log("COINMARKETCAP_API_KEY", COINMARKETCAP_API_KEY);
console.log("RPC_API_KEY", RPC_API_KEY);
console.log("RPC_URL", RPC_URL);
console.log("PK_SEPOLIA_AAVE", PK_SEPOLIA_AAVE);
console.log("ETHER_SCAN_API_KEY", ETHER_SCAN_API_KEY);

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  gasReporter: {
    enabled: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: "USD",
    gasPrice: 20
  },
  networks:{
    sepolia : {
      url: `${RPC_URL}${RPC_API_KEY}` ,
      chainId: 11155111,
      accounts: [`0x${PK_SEPOLIA_AAVE}`]
    },
    hardhat: {
      loggingEnabled: true,
      forking: {
        url: `${RPC_URL}${RPC_API_KEY}`,
        blockNumber: 7217548
      }
    }
  },
  etherscan:{
    apiKey:{
      sepolia:ETHER_SCAN_API_KEY
    }
  }
};

export default config;
