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

async function deployDarkRallySale() {
  // Upgradeable SC
  
  var usdcSCaddress = "0x643864518D0A8ca16EeF1c827E5E370ed51721FB";
  var darkRallySCnftAddress = "0x5333259a113043c2c1e2C63512437BABf7033E68";
  var companyWalletAddr = "0xDEC0eE6F68f0CC0F5E9baE7a9219E1B3e7390e17";

  var saleContract = await deploySC('DarkRallySale', [usdcSCaddress, darkRallySCnftAddress, companyWalletAddr]);
  var implementation = await printAddress('DarkRallySale', saleContract.address);

  await verify(implementation, 'DarkRallySale', []);
}


deployDarkRallySale() //
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // exitcode - error
  });

