const { expect, assert } = require("chai");
const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { networkConfig, developmentChains } = require("../hardhat-helper-config");

!developmentChains.includes(network.name)
    ? describe.skip()
    : describe("NFTMarketplace Unit Tests", function () {
          let nftmarketplaceContract, nftmarketplace, sampleNftContract, sampleNft;
          const PRICE = ethers.utils.parseEther("0.1");
          const TOKEN_ID = 0;

          beforeEach(async function () {
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              user = accounts[1];
              await deployments.fixture("all");

              nftmarketplaceContract = await ethers.getContract("NFTMarketplace");
              nftmarketplace = nftmarketplaceContract.connect(deployer);

              sampleNftContract = await ethers.getContract("SampleNft");
              sampleNft = sampleNftContract.connect(deployer);
              await sampleNft.mintNft();
              await sampleNft.approve(nftmarketplaceContract.address, TOKEN_ID);
          });

          describe("listItem", function () {
              it("a price must be specified for listing an item", async function () {
                  await expect(
                      nftmarketplace.listItem(sampleNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NFTMarketplace__PriceMustBeSpecified");
              });

              it("emits the item listed event", async function () {
                  await expect(nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftmarketplace,
                      "ItemListed"
                  );
              });

              it("should not allow previously listed item", async function () {
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);

                  const error = `NFTMarketplace__AlreadyListed("${sampleNft.address}", ${TOKEN_ID})`;
                  await expect(
                      nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error);
              });

              it("should only allow owner of nft to list", async function () {
                  nftmarketplace = nftmarketplaceContract.connect(user);
                  await sampleNft.approve(user.address, TOKEN_ID);
                  await expect(
                      nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotOwner");
              });

              it("should list an item", async function () {
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);
                  const listing = await nftmarketplace.getListing(sampleNft.address, TOKEN_ID);

                  assert(listing.seller == deployer.address);
                  assert(listing.price.toString() == PRICE.toString());
              });
          });
      });
