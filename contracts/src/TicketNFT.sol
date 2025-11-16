// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bool) public claimed;

    address public vaultAddress;

    event NFTMinted(uint256 indexed tokenId, address indexed to, string metadataURI);
    event NFTClaimed(uint256 indexed tokenId, address indexed claimer);

    constructor() ERC721("MyMineTicketKu NFT", "MMTKN") Ownable(msg.sender) {
        vaultAddress = address(this);
    }

    function mintToVault(string memory metadataURI) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(vaultAddress, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        
        emit NFTMinted(tokenId, vaultAddress, metadataURI);
        return tokenId;
    }

    function claimNFT(uint256 tokenId, address claimer) external onlyOwner {
        require(ownerOf(tokenId) == vaultAddress, "NFT not in vault");
        require(!claimed[tokenId], "NFT already claimed");
        
        claimed[tokenId] = true;
        _transfer(vaultAddress, claimer, tokenId);
        
        emit NFTClaimed(tokenId, claimer);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
}
