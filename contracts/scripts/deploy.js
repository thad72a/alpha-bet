const hre = require("hardhat");

async function main() {
  // Deploy a mock TAO token for testing
  const MockTAO = await hre.ethers.getContractFactory("MockTAO");
  const mockTAO = await MockTAO.deploy();
  await mockTAO.waitForDeployment();
  
  const mockTAOAddress = await mockTAO.getAddress();
  console.log("MockTAO deployed to:", mockTAOAddress);

  // Deploy the BettingCard contract
  const BettingCard = await hre.ethers.getContractFactory("BettingCard");
  const bettingCard = await BettingCard.deploy(mockTAOAddress);
  await bettingCard.waitForDeployment();

  const bettingCardAddress = await bettingCard.getAddress();
  console.log("BettingCard deployed to:", bettingCardAddress);
  console.log("MockTAO address:", mockTAOAddress);
  
  // Log the deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("MockTAO Token:", mockTAOAddress);
  console.log("BettingCard Contract:", bettingCardAddress);
  console.log("\nUpdate your frontend with these addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


