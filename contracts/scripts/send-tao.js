const hre = require("hardhat");

async function main() {
  // Get the deployed MockTAO address
  const mockTAOAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get the contract
  const MockTAO = await hre.ethers.getContractFactory("MockTAO");
  const mockTAO = MockTAO.attach(mockTAOAddress);
  
  // The address you want to send tokens to
  // REPLACE THIS with your MetaMask address
  const recipientAddress = "YOUR_METAMASK_ADDRESS_HERE";
  
  // Amount to send (5000 tokens)
  const amount = hre.ethers.parseEther("5000");
  
  console.log("Sending 5000 MockTAO tokens...");
  console.log("From: Contract Owner");
  console.log("To:", recipientAddress);
  
  // Transfer tokens
  const tx = await mockTAO.transfer(recipientAddress, amount);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Transfer complete!");
  
  // Check balances
  const balance = await mockTAO.balanceOf(recipientAddress);
  console.log("Recipient balance:", hre.ethers.formatEther(balance), "mTAO");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

