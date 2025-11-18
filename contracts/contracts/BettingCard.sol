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
    error ResolutionAlreadyProposed();
    error InsufficientBond();
    error DisputePeriodActive();
    error DisputePeriodEnded();
    error AlreadyDisputed();
    error NotParticipant();
    error AlreadyVoted();
    error VotingNotActive();
    error NoProposalExists();
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

    struct ResolutionProposal {
        address proposer;
        uint256 proposedPrice;      // For Binary cards (actual alpha price)
        uint256 proposedOption;     // For Multi cards (winning option index)
        uint256 bondAmount;
        uint256 proposalTime;
        bool disputed;
        address challenger;
        uint256 challengerBond;
        uint256 yesVotes;          // Weighted by stakes (support proposal)
        uint256 noVotes;           // Weighted by stakes (reject proposal)
        bool votingActive;
    }

    uint256 public nextCardId = 1;
    uint256 public platformFee = 250; // 2.5% (250/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public accumulatedFees = 0; // Track accumulated platform fees

    // Resolution system parameters
    uint256 public resolutionBond = 10 ether;      // 10 TAO required to propose resolution
    uint256 public disputePeriod = 48 hours;       // Time window to dispute a proposal
    uint256 public votingPeriod = 24 hours;        // Voting duration if disputed

    mapping(uint256 => Card) public cards;
    mapping(address => mapping(uint256 => Share)) public userShares;
    mapping(uint256 => bool) public cardExists;
    // Multi-option totals per option: cardId -> optionIndex -> total gross stake
    mapping(uint256 => mapping(uint256 => uint256)) public optionTotalStakes;
    // User stakes per option: user -> cardId -> optionIndex -> gross stake
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userOptionStakes;
    
    // Resolution proposal system
    mapping(uint256 => ResolutionProposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

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

    // Resolution system events
    event ResolutionProposed(
        uint256 indexed cardId,
        address indexed proposer,
        uint256 proposedPrice,
        uint256 proposedOption,
        uint256 bondAmount
    );

    event ResolutionDisputed(
        uint256 indexed cardId,
        address indexed challenger,
        uint256 bondAmount
    );

    event VoteCast(
        uint256 indexed cardId,
        address indexed voter,
        bool supportsProposal,
        uint256 voteWeight
    );

    event ResolutionFinalized(
        uint256 indexed cardId,
        bool proposalAccepted,
        address bondWinner,
        uint256 bondPayout
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

    // ===== DECENTRALIZED RESOLUTION SYSTEM =====
    
    /**
     * @notice Step 1: Anyone can propose a resolution after the card deadline
     * @param _cardId The card ID to resolve
     * @param _actualAlphaPrice The actual alpha price at the timestamp (for Binary cards)
     */
    function proposeResolution(uint256 _cardId, uint256 _actualAlphaPrice) external payable nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        if (card.cardType != CardType.Binary) revert InvalidCardType();
        if (card.resolved) revert CardAlreadyResolved();
        if (block.timestamp < card.timestamp) revert ResolutionTimeNotReached();
        if (proposals[_cardId].proposer != address(0)) revert ResolutionAlreadyProposed();
        if (msg.value < resolutionBond) revert InsufficientBond();

        proposals[_cardId] = ResolutionProposal({
            proposer: msg.sender,
            proposedPrice: _actualAlphaPrice,
            proposedOption: 0, // Not used for Binary
            bondAmount: msg.value,
            proposalTime: block.timestamp,
            disputed: false,
            challenger: address(0),
            challengerBond: 0,
            yesVotes: 0,
            noVotes: 0,
            votingActive: false
        });

        emit ResolutionProposed(_cardId, msg.sender, _actualAlphaPrice, 0, msg.value);
    }

    /**
     * @notice Step 1 (Multi): Anyone can propose a resolution for multi-option cards
     * @param _cardId The card ID to resolve
     * @param _winningOption The winning option index
     */
    function proposeResolutionMulti(uint256 _cardId, uint256 _winningOption) external payable nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        if (card.cardType != CardType.Multi) revert InvalidCardType();
        if (card.resolved) revert CardAlreadyResolved();
        if (block.timestamp < card.timestamp) revert ResolutionTimeNotReached();
        if (proposals[_cardId].proposer != address(0)) revert ResolutionAlreadyProposed();
        if (_winningOption >= card.optionNames.length) revert InvalidOption();
        if (msg.value < resolutionBond) revert InsufficientBond();

        proposals[_cardId] = ResolutionProposal({
            proposer: msg.sender,
            proposedPrice: 0, // Not used for Multi
            proposedOption: _winningOption,
            bondAmount: msg.value,
            proposalTime: block.timestamp,
            disputed: false,
            challenger: address(0),
            challengerBond: 0,
            yesVotes: 0,
            noVotes: 0,
            votingActive: false
        });

        emit ResolutionProposed(_cardId, msg.sender, 0, _winningOption, msg.value);
    }

    /**
     * @notice Step 2: Anyone can dispute a proposal within the dispute period
     * @param _cardId The card ID with the disputed proposal
     */
    function disputeResolution(uint256 _cardId) external payable nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        ResolutionProposal storage proposal = proposals[_cardId];
        if (proposal.proposer == address(0)) revert NoProposalExists();
        if (proposal.disputed) revert AlreadyDisputed();
        if (block.timestamp >= proposal.proposalTime + disputePeriod) revert DisputePeriodEnded();
        if (msg.value < proposal.bondAmount) revert InsufficientBond();

        proposal.disputed = true;
        proposal.challenger = msg.sender;
        proposal.challengerBond = msg.value;
        proposal.votingActive = true;

        emit ResolutionDisputed(_cardId, msg.sender, msg.value);
    }

    /**
     * @notice Step 3: Card participants vote on disputed resolution (weighted by stakes)
     * @param _cardId The card ID to vote on
     * @param _supportsProposal True to support the proposal, false to reject it
     */
    function voteOnResolution(uint256 _cardId, bool _supportsProposal) external nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        ResolutionProposal storage proposal = proposals[_cardId];
        
        if (!proposal.votingActive) revert VotingNotActive();
        if (hasVoted[_cardId][msg.sender]) revert AlreadyVoted();
        
        // Calculate voter's weight based on their stake
        uint256 voteWeight = 0;
        
        if (card.cardType == CardType.Binary) {
            Share storage userShare = userShares[msg.sender][_cardId];
            voteWeight = userShare.yesShares + userShare.noShares;
        } else {
            // For multi-option cards, sum all stakes
            for (uint256 i = 0; i < card.optionNames.length; i++) {
                voteWeight += userOptionStakes[msg.sender][_cardId][i];
            }
        }
        
        if (voteWeight == 0) revert NotParticipant();
        
        hasVoted[_cardId][msg.sender] = true;
        
        if (_supportsProposal) {
            proposal.yesVotes += voteWeight;
        } else {
            proposal.noVotes += voteWeight;
        }

        emit VoteCast(_cardId, msg.sender, _supportsProposal, voteWeight);
    }

    /**
     * @notice Step 4: Finalize resolution after dispute period or voting period
     * @param _cardId The card ID to finalize
     */
    function finalizeResolution(uint256 _cardId) external nonReentrant {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        ResolutionProposal storage proposal = proposals[_cardId];
        
        if (card.resolved) revert CardAlreadyResolved();
        if (proposal.proposer == address(0)) revert NoProposalExists();
        
        bool proposalAccepted = false;
        address bondWinner;
        uint256 bondPayout;
        
        if (!proposal.disputed) {
            // No dispute: proposal accepted if dispute period has passed
            if (block.timestamp < proposal.proposalTime + disputePeriod) revert DisputePeriodActive();
            
            proposalAccepted = true;
            bondWinner = proposal.proposer;
            bondPayout = proposal.bondAmount;
            
        } else {
            // Disputed: check voting results after voting period
            if (block.timestamp < proposal.proposalTime + disputePeriod + votingPeriod) {
                revert VotingNotActive(); // Still in voting period
            }
            
            // Majority wins
            if (proposal.yesVotes > proposal.noVotes) {
                proposalAccepted = true;
                bondWinner = proposal.proposer;
                bondPayout = proposal.bondAmount + proposal.challengerBond;
            } else {
                proposalAccepted = false;
                bondWinner = proposal.challenger;
                bondPayout = proposal.bondAmount + proposal.challengerBond;
            }
        }
        
        // Resolve the card
        card.resolved = true;
        
        if (card.cardType == CardType.Binary) {
            card.outcome = proposal.proposedPrice >= card.bettedAlphaPrice;
            emit CardResolved(_cardId, card.outcome, proposal.proposedPrice);
        } else {
            if (proposalAccepted) {
                card.winningOption = proposal.proposedOption;
            } else {
                // If proposal rejected, card needs new proposal
                // Clear the proposal to allow re-proposal
                delete proposals[_cardId];
                card.resolved = false;
                
                // Return bonds to both parties
                (bool success1, ) = payable(proposal.proposer).call{value: proposal.bondAmount}("");
                (bool success2, ) = payable(proposal.challenger).call{value: proposal.challengerBond}("");
                if (!success1 || !success2) revert TransferFailed();
                
                emit ResolutionFinalized(_cardId, false, address(0), 0);
                return;
            }
            emit CardResolvedMulti(_cardId, card.winningOption);
        }
        
        // Pay out bond to winner
        (bool success, ) = payable(bondWinner).call{value: bondPayout}("");
        if (!success) revert TransferFailed();
        
        emit ResolutionFinalized(_cardId, proposalAccepted, bondWinner, bondPayout);
    }

    // ===== LEGACY OWNER RESOLUTION (DEPRECATED) =====
    // Kept for backward compatibility, but should not be used
    
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

    // ===== RESOLUTION SYSTEM VIEW FUNCTIONS =====
    
    function getProposal(uint256 _cardId) external view returns (ResolutionProposal memory) {
        return proposals[_cardId];
    }
    
    function hasUserVoted(uint256 _cardId, address _user) external view returns (bool) {
        return hasVoted[_cardId][_user];
    }
    
    function getVotingPower(uint256 _cardId, address _user) external view returns (uint256) {
        if (!cardExists[_cardId]) revert CardNotFound();
        Card storage card = cards[_cardId];
        
        uint256 votingPower = 0;
        
        if (card.cardType == CardType.Binary) {
            Share storage userShare = userShares[_user][_cardId];
            votingPower = userShare.yesShares + userShare.noShares;
        } else {
            for (uint256 i = 0; i < card.optionNames.length; i++) {
                votingPower += userOptionStakes[_user][_cardId][i];
            }
        }
        
        return votingPower;
    }
    
    function setResolutionBond(uint256 _newBond) external onlyOwner {
        resolutionBond = _newBond;
    }
    
    function setDisputePeriod(uint256 _newPeriod) external onlyOwner {
        disputePeriod = _newPeriod;
    }
    
    function setVotingPeriod(uint256 _newPeriod) external onlyOwner {
        votingPeriod = _newPeriod;
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


