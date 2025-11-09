// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BettingCard is ReentrancyGuard, Ownable {
    // Custom Errors
    error InvalidTimestamp();
    error InvalidPrice();
    error InvalidNetuid();
    error CardNotFound();
    error CardAlreadyResolved();
    error CardNotResolved();
    error BettingPeriodEnded();
    error NoSharesToPurchase();
    error NoSharesToRedeem();
    error ResolutionTimeNotReached();
    error TransferFailed();
    error IncorrectPaymentAmount();
    struct Card {
        uint256 id;
        uint256 netuid;
        uint256 bettedAlphaPrice; // Price in wei (1e18 = 1 TAO)
        uint256 timestamp;
        address creator;
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 totalLiquidity;
        bool resolved;
        bool outcome; // true if alpha price >= betted price at timestamp
        uint256 creationTime;
    }

    struct Share {
        uint256 yesShares;
        uint256 noShares;
    }

    uint256 public nextCardId = 1;
    uint256 public platformFee = 250; // 2.5% (250/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(uint256 => Card) public cards;
    mapping(address => mapping(uint256 => Share)) public userShares;
    mapping(uint256 => bool) public cardExists;

    event CardCreated(
        uint256 indexed cardId,
        uint256 indexed netuid,
        uint256 bettedAlphaPrice,
        uint256 timestamp,
        address creator
    );

    event SharesPurchased(
        uint256 indexed cardId,
        address indexed user,
        uint256 yesShares,
        uint256 noShares,
        uint256 totalCost
    );

    event CardResolved(
        uint256 indexed cardId,
        bool outcome,
        uint256 actualAlphaPrice
    );

    event SharesRedeemed(
        uint256 indexed cardId,
        address indexed user,
        uint256 yesShares,
        uint256 noShares,
        uint256 totalPayout
    );

    constructor() {
        // Native TAO - no token address needed
    }

    function createCard(
        uint256 _netuid,
        uint256 _bettedAlphaPrice,
        uint256 _timestamp
    ) external returns (uint256) {
        if (_timestamp <= block.timestamp) revert InvalidTimestamp();
        if (_bettedAlphaPrice == 0) revert InvalidPrice();
        if (_netuid == 0) revert InvalidNetuid();

        uint256 cardId = nextCardId++;
        
        cards[cardId] = Card({
            id: cardId,
            netuid: _netuid,
            bettedAlphaPrice: _bettedAlphaPrice,
            timestamp: _timestamp,
            creator: msg.sender,
            totalYesShares: 0,
            totalNoShares: 0,
            totalLiquidity: 0,
            resolved: false,
            outcome: false,
            creationTime: block.timestamp
        });

        cardExists[cardId] = true;

        emit CardCreated(cardId, _netuid, _bettedAlphaPrice, _timestamp, msg.sender);
        
        return cardId;
    }

    function purchaseShares(
        uint256 _cardId,
        uint256 _yesShares,
        uint256 _noShares
    ) external payable nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        if (cards[_cardId].resolved) revert CardAlreadyResolved();
        if (_yesShares == 0 && _noShares == 0) revert NoSharesToPurchase();
        if (block.timestamp >= cards[_cardId].timestamp) revert BettingPeriodEnded();

        uint256 totalCost = _yesShares + _noShares;
        if (msg.value != totalCost) revert IncorrectPaymentAmount();

        // Update user shares
        userShares[msg.sender][_cardId].yesShares += _yesShares;
        userShares[msg.sender][_cardId].noShares += _noShares;

        // Update card totals
        cards[_cardId].totalYesShares += _yesShares;
        cards[_cardId].totalNoShares += _noShares;
        cards[_cardId].totalLiquidity += totalCost;

        emit SharesPurchased(_cardId, msg.sender, _yesShares, _noShares, totalCost);
    }

    function resolveCard(uint256 _cardId, uint256 _actualAlphaPrice) external onlyOwner {
        if (!cardExists[_cardId]) revert CardNotFound();
        if (cards[_cardId].resolved) revert CardAlreadyResolved();
        if (block.timestamp < cards[_cardId].timestamp) revert ResolutionTimeNotReached();

        Card storage card = cards[_cardId];
        card.resolved = true;
        card.outcome = _actualAlphaPrice >= card.bettedAlphaPrice;

        emit CardResolved(_cardId, card.outcome, _actualAlphaPrice);
    }

    function redeemShares(uint256 _cardId) external nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        if (!cards[_cardId].resolved) revert CardNotResolved();

        Share storage userShare = userShares[msg.sender][_cardId];
        if (userShare.yesShares == 0 && userShare.noShares == 0) revert NoSharesToRedeem();

        Card storage card = cards[_cardId];
        uint256 totalPayout = 0;

        if (card.outcome) {
            // Yes shares win
            if (userShare.yesShares > 0) {
                totalPayout = (userShare.yesShares * card.totalLiquidity) / card.totalYesShares;
            }
        } else {
            // No shares win
            if (userShare.noShares > 0) {
                totalPayout = (userShare.noShares * card.totalLiquidity) / card.totalNoShares;
            }
        }

        // Store values for event before clearing
        uint256 yesShares = userShare.yesShares;
        uint256 noShares = userShare.noShares;

        // Clear user shares
        userShares[msg.sender][_cardId] = Share(0, 0);

        // Send native TAO to user
        if (totalPayout > 0) {
            (bool success, ) = payable(msg.sender).call{value: totalPayout}("");
            if (!success) revert TransferFailed();
        }

        emit SharesRedeemed(_cardId, msg.sender, yesShares, noShares, totalPayout);
    }

    function getCard(uint256 _cardId) external view returns (Card memory) {
        if (!cardExists[_cardId]) revert CardNotFound();
        return cards[_cardId];
    }

    function getUserShares(address _user, uint256 _cardId) external view returns (Share memory) {
        return userShares[_user][_cardId];
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFee = _fee;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            if (!success) revert TransferFailed();
        }
    }

    function getCardCount() external view returns (uint256) {
        return nextCardId - 1;
    }

    // Allow contract to receive native TAO
    receive() external payable {}
}


