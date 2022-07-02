const { ethers } = require("hardhat");

async function mindAndListNft() {
    const nftmarketplace = await ethers.getContract("NFTMarketplace");
    const sampleNft = await ethers.getContract("SampleNft");

    console.log("Minting NFT...");
    const mintTx = await sampleNft.mintNft();
    const mintReceipt = await mintTx.wait(1);
    const tokenId = mintReceipt.events[0].args.tokenId;

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
}

mindAndListNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
