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

async function deployERC20() {
  //TOKEN ERC-20 Upgradeable

  var myTokenProxyContract = await deploySC('DarkToken');

  //I mplementation Contract
  var darkTokenImplementationContract = await printAddress(
    'DarkToken',
    myTokenProxyContract.address
  );
  await verify(darkTokenImplementationContract, 'DarkToken', []);
}

var MINTER_ROLE = getRole('MINTER_ROLE');
async function deployERC721() {
  //Token ERC-721 Upgradeable

  //var relayerAddress = "0x9ba986566f59441E2F7d7A30Eb2A935ccEE58fc7";

  var nftContract = await deploySC('NftTicket');
  var implementation = await printAddress('NftTicket', nftContract.address);

  // set up
  //await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "GR");

  await verify(implementation, 'NftTicket', []);
}

deployERC20()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // exitcode - error
  });

deployERC721() //
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // exitcode - error
  });
