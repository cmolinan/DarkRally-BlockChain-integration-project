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

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";



/**
* @title NFT Smart Contract for Dark Rally game
* @dev This SC does not handle any coins
* @author Carlos Molina (cmolinan10@gmail.com)
*/
contract DarkRallyNFT is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, 
         PausableUpgradeable, ERC1155BurnableUpgradeable, ERC1155SupplyUpgradeable, UUPSUpgradeable {
    bytes32 public constant BUSINESS_ROLE = keccak256("BUSINESS_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Struct Nft Info 
    struct NftInfo {                
        string nameOfNFT;  // ie: NFToy serie AA23-A   --only for show in getter function
        string category; // ie: Toys, Tickets, Tropheus, Vehicles, Skins --only for show in getter function
        string metadataHashIpfs;  // ie: QmNoLB8krmgfntxAHgaJrTE2Mf6NCPQ7ct1UvhH2pNkLeg        
        uint256 maxSupply; // ie: 3000    
        bool askDateForMint; // If true, the expiration date will be validated before minting.
        uint256 validUntil; // initially used for Tickets - expressed in epoch time        
        bool tokenIsRegistered; // needed to determine if this token has been registered or not. 
                                // It's a requirement to MINT
    }
    
    // ave all the NFT registered by function 'registerNewTypeOfNft'
    mapping(uint256 tokenId => NftInfo) public nftInfo;

    // required for OpenSea
    string public name;
    
    // storage the list of tokens registered
    uint256[] internal tokensList;

    /// @notice When a new NFT is registered this event is fired
    event RegisterNewTypeOfNFT (NftInfo);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __ERC1155_init("");
        __AccessControl_init();
        __Pausable_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(BUSINESS_ROLE, msg.sender);

        name =  "Dark Rally NFT Collection - Inventory #01";
    }


    /**     
     * @notice Allows registration of a new type of NFT like vehicles, toys, tickets, etc.
     * @dev Only registered tokens id are allowed to be minted
     * @param tokenId Token id number for a new type of NFT
     * @param nameOfNFT Name of this token Id. Only used as reference
     * @param category Category of this token Id. Only used as reference
     * @param metadataHashIpfs IPFS hash of metadata file for this token Id
     * @param maxSupply Maximum number to mint 
     * @param askDateForMint If true, only mint if the mint date is less than or equal to the 'validUntil' parameter
     * @param validUntil Maximum date for mint if parameter 'askDateForMint' is true. Use epoch time
     */
    function registerNewTypeOfNft (
        uint256 tokenId, string calldata nameOfNFT, string calldata category,  string calldata metadataHashIpfs,
        uint256 maxSupply, bool askDateForMint,  uint256 validUntil
    ) public  onlyRole(BUSINESS_ROLE) whenPaused {
                
        require(!nftInfo[tokenId].tokenIsRegistered, "TokenId was already registered");
        require ( bytes(metadataHashIpfs).length > 32, "Check the MetadataHashIPFS entry");
        require (maxSupply > 0,"Maxsupply must be greater than 0");
        if (askDateForMint) require ( validUntil > block.timestamp, 
            "Expiration date must be greater than current date");

        nftInfo[tokenId] = NftInfo(nameOfNFT, category, metadataHashIpfs,
         maxSupply, askDateForMint, validUntil, true);  // true means tokenIsRegistered
        
        tokensList.push(tokenId); // push to array the new registered tokenId

        emit RegisterNewTypeOfNFT (nftInfo[tokenId]);    
    }

    /**     
     * @notice Allows the deletion of the registration of an NFT type.
     * @param tokenId Token id number
     */
    function deleteRegisterOfTypeOfNft (uint256 tokenId) public  onlyRole(BUSINESS_ROLE) {
        require(nftInfo[tokenId].tokenIsRegistered, "TokenId is not registered");
        require(totalSupply(tokenId) == 0, "Not possible due TokenId already has mintages");
        delete nftInfo[tokenId];

        // delete tokenId entry inside tokenList array
        if (tokensList.length > 0) {
            bool toPop = false;
            for (uint256 i= 0; i < tokensList.length ; i++) {
                if(tokensList[i]==tokenId){
                    tokensList[i]=tokensList[tokensList.length-1];
                    //tokensList.pop();
                    toPop = true;
                    break;
                }
            }  
            if(toPop) tokensList.pop();
        }
    }

    /** 
     * @notice List all the tokens ids registered
     * @return Array with all the registered tokens id 
     */
    function getTokensList() external view returns(uint256[] memory) {        
        uint256[] memory tokensListOut = new uint256[](tokensList.length);

        for (uint256 i = 0; i < tokensList.length; ++i) {
            tokensListOut[i] = tokensList[i];
        }

        return tokensListOut; 
    }

    /** 
     * @notice Allows the change of MetadataHashOfNft parameter for a token Id
     * @param _tokenId Token Id number
     * @param _metadataHashIpfs New IPFS hash of metadata file for this token Id      
     */
    function changeMetadataHashOfNft(uint256 _tokenId, string memory _metadataHashIpfs)  
        external onlyRole(BUSINESS_ROLE) {

        require(nftInfo[_tokenId].tokenIsRegistered, "Token is not registered");        
        require(bytes(_metadataHashIpfs).length > 0, "MetadataHash can't be empty");

        nftInfo[_tokenId].metadataHashIpfs = _metadataHashIpfs;
    }

    /** 
     * @notice Allows the change of maxSupply parameter for a token Id
     * @param _tokenId Token Id number
     * @param _maxSupply New maximum number to mint     
     */
    function changeMaxSupplyOfNft(uint256 _tokenId, uint256 _maxSupply)  
        external onlyRole(BUSINESS_ROLE) {

        require(nftInfo[_tokenId].tokenIsRegistered, "Token is not registered");
        require(_maxSupply != 0 && nftInfo[_tokenId].maxSupply != _maxSupply, "Nothing to change");
        
        nftInfo[_tokenId].maxSupply = _maxSupply;
    }

    /** 
     * @notice Mint registered NFTs
     * @param account Address to be the owner
     * @param tokenId Token Id to be minted
     * @param amount Amount of tokens to be minted
     */
    function mint(address account, uint256 tokenId, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {        
        require(nftInfo[tokenId].tokenIsRegistered, "Token needs to be registered before mint");
        require(totalSupply(tokenId) + amount <= nftInfo[tokenId].maxSupply,
             "Limit of Supply for this token has been reached");        
        if (nftInfo[tokenId].askDateForMint) require ( nftInfo[tokenId].validUntil > block.timestamp, 
            "This token has already expired");

        _mint(account, tokenId, amount, "");

    }
   
    /** 
     * @notice Returns URI of a token Id
     * @param _tokenId Token Id requested
     * @return IPFS URI for the given token Id
     */
    function uri(uint256 _tokenId) public override view returns(string memory) {
        return (
            string(
                abi.encodePacked("https://ipfs.io/ipfs/", nftInfo[_tokenId].metadataHashIpfs)
            )
        );
    }

    /** 
     * @notice Returns the balance of each token-id owned by an account, from a list.
     * @param _account Account requested
     * @param _tokensList Array with a list of token Id requested
     * @return Array with the balance of each token requested that is owned by the account.
     */
    function getAssetsOfAccount(
            address _account,  uint256[] calldata _tokensList ) 
                external view returns(uint256[] memory) {
        require(_tokensList.length != 0, "Length of array is zero");
        
        uint256[] memory balanceList = new uint256[](_tokensList.length);

        for (uint256 i = 0; i < _tokensList.length; ++i) {
            balanceList[i] = balanceOf(_account, _tokensList[i]);
        }
        return balanceList;
    }

    ///////////////////////////////////////////////////////////////
    ////                    HELPER FUNCTIONS                   ////
    ///////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(
        address operator, address from, address to, uint256[] memory ids, 
        uint256[] memory amounts, bytes memory data)
        internal
        whenNotPaused
        override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
