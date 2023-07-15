import './style.css';
import { BigNumber, Contract, providers, ethers, utils } from "ethers";


window.ethers = ethers;

var provider, signer, account;
var usdcTkContract, nftTknContract, mktSContract;

// REQUIRED
// Conectar con metamask
function initSCs() {
  provider = new providers.Web3Provider(window.ethereum);

  // Importar ABI
  var nftTknAbi = require("../artifacts/contracts/DarkRallyNFT.sol/DarkRallyNFT.json").abi;
  var usdcTknAbi = require("../artifacts/contracts/USDCoin.sol/USDCoin.json").abi;
  var mktPlaceAbi = require("../artifacts/contracts/DarkRallyMktPlace.sol/DarkRallyMktPlace.json").abi; 

  var nftTknAdd = "0x7Eb878f9c5AEbe42a4728e2F82eAC6388A583241";
  var usdcAddress = "0x643864518D0A8ca16EeF1c827E5E370ed51721FB"; 
  var mktSContractAdd = "0xd3779F7cD157aF082F55b98ccF1370CE400bc814";

    
  nftTknContract = new Contract(nftTknAdd, nftTknAbi, provider);
  usdcTkContract = new Contract(usdcAddress, usdcTknAbi, provider);
  mktSContract = new Contract(mktSContractAdd, mktPlaceAbi, provider);
  
}

function setUpListeners() {
  // Connect to Metamask

  var bttn = document.getElementById("connect");
  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      document.getElementById("account").innerHTML = "";
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
            
      console.log("Billetera metamask", account);

      provider = new providers.Web3Provider(window.ethereum);
      signer = provider.getSigner(account);
      window.signer = signer;

      document.getElementById("account").innerHTML = account;
    }
  });
  
  //Balance of USDCoin
  var usdcBalanceBtn = document.getElementById("usdcUpdateButton");
  var usdcValuePrint = document.getElementById("usdcBalance");

  usdcBalanceBtn.addEventListener("click", async function () {  
    try {
      usdcValuePrint.innerText = "";
      var res = await usdcTkContract.balanceOf(account);
      //var res = await usdcTkContract.allowance(account, '0xd3779F7cD157aF082F55b98ccF1370CE400bc814');

      console.log("USDC-res", res);
      var value = ethers.utils.formatUnits(res, 6);
      console.log("USDC-value", value);
      usdcValuePrint.innerText = value;

    } catch (error) {
      console.log(error.reason);
    }
  });

  //Allowance USDC for DarkRalleMktPlace SC
  var usdcAllowanceBtn = document.getElementById("usdcAllowanceButton");
  var usdcAllowancePrint = document.getElementById("usdcAllowance");

  usdcAllowanceBtn.addEventListener("click", async function () {  
    try {
      usdcAllowancePrint.innerText = "";
      var res = await usdcTkContract.allowance(account, '0xd3779F7cD157aF082F55b98ccF1370CE400bc814');
      
      var value = ethers.utils.formatUnits(res, 6);
      console.log("USDC-allowance", value);
      usdcAllowancePrint.innerText = value;

    } catch (error) {
      console.log(error.reason);
    }
  });


  // Approve MiPrimerToken
  var approveErr = document.getElementById("approveError");
  var approveBtn = document.getElementById("approveButton");
  
  approveErr.innerText ="(amount with 6 decimals! -> 000000 )";

  approveBtn.addEventListener("click", async function () {       
    approveBtn.disabled = true;

    approveErr.innerText = "...connecting to Wallet";
    var valueForApproveInp = document.getElementById("approveInput");
    if (valueForApproveInp.value == "") {
      approveErr.innerText ="Enter a valid amount with 6 decimals";
      approveBtn.disabled = false;
      return
    }

    try {
      approveErr.innerText = "...connecting to Wallet";
      var tx = await usdcTkContract
        .connect(signer)
        .approve(mktSContract.address, valueForApproveInp.value.trim());
      approveErr.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      approveErr.innerText = "Approved confirmed for "+ valueForApproveInp.value +"\nHash: " + transactionHash;
      valueForApproveInp.value = "";
    } catch (error) {
      console.log(error.reason);
      approveErr.innerText=error.reason;
    }
  
    usdcAllowanceBtn.click();
    approveBtn.disabled = false;
  });


  // Create Sale Offer
  var createMsg = document.getElementById("createMsg");
  var createBtn = document.getElementById("createOfferButton");

  createBtn.addEventListener("click", async function () {
    createBtn.disabled = true;
    createMsg.innerText ="";
    var tokenIdInput = document.getElementById("createTokenId");
    var priceInput = document.getElementById("createPrice");
    var quantityInput = document.getElementById("createQuantity");

    // if (tokenIdInput.value == 0) {
    //   createMsg.innerText ="Enter a valid Id";
    //   createBtn.disabled = false;
    //   return
    // }

    try {
      createMsg.innerText = "...connecting to Wallet";
      console.log(priceInput.value);
      var tx = await mktSContract
        .connect(signer)
        .createSaleOffer(tokenIdInput.value,priceInput.value,quantityInput.value);
      createMsg.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      createMsg.innerText = "Create confirmed\nHash: " + transactionHash;
      tokenIdInput.value = "";
    } catch (error) {
      console.log(error.reason);
      createMsg.innerText=error.reason;
    }
    createBtn.disabled = false;
  });
 
  // Purchase a Token By ID
  var purchaseMsg = document.getElementById("purchaseMsg");
  var purchaseBtn = document.getElementById("purchaseButton");

  purchaseBtn.addEventListener("click", async function () {
    purchaseBtn.disabled = true;
    purchaseMsg.innerText ="";
    var tknIdInput = document.getElementById("purchaseInput");
    if (tknIdInput.value == "") {
      purchaseMsg.innerText ="Enter a valid Id";
      purchaseBtn.disabled = false;
      return
    }

    try {
      purchaseMsg.innerText = "...connecting to Wallet";
      var tx = await mktSContract
        .connect(signer)
        .purchaseNftById(tknIdInput.value.trim());
      purchaseMsg.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      purchaseMsg.innerText = "Purchase confirmed for Token #" + tknIdInput.value + "\nHash: " + transactionHash;
      tknIdInput.value = "";
    } catch (error) {
      console.log(error.reason);
      purchaseMsg.innerText=error.reason;
    }
    purchaseBtn.disabled = false;
  });
 
  // Purchase NFT (with Ether)
  var purchaseEthBtn = document.getElementById("purchaseEthButton");
  var purchaseEthErr = document.getElementById("purchaseEthError");

  purchaseEthBtn.addEventListener("click", async function () {  
    purchaseEthBtn.disabled = true;
    try {
      purchaseEthErr.innerText = "...connecting to Wallet";    
      var tx = await mktSContract
      .connect(signer)
      .depositEthForARandomNft({
        value: '10000000000000000',
      });
      purchaseEthErr.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();

      var transactionHash = response.transactionHash;
      purchaseEthErr.innerText = "Purchased confirmed with Hash: " + transactionHash;
      
      console.log(transactionHash);      

    } catch (error) {
      console.log(error.reason);
    }
    purchaseEthBtn.disabled = false;
  });


}

// Setup for receive events of PublicSale Contract
var showListOfTokens = document.getElementById("nftList");
function setUpEventsContracts() {  
  mktSContract.on("DeliverNft", (winnerAccount, nftId) => {
    var tokenNum = ethers.utils.formatUnits(nftId, 0);
    
    var child = document.createElement("li");
    child.innerText = `Token #${tokenNum} was purchased by: ${winnerAccount}`;
    showListOfTokens.appendChild(child);

    console.log("Account", winnerAccount);
    console.log("Token #", tokenNum);
  });

}

  
async function setUp() {

  setUpListeners();  
  initSCs();
  // initSCsMumbai();

  setUpEventsContracts();
}

setUp()
  .then()
  .catch((e) => console.log(e));
