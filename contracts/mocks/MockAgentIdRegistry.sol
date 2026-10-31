// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice Mock registry SPACE ID .ai Agent ID HANYA untuk tes Hardhat.
/// Bukan bagian dari kontrak produksi — di jaringan asli, ZIGZOO memakai
/// registry SPACE ID publik 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F.
contract MockAgentIdRegistry is ERC721 {
    uint256 private _nextId = 1;

    constructor() ERC721("Mock Agent ID", "AGENTID") {}

    function mintAgentId(address to) external returns (uint256) {
        uint256 id = _nextId++;
        _mint(to, id);
        return id;
    }
}
