// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "../competence/ICompetenceInfo.sol";

contract DarkTrophy is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;

    ICompetenceInfo competenceInfo;

    struct TrophyTransaction {
        address trophyOwner;
        uint256 competenceUuid;
        uint256 trophyUuid;
    }
    mapping(address => TrophyTransaction) internal _TrophyTransactions;

    event MintTrophy(
        address owner,
        uint256 competenceUuid,
        uint256 trophyUuid,
        uint256 creationDate
    );

    /**
     * @dev Details the information of a Dark Trophy. Additional properties attached for its competence
     * @param owner: Wallet address of the current owner of the Dark Trophy
     * @param trophyUuid: Uuid of the Tatacuy when it was minted
     * @param creationDate: Timestamp of the Dark Trophy when it was minted
     * @param hasTrophy: Whether a Tatacuy exists or not
     * @param competenceStartDate: Timestamp when the competence started
     * @param competenceEndDate: Timestamp when the competence ended
     */
    struct TrophyInfo {
        address owner;
        uint256 competenceUuid;
        uint256 trophyUuid;
        uint256 creationDate;
        uint256 competenceStartDate;
        uint256 competenceEndDate;
        bool hasTrophy;
    }
    // Competence uuid => trophy uuid => struct of trophy
    mapping(uint256 => TrophyInfo) uuidToTrophyInfo;

    // List of all Uuid active competences
    uint256[] internal listUuidActiveCompetences;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(PAUSER_ROLE, _msgSender());
        _grantRole(UPGRADER_ROLE, _msgSender());
    }

    // /**
    //  * @dev Trigger when it is minted
    //  * @param _account: Wallet address of the current owner of the Trophy
    //  * @param _competenceUuid: Uuid of the competence when it was minted
    //  * @param _trophyUuid: Uuid of the trophy when it was minted
    //  */
    function registerNft(bytes memory _data) external {
        (address _account, uint256 _competenceUuid, , uint256 _trophyUuid) = abi
            .decode(_data, (address, uint256, uint256, uint256));

        uuidToTrophyInfo[_competenceUuid] = TrophyInfo({
            owner: _account,
            competenceUuid: _competenceUuid,
            trophyUuid: _trophyUuid,
            creationDate: block.timestamp,
            competenceStartDate: 0,
            competenceEndDate: 0,
            hasTrophy: true
        });

        emit MintTrophy(
            _account,
            _competenceUuid,
            _trophyUuid,
            block.timestamp
        );
    }

    function getTrophyWithUuid(
        uint256 _trophyUuid
    ) external view returns (TrophyInfo memory) {
        return uuidToTrophyInfo[_trophyUuid];
    }

    function setCompetenceAddress(
        address _competenceAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        competenceInfo = ICompetenceInfo(_competenceAddress);
    }

    function getListOfCompetences()
        external
        view
        returns (TrophyInfo[] memory listActiveCompetences)
    {
        listActiveCompetences = new TrophyInfo[](
            listUuidActiveCompetences.length
        );
        for (uint256 i = 0; i < listUuidActiveCompetences.length; i++) {
            listActiveCompetences[i] = uuidToTrophyInfo[
                listUuidActiveCompetences[i]
            ];
        }
    }

    function tokenUri(
        string memory _prefix,
        uint256
    ) external pure returns (string memory) {
        return string(abi.encodePacked(_prefix, "trophies.json"));
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
}
