require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.18',
  networks: {
    mumbai: {
      url: process.env.MUMBAI_TESNET_URL,
      accounts: [process.env.ADMIN_ACCOUNT_PRIVATE_KEY],
      timeout: 0,
      gas: 'auto',
      gasPrice: 'auto',
    },
    goerli: {
      url: process.env.GOERLI_TESNET_URL,
      accounts: [process.env.ADMIN_ACCOUNT_PRIVATE_KEY],
      timeout: 0,
      gas: 'auto',
      gasPrice: 'auto',
    },
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    },
  },
};
