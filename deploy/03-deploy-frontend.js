const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONT_END_ADDRS_FILE = "../nft-marketplace-ui/constants/contract.json";

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end");
        await updateContractAddress();
    }
};

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
