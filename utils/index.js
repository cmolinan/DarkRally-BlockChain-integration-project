const hre = require("hardhat");

const gcf = hre.ethers.getContractFactory;
const dp = hre.upgrades.deployProxy;
const pEth = hre.ethers.utils.parseEther;

function getRole(role) {
  return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
}

async function ex(contract, command, args, messageWhenFailed) {
  try {
    var tx = await contract[command](...args);
    return await tx.wait(1);
  } catch (e) {
    console.error(messageWhenFailed, e);
  }
}

async function verify(implementation, contractName, arguments = []) {
  if (!process.env.HARDHAT_NETWORK) return;
  try {
    await hre.run("verify:verify", {
      address: implementation,
      constructorArguments: [...arguments],
    });
  } catch (e) {
    if (e.message.includes("Contract source code already verified"))
      console.log(`${contractName} is verified already`);
    else console.error(`Error veryfing - ${contractName}`, e);
  }
}

async function printAddress(contractName, proxyAddress) {
  console.log(`${contractName} Proxy Address: ${proxyAddress}`);
  var implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );
  console.log(`${contractName} Impl Address: ${implementationAddress}`);
  return implementationAddress;
}

async function deploySC(contractName, args = []) {
  var smartContract = await gcf(contractName);
  var proxyContract = await dp(smartContract, [...args], {
    kind: "uups",
  });
  if (process.env.HARDHAT_NETWORK) {
    var tx = await proxyContract.deployed();
    // true cuando se usa '--network matic' en el script de deployment
    await tx.deployTransaction.wait(5);
  }
  return proxyContract;
}

async function deploySCNoUp(contractName, args = []) {
  var SmartContract = await gcf(contractName);
  var smartContract = await SmartContract.deploy([...args]);

  // true cuando se usa '--network matic' en el script de deployment
  if (process.env.HARDHAT_NETWORK) {
    var tx = await smartContract.deployed();
    await tx.deployTransaction.wait(5);

    console.log(`${contractName} - Imp: ${smartContract.address}`);
  }
  return smartContract;
}

module.exports = {
  ex,
  verify,
  getRole,
  printAddress,
  deploySC,
  deploySCNoUp,
  pEth,
};
