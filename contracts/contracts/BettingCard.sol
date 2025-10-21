// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BettingCard is ReentrancyGuard, Ownable {
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

    IERC20 public immutable taoToken;
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

    constructor(address _taoToken) {
        taoToken = IERC20(_taoToken);
    }

    function createCard(
        uint256 _netuid,
        uint256 _bettedAlphaPrice,
        uint256 _timestamp
    ) external returns (uint256) {
        require(_timestamp > block.timestamp, "Timestamp must be in the future");
        require(_bettedAlphaPrice > 0, "Price must be greater than 0");
        require(_netuid > 0, "Invalid netuid");

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
    ) external nonReentrant {
        require(cardExists[_cardId], "Card does not exist");
        require(!cards[_cardId].resolved, "Card already resolved");
        require(_yesShares > 0 || _noShares > 0, "Must purchase at least one share");
        require(block.timestamp < cards[_cardId].timestamp, "Betting period has ended");

        uint256 totalCost = _yesShares + _noShares;
        require(taoToken.balanceOf(msg.sender) >= totalCost, "Insufficient TAO balance");
        require(taoToken.allowance(msg.sender, address(this)) >= totalCost, "Insufficient allowance");

        // Transfer TAO from user to contract
        taoToken.transferFrom(msg.sender, address(this), totalCost);

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
        require(cardExists[_cardId], "Card does not exist");
        require(!cards[_cardId].resolved, "Card already resolved");
        require(block.timestamp >= cards[_cardId].timestamp, "Resolution time not reached");

        Card storage card = cards[_cardId];
        card.resolved = true;
        card.outcome = _actualAlphaPrice >= card.bettedAlphaPrice;

        emit CardResolved(_cardId, card.outcome, _actualAlphaPrice);
    }

    function redeemShares(uint256 _cardId) external nonReentrant {
        require(cardExists[_cardId], "Card does not exist");
        require(cards[_cardId].resolved, "Card not resolved");

        Share storage userShare = userShares[msg.sender][_cardId];
        require(userShare.yesShares > 0 || userShare.noShares > 0, "No shares to redeem");

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

        // Clear user shares
        userShares[msg.sender][_cardId] = Share(0, 0);

        if (totalPayout > 0) {
            taoToken.transfer(msg.sender, totalPayout);
        }

        emit SharesRedeemed(_cardId, msg.sender, userShare.yesShares, userShare.noShares, totalPayout);
    }

    function getCard(uint256 _cardId) external view returns (Card memory) {
        require(cardExists[_cardId], "Card does not exist");
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
        uint256 balance = taoToken.balanceOf(address(this));
        if (balance > 0) {
            taoToken.transfer(owner(), balance);
        }
    }

    function getCardCount() external view returns (uint256) {
        return nextCardId - 1;
    }
}


