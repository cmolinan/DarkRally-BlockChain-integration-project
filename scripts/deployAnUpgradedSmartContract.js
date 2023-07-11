async function upGradeSmartContract() {
  
  //write here the Proxy Address of your current Smart Contract
  // var UpgradeableSCProxyAddress = "0x523dBB6850adCc5dCa46E26c9464924bd01eBd4F";  //DarkRallyNFT
  var UpgradeableSCProxyAddress = "0x6153652B17e0fac6e9779a4AdaeC86291a48B622";  //DarkRallySale
  
  //write here the new Contract Name of your current Smart Contract
  // const NewUpgradeableSC = await hre.ethers.getContractFactory(
  //   "DarkRallyNFT"
  // );
  const NewUpgradeableSC = await hre.ethers.getContractFactory(
    "DarkRallySale"
  );

  // We tell the proxy contract to point to the new implementation contract.
    var newUpgradeableSC = await upgrades.upgradeProxy(
    UpgradeableSCProxyAddress,
    NewUpgradeableSC
  );

  await newUpgradeableSC.deployTransaction.wait(5);

  var implementationAddress = await upgrades.erc1967.getImplementationAddress(
    newUpgradeableSC.address
  );

  console.log("Your current Proxy address:", newUpgradeableSC.address);
  console.log("New implementation address:", implementationAddress);

  //if the verification fails, retry one more time putting directly the
  // implementacion address like a string
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upGradeSmartContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // exitcode - error
});
