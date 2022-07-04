const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const TOKEN_ID = 5;

async function updateListingPrice() {
    const nftmarketplace = await ethers.getContract("NFTMarketplace");
    const sampleNft = await ethers.getContract("SampleNft");

    console.log("Updating price...");
    const listTx = await nftmarketplace.updateListing(
        sampleNft.address,
        TOKEN_ID,
        ethers.utils.parseEther("0.2")
    );
    await listTx.wait(1);
    console.log("Updated!");

    if (network.config.chainId == "31337") {
        await moveBlocks(1, 1000);
    }
}

updateListingPrice()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
