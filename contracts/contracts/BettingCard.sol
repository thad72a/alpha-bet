// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BettingCard is ReentrancyGuard, Ownable {
    // Types
    enum CardType {
        Binary,     // YES/NO
        Multi       // Multiple options (users can stake on any subset of options)
    }

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
    error InvalidOption();
    error InvalidOptionsArray();
    error InvalidCardType();
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
        CardType cardType;
        string[] optionNames; // Only used for Multi
        uint256 winningOption; // Only used for Multi; undefined until resolved
    }

    struct Share {
        uint256 yesShares;
        uint256 noShares;
    }

    uint256 public nextCardId = 1;
    uint256 public platformFee = 250; // 2.5% (250/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public accumulatedFees = 0; // Track accumulated platform fees

    mapping(uint256 => Card) public cards;
    mapping(address => mapping(uint256 => Share)) public userShares;
    mapping(uint256 => bool) public cardExists;
    // Multi-option totals per option: cardId -> optionIndex -> total gross stake
    mapping(uint256 => mapping(uint256 => uint256)) public optionTotalStakes;
    // User stakes per option: user -> cardId -> optionIndex -> gross stake
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userOptionStakes;

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

    // Multi-selection specific events
    event CardCreatedMulti(
        uint256 indexed cardId,
        uint256 indexed netuid,
        string[] optionNames,
        uint256 timestamp,
        address creator
    );

    event OptionBetPlaced(
        uint256 indexed cardId,
        address indexed user,
        uint256 indexed optionIndex,
        uint256 amount,       // gross amount sent
        uint256 feeAmount,    // fee deducted
        uint256 netAmount     // added to liquidity
    );

    event CardResolvedMulti(
        uint256 indexed cardId,
        uint256 indexed winningOption
    );

    event OptionWinningsRedeemed(
        uint256 indexed cardId,
        address indexed user,
        uint256 indexed winningOption,
        uint256 userGrossStakeOnWinner,
        uint256 payout
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
            creationTime: block.timestamp,
            cardType: CardType.Binary,
            optionNames: new string[](0),
            winningOption: 0
        });

        cardExists[cardId] = true;

        emit CardCreated(cardId, _netuid, _bettedAlphaPrice, _timestamp, msg.sender);
        
        return cardId;
    }

    // Create a multi-selection market. Options length must be >= 2
    function createCardMulti(
        uint256 _netuid,
        string[] calldata _optionNames,
        uint256 _timestamp
    ) external returns (uint256) {
        if (_timestamp <= block.timestamp) revert InvalidTimestamp();
        if (_netuid == 0) revert InvalidNetuid();
        if (_optionNames.length < 2) revert InvalidOptionsArray();

        uint256 cardId = nextCardId++;

        cards[cardId].id = cardId;
        cards[cardId].netuid = _netuid;
        cards[cardId].bettedAlphaPrice = 0; // not used for Multi
        cards[cardId].timestamp = _timestamp;
        cards[cardId].creator = msg.sender;
        cards[cardId].totalYesShares = 0; // not used for Multi
        cards[cardId].totalNoShares = 0;  // not used for Multi
        cards[cardId].totalLiquidity = 0;
        cards[cardId].resolved = false;
        cards[cardId].outcome = false; // not used for Multi
        cards[cardId].creationTime = block.timestamp;
        cards[cardId].cardType = CardType.Multi;
        // copy options into storage array
        for (uint256 i = 0; i < _optionNames.length; i++) {
            cards[cardId].optionNames.push(_optionNames[i]);
        }
        cards[cardId].winningOption = 0;

        cardExists[cardId] = true;

        emit CardCreatedMulti(cardId, _netuid, _optionNames, _timestamp, msg.sender);
        return cardId;
    }

    function purchaseShares(
        uint256 _cardId,
        uint256 _yesShares,
        uint256 _noShares
    ) external payable nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        if (cards[_cardId].resolved) revert CardAlreadyResolved();
        if (cards[_cardId].cardType != CardType.Binary) revert InvalidCardType();
        if (_yesShares == 0 && _noShares == 0) revert NoSharesToPurchase();
        if (block.timestamp >= cards[_cardId].timestamp) revert BettingPeriodEnded();

        uint256 totalCost = _yesShares + _noShares;
        uint256 feeAmount = (totalCost * platformFee) / FEE_DENOMINATOR;
        uint256 netAmount = totalCost - feeAmount;
        
        if (msg.value != totalCost) revert IncorrectPaymentAmount();

        // Update user shares
        userShares[msg.sender][_cardId].yesShares += _yesShares;
        userShares[msg.sender][_cardId].noShares += _noShares;

        // Update card totals (only net amount goes to liquidity)
        cards[_cardId].totalYesShares += _yesShares;
        cards[_cardId].totalNoShares += _noShares;
        cards[_cardId].totalLiquidity += netAmount;

        // Accumulate platform fees
        accumulatedFees += feeAmount;

        emit SharesPurchased(_cardId, msg.sender, _yesShares, _noShares, totalCost);
    }

    function resolveCard(uint256 _cardId, uint256 _actualAlphaPrice) external onlyOwner {
        if (!cardExists[_cardId]) revert CardNotFound();
        if (cards[_cardId].resolved) revert CardAlreadyResolved();
        if (block.timestamp < cards[_cardId].timestamp) revert ResolutionTimeNotReached();
        if (cards[_cardId].cardType != CardType.Binary) revert InvalidCardType();

        Card storage card = cards[_cardId];
        card.resolved = true;
        card.outcome = _actualAlphaPrice >= card.bettedAlphaPrice;

        emit CardResolved(_cardId, card.outcome, _actualAlphaPrice);
    }

    function redeemShares(uint256 _cardId) external nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        if (!cards[_cardId].resolved) revert CardNotResolved();
        if (cards[_cardId].cardType != CardType.Binary) revert InvalidCardType();

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

        // Send native TAO to user (fees were already deducted on purchase)
        if (totalPayout > 0) {
            (bool success, ) = payable(msg.sender).call{value: totalPayout}("");
            if (!success) revert TransferFailed();
        }

        emit SharesRedeemed(_cardId, msg.sender, yesShares, noShares, totalPayout);
    }

    // ----- Multi-selection functions -----

    function placeBetOnOption(
        uint256 _cardId,
        uint256 _optionIndex
    ) external payable nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        if (card.cardType != CardType.Multi) revert InvalidCardType();
        if (card.resolved) revert CardAlreadyResolved();
        if (block.timestamp >= card.timestamp) revert BettingPeriodEnded();
        if (_optionIndex >= card.optionNames.length) revert InvalidOption();
        if (msg.value == 0) revert IncorrectPaymentAmount();

        uint256 amount = msg.value;
        uint256 feeAmount = (amount * platformFee) / FEE_DENOMINATOR;
        uint256 netAmount = amount - feeAmount;

        // Update user and option totals with gross amount (pre-fee)
        userOptionStakes[msg.sender][_cardId][_optionIndex] += amount;
        optionTotalStakes[_cardId][_optionIndex] += amount;

        // Liquidity increases by net (post-fee) amount
        card.totalLiquidity += netAmount;
        accumulatedFees += feeAmount;

        emit OptionBetPlaced(_cardId, msg.sender, _optionIndex, amount, feeAmount, netAmount);
    }

    function resolveCardMulti(uint256 _cardId, uint256 _winningOption) external onlyOwner {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        if (card.cardType != CardType.Multi) revert InvalidCardType();
        if (card.resolved) revert CardAlreadyResolved();
        if (block.timestamp < card.timestamp) revert ResolutionTimeNotReached();
        if (_winningOption >= card.optionNames.length) revert InvalidOption();

        card.resolved = true;
        card.winningOption = _winningOption;

        emit CardResolvedMulti(_cardId, _winningOption);
    }

    function redeemOptionWinnings(uint256 _cardId) external nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        if (card.cardType != CardType.Multi) revert InvalidCardType();
        if (!card.resolved) revert CardNotResolved();

        uint256 winningOptionIndex = card.winningOption;
        uint256 userGrossStakeOnWinner = userOptionStakes[msg.sender][_cardId][winningOptionIndex];
        if (userGrossStakeOnWinner == 0) revert NoSharesToRedeem();

        uint256 totalGrossStakeOnWinner = optionTotalStakes[_cardId][winningOptionIndex];
        uint256 payout = (userGrossStakeOnWinner * card.totalLiquidity) / totalGrossStakeOnWinner;

        // Clear user's stake on winning option to prevent double-claim
        userOptionStakes[msg.sender][_cardId][winningOptionIndex] = 0;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit OptionWinningsRedeemed(_cardId, msg.sender, winningOptionIndex, userGrossStakeOnWinner, payout);
    }

    // ----- View helpers -----
    function getCard(uint256 _cardId) external view returns (Card memory) {
        if (!cardExists[_cardId]) revert CardNotFound();
        return cards[_cardId];
    }

    function getUserShares(address _user, uint256 _cardId) external view returns (Share memory) {
        return userShares[_user][_cardId];
    }

    function getOptionNames(uint256 _cardId) external view returns (string[] memory) {
        if (!cardExists[_cardId]) revert CardNotFound();
        return cards[_cardId].optionNames;
    }

    function getUserOptionStake(address _user, uint256 _cardId, uint256 _optionIndex) external view returns (uint256) {
        return userOptionStakes[_user][_cardId][_optionIndex];
    }

    function getOptionTotalStake(uint256 _cardId, uint256 _optionIndex) external view returns (uint256) {
        return optionTotalStakes[_cardId][_optionIndex];
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFee = _fee;
    }

    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        if (fees > 0) {
            accumulatedFees = 0;
            (bool success, ) = payable(owner()).call{value: fees}("");
            if (!success) revert TransferFailed();
        }
    }

    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    function getCardCount() external view returns (uint256) {
        return nextCardId - 1;
    }

    // Allow contract to receive native TAO
    receive() external payable {}
}


