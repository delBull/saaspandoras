require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {},
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532,
    },
    sepolia: {
      url: "https://rpc.sepolia.org", // Or Alchemy/Infura URL if env var available, but public RPC is fine for low traffic
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};