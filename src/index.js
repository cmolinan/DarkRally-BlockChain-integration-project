import './style.css';
import { BigNumber, Contract, providers, ethers, utils } from "ethers";

window.ethers = ethers;

var provider, signer, account;

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
}

async function setUp() {

  setUpListeners(); 

}

setUp()
  .then()
  .catch((e) => console.log(e));
