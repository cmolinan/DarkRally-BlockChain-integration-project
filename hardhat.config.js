require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },  
  defaultNetwork: "localhost",
  networks: {    
    localhost: {
      url: "HTTP://127.0.0.1:8545",
      timeout: 800000,
      gas: "auto",
      gasPrice: "auto",
    },    
    mumbai: {
      url: process.env.MUMBAI_TESNET_URL,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 0,
      gas: "auto",
      gasPrice: "auto",
    },
    goerli: {
      url: process.env.GOERLI_TESNET_URL,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 0,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {      
      goerli: process.env.API_KEY_ETHERSCAN,        
      polygonMumbai: process.env.API_KEY_POLYGONSCAN,
    },
  },
};
