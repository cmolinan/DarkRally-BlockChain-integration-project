
const { expect } = require("chai");
const { ethers } = require("hardhat");

var { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

function getRole(role) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
}

describe("DarkRallyNFT", function () {

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");
const PAUSER_ROLE = getRole("PAUSER_ROLE");
const UPGRADER_ROLE    = getRole("UPGRADER_ROLE");
const DEFAULT_ADMIN_ROLE    = getRole("0x00");

var owner;
var alice;
var bob;
var darkRallyNFT;
var darkRallyNFTProxy;
var implementationAddress;
var metadataHashIpfs = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(('MetadataHash')));
beforeEach(async () => {
  [owner, alice, bob] = await ethers.getSigners();
  // Desplegar el contrato antes de cada prueba
  const DarkRallyNFT = await ethers.getContractFactory("DarkRallyNFT");
  
  
 
  darkRallyNFT = await hre.upgrades.deployProxy(DarkRallyNFT, {
    kind: "uups",
  });
  
   implementationAddress = await upgrades.erc1967.
  getImplementationAddress(darkRallyNFT.address);
  console.log("Implementation address: ", implementationAddress);

});

  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
  
    // Deploy DarkRallyNFT contract
    const DarkRallyNFT = await ethers.getContractFactory("DarkRallyNFT");
    
   
    darkRallyNFT = await hre.upgrades.deployProxy(DarkRallyNFT, {
      kind: "uups",
    });
    
    var implementationAddress = await upgrades.erc1967.
    getImplementationAddress(darkRallyNFT.address);
    console.log("Implementation address: ", implementationAddress);
     
    return { darkRallyNFT, owner, alice, bob };
  }

  describe("DarkRallyNFT Smart Contract", function () {
    it("should not allow minting without the MINTER_ROLE", async function () {
      const { darkRallyNFT, alice } = await loadFixture(deployFixture);
      
      const errorMessage =
        "AccessControl: account " +
        alice.address.toLowerCase() +
        " is missing role " +
        getRole("MINTER_ROLE");

      await expect(
        darkRallyNFT.connect(alice).mint(alice.address, 1, 101)
      ).to.be.revertedWith(errorMessage);
    });

    it("should mint a new NFT", async function () {
      const { darkRallyNFT, alice } = await loadFixture(deployFixture);

      // Register a new NFT type
      await darkRallyNFT.registerNewTypeOfNft(
        1, // Token ID
        "NFT Name",
        "NFT Category",
        "QmNoLB8krmgfntxAHgaJrTE2Mf6NCPQ7ct1UvhH2pNkLeg", // Metadata Hash IPFS
        100, // Max Supply
        10, // Initial Price
        false, // Ask Date For Mint
        0, // Valid Until
        0 // Entries Counter
      );

      // Mint a new NFT
      const errorMessage =
        "AccessControl: account " +
        alice.address.toLowerCase() +
        " is missing role " +
        getRole("DEFAULT_ADMIN_ROLE");

      await expect(
        darkRallyNFT.connect(alice).mint(alice.address, 1, 101)
      ).to.be.revertedWith(errorMessage);

      // Check the balance of the recipient
      const balance = await darkRallyNFT.balanceOf(alice.address, 1);

      // Assert the balance is as expected
      expect(balance).to.equal(1);
    });

    it("should revert when calling a function while paused", async function () {
        const { darkRallyNFT, owner, alice } = await loadFixture(deployFixture);
      
        // Llamar a la función pause como el owner del contrato (quien tiene el rol PAUSER_ROLE)
        await darkRallyNFT.connect(owner).pause();
      
        // Verificar que el contrato esté en pausa
        expect(await darkRallyNFT.paused()).to.equal(true);
      
        // Verificar que las funciones lanzan una excepción cuando se llaman mientras el contrato está en pausa
        await expect(
          darkRallyNFT.connect(owner).registerNewTypeOfNft(
            1,
            "NFT Name",
            "NFT Category",
            "QmNoLB8krmgfntxAHgaJrTE2Mf6NCPQ7ct1UvhH2pNkLeg",
            100,
            10,
            false,
            0,
            0
          )
        ).to.be.revertedWith("Pausable: paused");
      
        // ...
        // Agrega más pruebas para otras funciones que deben ser pausadas
      });


          

});
it("shouldn't pause the contract", async function () {
    const { darkRallyNFT, owner, alice } = await loadFixture(deployFixture);
  
    // Verificar que la función solo pueda ser llamada por el usuario con el rol PAUSER_ROLE
    console.log("validadon que no se pueda pausar");
    await expect(
      darkRallyNFT.connect(alice).pause()
    ).to.be.
    revertedWith("AccessControl:"+
    " account "+alice.address.toLowerCase() +" is missing role "+getRole("PAUSER_ROLE"));
    
    
    console.log( "passed"); 
    // Llamar a la función pause como el owner del contrato (quien tiene el rol PAUSER_ROLE)

  });
  it("should pause the contract", async  ()=> {
    
    const { darkRallyNFT, owner, alice } = await loadFixture(deployFixture);
    
    
    await darkRallyNFT.connect(owner).pause();
    // Verificar que el contrato esté en pausa
    expect(await darkRallyNFT.paused()).to.equal(true);  
});
  
it('debería registrar un nuevo tipo de NFT exitosamente', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
    
    const maxSupply = 100;
    const initialPrice = 1;
    const askDateForMint = false;
    const validUntil = 0;
    const entriesCounter = 0;

    await darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
    );

    const nftInfo = await darkRallyNFT.nftInfo(tokenId);
    expect(nftInfo.tokenIsRegistered).to.be.true;
    // Verificar otros valores si es necesario
  });
  it('no debería permitir registrar un tokenId ya registrado', async () => {
    const tokenId = 1;
    // Registrar un tokenId previamente
    await darkRallyNFT.registerNewTypeOfNft(
      tokenId, 'Nombre1', 'Categoria1', metadataHashIpfs,
      100, 1, false, 0, 0
    );

    // Intentar registrar el mismo tokenId nuevamente
    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, 'Nombre2', 'Categoria2', metadataHashIpfs,
      200, 2, true, 0, 0
    )).to.be.revertedWith('TokenId was already registered');
  });
  it.only('debería requerir una longitud de MetadataHashIPFS adecuada', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
    const metadataHashIpfs = 'MetadataHash';
    const maxSupply = 100;
    const initialPrice = 1;
    const askDateForMint = false;
    const validUntil = 0;
    const entriesCounter = 0;

    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
    )).to.be.revertedWith('Check the MetadataHashIPFS entry');
  });
  it('debería requerir un maxSupply mayor a cero', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
   
    const maxSupply = 0; // maxSupply igual a cero
    const initialPrice = 1;
    const askDateForMint = false;
    const validUntil = 0;
    const entriesCounter = 0;

    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
    )).to.be.revertedWith('Maxsupply must be greater than 0');
  });
  it.only('debería requerir una fecha de vencimiento válida si askDateForMint es true', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
    const metadataHashIpfs = 'MetadataHash';
    const maxSupply = 100;
    const initialPrice = 1;
    const askDateForMint = true;
    const validUntil = 0; // Fecha de vencimiento menor a la fecha actual
    const entriesCounter = 0;

    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
    )).to.be.revertedWith('Expiration date must be greater than current date');
  });

});
