// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IDarkRallyNFT {
    event AdminChanged(address previousAdmin, address newAdmin);
    event ApprovalForAll(
        address indexed account,
        address indexed operator,
        bool approved
    );
    event BeaconUpgraded(address indexed beacon);
    event Initialized(uint8 version);
    event Paused(address account);
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole
    );
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event URI(string value, uint256 indexed id);
    event Unpaused(address account);
    event Upgraded(address indexed implementation);

    function BUSINESS_ROLE() external view returns (bytes32);

    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

    function MINTER_ROLE() external view returns (bytes32);

    function PAUSER_ROLE() external view returns (bytes32);

    function UPGRADER_ROLE() external view returns (bytes32);

    function balanceOf(
        address account,
        uint256 id
    ) external view returns (uint256);

    function balanceOfBatch(
        address[] memory accounts,
        uint256[] memory ids
    ) external view returns (uint256[] memory);

    function burn(address account, uint256 id, uint256 value) external;

    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) external;

    function changeMaxSupplyOfNft(
        uint256 _tokenId,
        uint256 _maxSupply
    ) external;

    function changeMetadataHashOfNft(
        uint256 _tokenId,
        string memory _metadataHashIpfs
    ) external;

    function deleteRegisterOfTypeOfNft(uint256 tokenId) external;

    function exists(uint256 id) external view returns (bool);

    function getAssetsOfAccount(
        address _account,
        uint256[] memory _tokensList
    ) external view returns (uint256[] memory);

    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    function getTokensList() external view returns (uint256[] memory);

    function grantRole(bytes32 role, address account) external;

    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);

    function initialize() external;

    function isApprovedForAll(
        address account,
        address operator
    ) external view returns (bool);

    function mint(address account, uint256 tokenId, uint256 amount) external;

    function name() external view returns (string memory);

    function nftInfo(
        uint256 tokenId
    )
        external
        view
        returns (
            string memory nameOfNFT,
            string memory category,
            string memory metadataHashIpfs,
            uint256 maxSupply,
            bool askDateForMint,
            uint256 validUntil,
            bool tokenIsRegistered
        );

    function pause() external;

    function paused() external view returns (bool);

    function proxiableUUID() external view returns (bytes32);

    function registerNewTypeOfNft(
        uint256 tokenId,
        string memory nameOfNFT,
        string memory category,
        string memory metadataHashIpfs,
        uint256 maxSupply,
        bool askDateForMint,
        uint256 validUntil
    ) external;

    function renounceRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external;

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;

    function setApprovalForAll(address operator, bool approved) external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    function totalSupply(uint256 id) external view returns (uint256);

    function unpause() external;

    function upgradeTo(address newImplementation) external;

    function upgradeToAndCall(
        address newImplementation,
        bytes memory data
    ) external payable;

    function uri(uint256 _tokenId) external view returns (string memory);
}
