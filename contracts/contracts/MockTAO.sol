// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockTAO is ERC20, Ownable {
    constructor() ERC20("Mock TAO", "mTAO") {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1M tokens for testing
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet() external {
        _mint(msg.sender, 1000 * 10**18); // Anyone can get 1000 tokens for testing
    }
}


