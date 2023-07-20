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

  function handleAccountsChanged(accounts) {
    // Handle new accounts, or lack thereof.
    accountMsg.innerHTML = "";
    // if (account == undefined)  connectErr.innerHTML = "Not connected to Mumbai!" 
    // connectErr.innerHTML = "Account changed!"
    console.log("accounts", accounts);

  }
  
  async function handleChainChanged(chain) {
    // Handle new accounts, or lack thereof.
    accountMsg.innerHTML = "";
    
    const chainId1 = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId1 !== '0x13881')  connectErr.innerHTML = "Not connected to Mumbai!" 
    else connectErr.innerHTML = "";
    console.log("CHAIN:", chain);

  }

  function handleConnect(chain) {
    // Handle new accounts, or lack thereof.
    console.log("CHAIN Connection:", chain);
  }

  window.ethereum.on('connect', handleConnect);
  window.ethereum.on('accountsChanged', handleAccountsChanged);  
  window.ethereum.on('chainChanged', handleChainChanged);

  var connectBtn = document.getElementById("connect");
  var connectErr = document.getElementById("connectError");
  var accountMsg = document.getElementById("account");
  connectBtn.addEventListener("click", async function () {
    eraseAllErrorMsgs();
    try{
      if (window.ethereum) {
        //verify it's in Mumbai testNet
        connectErr.innerText = "";        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId == '0x13881') {

          accountMsg.innerHTML = "";
          [account] = await ethereum.request({
            method: "eth_requestAccounts",
          });
                
          console.log("Billetera metamask", account);

          provider = new providers.Web3Provider(window.ethereum);
          signer = provider.getSigner(account);
          window.signer = signer;

          accountMsg.innerHTML = account;

        } else connectErr.innerText = "Please connect your wallet to MUMBAI Testnet!";
      
      };
    } catch (error) {
      connectErr.innerText=error.message ;
      console.log(error.message);
    }
  });
  
  //Balance of USDCoin
  var usdcBalanceBtn = document.getElementById("usdcUpdateButton");
  var usdcValuePrint = document.getElementById("usdcBalance");

  usdcBalanceBtn.addEventListener("click", async function () {  
    if (account == undefined) {
      usdcValuePrint.innerText = "Not connected! ";
      return;
    }
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
    if (account == undefined) {
      usdcAllowancePrint.innerText = "Not connected! ";
      return;
    }
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


  // Approve USDC
  var approveErr = document.getElementById("approveError");
  var approveBtn = document.getElementById("approveButton");
  
  approveErr.innerText ="(amount with 6 decimals! -> 000000 )";

  approveBtn.addEventListener("click", async function () {  
    if (account == undefined) {
      approveErr.innerText = "Not connected! ";
      return;
    }

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
    if (account == undefined) {
      createMsg.innerText = "Not connected! ";
      return;
    }

    createBtn.disabled = true;
    createMsg.innerText ="";
    var tokenIdInput = document.getElementById("createTokenId");
    var priceInput = document.getElementById("createPrice");
    var quantityInput = document.getElementById("createQuantity");

    try {
      createMsg.innerText = "...connecting to Wallet";
      
      var tx = await mktSContract
        .connect(signer)
        .createSaleOffer(tokenIdInput.value,priceInput.value,quantityInput.value);
      createMsg.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      createMsg.innerText = "Create confirmed\nHash: " + transactionHash;
      tokenIdInput.value = "";
      listBtn.click();
    } catch (error) {
      console.log(error.reason);
      createMsg.innerText=error.reason;
    }
    createBtn.disabled = false;    
    
  });

  // Approval for All NFT
  var approveNftMsg = document.getElementById("approveNftMsg");
  var approveNftBtn = document.getElementById("approveNftButton");

  approveNftBtn.addEventListener("click", async function () {
    if (account == undefined) {
      approveNftMsg.innerText = "Not connected! ";
      return;
    }

    approveNftBtn.disabled = true;
    approveNftMsg.innerText ="";

    try {
      approveNftMsg.innerText = "...connecting to Wallet";
      
      var tx = await nftTknContract
        .connect(signer)
        .setApprovalForAll("0xd3779F7cD157aF082F55b98ccF1370CE400bc814", true);
        approveNftMsg.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      approveNftMsg.innerText = "Approve confirmed\nHash: " + transactionHash;
      rApproveNftBtn.disabled = true;
      approveAllowanceBtn.click();
    } catch (error) {
      console.log(error.reason);
      approveNftMsg.innerText=error.reason;
    }
    approveNftBtn.disabled = false;    
    
  });


  // Remove Approval for All NFT
  var rApproveNftMsg = document.getElementById("rApproveNftMsg");
  var rApproveNftBtn = document.getElementById("rApproveNftButton");

  rApproveNftBtn.addEventListener("click", async function () {
    if (account == undefined) {
      rApproveNftMsg.innerText = "Not connected! ";
      return;
    }

    rApproveNftBtn.disabled = true;
    rApproveNftMsg.innerText ="";

    try {
      rApproveNftMsg.innerText = "...connecting to Wallet";
      
      var tx = await nftTknContract
        .connect(signer)
        .setApprovalForAll("0xd3779F7cD157aF082F55b98ccF1370CE400bc814", false);
        rApproveNftMsg.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      rApproveNftMsg.innerText = "Remove approved confirmed\nHash: " + transactionHash;
      approveAllowanceBtn.click();
      approveNftBtn.disabled = true;

    } catch (error) {
      console.log(error.reason);
      rApproveNftMsg.innerText=error.reason;
    }
    rApproveNftBtn.disabled = false;    
    
  });
  
  
   //Check approval for all NFT in DarkRalleNFT SC for this Contract
   var approveAllowanceBtn = document.getElementById("approveAllowanceButton");
   var approveAllowancePrint = document.getElementById("approveAllowance");
 
   approveAllowanceBtn.addEventListener("click", async function () {  
    if (account == undefined) {
      approveAllowancePrint.innerText = "Not connected! ";
      return;
    }

     try {
       approveAllowancePrint.innerText = "";

       //The question is for DarkRallyNFT SC about this Contract
       var res = await nftTknContract.isApprovedForAll(account, '0xd3779F7cD157aF082F55b98ccF1370CE400bc814');
            
       approveAllowancePrint.innerText =  res ? "YES" :"NO";  //true or false
       approveNftBtn.disabled = res;
       rApproveNftBtn.disabled = !res;
 
     } catch (error) {
       console.log(error.reason);
     }
   });
   
 
  // List All Sale Offers
  var listMsg = document.getElementById("listMsg");
  var listBtn = document.getElementById("getSaleOffersButton");
  var listList = document.getElementById("saleOfferstList");

  listBtn.addEventListener("click", async function () {
    if (account == undefined) {
      listMsg.innerText = "Not connected! ";
      return;
    }

    listBtn.disabled = true;
    listMsg.innerText ="";
    listList.innerHTML = "";

    try {      
      listMsg.innerText = "...transaction sent. Please wait";      
      var res = await mktSContract.getSalesList();
      listMsg.innerText = "";      
          
      var child = document.createElement("li");
      child.innerText = `Token--Owner--------------------------------------Qty--Price`;
      listList.appendChild(child);
      

      [...res].sort().forEach(elem => {
        var child = document.createElement("li");
        var elem1 = elem.split("_"); 
          
        child.innerText = `${elem1[0]}----${elem1[1]}--${elem1[3].slice(-4)}---${elem1[2]}`;
          listList.appendChild(child);
      });
  
    } catch (error) {
      console.log(error.reason);
      listMsg.innerText=error.reason;
    }
    listBtn.disabled = false;
  });
 

  // Modify Sale Offer
  var modifyMsg = document.getElementById("modifyMsg");
  var modifyBtn = document.getElementById("modifyOfferButton");

  modifyBtn.addEventListener("click", async function () {
    if (account == undefined) {
      modifyMsg.innerText = "Not connected! ";
      return;
    }

    modifyBtn.disabled = true;
    modifyMsg.innerText ="";
    var tokenIdInput = document.getElementById("modifyTokenId");
    var priceInput = document.getElementById("modifyPrice");
    var quantityInput = document.getElementById("modifyQuantity");

    try {
      modifyMsg.innerText = "...connecting to Wallet";
      
      var tx = await mktSContract
        .connect(signer)
        .updatePriceAndQuantity(tokenIdInput.value,priceInput.value,quantityInput.value);
        modifyMsg.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      modifyMsg.innerText = "Update confirmed\nHash: " + transactionHash;
      tokenIdInput.value = "";
      listBtn.click();
    } catch (error) {
      console.log(error.reason);
      modifyMsg.innerText=error.reason;
    }
    modifyBtn.disabled = false;    
    
  });


    // Remove Sale Offer
    var removeMsg = document.getElementById("removeMsg");
    var removeBtn = document.getElementById("removeOfferButton");
  
    removeBtn.addEventListener("click", async function () {
      if (account == undefined) {
        removeMsg.innerText = "Not connected! ";
        return;
      }
  
      removeBtn.disabled = true;
      removeMsg.innerText ="";
      var tokenIdInput = document.getElementById("removeTokenId");
  
      try {
        removeMsg.innerText = "...connecting to Wallet";        
        var tx = await mktSContract
          .connect(signer)
          .removeSaleOffer(tokenIdInput.value);
          removeMsg.innerText = "...transaction sent. Please wait";
        var response = await tx.wait();
        var transactionHash = response.transactionHash;
        console.log("Tx Hash", transactionHash);
        removeMsg.innerText = "Remove confirmed\nHash: " + transactionHash;
        tokenIdInput.value = "";
        listBtn.click();
      } catch (error) {
        console.log(error.reason);
        removeMsg.innerText=error.reason;
      }
      removeBtn.disabled = false;    
      
    });
  
    // Purchase a NFT
  var buyMsg = document.getElementById("buyMsg");
  var buyBtn = document.getElementById("buyOfferButton");

  buyBtn.addEventListener("click", async function () {
    if (account == undefined) {
      buyMsg.innerText = "Not connected! ";
      return;
    }

    buyBtn.disabled = true;
    buyMsg.innerText ="";
    var tokenIdInput = document.getElementById("buyTokenId");
    var priceInput = document.getElementById("buyPrice");
    var quantityInput = document.getElementById("buyQuantity");
    var ownerInput = document.getElementById("buyOwner");

    try {
      buyMsg.innerText = "...connecting to Wallet";
      
      var tx = await mktSContract
        .connect(signer)
        .purchaseNft(tokenIdInput.value, ownerInput.value, priceInput.value,quantityInput.value);
      buyMsg.innerText = "...transaction sent. Please wait";
      var response = await tx.wait();
      var transactionHash = response.transactionHash;
      console.log("Tx Hash", transactionHash);
      buyMsg.innerText = "Update confirmed\nHash: " + transactionHash;
      tokenIdInput.value = "";
      listBtn.click();
    } catch (error) {
      console.log(error.reason);
      buyMsg.innerText=error.reason;
    }
    buyBtn.disabled = false;    
    
  });

    
  function eraseAllErrorMsgs(){
    connectErr.innerHTML = "";
    usdcValuePrint.innerText = "";
    usdcAllowancePrint.innerText = "";
    approveErr.innerText = "";
    createMsg.innerText  = "";
    approveNftMsg.innerText  = "";
    rApproveNftMsg.innerText = "";
    listMsg.innerText = "";
    approveAllowancePrint.innerText = "";  
    modifyMsg.innerText ="";
    buyMsg.innerText = "";
    removeMsg.innerText = "";
  }
  

}

 
async function setUp() {

  setUpListeners();  
  initSCs();

  // initSCsMumbai();

  //setUpEventsContracts();
}

setUp()
  .then()
  .catch((e) => console.log(e));
