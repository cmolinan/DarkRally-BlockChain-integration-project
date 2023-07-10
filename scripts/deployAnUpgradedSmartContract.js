async function upGradeSmartContract() {
  
  //write here the Proxy Address of your current Smart Contract
  var UpgradeableSCProxyAddress = "0x523dBB6850adCc5dCa46E26c9464924bd01eBd4F";  //DarkRallySale
  
  //write here the new Contract Name of your current Smart Contract
  const NewUpgradeableSC = await hre.ethers.getContractFactory(
    "DarkRallyNFT"
  );

  // Le decimos al contrato proxi que apunte al nuevo contrato de implementacion
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
