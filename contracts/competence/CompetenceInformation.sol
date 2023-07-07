// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract CompetenceInformation is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    bytes32 public constant DARK_TROPHY = keccak256("DARK_TROPHY");

    uint256 public trophyStock;

    address public trophyAddress;

    mapping(bytes32 => address) public nftTypeToAddress;

    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(PAUSER_ROLE, _msgSender());
        _grantRole(UPGRADER_ROLE, _msgSender());

        _setGameVariables();
    }

    function _setGameVariables() internal {
        trophyStock = 3;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setTrophyAddress(
        address _trophyAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        nftTypeToAddress[DARK_TROPHY] = _trophyAddress;
        trophyAddress = _trophyAddress;
    }

    function getAddressOfNftType(
        bytes32 _type
    ) external view returns (address) {
        return nftTypeToAddress[_type];
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
}
