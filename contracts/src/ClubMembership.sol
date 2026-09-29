// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice ERC-5192's minimal soulbound-token interface.
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool);
}

/// @title ClubMembership
/// @notice A permanently non-transferable membership credential minted by the club owner.
contract ClubMembership is ERC721, IERC5192, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("Blockchain Club", "CLUB") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        emit Locked(tokenId);
        _safeMint(to, tokenId);
    }

    function locked(uint256) external pure override returns (bool) {
        return true;
    }

    /// @dev OpenZeppelin v5 transfer hook. Minting/burning are allowed; user transfers revert.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "ClubMembership: token is soulbound");
        return super._update(to, tokenId, auth);
    }
}
