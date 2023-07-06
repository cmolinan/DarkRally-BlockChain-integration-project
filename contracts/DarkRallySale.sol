// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IDarkRallyNFT {    
    function mint(address account, uint256 tokenId, uint256 amount) external;
}

contract DarkRallySale is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {    
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");    
    bytes32 public constant PURCHASER_ROLE = keccak256("PURCHASER_ROLE");  //set prices and purchase NFTs

    // USDC Coin contract
    IERC20Upgradeable USDCoin_SC;  // Setter in Constructor

    // DarkRallyNFT contract
    IDarkRallyNFT DarkRallyNFT_SC;  // Setter in Constructor
   
    // Wallet for transferring USDC coins for each purchase
    address companyWalletAddr;   // Setter in Constructor
   
   // Prices storage:   tokenId => price 
    mapping(uint256 tokenId => uint256) public priceOfNft;

    event SetNftPrices(uint256[] tokenId, uint256[] price);  //When new prices were registered
    event PurchaseOfNft(address account, uint256 tokenId, uint256 amount, uint256 coinsPaid); //when a purchase of NFTs was done    
        
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _usdcSCaddress, address _darkRallyNftAddress, address _companyWalletAddr) public initializer {                
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(PURCHASER_ROLE, msg.sender);        

        USDCoin_SC = IERC20Upgradeable(_usdcSCaddress);
        DarkRallyNFT_SC = IDarkRallyNFT(_darkRallyNftAddress);

        companyWalletAddr = _companyWalletAddr; 
    }
    
    function setNftPrice(uint256[] memory _tokenId, uint256[] memory _price) external onlyRole(PURCHASER_ROLE) {
        require( _price.length == _tokenId.length && _price.length != 0, "Length of arrays not equal or zero");

        for (uint256  i = 0; i < _price.length; i++) {
            priceOfNft[_tokenId[i]] = _price[i];
        }
        
        // Emit event
        emit SetNftPrices(_tokenId, _price);
    }

    function purchaseNftById(uint256 _tokenId, uint256 _amount) external whenNotPaused onlyRole(PURCHASER_ROLE) {        
        
        // Price to be paid for all tokens
        uint256 amountToPay = priceOfNft[_tokenId] * _amount;

        require( amountToPay > 0, "NFT without price or amount is zero");
        require( USDCoin_SC.allowance(msg.sender, address(this)) >= amountToPay, "Not enough allowance for this SC");
        require( USDCoin_SC.balanceOf(msg.sender) >= amountToPay, "Not enough USDC balance"); 
        
        //transfer coins to company Wallet
        USDCoin_SC.transferFrom(msg.sender, companyWalletAddr, amountToPay);
        
        //Mint the tokens
        DarkRallyNFT_SC.mint(msg.sender, _tokenId, _amount);

        // Emit event
        emit PurchaseOfNft(msg.sender, _tokenId, _amount, amountToPay);
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
    {}
}
