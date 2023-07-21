// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IDarkRallyNFT {    
  function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external;
  function balanceOf(address account, uint256 id) external view returns (uint256);
}

contract DarkRallyMktPlace is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {    
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");    
  bytes32 public constant BUSINESS_ROLE = keccak256("BUSINESS_ROLE");  //set NFTs prices 

  // USDC Coin contract
  IERC20Upgradeable USDCoin_SC;  // Setter in Constructor

  // DarkRallyNFT contract
  IDarkRallyNFT DarkRallyNFT_SC;  // Setter in Constructor


  // Struct for Sale Info
  struct ForSaleInfo {
    uint256 tokenId;
    address owner;
    uint256 price;
    uint256 quantity;
    uint256 arrayIndex;
    bool isRegistered;
  }

  // List of NFT to sale -> uuid is obtained with  tokenId + '_' + owner
  mapping(bytes32 uuid => ForSaleInfo) internal forSaleInfo;

  //new storage for the list of all UUID registered
  bytes32[] public forSaleUuid;

  struct ScAddresses {
    address darkRallyNft;  // Address of NFT SC
    address usdcCoin;       // Address of usdcCoin SC
    address companyWallet; // Wallet for transferring the net USDC coins for each sale
    address feeWallet;     // Wallet for transferring the fee USDC coins for each sale 
    }

  ScAddresses public scAddresses; // contains SC addresses

  //Event when new NFT is offered to sale
  event SetNftPrices(uint256[] tokenId, uint256[] price);  

  //Event when a purchase of NFTs was done 
  event PurchaseNft(uint256 tokenId, address owner, address buyer, uint256 quantity, uint256 amountPayed);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
      _disableInitializers();
  }

  function initialize(
    address _usdcSCaddress, 
    address _darkRallySCnftAddress, 
    address _companyWalletAddr,
    address _feeWalletAddr

  ) public initializer {                

    __Pausable_init();
    __AccessControl_init();
    __UUPSUpgradeable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(PAUSER_ROLE, msg.sender);
    _grantRole(UPGRADER_ROLE, msg.sender);
    _grantRole(BUSINESS_ROLE, msg.sender);
    
    scAddresses.darkRallyNft = _darkRallySCnftAddress;
    DarkRallyNFT_SC = IDarkRallyNFT(scAddresses.darkRallyNft);

    scAddresses.usdcCoin = _usdcSCaddress;
    USDCoin_SC = IERC20Upgradeable(scAddresses.usdcCoin);

    scAddresses.companyWallet = _companyWalletAddr;

    scAddresses.feeWallet =  _feeWalletAddr;
  }
  
  function createSaleOffer(uint256 _tokenId, uint256 _price, uint256 _quantity) external {
    //msg.sender must be the owner

    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", msg.sender));
    // bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", msg.sender));
    require( !forSaleInfo[uuid].isRegistered, "Token is already registered");

    require( _quantity > 0, "Quantity must not be zero");
    require( _price > 0, "Price must not be zero");
    require( DarkRallyNFT_SC.balanceOf(msg.sender, _tokenId) >= _quantity, "Don't own that quantity of tokens"); 

    forSaleUuid.push(uuid);
    
    forSaleInfo[uuid] = ForSaleInfo(_tokenId, msg.sender, _price, _quantity, forSaleUuid.length -1, true);

  }

  function purchaseNft(uint256 _tokenId, address _owner, uint256 _price, uint256 _quantity) external whenNotPaused {

    //remember that msg.sender is the buyer
    
    require( DarkRallyNFT_SC.balanceOf(_owner, _tokenId) >= _quantity, "Owner no longer have enough tokens");

    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", _owner));   //obtain uuid         

    require(forSaleInfo[uuid].isRegistered, "Token is not for sale");
    require(forSaleInfo[uuid].price == _price, "Price is different that registered");
    
    uint256 maxQuantityToSale = forSaleInfo[uuid].quantity;
    require(_quantity != 0 && maxQuantityToSale >= _quantity, "That quantity is not authorized to sale");

    // verify USDC Coin
    require( USDCoin_SC.allowance(msg.sender, address(this)) >= _price, "Not enough USDC allowance for this SC");
    require( USDCoin_SC.balanceOf(msg.sender) >= _price, "Not enough USDC balance");
    
    // calculations of transfers
    uint256 amountToPay = _price * _quantity;
    uint256 net = (amountToPay * 95) / 100;  //95% to owner.        
    uint256 company = (amountToPay * 45) / 1000;  //90% of the remaining 5% is for companyWallet
    uint256 fee = amountToPay - net  - company;      //10% of the remaining 5% is for feeWallet
            
    //transfer coins to owner
    USDCoin_SC.transferFrom(msg.sender, _owner, net);

    //transfer coins to company Wallet
    USDCoin_SC.transferFrom(msg.sender, scAddresses.companyWallet, company);

    //transfer coins to fee Wallet
    USDCoin_SC.transferFrom(msg.sender, scAddresses.feeWallet, fee);

    //Transfer of tokens to buyer
    DarkRallyNFT_SC.safeTransferFrom(_owner, msg.sender, _tokenId, _quantity, "");

    //update mapping and array
    if (maxQuantityToSale - _quantity > 0) {
      forSaleInfo[uuid].quantity = maxQuantityToSale - _quantity;

    } else {          

      //Uuid of arrays's last_value 
      bytes32 uuidFromLast = forSaleUuid[forSaleUuid.length-1]; 
      
      //move UUID from last position to the position where value wiil be deleted
      forSaleUuid[forSaleInfo[uuid].arrayIndex] = forSaleUuid[forSaleUuid.length-1]; 

      //update array position for last position's UUID
      forSaleInfo[uuidFromLast].arrayIndex = forSaleInfo[uuid].arrayIndex;

      forSaleUuid.pop();

      delete forSaleInfo[uuid];
    }

    // Emit event
    emit PurchaseNft(_tokenId, _owner, msg.sender, _quantity, amountToPay);
  }

  function getSalesList() external view returns(string[] memory) {        
    string[] memory forSaleListOut = new string[](forSaleUuid.length);
  
    string memory infoSales;
    bytes32 uuid;
    for (uint256 i = 0; i < forSaleUuid.length; ++i) {
      uuid = forSaleUuid[i];
      infoSales  = string.concat(
        Strings.toString(forSaleInfo[uuid].tokenId), "_", 
        Strings.toHexString(uint160(forSaleInfo[uuid].owner), 20), "_", 
        Strings.toString(forSaleInfo[uuid].price), "_", 
        Strings.toString(forSaleInfo[uuid].quantity)
        );

        forSaleListOut[i] = infoSales;
    }

    return forSaleListOut; 
  }

  function updatePriceAndQuantity(uint256 _tokenId, uint256 _newPrice, uint256 _newQuantity) external {
    //msg.sender must be the owner
    
    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", msg.sender));
    require( forSaleInfo[uuid].isRegistered, "Token not registered for Sale"); 
    require( _newPrice != forSaleInfo[uuid].price || _newQuantity != forSaleInfo[uuid].quantity, "Nothing to change");
    require( DarkRallyNFT_SC.balanceOf(msg.sender, _tokenId) >= _newQuantity, "Doesn't have that quantity of tokens!");

    forSaleInfo[uuid].price = _newPrice;
    forSaleInfo[uuid].quantity = _newQuantity;    

  }

  function removeSaleOffer(uint256 _tokenId) external {
    //msg.sender must be the owner
    
    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", msg.sender));
    require( forSaleInfo[uuid].isRegistered, "Token not registered for Sale"); 

    //Uuid of arrays's last_value 
    bytes32 uuidFromLast = forSaleUuid[forSaleUuid.length-1]; 
    
    //move UUID from last position to the position where value wiil be deleted
    forSaleUuid[forSaleInfo[uuid].arrayIndex] = forSaleUuid[forSaleUuid.length-1]; 

    //update array position for last position's UUID
    forSaleInfo[uuidFromLast].arrayIndex = forSaleInfo[uuid].arrayIndex;

    //forSaleList.pop();
    forSaleUuid.pop();

    // forSaleInfo[uuid].isRegistered = false;
    delete forSaleInfo[uuid];
  }  

  function setNftScAddress(address _darkRallyNftAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_darkRallyNftAddr != address(0), "Address zero is invalid");
    scAddresses.darkRallyNft = _darkRallyNftAddr;
    DarkRallyNFT_SC = IDarkRallyNFT(scAddresses.darkRallyNft);
  }

  function setUsdcCoinScAddress(address _usdcCoinAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_usdcCoinAddr != address(0), "Address zero is invalid");
    scAddresses.usdcCoin = _usdcCoinAddr;
    USDCoin_SC = IERC20Upgradeable(scAddresses.usdcCoin);
  }

  function setCompanyWalletAddress(address _companyWalletAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_companyWalletAddr != address(0), "Address zero is invalid");
    scAddresses.companyWallet = _companyWalletAddr;
  }

  function setFeeWalletAddress(address _feeWalletAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_feeWalletAddr != address(0), "Address zero is invalid");
    scAddresses.feeWallet = _feeWalletAddr;
  }

  ////////////////////////////////////////////////////////////////////////
  /////////                    Helper Methods                    /////////
  ////////////////////////////////////////////////////////////////////////

  function pause() public onlyRole(PAUSER_ROLE) {
    _pause();        
  }

  function unpause() public onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  function _authorizeUpgrade(address newImplementation)      
    internal
    onlyRole(UPGRADER_ROLE)
    override
  {}
}
