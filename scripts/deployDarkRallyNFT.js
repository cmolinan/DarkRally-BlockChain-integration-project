require('dotenv').config();
var hre = require('hardhat');

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require('../utils');


async function deployDarkRallyNFT() {
  var MINTER_ROLE = getRole('MINTER_ROLE');  
  //Token ERC-1155 Upgradeable

  var nftContract = await deploySC('DarkRallyNFT');
  var implementation = await printAddress('DarkRallyNFT', nftContract.address);

  // set up
  //await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "GR");

  await verify(implementation, 'DarkRallyNFT', []);
}


deployDarkRallyNFT() //
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // exitcode - error
  });

