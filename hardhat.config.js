require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require('solidity-coverage');


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  plugins: ['hardhat-hardhat-coverage'],
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },  

  
 
  networks: {    
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
