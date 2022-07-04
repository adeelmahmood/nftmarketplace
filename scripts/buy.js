const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const TOKEN_ID = 7;

async function buy() {
    const nftmarketplace = await ethers.getContract("NFTMarketplace");
    const sampleNft = await ethers.getContract("SampleNft");

    const listing = await nftmarketplace.getListing(sampleNft.address, TOKEN_ID);
    if (listing) {
        console.log(`Existing listing: ${JSON.stringify(listing)}`);
        const listTx = await nftmarketplace.buyItem(sampleNft.address, TOKEN_ID, {
            value: listing.price,
        });
        await listTx.wait(1);
        console.log("Bought!");

        if (network.config.chainId == "31337") {
            await moveBlocks(1, 1000);
        }
    }
}

buy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
