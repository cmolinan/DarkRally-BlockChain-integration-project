require('dotenv').config();
var hre = require('hardhat');


async function deployUSDC() {
  //TOKEN ERC-20 No Upgradeable
  const MyUsdcCCoin = await ethers.getContractFactory("USDCoin");
  const myUsdcContract = await MyUsdcCCoin.deploy();
  
  var tx = await myUsdcContract.deployed();
  
  await tx.deployTransaction.wait(5);
  console.log(
    "My USDC Coin is published in address ",
    myUsdcContract.address
  );
  
  console.log("Begin the verification:");
  
  await hre.run("verify:verify", {
    address: myUsdcContract.address,
    constructorArguments: [],
  });
}

deployUSDC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // exitcode - error
});

