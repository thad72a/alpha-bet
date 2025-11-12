const hre = require("hardhat");

async function main() {
  const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Check if there's code at this address
  const code = await hre.ethers.provider.getCode(address);
  
  if (code === "0x") {
    console.log("❌ No contract deployed at", address);
    console.log("The Hardhat node may have restarted.");
    console.log("\n🔄 Solution: Redeploy the contract:");
    console.log("   npm run deploy:localhost");
  } else {
    console.log("✅ Contract exists at", address);
    
    // Try to call getCardCount
    const BettingCard = await hre.ethers.getContractFactory("BettingCard");
    const contract = BettingCard.attach(address);
    const count = await contract.getCardCount();
    console.log("📊 Card count:", count.toString());
  }
}

main().catch(console.error);
