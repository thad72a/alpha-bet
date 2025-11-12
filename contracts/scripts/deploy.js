const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment...\n");
  
  // Get network info
  const network = hre.network.name;
  console.log("📡 Network:", network);

  // Deploy the BettingCard contract (uses native TAO)
  console.log("📝 Deploying BettingCard contract...");
  const BettingCard = await hre.ethers.getContractFactory("BettingCard");
  const bettingCard = await BettingCard.deploy();
  await bettingCard.waitForDeployment();

  const bettingCardAddress = await bettingCard.getAddress();
  console.log("✅ BettingCard deployed to:", bettingCardAddress);

  // Save deployment info
  const deploymentInfo = {
    network: network,
    contracts: {
      BettingCard: bettingCardAddress,
      TAO: 'native' // Native TAO, not a contract
    },
    deployedAt: new Date().toISOString(),
    note: "TAO is native on Bittensor - no token contract address needed"
  };

  const deploymentsPath = path.join(__dirname, '../deployment-addresses.json');
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment-addresses.json");
  
  // Log the deployment summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(50));
  console.log("Network:", network);
  console.log("BettingCard Contract:", bettingCardAddress);
  console.log("TAO: Native (no contract address needed)");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });


