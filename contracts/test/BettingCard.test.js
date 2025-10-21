const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BettingCard", function () {
  let bettingCard;
  let mockTAO;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockTAO
    const MockTAO = await ethers.getContractFactory("MockTAO");
    mockTAO = await MockTAO.deploy();
    await mockTAO.waitForDeployment();

    // Deploy BettingCard
    const BettingCard = await ethers.getContractFactory("BettingCard");
    bettingCard = await BettingCard.deploy(await mockTAO.getAddress());
    await bettingCard.waitForDeployment();

    // Give users some TAO tokens
    await mockTAO.connect(user1).faucet();
    await mockTAO.connect(user2).faucet();
  });

  describe("Card Creation", function () {
    it("Should create a new betting card", async function () {
      const netuid = 1;
      const bettedPrice = ethers.parseEther("0.025");
      const currentBlock = await ethers.provider.getBlock("latest");
      const timestamp = currentBlock.timestamp + 86400; // 24 hours from now

      await expect(bettingCard.connect(user1).createCard(netuid, bettedPrice, timestamp))
        .to.emit(bettingCard, "CardCreated")
        .withArgs(1, netuid, bettedPrice, timestamp, user1.address);

      const card = await bettingCard.getCard(1);
      expect(card.netuid).to.equal(netuid);
      expect(card.bettedAlphaPrice).to.equal(bettedPrice);
      expect(card.creator).to.equal(user1.address);
    });

    it("Should reject card creation with past timestamp", async function () {
      const netuid = 1;
      const bettedPrice = ethers.parseEther("0.025");
      const currentBlock = await ethers.provider.getBlock("latest");
      const timestamp = currentBlock.timestamp - 3600; // 1 hour ago

      await expect(
        bettingCard.connect(user1).createCard(netuid, bettedPrice, timestamp)
      ).to.be.revertedWith("Timestamp must be in the future");
    });
  });

  describe("Share Purchasing", function () {
    let cardId;

    beforeEach(async function () {
      const netuid = 1;
      const bettedPrice = ethers.parseEther("0.025");
      const currentBlock = await ethers.provider.getBlock("latest");
      const timestamp = currentBlock.timestamp + 86400;

      await bettingCard.connect(user1).createCard(netuid, bettedPrice, timestamp);
      cardId = 1;

      // Approve spending
      await mockTAO.connect(user2).approve(await bettingCard.getAddress(), ethers.parseEther("100"));
    });

    it("Should allow users to purchase shares", async function () {
      const yesShares = ethers.parseEther("10");
      const noShares = ethers.parseEther("5");

      await expect(
        bettingCard.connect(user2).purchaseShares(cardId, yesShares, noShares)
      ).to.emit(bettingCard, "SharesPurchased")
        .withArgs(cardId, user2.address, yesShares, noShares, yesShares + noShares);

      const userShares = await bettingCard.getUserShares(user2.address, cardId);
      expect(userShares.yesShares).to.equal(yesShares);
      expect(userShares.noShares).to.equal(noShares);
    });

    it("Should update card totals correctly", async function () {
      const yesShares = ethers.parseEther("10");
      const noShares = ethers.parseEther("5");

      await bettingCard.connect(user2).purchaseShares(cardId, yesShares, noShares);

      const card = await bettingCard.getCard(cardId);
      expect(card.totalYesShares).to.equal(yesShares);
      expect(card.totalNoShares).to.equal(noShares);
      expect(card.totalLiquidity).to.equal(yesShares + noShares);
    });
  });

  describe("Card Resolution", function () {
    let cardId;

    beforeEach(async function () {
      const netuid = 1;
      const bettedPrice = ethers.parseEther("0.025");
      const currentBlock = await ethers.provider.getBlock("latest");
      const timestamp = currentBlock.timestamp + 86400;

      await bettingCard.connect(user1).createCard(netuid, bettedPrice, timestamp);
      cardId = 1;
    });

    it("Should resolve card with correct outcome", async function () {
      const actualPrice = ethers.parseEther("0.030"); // Higher than betted price
      
      // Fast forward time to after the resolution timestamp
      await ethers.provider.send("evm_increaseTime", [86400 + 1]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");
      
      await expect(bettingCard.resolveCard(cardId, actualPrice))
        .to.emit(bettingCard, "CardResolved")
        .withArgs(cardId, true, actualPrice);

      const card = await bettingCard.getCard(cardId);
      expect(card.resolved).to.be.true;
      expect(card.outcome).to.be.true;
    });

    it("Should only allow owner to resolve cards", async function () {
      const actualPrice = ethers.parseEther("0.030");

      await expect(
        bettingCard.connect(user1).resolveCard(cardId, actualPrice)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});


