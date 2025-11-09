// Auto-generated ABIs from freshly compiled contracts
// BettingCard contract updated for native TAO on Bittensor
export const BETTING_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "BettingPeriodEnded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CardAlreadyResolved",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CardNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CardNotResolved",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectPaymentAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidNetuid",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPrice",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidTimestamp",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoSharesToPurchase",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoSharesToRedeem",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ResolutionTimeNotReached",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "netuid",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bettedAlphaPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "CardCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "outcome",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "actualAlphaPrice",
        "type": "uint256"
      }
    ],
    "name": "CardResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "yesShares",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "noShares",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalCost",
        "type": "uint256"
      }
    ],
    "name": "SharesPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "cardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "yesShares",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "noShares",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPayout",
        "type": "uint256"
      }
    ],
    "name": "SharesRedeemed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "FEE_DENOMINATOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "cardExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "cards",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "netuid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bettedAlphaPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "totalYesShares",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalNoShares",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalLiquidity",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "resolved",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "outcome",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "creationTime",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_netuid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_bettedAlphaPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_timestamp",
        "type": "uint256"
      }
    ],
    "name": "createCard",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_cardId",
        "type": "uint256"
      }
    ],
    "name": "getCard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "netuid",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "bettedAlphaPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalYesShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalNoShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalLiquidity",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "resolved",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "outcome",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "creationTime",
            "type": "uint256"
          }
        ],
        "internalType": "struct BettingCard.Card",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCardCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_cardId",
        "type": "uint256"
      }
    ],
    "name": "getUserShares",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "yesShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noShares",
            "type": "uint256"
          }
        ],
        "internalType": "struct BettingCard.Share",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextCardId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_cardId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_yesShares",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_noShares",
        "type": "uint256"
      }
    ],
    "name": "purchaseShares",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_cardId",
        "type": "uint256"
      }
    ],
    "name": "redeemShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_cardId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_actualAlphaPrice",
        "type": "uint256"
      }
    ],
    "name": "resolveCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_fee",
        "type": "uint256"
      }
    ],
    "name": "setPlatformFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userShares",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "yesShares",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "noShares",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;
