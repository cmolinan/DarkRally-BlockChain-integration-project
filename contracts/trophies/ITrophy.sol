// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface ITokenUri {
    function tokenUri(
        string memory _prefix,
        uint256 _uuid
    ) external view returns (string memory);
}

interface IDarkTrophy {
    struct DarkTrophyInfo {
        bool hasDarkTrophy;
    }
}
