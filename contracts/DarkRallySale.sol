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

// Interfaces
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./IDarkRallyNFT.sol";

/**
 * @title Public Sale Smart Contract for Dark Rally game
 * @dev This Smart Contract mints NFTs via intercontract links with DarkRallyNFT SC
 * @author Carlos Molina (cmolinan10@gmail.com)
 */
contract DarkRallySale is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant BUSINESS_ROLE = keccak256("BUSINESS_ROLE"); //set NFTs prices

    // USDC Coin contract
    IERC20Upgradeable public usdCoinSC; // Setter in Constructor

    // DarkRallyNFT contract
    IDarkRallyNFT public darkRallyNFTSC; // Setter in Constructor

    // Prices storage:   tokenId => price
    mapping(uint256 tokenId => uint256) public priceOfNft;

    struct ScAddresses {
        address darkRallyNft; // Address of NFT SC
        address usdcCoin; // Address of usdcCoin SC
        address companyWallet; // Wallet for transferring 90% USDC coins for each purchase
        address feeWallet; // Wallet for transferring 10% USDC coins for each purchase
    }

    ScAddresses public scAddresses; // contains SC addresses

    /// @notice When new prices are registered, this event is fired
    event SetNftPrices(uint256[] tokenId, uint256[] price);

    /// @notice When a purchase of NFTs is executed, this event is fired
    event PurchaseOfNft(
        address account,
        uint256 tokenId,
        uint256 amount,
        uint256 coinsPaid
    );

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

        scAddresses.feeWallet = _feeWalletAddr;
    }

    /**
     * @notice Allows the change of NFTs' prices in batch mode
     * @param _tokenId Array of Token Ids to change prices
     * @param _price Array with new price for the respective token Id
     */
    function setNftPrice(
        uint256[] calldata _tokenId,
        uint256[] calldata _price
    ) external onlyRole(BUSINESS_ROLE) {
        require(
            _price.length == _tokenId.length && _price.length != 0,
            "Arrays' length not equal or zero"
        );

        for (uint256 i = 0; i < _price.length; i++) {
            priceOfNft[_tokenId[i]] = _price[i];
        }

        // Emit event
        emit SetNftPrices(_tokenId, _price);
    }

    /**
     * @notice Purchase an amount of tokens ids using approved USD Coins
     * @param _tokenId Token Id to be purchased
     * @param _amount Amount of tokens to be purchased
     */
    function purchaseNftById(
        uint256 _tokenId,
        uint256 _amount
    ) external whenNotPaused {
        // Price to be paid for all tokens
        uint256 amountToPay = priceOfNft[_tokenId] * _amount;

        require(amountToPay > 0, "Price don't exist or amount is 0");
        require(
            usdCoinSC.allowance(msg.sender, address(this)) >= amountToPay,
            "Not enough allowance for this SC"
        );
        require(
            usdCoinSC.balanceOf(msg.sender) >= amountToPay,
            "Not enough USDC balance"
        );

        uint256 fee = (amountToPay * 10) / 100; //10% to feeWallet
        uint256 net = amountToPay - fee; //90% to companyWaller

        // Emit event
        emit PurchaseOfNft(msg.sender, _tokenId, _amount, amountToPay);

        // transfer coins to company Wallet
        require(
            usdCoinSC.transferFrom(msg.sender, scAddresses.companyWallet, net),
            "Failed transfer to company"
        );

        // transfer coins to fee Wallet
        require(
            usdCoinSC.transferFrom(msg.sender, scAddresses.feeWallet, fee),
            "Failed fee transfer"
        );

        // Intercontract mint of the tokens
        darkRallyNFTSC.mint(msg.sender, _tokenId, _amount);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    /**
     * @notice Allows the address change of DarkRallyNFT SC
     * @param _darkRallyNftAddr New address for DarkRallyNFT SC
     */
    function setNftScAddress(
        address _darkRallyNftAddr
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_darkRallyNftAddr != address(0), "Address zero is invalid");
        scAddresses.darkRallyNft = _darkRallyNftAddr;
        darkRallyNFTSC = IDarkRallyNFT(scAddresses.darkRallyNft);
    }

    /**
     * @notice Allows the address change of USD Coin SC
     * @param _usdcCoinAddr New address for USD Coin SC
     */
    function setUsdcCoinScAddress(
        address _usdcCoinAddr
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_usdcCoinAddr != address(0), "Address zero is invalid");
        scAddresses.usdcCoin = _usdcCoinAddr;
        usdCoinSC = IERC20Upgradeable(scAddresses.usdcCoin);
    }

    /**
     * @notice Allows the address change of Company wallet
     * @param _companyWalletAddr New address for Company wallet
     */
    function setCompanyWalletAddress(
        address _companyWalletAddr
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_companyWalletAddr != address(0), "Address zero is invalid");
        scAddresses.companyWallet = _companyWalletAddr;
    }

    /**
     * @notice Allows the address change of Fee wallet
     * @param _feeWalletAddr New address for Fee wallet
     */
    function setFeeWalletAddress(
        address _feeWalletAddr
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeWalletAddr != address(0), "Address zero is invalid");
        scAddresses.feeWallet = _feeWalletAddr;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) // solhint-disable-next-line
    {

    }
}
