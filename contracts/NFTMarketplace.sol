//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "hardhat/console.sol";

error NFTMarketplace__PriceMustBeSpecified();
error NFTMarketplace__NotApprovedForMarketplace();
error NFTMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NFTMarketplace__NotOwner();
error NFTMarketplace__NotListed();
error NFTMarketplace__PriceNotMatched(address nftAddress, uint256 tokenId, uint256 price);

contract NFTMarketplace {
    struct Listing {
        address seller;
        uint256 price;
    }

    // NFT contract -> token id -> listing (seller, price)
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    )

    /**
        Lists an NFT item
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        // price must be specified
        if (price <= 0) {
            revert NFTMarketplace__PriceMustBeSpecified();
        }

        IERC721 nft = IERC721(nftAddress);
        // make sure marketplace has the approval
        if (nft.getApproved(tokenId) != address(this)) {
            revert NFTMarketplace__NotApprovedForMarketplace();
        }

        s_listings[nftAddress][tokenId] = Listing(msg.sender, price);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /**
        Buy an NFT item
     */
    function buyItem(address nftAddress, uint256 tokenId) external payable isListed(nftAddress, tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];

        if (msg.value < listing.price) {
            revert NFTMarketplace__PriceNotMatched(nftAddress, tokenId, listing.price);
        }

        s_proceeds[msg.sender] += msg.value;
        delete s_listings[nftAddress][tokenId];        
        IERC721(nft).safeTransferFrom(listing.seller, msg.sender, tokenId);        
        emit ItemBought(msg.sender, nftAddress, tokenId, msg.value);
    }

    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];

        if (listing.price > 0) {
            revert NFTMarketplace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];

        if (listing.price <= 0) {
            revert NFTMarketplace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address seller
    ) {
        IERC721 nft = IERC721(nftAddress);

        if (nft.ownerOf(tokenId) != seller) {
            revert NFTMarketplace__NotOwner();
        }
        _;
    }
}

// 1. Functions of the NFT marketplace
//     1. Listing an item
//     2. Buying an item
