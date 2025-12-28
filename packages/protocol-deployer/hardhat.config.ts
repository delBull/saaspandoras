import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20", // ✅ Compatible con OZ 4.9.0 + Thirdweb
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
    }
  },
  networks: {
    // 🧪 TESTNET: Sepolia para pruebas
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PANDORA_ORACLE_PRIVATE_KEY
        ? [process.env.PANDORA_ORACLE_PRIVATE_KEY]
        : [],
      chainId: 11155111,
      gasPrice: 20000000000, // 20 gwei
    },

    // 🏠 MAINNET: Base para producción
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PANDORA_ORACLE_PRIVATE_KEY
        ? [process.env.PANDORA_ORACLE_PRIVATE_KEY]
        : [],
      chainId: 8453,
      gasPrice: 1000000000, // 1 gwei
    }
  }
};

export default config;
