const { expect, assert } = require("chai");
const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { networkConfig, developmentChains } = require("../hardhat-helper-config");
const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectEvent, // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    balance,
} = require("@openzeppelin/test-helpers");

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

          describe("buyItem", function () {
              it("should require listed item", async function () {
                  await expect(
                      nftmarketplace.buyItem(sampleNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NFTMarketplace__NotListed");
              });

              it("should revert without price", async function () {
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);

                  await expect(
                      nftmarketplace.buyItem(sampleNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NFTMarketplace__PriceNotMatched");
              });

              it("should emit item bought event", async function () {
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);

                  await expect(
                      nftmarketplace.buyItem(sampleNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit(nftmarketplace, "ItemBought");
              });

              it("should buy an item", async function () {
                  // list item as deployer
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);

                  // switch to user and attempt to buy
                  nftmarketplace = nftmarketplaceContract.connect(user);
                  await nftmarketplace.buyItem(sampleNft.address, TOKEN_ID, { value: PRICE });

                  const newOwner = await sampleNft.ownerOf(TOKEN_ID);
                  assert(newOwner == user.address);

                  const proceeds = await nftmarketplace.getProceeds(deployer.address);
                  assert(proceeds.toString() == PRICE.toString());

                  const listing = await nftmarketplace.getListing(sampleNft.address, TOKEN_ID);
                  assert(listing.seller == constants.ZERO_ADDRESS);
              });
          });

          describe("cancelListing", function () {
              it("revert if not owner", async function () {
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);

                  nftmarketplace = nftmarketplaceContract.connect(user);
                  await expect(
                      nftmarketplace.cancelListing(sampleNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NotOwner");
              });

              it("revert if not listed", async function () {
                  await expect(
                      nftmarketplace.cancelListing(sampleNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NotListed");
              });

              it("should emit cancel event", async function () {
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);
                  await expect(nftmarketplace.cancelListing(sampleNft.address, TOKEN_ID)).to.emit(
                      nftmarketplace,
                      "ListingCancelled"
                  );
              });

              it("should cancel listing", async function () {
                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);
                  await nftmarketplace.cancelListing(sampleNft.address, TOKEN_ID);

                  const listing = await nftmarketplace.getListing(sampleNft.address, TOKEN_ID);
                  assert(listing.seller == constants.ZERO_ADDRESS);
              });
          });

          describe("updateListing", function () {
              it("revert if not listed", async function () {
                  await expect(
                      nftmarketplace.updateListing(sampleNft.address, TOKEN_ID, PRICE + 1)
                  ).to.be.revertedWith("NotListed");
              });

              it("revert if not owner", async function () {
                  nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);
                  nftmarketplace = nftmarketplaceContract.connect(user);
                  await expect(
                      nftmarketplace.updateListing(sampleNft.address, TOKEN_ID, PRICE + 1)
                  ).to.be.revertedWith("NotOwner");
              });

              it("show emit listing updated event", async function () {
                  nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftmarketplace.updateListing(sampleNft.address, TOKEN_ID, PRICE + 1)
                  ).to.emit(nftmarketplace, "ItemListed");
              });

              it("show update listing price", async function () {
                  const newPrice = PRICE + 1;
                  nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);
                  await nftmarketplace.updateListing(sampleNft.address, TOKEN_ID, newPrice);

                  const listing = await nftmarketplace.getListing(sampleNft.address, TOKEN_ID);
                  assert(listing.price.toString() == newPrice.toString());
              });
          });

          describe("withdrawProceeds", function () {
              it("revert if no proceeds", async function () {
                  await expect(nftmarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NFTMarketplace__NoProceeds"
                  );
              });

              it("should successfully withdraw proceed", async function () {
                  const balanceBefore = await deployer.getBalance();

                  await nftmarketplace.listItem(sampleNft.address, TOKEN_ID, PRICE);
                  nftmarketplace = nftmarketplaceContract.connect(user);
                  await nftmarketplace.buyItem(sampleNft.address, TOKEN_ID, { value: PRICE });
                  nftmarketplace = nftmarketplaceContract.connect(deployer);

                  await nftmarketplace.withdrawProceeds();

                  const balanceAfter = await deployer.getBalance();
                  expect(Number(balanceAfter)).to.be.greaterThan(Number(balanceBefore));
              });
          });
      });
