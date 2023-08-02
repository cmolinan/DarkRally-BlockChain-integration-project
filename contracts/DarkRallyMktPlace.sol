/*
 _____             _      _____       _ _       
 |  __ \           | |    |  __ \     | | |      
 | |  | | __ _ _ __| | __ | |__) |__ _| | |_   _ 
 | |  | |/ _` | '__| |/ / |  _  // _` | | | | | |
 | |__| | (_| | |  |   <  | | \ \ (_| | | | |_| |
 |_____/ \__,_|_|  |_|\_\ |_|  \_\__,_|_|_|\__, |
                                            __/ |
                                           |___/ 
*/

// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


// Interfaces
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./IDarkRallyNFT.sol";

/**
* @title MarketPlace Smart Contract for Dark Rally game
* @dev This Smart Contract transfer NFTs via intercontract links with DarkRallyNFT SC
* @author Carlos Molina (cmolinan10@gmail.com)
*/
contract DarkRallyMktPlace is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {    
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");    
  bytes32 public constant BUSINESS_ROLE = keccak256("BUSINESS_ROLE");  //set NFTs prices 

  // USDC Coin contract
  IERC20Upgradeable public usdCoinSC;  // Setter in Constructor

  // DarkRallyNFT contract
  IDarkRallyNFT public darkRallyNFTSC;  // Setter in Constructor

  // Struct for Sale Info
  struct ForSaleInfo {
    uint256 tokenId;
    address owner;
    uint256 price;
    uint256 quantity;
    uint256 arrayIndex;
    bool isRegistered;
  }

  // List of NFT to sale -> uuid is based on: tokenId + '_' + owner
  mapping(bytes32 uuid => ForSaleInfo) internal forSaleInfo;

  // Storage for the list of all UUID registered
  bytes32[] public forSaleUuid;

  struct ScAddresses {
    address darkRallyNft;  // Address of NFT SC
    address usdcCoin;       // Address of usdcCoin SC
    address companyWallet; // Wallet for transferring the net USDC coins for each sale
    address feeWallet;     // Wallet for transferring the fee USDC coins for each sale 
    }

  ScAddresses public scAddresses; // contains SC addresses

  /// @notice When a new NFT is offered to sale, this event is fired
  event SetNftPrices(uint256[] tokenId, uint256[] price);  

  /// @notice When a purchase of NFTs is done, this event is fired
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
    darkRallyNFTSC = IDarkRallyNFT(scAddresses.darkRallyNft);

    scAddresses.usdcCoin = _usdcSCaddress;
    usdCoinSC = IERC20Upgradeable(scAddresses.usdcCoin);

    scAddresses.companyWallet = _companyWalletAddr;

    scAddresses.feeWallet =  _feeWalletAddr;
  }
  
  /**     
   * @notice Allows the creation, by an owner, of an offer to sell one or more of its NFTs
   * @param _tokenId Token id of sales offer
   * @param _price Price for sell its NFT's
   * @param _quantity Maximum amount of NFTs to sell
   * @dev Detailed data is stored in a Mapping and (only) UUIDs in an array
   */
  function createSaleOffer(uint256 _tokenId, uint256 _price, uint256 _quantity) external {
    // msg.sender must be the owner

    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", msg.sender));
    require( !forSaleInfo[uuid].isRegistered, "Token is already registered");

    require( _quantity > 0, "Quantity must not be zero");
    require( _price > 0, "Price must not be zero");
    require( darkRallyNFTSC.balanceOf(msg.sender, _tokenId) >= _quantity, "Don't own that amount of tokens"); 

    forSaleUuid.push(uuid);
    
    forSaleInfo[uuid] = ForSaleInfo(_tokenId, msg.sender, _price, _quantity, forSaleUuid.length -1, true);

  }

  /** 
   * @notice Purchase an amount of tokens
   * @param _tokenId Token Id to be purchased
   * @param _owner Owner of token Id to be purchased
   * @param _price Price of each token Id to be purchased
   * @param _quantity Amount of tokens to be purchased
   */
  function purchaseNft(uint256 _tokenId, address _owner, uint256 _price, uint256 _quantity) external whenNotPaused {
    // remember that msg.sender is the buyer
    
    require( darkRallyNFTSC.balanceOf(_owner, _tokenId) >= _quantity, "Owner don't have enough tokens");

    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", _owner));   //obtain uuid         

    require(forSaleInfo[uuid].isRegistered, "Token is not for sale");
    require(forSaleInfo[uuid].price == _price, "Registered price is different");
    
    uint256 maxQuantityToSale = forSaleInfo[uuid].quantity;
    require(_quantity != 0 && maxQuantityToSale >= _quantity, "Amount is not authorized to sale");

    // verify USDC Coin
    require( usdCoinSC.allowance(msg.sender, address(this)) >= _price, "Not enough USDC allowance");
    require( usdCoinSC.balanceOf(msg.sender) >= _price, "Not enough USDC balance");
    
    // calculations of transfers
    uint256 amountToPay = _price * _quantity;
    uint256 net = (amountToPay * 95) / 100;  // 95% to owner.        
    uint256 company = (amountToPay * 45) / 1000;  // 90% of the remaining 5% is for companyWallet
    uint256 fee = amountToPay - net  - company;      // 10% of the remaining 5% is for feeWallet
            
    // update mapping and array
    if (maxQuantityToSale - _quantity > 0) {
      forSaleInfo[uuid].quantity = maxQuantityToSale - _quantity;

    } else {          

      // Uuid of arrays's last_value 
      bytes32 uuidFromLast = forSaleUuid[forSaleUuid.length-1]; 
      
      // move UUID from last position to the position where value wiil be deleted
      forSaleUuid[forSaleInfo[uuid].arrayIndex] = forSaleUuid[forSaleUuid.length-1]; 

      // update array position for last position's UUID
      forSaleInfo[uuidFromLast].arrayIndex = forSaleInfo[uuid].arrayIndex;

      forSaleUuid.pop();

      delete forSaleInfo[uuid];
    }

    // Emit event
    emit PurchaseNft(_tokenId, _owner, msg.sender, _quantity, amountToPay);

    // transfer coins to owner
    require(usdCoinSC.transferFrom(msg.sender, _owner, net),"Transfer to Owner wallet failed");

    // transfer coins to company Wallet
    require(usdCoinSC.transferFrom(msg.sender, scAddresses.companyWallet, company),
      "Failed transfer to Company");

    // transfer coins to fee Wallet
    require(usdCoinSC.transferFrom(msg.sender, scAddresses.feeWallet, fee),"Failed fee transfer");

    // transfer of tokens to buyer
    darkRallyNFTSC.safeTransferFrom(_owner, msg.sender, _tokenId, _quantity, "");
  }

  /** 
   * @notice List all the NFTs offered for sale
   * @return Array with info of all the NFTs offered for sale
   */
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

  /** 
   * @notice Allows update of price and quantity for a NFT offered to sale
   * @param _tokenId Token Id info to be updated
   * @param _newPrice New price of token Id offered to sale
   * @param _newQuantity New maximum quantity of token Id offered to sale
   */
  function updatePriceAndQuantity(uint256 _tokenId, uint256 _newPrice, uint256 _newQuantity) external {
    // msg.sender must be the owner
    
    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", msg.sender));
    require( forSaleInfo[uuid].isRegistered, "Token not registered for Sale"); 
    require( _newPrice != forSaleInfo[uuid].price || _newQuantity != forSaleInfo[uuid].quantity, "Nothing to change");
    require( darkRallyNFTSC.balanceOf(msg.sender, _tokenId) >= _newQuantity, "Owner don't have enough tokens");
    
    forSaleInfo[uuid].price = _newPrice;
    forSaleInfo[uuid].quantity = _newQuantity;    

  }

  /** 
   * @notice Remove a sales offer 
   * @dev Take note of the procedure to remove the UUID from the array of sales offers
   * @param _tokenId Token Id to be removed from sales offers
   */
  function removeSaleOffer(uint256 _tokenId) external {
    //msg.sender must be the owner
    
    bytes32 uuid = keccak256(abi.encodePacked(_tokenId, "_", msg.sender));
    require( forSaleInfo[uuid].isRegistered, "Token not registered for Sale"); 

    // Procedure to remove the UUD from the array of sales offers
    // 1. Get the Uuid of array's last value
    bytes32 uuidFromLast = forSaleUuid[forSaleUuid.length-1]; 
    
    // 2. Move UUID from last position to the position where value will be removed
    forSaleUuid[forSaleInfo[uuid].arrayIndex] = forSaleUuid[forSaleUuid.length-1]; 

    // 3. Update, in Mapping, array position for last position's UUID
    forSaleInfo[uuidFromLast].arrayIndex = forSaleInfo[uuid].arrayIndex;

    // 4 Remove the last position of the array
    forSaleUuid.pop();

    // delete the mapping entry for the removed UUID
    delete forSaleInfo[uuid];
  }  

  ////////////////////////////////////////////////////////////////////////
  /////////                    Helper Methods                    /////////
  ////////////////////////////////////////////////////////////////////////

  /** 
   * @notice Allows the address change of DarkRallyNFT SC 
   * @param _darkRallyNftAddr New address for DarkRallyNFT SC
   */
  function setNftScAddress(address _darkRallyNftAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_darkRallyNftAddr != address(0), "Address zero is invalid");
    scAddresses.darkRallyNft = _darkRallyNftAddr;
    darkRallyNFTSC = IDarkRallyNFT(scAddresses.darkRallyNft);
  }

  /** 
   * @notice Allows the address change of USD Coin SC 
   * @param _usdcCoinAddr New address for USD Coin SC
   */
  function setUsdcCoinScAddress(address _usdcCoinAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_usdcCoinAddr != address(0), "Address zero is invalid");
    scAddresses.usdcCoin = _usdcCoinAddr;
    usdCoinSC = IERC20Upgradeable(scAddresses.usdcCoin);
  }

  /** 
   * @notice Allows the address change of Company wallet
   * @param _companyWalletAddr New address for Company wallet
   */
  function setCompanyWalletAddress(address _companyWalletAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_companyWalletAddr != address(0), "Address zero is invalid");
    scAddresses.companyWallet = _companyWalletAddr;
  }

  /** 
   * @notice Allows the address change of Fee wallet
   * @param _feeWalletAddr New address for Fee wallet
   */
  function setFeeWalletAddress(address _feeWalletAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_feeWalletAddr != address(0), "Address zero is invalid");
    scAddresses.feeWallet = _feeWalletAddr;
  }

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
    // solhint-disable-next-line
  {}
}
