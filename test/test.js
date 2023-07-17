
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
var alice;
var darkRallyNFT;
var darkRallyNFTProxy;
var implementationAddress;
var metadataHashIpfs = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(('MetadataHash')));
beforeEach(async () => {
  [owner, alice, alice] = await ethers.getSigners();
  // Desplegar el contrato antes de cada prueba
  const DarkRallyNFT = await ethers.getContractFactory("DarkRallyNFT");
  
  
 
  darkRallyNFT = await hre.upgrades.deployProxy(DarkRallyNFT, {
    kind: "uups",
  });
  
   implementationAddress = await upgrades.erc1967.
  getImplementationAddress(darkRallyNFT.address);
 

});

it("should revert if the tokens list is empty", async function () {
  const tokensList = [];
  await expect(darkRallyNFT.getAssetsOfAccount(alice.address, tokensList)).to.be.revertedWith("Length of array is zero");
});

it("should revert if the tokens list is empty", async function () {
  const tokensList = [];
  await expect(darkRallyNFT.getAssetsOfAccount(alice.address, tokensList)).to.be.revertedWith("Length of array is zero");
});

  describe("DarkRallyNFT Smart Contract", function () {
    it("should not allow minting without the MINTER_ROLE", async function () {
      
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

      // Register a new NFT type
       await darkRallyNFT.connect(owner).pause();
      await darkRallyNFT.registerNewTypeOfNft(
        1, // Token ID
        "NFT Name",
        "NFT Category",
        "QmNoLB8krmgfntxAHgaJrTE2Mf6NCPQ7ct1UvhH2pNkLeg", // Metadata Hash IPFS
        100, // Max Supply
        false, // Ask Date For Mint
        0 // Valid Until
        // Entries Counter
      );
      await darkRallyNFT.connect(owner).unpause();
      await  darkRallyNFT.connect(owner).mint(alice.address, 1, 1);
      

      // Check the balance of the recipient
      const balance = await darkRallyNFT.balanceOf(alice.address, 1);

      // Assert the balance is as expected
      expect(balance).to.equal(1);
    });

    it("should mint a new NFT", async function () {

      // Register a new NFT type
       await darkRallyNFT.connect(owner).pause();
      await darkRallyNFT.registerNewTypeOfNft(
        1, // Token ID
        "NFT Name",
        "NFT Category",
        "QmNoLB8krmgfntxAHgaJrTE2Mf6NCPQ7ct1UvhH2pNkLeg", // Metadata Hash IPFS
        100, // Max Supply
    
        false, // Ask Date For Mint
        0 // Valid Until
        // Entries Counter
      );
      await darkRallyNFT.connect(owner).unpause();
  await  darkRallyNFT.connect(owner).mint(alice.address, 1, 1);
      

      // Check the balance of the recipient
      const balance = await darkRallyNFT.balanceOf(alice.address, 1);

      // Assert the balance is as expected
      expect(balance).to.equal(1);
    });

    // it("should revert when calling a function while paused", async function () {
       
      
    //     // Llamar a la función pause como el owner del contrato (quien tiene el rol PAUSER_ROLE)
    //     await darkRallyNFT.connect(owner).pause();
      
    //     // Verificar que el contrato esté en pausa
    //     expect(await darkRallyNFT.paused()).to.equal(true);
      
    //     // Verificar que las funciones lanzan una excepción cuando se llaman mientras el contrato está en pausa
    //     await expect(

    //       darkRallyNFT.connect(owner).registerNewTypeOfNft(
    //         1,
    //         "NFT Name",
    //         "NFT Category",
    //         "QmNoLB8krmgfntxAHgaJrTE2Mf6NCPQ7ct1UvhH2pNkLeg",
    //         100,
    //         10,
    //         false,
    //         0,
    //         0
    //       )
    //     ).to.be.revertedWith("Pausable: paused");
      
    // });


          

});
it("shouldn't pause the contract", async function () {
 
  
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
    const askDateForMint = false;
    const validUntil = 0;
    await darkRallyNFT.connect(owner).pause();
     
    await darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply, askDateForMint, validUntil
    );
    await darkRallyNFT.connect(owner).unpause();
    const nftInfo = await darkRallyNFT.nftInfo(tokenId);
    expect(nftInfo.tokenIsRegistered).to.be.true;
    // Verificar otros valores si es necesario
  });
  it('no debería permitir registrar un tokenId ya registrado', async () => {
    const tokenId = 1;
    // Registrar un tokenId previamente
     await darkRallyNFT.connect(owner).pause();
    await darkRallyNFT.registerNewTypeOfNft(
      tokenId, 'Nombre1', 'Categoria1', metadataHashIpfs,
      100, false, 0
    );

    // Intentar registrar el mismo tokenId nuevamente
     
    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, 'Nombre2', 'Categoria2', metadataHashIpfs,
      200,  true, 0
    )).to.be.revertedWith('TokenId was already registered');
  });
  it('debería requerir una longitud de MetadataHashIPFS adecuada', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
    const metadataHashIpfs = 'MetadataHash';
    const maxSupply = 100;
    const askDateForMint = false;
    const validUntil = 0;

     await darkRallyNFT.connect(owner).pause();
    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply,  askDateForMint, validUntil
    )).to.be.revertedWith('Check the MetadataHashIPFS entry');
  });
  it('debería requerir un maxSupply mayor a cero', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
   
    const maxSupply = 0; // maxSupply igual a cero
    const askDateForMint = false;
    const validUntil = 0;

     await darkRallyNFT.connect(owner).pause();
    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply,  askDateForMint, validUntil
    )).to.be.revertedWith('Maxsupply must be greater than 0');
  });
  it('debería requerir una fecha de vencimiento válida si askDateForMint es true', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
   
    const maxSupply = 100;
    const askDateForMint = true;
    const validUntil = 0; // Fecha de vencimiento menor a la fecha actual

     await darkRallyNFT.connect(owner).pause();
    await expect(darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply,  askDateForMint, validUntil
    )).to.be.revertedWith('Expiration date must be greater than current date');
  });
  it('debería registrar un nuevo tipo de NFT sin fecha de vencimiento requerida', async () => {
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
    
    const maxSupply = 100;
    const askDateForMint = false;
    const validUntil = 0;

     await darkRallyNFT.connect(owner).pause();
      await expect(darkRallyNFT.registerNewTypeOfNft(
        tokenId, nameOfNFT, category, metadataHashIpfs,
        maxSupply,  askDateForMint, validUntil
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
      const askDateForMint = true;
      const validUntil = currentTimestamp + 10000;
      
       await darkRallyNFT.connect(owner).pause();
        await expect(darkRallyNFT.registerNewTypeOfNft(
          tokenId, nameOfNFT, category, metadataHashIpfs,
          maxSupply,  askDateForMint, validUntil
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
      const askDateForMint = true;
      const validUntil = currentTimestamp + 10000;
      
       await darkRallyNFT.connect(owner).pause();
        await expect(darkRallyNFT.registerNewTypeOfNft(
          tokenId, nameOfNFT, category, metadataHashIpfs,
          maxSupply,  askDateForMint, validUntil
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
        const askDateForMint = true;
        const validUntil = currentTimestamp + 10000;
        
         await darkRallyNFT.connect(owner).pause();
          await expect(darkRallyNFT.registerNewTypeOfNft(
            tokenId, nameOfNFT, category, metadataHashIpfs,
            maxSupply,  askDateForMint, validUntil
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
          const askDateForMint = true;
          const validUntil = currentTimestamp + 10000;
          const amount = 10;
          
          
           await darkRallyNFT.connect(owner).pause();
            await darkRallyNFT.registerNewTypeOfNft(
              tokenId, nameOfNFT, category, metadataHashIpfs,
              maxSupply,  askDateForMint, validUntil
            );
            await darkRallyNFT.connect(owner).unpause();
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
     await darkRallyNFT.connect(owner).pause();
    await darkRallyNFT.registerNewTypeOfNft(tokenId, 'NFT Name', 'Category', metadataHashIpfs, maxSupply, false, 0);
    await darkRallyNFT.connect(owner).unpause();
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
     await darkRallyNFT.connect(owner).pause();
    await darkRallyNFT.registerNewTypeOfNft(tokenId, 'NFT Name', 'Category', metadataHashIpfs, 100, true, validUntil);
    await ethers.provider.send('evm_increaseTime', [oneDayInSeconds]);
    await ethers.provider.send('evm_mine');
    // Mint tokens for an expired token
    await darkRallyNFT.connect(owner).unpause();
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
    const askDateForMint = false;
    const validUntil = 0;

     await darkRallyNFT.connect(owner).pause();
    await darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply,  askDateForMint, validUntil
    );

    
    
    const expectedURI = "https://ipfs.io/ipfs/" + metadataHashIpfs  ;

    // Call the uri function
    const actualURI = await darkRallyNFT.uri(tokenId);

    // Assert
    expect(actualURI).to.equal(expectedURI);
  });

});
describe("DarkRallySale tests", function () {

  const MINTER_ROLE = getRole("MINTER_ROLE");
  const BURNER_ROLE = getRole("BURNER_ROLE");
  const PAUSER_ROLE = getRole("PAUSER_ROLE");
  const UPGRADER_ROLE    = getRole("UPGRADER_ROLE");
  const DEFAULT_ADMIN_ROLE    = "0x0000000000000000000000000000000000000000000000000000000000000000";
  
  var owner;
  var alice;
  
  var darkRallyNFT;
  var darkRallyNFTProxy;
  var implementationAddress;
  var metadataHashIpfs = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(('MetadataHash')));
  let darkRallySale;
  let usdCoin;
  let companyWalletAddr;
  var tokenId;
  var nameOfNFT;
  var category;
  var maxSupply;
  var askDateForMint;
  var validUntil;
  var feeWallet;

  beforeEach(async function () {
    
    // Mock USDCoin contract
    const USDCoin = await ethers.getContractFactory("USDCoin");
    usdCoin = await USDCoin.deploy();
    await usdCoin.deployed();

    const DarkRallyNFT = await ethers.getContractFactory("DarkRallyNFT");
  
  
 
  darkRallyNFT = await hre.upgrades.deployProxy(DarkRallyNFT, {
    kind: "uups",
  });
  
   implementationAddress = await upgrades.erc1967.
  getImplementationAddress(darkRallyNFT.address);

    [owner, companyWalletAddr,feeWallet, alice, bob] = await ethers.getSigners();

    // Initialize DarkRallySale contract
    const DarkRallySale = await ethers.getContractFactory("DarkRallySale");
  
  
 
    darkRallySale = await upgrades.deployProxy(DarkRallySale, [
      usdCoin.address,
      darkRallyNFT.address,
      companyWalletAddr.address,
      feeWallet.address
     ], {
      kind: "uups",
    });
    
     implementationAddressDarkRallySale = await upgrades.erc1967.
    getImplementationAddress(darkRallyNFT.address);

     tokenId = 1;
     nameOfNFT = 'MiNFT';
     category = 'Categoria';
     maxSupply = 100;
     
     askDateForMint = false;
     validUntil = 0;
  
      await darkRallyNFT.connect(owner).pause();
//## print if registerNewTypeOfNft is called successfully 

 
    await darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply, askDateForMint, validUntil
    );

    tokenId = 2;
    nameOfNFT = 'MiNFT2';
    category = 'Categoria2';
    maxSupply = 100;
    
    askDateForMint = false;
    validUntil = 0;

    await darkRallyNFT.registerNewTypeOfNft(
      tokenId, nameOfNFT, category, metadataHashIpfs,
      maxSupply, askDateForMint, validUntil
    );
  });
  it("should allow the purchase of an NFT", async () => {

    
      usdCoin.connect(owner).mint(alice.address, 100000000000);
      await usdCoin.connect(alice).approve(darkRallySale.address, 100000000000);
      await darkRallySale.connect(owner).setNftPrice([tokenId], [100]);
      
      darkRallyNFT.grantRole(MINTER_ROLE, darkRallySale.address);
      await darkRallyNFT.connect(owner).unpause();
      expect(await darkRallySale.connect(alice).purchaseNftById(tokenId,100))
      .to.emit(darkRallySale, "DeliverNft")
      .withArgs(await alice, tokenId);
      
    // Check that the NFT was minted
    expect(await darkRallyNFT.balanceOf( alice.address, tokenId)).to.equal(100);
  
  });

  it("Set prices correctly ", async () => {
    usdCoin.connect(owner).mint(alice.address, 100000000000);
    // Set up mock approvals and balances
    await usdCoin.connect(alice).approve(darkRallySale.address, 100000000000);
    await darkRallySale.connect(owner).setNftPrice([1, 2], [100,100]);
   
    expect(await darkRallySale.priceOfNft(1)).to.be.equal(100);
    expect(await darkRallySale.priceOfNft(2)).to.be.equal(100);
   });
  it("Set prices with reverted message ", async () => {

    
    usdCoin.connect(owner).mint(alice.address, 100000000000);
    // Set up mock approvals and balances
  

    await usdCoin.connect(alice).approve(darkRallySale.address, 100000000000);
   
    // test setnftprice 
    await expect( darkRallySale.connect(owner).setNftPrice([1, 2], [100,100,100])).to.be.revertedWith('Length of arrays not equal or zero');
    
   });

  it("should mint an NFT and emit Minted event", async function () {

    const account = owner.address;
    const tokenId = 1;
    const nameOfNFT = 'MiNFT';
    const category = 'Categoria';
    const currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const maxSupply = 100;
    const askDateForMint = true;
    const validUntil = currentTimestamp + 10000;
    const amount = 10;
    
    
     await darkRallyNFT.connect(owner).pause();
      await darkRallyNFT.registerNewTypeOfNft(
        tokenId, nameOfNFT, category, metadataHashIpfs,
        maxSupply,  askDateForMint, validUntil
      );
      await darkRallyNFT.connect(owner).unpause();
      await darkRallyNFT.mint(account, tokenId, amount);

    // Assert the minted tokens
    const balance = await darkRallyNFT.balanceOf(account, tokenId);
    expect(balance).to.equal(amount);

    const mintedEvent = await expect(darkRallyNFT) 
      .to.emit(darkRallyNFT, "Minted")
      .withArgs(alice.address, tokenId, amount);
      
  });


  it("should burn an NFT and emit Burned event", async function () {
    const tokenId = 1;
    const amount = 1;
    await darkRallyNFT.connect(owner).unpause();
    // Mint the NFT first
    await darkRallyNFT.connect(owner).mint(alice.address, tokenId, amount);

    await darkRallyNFT.connect(owner).burn(alice.address, tokenId, amount);

    const burnedEvent = await expect(darkRallyNFT)
      .to.emit(darkRallyNFT, "Burned")
      .withArgs(alice.address, tokenId, amount);
  });

  

  it("shouldn't allow the purchase of an NFT doesn't exist", async () => {

    
    usdCoin.connect(owner).mint(alice.address, 100000000000);
    await usdCoin.connect(alice).approve(darkRallySale.address, 100000000000);
    await darkRallySale.connect(owner).setNftPrice([tokenId], [100]);
    
    darkRallyNFT.grantRole(MINTER_ROLE, darkRallySale.address);
    await darkRallyNFT.connect(owner).unpause();
    await expect( darkRallySale.connect(alice).purchaseNftById(20,100)).to.be.revertedWith('NFT without price or amount is zero');
    
   
});
it("shouldn't allow the purchase of an NFT: Not enough allowance for this SC", async () => {

    
  usdCoin.connect(owner).mint(alice.address, 100000000000);
  
  await darkRallySale.connect(owner).setNftPrice([tokenId], [100]);
  
  darkRallyNFT.grantRole(MINTER_ROLE, darkRallySale.address);
  await darkRallyNFT.connect(owner).unpause();
  await expect( darkRallySale.connect(alice).purchaseNftById(tokenId,100)).to.be.revertedWith('Not enough allowance for this SC');

});
it("shouldn't allow the purchase of an NFT: Not enough USDC balance", async () => {
  
  await usdCoin.connect(alice).approve(darkRallySale.address, 100000000000);
  await darkRallySale.connect(owner).setNftPrice([tokenId], [100]);
  darkRallyNFT.grantRole(MINTER_ROLE, darkRallySale.address);
  await darkRallyNFT.connect(owner).unpause();
  await expect( darkRallySale.connect(alice).purchaseNftById(tokenId,100)).to.be.revertedWith('Not enough USDC balance');


  
});

  it("should set the DarkRallyNFT contract address", async function () {
    const newAddress = "0x1234567890123456789012345678901234567890";
    await darkRallySale.setNftScAddress(newAddress);
      console.log(await darkRallySale.scAddresses.darkRallyNft);
  await expect( darkRallySale.scAddresses.darkRallyNft).to.be.equal(newAddress);
  });
  it("should revert if the address is zero", async function () {
    await expect(darkRallySale.setNftScAddress(ethers.constants.AddressZero)).to.be.revertedWith("Address zero is invalid");
  });
  it("should revert if called by a non-admin", async function () {
    await expect(darkRallySale.connect(alice).setNftScAddress("0x1234567890123456789012345678901234567890")).to.be.revertedWith("AccessControl: account "+ alice.address.toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
  });



  it("should revert if the address is zero", async function () {
    await expect(darkRallySale.setUsdcCoinScAddress(ethers.constants.AddressZero)).to.be.revertedWith("Address zero is invalid");
  });
  it("should revert if called by a non-admin", async function () {
    await expect(darkRallySale.connect(alice).setUsdcCoinScAddress("0x1234567890123456789012345678901234567890")).to.be.revertedWith("AccessControl: account "+ alice.address.toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
  });


  


  it("should revert if the address is zero", async function () {
    await expect(darkRallySale.setCompanyWalletAddress(ethers.constants.AddressZero)).to.be.revertedWith("Address zero is invalid");
  });
  it("should revert if called by a non-admin", async function () {
    await expect(darkRallySale.connect(alice).setCompanyWalletAddress("0x1234567890123456789012345678901234567890")).to.be.revertedWith("AccessControl: account "+ alice.address.toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
  });
 
  it("should allow setting of fee wallet address", async function () {
    await darkRallySale.connect(feeWallet).setFeeWalletAddress(feeWallet.getAddress());
    darkRallySale.grantRole(DEFAULT_ADMIN_ROLE, feeWallet.getAddress());
    expect(await darkRallySale.feeWallet()).to.equal(await feeWallet.getAddress());
  });

  it("should revert if the address is zero", async function () {
    await expect(darkRallySale.setFeeWalletAddress(ethers.constants.AddressZero)).to.be.revertedWith("Address zero is invalid");
  });

  it("should revert if called by a non-admin", async function () {
    

    await expect(darkRallySale.connect(alice).setFeeWalletAddress(alice.getAddress())).to.be.revertedWith("AccessControl: account " + alice.address.toLowerCase() + " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
  });
  });
  