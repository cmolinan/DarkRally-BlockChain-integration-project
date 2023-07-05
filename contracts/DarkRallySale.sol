// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IDarkRallyNFT {
    
    function mint(address account, uint256 tokenId, uint256 amount) external;

    function balanceOf(address account, uint256 id) external view returns (uint256);
}

contract MyToken is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // USDC Coin contract
    IERC20Upgradeable USDCoin;  // Setter in Constructor
    IDarkRallyNFT DarkRallyNFT;  // Setter in Constructor

    event DeliverNft(address account, uint256 nftId);
    mapping (uint256 _tknId => bool) internal tokensSold;

    // Wallet to transfer the USDC coins
    address companyWalletAddr;   // Setter in Constructor
    
    // only for debug
    //mapping (uint256 _tknId => uint256) public  tmpTokensSoldbyPrice;
    // mapping (uint256 _tknId => address) public  tmpTokensSoldbyAddress;

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

        USDCoin = IERC20Upgradeable(_usdcSCaddress);
        DarkRallyNFT = IDarkRallyNFT(_darkRallyNftAddress);

        companyWalletAddr = _companyWalletAddr;  //for transfers of USDC coins to company
    }
    
    function purchaseNftById(uint256 _id) external {        

        //require (tokens avallable)
        
        require( !tokensSold[_id], "tokenId not available");         
        
        // Get the Price of the TokenId
        uint256 priceNft = _getPriceByTokenId(_id) * 10 ** 18;

        require( USDCoin.allowance(msg.sender, address(this)) >= priceNft, "DarkRallySale: Not enough allowance");
        require( USDCoin.balanceOf(msg.sender) >= priceNft, "DarkRallySale: Not enough token balance"); 
        
        DarkRallyNFT.mint(msg.sender, _id, _id); 
        USDCoin.transferFrom(msg.sender, companyWalletAddr, priceNft);

        // Emit event
        emit DeliverNft(msg.sender, _id);
        tokensSold[_id] = true;
        // tmpTokensSoldbyPrice[_id] = priceNft;
        // tmpTokensSoldbyAddress[_id] = msg.sender;        
    }

    // Según el id del NFT, devuelve el precio. Existen 3 grupos de precios
    function _getPriceByTokenId(uint256 _id) internal pure returns (uint256) {

        //return pricexxx
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // function _beforeTokenTransfer(address from, address to, uint256 amount)
    //     internal
    //     whenNotPaused
    //     override
    // {
    //     super._beforeTokenTransfer(from, to, amount);
    // }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}
