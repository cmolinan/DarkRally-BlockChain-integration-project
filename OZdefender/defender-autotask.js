const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");

exports.handler = async function (data) {  
  // This webhook is triggered from a Dark Rally Webapp
  // Don't forget that Relayer Address needs MINER_ROLE in DarkRallyNFT SC
  
  // Provider initializing 
  const provider = new DefenderRelayProvider(data);
 
  // Signer is created 
  const signer = new DefenderRelaySigner(data, provider, { speed: "fast" });

   //parameters comes inside the body
   //including address of DarkRallyNFT SC and a secret key
  const {
    darkRallyNftAddr,
   	winnerAccount,
    tokenId,
    amount,
    secret
	} = data.request.body;
  
  // console.log("Parameters body:",data.request.body);
  const { secretValue } = data.secrets;
  if (secret != secretValue) return { "error": "Secret key error"};
  
  // Execute 'mint' of SC DarkRallyNFT
  var DarkRallyNFT = darkRallyNftAddr;

  var tokenAbi = ["function mint(address account, uint256 tokenId, uint256 amount)"];
  var tokenContract = new ethers.Contract(DarkRallyNFT, tokenAbi, signer);
  
  var tx = await tokenContract.mint(winnerAccount, tokenId, amount);
  var response = await tx.wait();
  
  //If success, the result field of the response will be the 'transacionHash'
  var transactionHash = response.transactionHash;   
  
  //console.log(JSON.stringify(obj));
  return { transactionHash : transactionHash };
};
