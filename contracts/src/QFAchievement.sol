// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QFAchievement
 * @notice Soulbound ERC-721 achievement NFTs for QF Games.
 *         Single contract for all 161 achievements. Non-transferable.
 *         Minted by the backend escrow wallet after fee payment is confirmed off-chain.
 *
 * @dev Each token has a unique tokenURI pointing to IPFS-hosted JSON metadata.
 *      Payment logic (burn/team split) is handled off-chain by the backend.
 *      Soulbound: _update override reverts on any transfer (only mint and burn allowed).
 */
contract QFAchievement is ERC721, Ownable {

    uint256 private _nextTokenId;

    // Authorised minter (escrow wallet)
    address public minter;

    // tokenId => IPFS metadata URI
    mapping(uint256 => string) private _tokenURIs;

    event AchievementMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string tokenURI
    );

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    error NotMinter();
    error SoulboundTransfer();
    error ZeroAddress();

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    constructor(address _minter) ERC721("QF Achievement", "QFACHIEVE") Ownable(msg.sender) {
        if (_minter == address(0)) revert ZeroAddress();
        minter = _minter;
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a soulbound achievement NFT.
     * @param to Recipient address
     * @param uri IPFS URI for the token metadata JSON
     * @return tokenId The minted token ID
     */
    function mint(address to, string calldata uri) external onlyMinter returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        emit AchievementMinted(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @notice Update the authorised minter address.
     * @param newMinter New escrow wallet address
     */
    function setMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) revert ZeroAddress();
        emit MinterUpdated(minter, newMinter);
        minter = newMinter;
    }

    /**
     * @notice Returns the metadata URI for a token.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Soulbound: block all transfers except minting (from == address(0)).
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert SoulboundTransfer();
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Total number of achievements minted.
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
