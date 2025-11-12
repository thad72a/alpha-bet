const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BettingCard", function () {
  let bettingCard;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy BettingCard (uses native TAO)
    const BettingCard = await ethers.getContractFactory("BettingCard");
    bettingCard = await BettingCard.deploy();
    await bettingCard.waitForDeployment();
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
      ).to.be.revertedWithCustomError(bettingCard, "InvalidTimestamp");
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
    });

    it("Should allow users to purchase shares with native TAO", async function () {
      const yesShares = ethers.parseEther("10");
      const noShares = ethers.parseEther("5");
      const totalCost = yesShares + noShares;

      await expect(
        bettingCard.connect(user2).purchaseShares(cardId, yesShares, noShares, { value: totalCost })
      ).to.emit(bettingCard, "SharesPurchased")
        .withArgs(cardId, user2.address, yesShares, noShares, totalCost);

      const userShares = await bettingCard.getUserShares(user2.address, cardId);
      expect(userShares.yesShares).to.equal(yesShares);
      expect(userShares.noShares).to.equal(noShares);
    });

    it("Should update card totals correctly with platform fee", async function () {
      const yesShares = ethers.parseEther("10");
      const noShares = ethers.parseEther("5");
      const totalCost = yesShares + noShares;

      await bettingCard.connect(user2).purchaseShares(cardId, yesShares, noShares, { value: totalCost });

      const card = await bettingCard.getCard(cardId);
      expect(card.totalYesShares).to.equal(yesShares);
      expect(card.totalNoShares).to.equal(noShares);
      
      // Total liquidity should be totalCost minus platform fee (2.5%)
      const platformFee = await bettingCard.platformFee();
      const FEE_DENOMINATOR = await bettingCard.FEE_DENOMINATOR();
      const expectedFee = (totalCost * platformFee) / FEE_DENOMINATOR;
      const expectedLiquidity = totalCost - expectedFee;
      expect(card.totalLiquidity).to.equal(expectedLiquidity);
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

      // Fast forward time to after the resolution timestamp
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        bettingCard.connect(user1).resolveCard(cardId, actualPrice)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});


