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


async function deployDarkRallyMktPlace() {
  // var BUSINESS_ROLE = getRole('BUSINESS_ROLE');
  //Token ERC-1155 Upgradeable

  var usdcSCaddress = "0x643864518D0A8ca16EeF1c827E5E370ed51721FB";
  var darkRallySCnftAddress = "0x7Eb878f9c5AEbe42a4728e2F82eAC6388A583241";
  var companyWalletAddr = "0xDEC0eE6F68f0CC0F5E9baE7a9219E1B3e7390e17";
  var feeWalletAddr = "0x7A30a1401a37FBAFbb7db0207a1658511096B861";

  var mktContract = await deploySC('DarkRallyMktPlace',[usdcSCaddress, darkRallySCnftAddress, companyWalletAddr, feeWalletAddr]);
    var implementation = await printAddress('DarkRallyMktPlace', mktContract.address);

  // set up
  //await ex(mktContract, "grantRole", [BUSINESS_ROLE, "0xxxx"], "GR");

  await verify(implementation, 'DarkRallyMktPlace', []);
}


deployDarkRallyMktPlace() //
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // exitcode - error
  });

