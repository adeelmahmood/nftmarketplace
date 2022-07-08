const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONT_END_ADDRS_FILE = "../nft-marketplace-ui/constants/contract.json";
const FRONT_END_NFTMARKETPLACE_ABI_FILE = "../nft-marketplace-ui/constants/nftmarketplace.json";
const FRONT_END_SAMPLENFT_ABI_FILE = "../nft-marketplace-ui/constants/samplenft.json";

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end");
        await updateContractAddress();
        await updateAbi();
    }
};

async function updateAbi() {
    const nftmarketplace = await ethers.getContract("NFTMarketplace");
    fs.writeFileSync(
        FRONT_END_NFTMARKETPLACE_ABI_FILE,
        nftmarketplace.interface.format(ethers.utils.FormatTypes.json)
    );

    const sampleNft = await ethers.getContract("SampleNft");
    fs.writeFileSync(
        FRONT_END_SAMPLENFT_ABI_FILE,
        sampleNft.interface.format(ethers.utils.FormatTypes.json)
    );
}

async function updateContractAddress() {
    const nftmarketplace = await ethers.getContract("NFTMarketplace");
    const chainId = network.config.chainId.toString();
    const contractAddress = JSON.parse(fs.readFileSync(FRONT_END_ADDRS_FILE));
    if (chainId in contractAddress) {
        if (!contractAddress[chainId]["NFTMarketplace"].includes(nftmarketplace.address)) {
            contractAddress[chainId]["NFTMarketplace"].push(nftmarketplace.address);
        }
    } else {
        contractAddress[chainId] = { NFTMarketplace: [nftmarketplace.address] };
    }
    fs.writeFileSync(FRONT_END_ADDRS_FILE, JSON.stringify(contractAddress));
}

module.exports.tags = ["all", "frontend"];
