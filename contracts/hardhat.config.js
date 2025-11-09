require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '../.env.local' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    bittensorTestnet: {
      url: "https://test.chain.opentensor.ai",
      chainId: 945,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto'
    },
    bittensorMainnet: {
      url: "https://lite.chain.opentensor.ai",
      chainId: 966, // Mainnet chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto'
    }
  },
  mocha: {
    timeout: 300000
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};


