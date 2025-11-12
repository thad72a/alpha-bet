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
    // Try different Bittensor Testnet RPC endpoints
    bittensorTestnet: {
      url: "https://test.chain.opentensor.ai",
      chainId: 945,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 60000, // Increase timeout
      gasPrice: 'auto',
      gas: 'auto'
    },
    bittensorTestnetAlt1: {
      url: "https://testnet.bittensor.network",
      chainId: 945,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 60000,
      gasPrice: 'auto'
    },
    bittensorTestnetAlt2: {
      url: "wss://test.finney.opentensor.ai:443",
      chainId: 945,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 60000,
      gasPrice: 'auto'
    },
    bittensorMainnet: {
      url: "https://lite.chain.opentensor.ai",
      chainId: 966,
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

