require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
const path = require("path");

const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    "base-sepolia": {
      url: "https://base-sepolia.public.blastapi.io",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: "auto",
    },
    // o, si arriba falla:
  // url: "https://rpc.ankr.com/base_sepolia",
  // url: "https://sepolia.base.org",
  },
  paths: {
    sources: path.resolve(__dirname, "contracts"),
    tests: path.resolve(__dirname, "test"),
    cache: path.resolve(__dirname, "cache"),
    artifacts: path.resolve(__dirname, "artifacts"),
    root: path.resolve(__dirname),
  },
  mocha: {
    timeout: 40000,
  },
};
