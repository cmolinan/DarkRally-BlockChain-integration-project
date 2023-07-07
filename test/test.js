const { expect } = require("chai");
const { ethers } = require("hardhat");

var { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

function getRole(role) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
}

describe("DarkRallyNFT tests", function () {

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
  await  darkRallyNFT.connect(owner).mint(alice.address, 1, 1);
      

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
    
    await expect(
      darkRallyNFT.connect(alice).pause()
    ).to.be.
    revertedWith("AccessControl:"+
    " account "+alice.address.toLowerCase() +" is missing role "+getRole("PAUSER_ROLE"));
    

    // Llamar a la función pause como el owner del contrato (quien tiene el rol PAUSER_ROLE)

  });
  it("should pause the contract", async  ()=> {
    
 
    
    
    await darkRallyNFT.connect(owner).pause();
    // Verificar que el contrato esté en pausa
    expect(await darkRallyNFT.paused()).to.equal(true);  
});
it("should despause the contract", async  ()=> {
    
 
  
  
  await darkRallyNFT.connect(owner).pause();
  await darkRallyNFT.connect(owner).unpause();
  // Verificar que el contrato esté en pausa
  expect(await darkRallyNFT.paused()).to.equal(false);  
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
  it('debería requerir una longitud de MetadataHashIPFS adecuada', async () => {
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
  it('debería requerir una fecha de vencimiento válida si askDateForMint es true', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
   
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
  it('debería registrar un nuevo tipo de NFT sin fecha de vencimiento requerida', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
    
    const maxSupply = 100;
    const initialPrice = 1;
    const askDateForMint = false;
    const validUntil = 0;
    const entriesCounter = 0;

      await expect(darkRallyNFT.registerNewTypeOfNft(
        tokenId, nameOfNFT, category, metadataHashIpfs,
        maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
      ));
      const nftInfo = await darkRallyNFT.nftInfo(tokenId);
      
      expect(nftInfo.tokenIsRegistered).to.be.true;
    });
     
    it('debería registrar un nuevo tipo de NFT con fecha de vencimiento requerida', async () => {
      const tokenId = 1;
      const nameOfNFT = 'MiNFT';
      const category = 'Categoria';
      const currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

    // Increase the time by 1 day (86400 seconds)
    
      
      const maxSupply = 100;
      const initialPrice = 1;
      const askDateForMint = true;
      const validUntil = currentTimestamp + 10000;
      const entriesCounter = 0;
      
        await expect(darkRallyNFT.registerNewTypeOfNft(
          tokenId, nameOfNFT, category, metadataHashIpfs,
          maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
        ));
        const nftInfo = await darkRallyNFT.nftInfo(tokenId);
        
        expect(nftInfo.tokenIsRegistered).to.be.true;
      });

         it('debería registrar un nuevo tipo de NFT con fecha de vencimiento requerida', async () => {
      const tokenId = 1;
      const nameOfNFT = 'MiNFT';
      const category = 'Categoria';
      const currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

    // Increase the time by 1 day (86400 seconds)
    
      
      const maxSupply = 100;
      const initialPrice = 1;
      const askDateForMint = true;
      const validUntil = currentTimestamp + 10000;
      const entriesCounter = 0;
      
        await expect(darkRallyNFT.registerNewTypeOfNft(
          tokenId, nameOfNFT, category, metadataHashIpfs,
          maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
        ));
        const nftInfo = await darkRallyNFT.nftInfo(tokenId);
        
        expect(nftInfo.tokenIsRegistered).to.be.true;
      });

      it('debería registrar un nuevo tipo de NFT con fecha de vencimiento requerida', async () => {
        const tokenId = 1;
        const nameOfNFT = 'MiNFT';
        const category = 'Categoria';
        const currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
  
      
      
        
        const maxSupply = 100;
        const initialPrice = 1;
        const askDateForMint = true;
        const validUntil = currentTimestamp + 10000;
        const entriesCounter = 0;
        
          await expect(darkRallyNFT.registerNewTypeOfNft(
            tokenId, nameOfNFT, category, metadataHashIpfs,
            maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
          ));
          const nftInfo = await darkRallyNFT.nftInfo(tokenId);
          
          expect(nftInfo.tokenIsRegistered).to.be.true;
        });

it('Token debería  de registrarse antes del mint', async () => {
        const tokenId = 1023;
          
          
          expect(darkRallyNFT.mint(alice,tokenId,100 ) ).to.be.revertedWith('Token needs to be registered before mint');
        });
        it('should mint tokens successfully', async () => {
          const account = owner.address;
          const tokenId = 1;
          const nameOfNFT = 'MiNFT';
          const category = 'Categoria';
          const currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    
        
        
          
          const maxSupply = 100;
          const initialPrice = 1;
          const askDateForMint = true;
          const validUntil = currentTimestamp + 10000;
          const entriesCounter = 0;
          const amount = 10;
          
            await darkRallyNFT.registerNewTypeOfNft(
              tokenId, nameOfNFT, category, metadataHashIpfs,
              maxSupply, initialPrice, askDateForMint, validUntil, entriesCounter
            );
            await darkRallyNFT.mint(account, tokenId, amount);
      
          // Assert the minted tokens
          const balance = await darkRallyNFT.balanceOf(account, tokenId);
          expect(balance).to.equal(amount);
        });

         it('should revert if token is not registered', async () => {
    const account = owner.address;
    const tokenId = 1;
    const amount = 10;

    // Mint tokens without registering the token
    await expect(darkRallyNFT.mint(account, tokenId, amount)).to.be.revertedWith('Token needs to be registered before mint');
  });

  it('should revert if max supply limit is reached', async () => {
    const account = owner.address;
    const tokenId = 1;
    const maxSupply = 10;
    const amount = 20;

    // Register the token with a max supply
    await darkRallyNFT.registerNewTypeOfNft(tokenId, 'NFT Name', 'Category', metadataHashIpfs, maxSupply, 1, false, 0, 0);

    // Mint tokens exceeding the max supply
    await expect(darkRallyNFT.mint(account, tokenId, amount)).to.be.revertedWith('Limit of Supply for this token has been reached');
  });

  it('should revert if token has expired', async () => {
    const oneDayInSeconds = 24 * 60 * 60;
    const account = owner.address;
    const tokenId = 1;
    const amount = 10;
    const currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const validUntil = currentTimestamp + 10000; // Set validUntil to a past timestamp
 
    // Register the token with askDateForMint and expired validUntil
    await darkRallyNFT.registerNewTypeOfNft(tokenId, 'NFT Name', 'Category', metadataHashIpfs, 100, 1, true, validUntil, 0);
    await ethers.provider.send('evm_increaseTime', [oneDayInSeconds]);
    await ethers.provider.send('evm_mine');
    // Mint tokens for an expired token
    await expect(darkRallyNFT.mint(account, tokenId, amount)).to.be.revertedWith('This token has already expired');
  });

  it('should revert if is paused', async () => {
    const oneDayInSeconds = 24 * 60 * 60;
    const account = owner.address;
    const tokenId = 1;
    const amount = 10;
    const currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const validUntil = currentTimestamp + 10000; // Set validUntil to a past timestamp
 
      
  await darkRallyNFT.connect(owner).pause();
 
  // Verificar que el contrato esté en pausa
 

    // Register the token with askDateForMint and expired validUntil
    // Mint tokens for an expired token
    await expect(darkRallyNFT.mint(account, tokenId, amount)).to.be.revertedWith('Pausable: paused');
  });
  it("should return the correct URI for a given token ID", async () => {
    // Set up
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

    
    
    const expectedURI = "https://ipfs.io/ipfs/" + metadataHashIpfs  ;

    // Call the uri function
    const actualURI = await darkRallyNFT.uri(tokenId);

    // Assert
    expect(actualURI).to.equal(expectedURI);
  });

});
describe("DarkRallyNFT tests", function () {

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
   
  
  });
  
  it("should return the correct URI for a given token ID", async () => {
    // Set up
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

    
    
    const expectedURI = "https://ipfs.io/ipfs/" + metadataHashIpfs  ;

    // Call the uri function
    const actualURI = await darkRallyNFT.uri(tokenId);

    // Assert
    expect(actualURI).to.equal(expectedURI);
  });
  
  });
