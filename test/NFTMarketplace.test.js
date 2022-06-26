const { expect, assert } = require("chai");
const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { networkConfig, developmentChains } = require("../hardhat-helper-config");

!developmentChains.includes(network.name)
    ? describe.skip()
    : describe("NFTMarketplace Unit Tests", function () {
          let factory, marketplace;

          beforeEach(async function () {
              factory = await ethers.getContractFactory("NFTMarketplace");
              marketplace = await factory.deploy();
              await marketplace.deployed();
          });

          describe("listItem", function () {
              it("something", async function () {
                  assert(true);
              });
          });
      });
