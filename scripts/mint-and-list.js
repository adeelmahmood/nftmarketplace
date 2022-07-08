const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

async function mindAndListNft() {
    const nftmarketplace = await ethers.getContract("NFTMarketplace");
    const sampleNft = await ethers.getContract("SampleNft");

    console.log("Minting NFT...");
    const mintTx = await sampleNft.mintNft();
    const mintReceipt = await mintTx.wait(1);
    const tokenId = mintReceipt.events[0].args.tokenId;
    const tokenUri = await sampleNft.tokenURI(tokenId);
    console.log(`NFT token URI ${tokenUri}`);

    console.log("Approving for marketplace...");
    const approveTx = await sampleNft.approve(nftmarketplace.address, tokenId);
    await approveTx.wait(1);

    console.log("Listing NFT...");
    const listTx = await nftmarketplace.listItem(
        sampleNft.address,
        tokenId,
        ethers.utils.parseEther("0.1")
    );
    await listTx.wait(1);
    console.log("Listed!");

    if (network.config.chainId == "31337") {
        await moveBlocks(1, 1000);
    }
}

mindAndListNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
