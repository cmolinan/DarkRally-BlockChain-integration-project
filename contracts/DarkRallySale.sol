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
    bytes32 public constant BUSINESS_ROLE = keccak256("BUSINESS_ROLE");  //set NFTs prices 

    // USDC Coin contract
    IERC20Upgradeable USDCoin_SC;  // Setter in Constructor

    // DarkRallyNFT contract
    IDarkRallyNFT DarkRallyNFT_SC;  // Setter in Constructor
   
   // Prices storage:   tokenId => price 
    mapping(uint256 tokenId => uint256) public priceOfNft;

    struct ScAddresses {
        address darkRallyNft;  // Address of NFT SC
        address usdcCoin;       // Address of usdcCoin SC
        address companyWallet; // Wallet for transferring 90% USDC coins for each purchase
        address feeWallet;     // Wallet for transferring 10% USDC coins for each purchase
    }

    ScAddresses public scAddresses; // contains SC addresses

    //Event when new prices were registered
    event SetNftPrices(uint256[] tokenId, uint256[] price);  

    //Event when a purchase of NFTs was done    
    event PurchaseOfNft(address account, uint256 tokenId, uint256 amount, uint256 coinsPaid);        
    
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
    
    function setNftPrice(uint256[] calldata _tokenId, uint256[] calldata _price) external onlyRole(BUSINESS_ROLE) {
        require( _price.length == _tokenId.length && _price.length != 0, "Length of arrays not equal or zero");

        for (uint256  i = 0; i < _price.length; i++) {
            priceOfNft[_tokenId[i]] = _price[i];
        }
        
        // Emit event
        emit SetNftPrices(_tokenId, _price);
    }

    function purchaseNftById(uint256 _tokenId, uint256 _amount) external whenNotPaused {        
        
        // Price to be paid for all tokens
        uint256 amountToPay = priceOfNft[_tokenId] * _amount;

        require( amountToPay > 0, "NFT without price or amount is zero");
        require( USDCoin_SC.allowance(msg.sender, address(this)) >= amountToPay, "Not enough allowance for this SC");
        require( USDCoin_SC.balanceOf(msg.sender) >= amountToPay, "Not enough USDC balance"); 
        
        
        uint256 fee = (amountToPay * 10) / 100;  //10% to feeWallet
        uint256 net = amountToPay - fee; //90% to companyWaller

        //transfer coins to company Wallet
        USDCoin_SC.transferFrom(msg.sender, scAddresses.companyWallet, net);

        //transfer coins to fee Wallet
        USDCoin_SC.transferFrom(msg.sender, scAddresses.feeWallet, fee);        

        //Mint the tokens
        DarkRallyNFT_SC.mint(msg.sender, _tokenId, _amount);

        // Emit event
        emit PurchaseOfNft(msg.sender, _tokenId, _amount, amountToPay);
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
