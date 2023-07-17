// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract DarkRallyNFT is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, 
         PausableUpgradeable, ERC1155BurnableUpgradeable, ERC1155SupplyUpgradeable, UUPSUpgradeable {
    bytes32 public constant BUSINESS_ROLE = keccak256("BUSINESS_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Struct Nft Info 
    struct NftInfo {                
        string nameOfNFT;  //ie: NFToy serie AA23-A   --only for show in getter function
        string category; //ie: Toys, Tickets, Tropheus, Vehicles, Skins --only for show in getter function
        string metadataHashIpfs;  //ie: QmNoLB8krmgfntxAHgaJrTE2Mf6NCPQ7ct1UvhH2pNkLeg        
        uint256 maxSupply; //ie: 3000    
        bool askDateForMint; // If true, the expiration date will be validated before minting.
        uint256 validUntil; // initially used for Tickets - expressed in epoch time        
        bool tokenIsRegistered; //needed to determine if this token has been registered or not. It's a requirement to MINT
    }
    
    //save all the NFT registered by function 'registerNewTypeOfNft'
    mapping(uint256 tokenId => NftInfo) public nftInfo;

    //required for OpenSea
    string public name;
    
    //storage the list of tokens registered
    uint256[] internal tokensList;

    //Event when a new NFT is registered
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


    function registerNewTypeOfNft (
        uint256 tokenId, string calldata nameOfNFT, string calldata category,  string calldata metadataHashIpfs,
        uint256 maxSupply, bool askDateForMint,  uint256 validUntil
    ) public  onlyRole(BUSINESS_ROLE) whenPaused {
                
        require(!nftInfo[tokenId].tokenIsRegistered, "TokenId was already registered");
        require ( bytes(metadataHashIpfs).length > 32, "Check the MetadataHashIPFS entry");
        require (maxSupply > 0,"Maxsupply must be greater than 0");
        if (askDateForMint) require ( validUntil > block.timestamp, "Expiration date must be greater than current date");

        nftInfo[tokenId] = NftInfo(nameOfNFT, category, metadataHashIpfs,
        maxSupply, askDateForMint, validUntil, true);  //true means tokenIsRegistered
        
        tokensList.push(tokenId); //push to array the new registered tokenId

        emit RegisterNewTypeOfNFT (nftInfo[tokenId]);    
    }

    function deleteRegisterOfTypeOfNft (uint256 tokenId) public  onlyRole(BUSINESS_ROLE) {
        require(nftInfo[tokenId].tokenIsRegistered, "TokenId is not registered");
        require(totalSupply(tokenId) == 0, "Not possible due TokenId already has mintages");
        delete nftInfo[tokenId];

        //delete tokenId entry inside tokenList array
        if (tokensList.length > 0) {
            for (uint256 i=tokensList.length-1;i>=0;--i){
                if(tokensList[i]==tokenId){
                    tokensList[i]=tokensList[tokensList.length-1];
                    tokensList.pop();                    
                    break;
                }
            }  
        }
    }

    function getTokensList() external view returns(uint256[] memory) {        
        uint256[] memory tokensListOut = new uint256[](tokensList.length);

        for (uint256 i = 0; i < tokensList.length; ++i) {
            tokensListOut[i] = tokensList[i];
        }

        return tokensListOut; 
    }

    function replaceTokensList(uint256[] calldata tokensIdArray) external onlyRole(BUSINESS_ROLE) {

        delete tokensList;
        if(tokensIdArray.length > 0) {
            for (uint256 i = 0; i < tokensIdArray.length; ++i) {                
                tokensList.push(tokensIdArray[i]);
            }
        }        
    }

    function changeMetadataHashOfNft(uint256 _tokenId, string memory _metadataHashIpfs)  
        external onlyRole(BUSINESS_ROLE) {

        require(nftInfo[_tokenId].tokenIsRegistered, "Token is not registered");        
        require(bytes(_metadataHashIpfs).length > 0, "MetadataHash can't be empty");

        nftInfo[_tokenId].metadataHashIpfs = _metadataHashIpfs;
    }

    function changeMaxSupplyOfNft(uint256 _tokenId, uint256 _maxSupply)  
        external onlyRole(BUSINESS_ROLE) {

        require(nftInfo[_tokenId].tokenIsRegistered, "Token is not registered");
        require(_maxSupply != 0 && nftInfo[_tokenId].maxSupply != _maxSupply, "Nothing to change");
        
        nftInfo[_tokenId].maxSupply = _maxSupply;
    }

    function mint(address account, uint256 tokenId, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {        
        require(nftInfo[tokenId].tokenIsRegistered, "Token needs to be registered before mint");
        require(totalSupply(tokenId) + amount <= nftInfo[tokenId].maxSupply, "Limit of Supply for this token has been reached");        
        if (nftInfo[tokenId].askDateForMint) require ( nftInfo[tokenId].validUntil > block.timestamp, "This token has already expired");

        _mint(account, tokenId, amount, "");

    }
   
    function uri(uint256 _tokenId) public override view returns(string memory) {
        return (
            string(
                abi.encodePacked("https://ipfs.io/ipfs/", nftInfo[_tokenId].metadataHashIpfs)
            )
        );
    }

    function getAssetsOfAccount(address _account,  uint256[] calldata _tokensList ) external view returns(uint256[] memory) {
        require(_tokensList.length != 0, "Length of array is zero");
        
        uint256[] memory balanceList = new uint256[](_tokensList.length);

        for (uint256 i = 0; i < _tokensList.length; ++i) {
            balanceList[i] = balanceOf(_account, _tokensList[i]);
        }
        return balanceList;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
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
