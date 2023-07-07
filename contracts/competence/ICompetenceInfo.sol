// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface ITokenUri {
    function tokenUri(
        string memory _prefix,
        uint256 _uuid
    ) external view returns (string memory);
}

interface ICompetenceInfo {
    function trophyStock() external returns (uint256);

    function trophyAddress() external view returns (address);

    function getAddressOfNftType(bytes32 _type) external view returns (address);
}
