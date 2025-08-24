// SPDX-License-Identifier: MIT
// Remix script to generate AI route recommendation events
// To run: Deploy Vyan contract first, then run this script in Remix

const generateAIRouteRecommendation = async () => {
  console.log("🤖 Generating AI Route Recommendation Event...");
  
  // Get the deployed contract instance
  // Replace 'YOUR_CONTRACT_ADDRESS' with actual deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS";
  const vyan = await ethers.getContractAt("Vyan", contractAddress);
  
  // Get signers - Account 0 should be the contract owner
  const [ownerAccount] = await ethers.getSigners();
  
  console.log(`👑 Owner Account: ${ownerAccount.address}`);
  
  // ====== CUSTOMIZE YOUR AI ROUTE RECOMMENDATION HERE ======
  const aiRoute = {
    routeId: "route_test_001",           // Change this to your desired route ID
    fromStation: "A",                    // Change this to source station ID
    toStation: "B",                      // Change this to destination station ID
    batteryCount: 5,                     // Change this to number of batteries to transfer
    eta: "15 min",                       // Change this to estimated time of arrival
    priority: "high",                    // Change this to priority (critical, high, normal)
    reason: "Station B predicted shortage in 2.5h" // Change this to reason for recommendation
  };
  // =========================================================
  
  console.log("\n🤖 AI Route Recommendation Configuration:");
  console.log(`🆔 Route ID: ${aiRoute.routeId}`);
  console.log(`📍 From Station: ${aiRoute.fromStation}`);
  console.log(`🎯 To Station: ${aiRoute.toStation}`);
  console.log(`🔋 Batteries: ${aiRoute.batteryCount}`);
  console.log(`⏰ ETA: ${aiRoute.eta}`);
  console.log(`🚨 Priority: ${aiRoute.priority}`);
  console.log(`💭 Reason: ${aiRoute.reason}`);
  
  // Verify owner account
  console.log("\n🔐 OWNER VERIFICATION REQUIRED:");
  console.log("⚠️  Only the contract owner can generate AI route recommendations");
  console.log("🛑 TO STOP: REJECT the confirmation transaction");
  console.log("✅ TO CONTINUE: APPROVE the confirmation transaction");
  
  try {
    console.log("\n⏳ Waiting for your confirmation...");
    
    // Generate the AI route recommendation event
    console.log("🚀 Calling generateAIRouteRecommendation function...");
    
    const tx = await vyan.connect(ownerAccount).generateAIRouteRecommendation(
      aiRoute.routeId,
      aiRoute.fromStation,
      aiRoute.toStation,
      aiRoute.batteryCount,
      aiRoute.eta,
      aiRoute.priority,
      aiRoute.reason
    );
    
    console.log("⏳ Transaction submitted, waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ AI Route Recommendation event generated successfully!");
    console.log(`📄 Transaction Hash: ${receipt.transactionHash}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    
    // Look for the AIRecommendation event in the receipt
    const event = receipt.logs.find(log => {
      try {
        const parsed = vyan.interface.parseLog(log);
        return parsed.name === 'AIRecommendation';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = vyan.interface.parseLog(event);
      console.log("\n🎉 AIRecommendation Event Details:");
      console.log(`🆔 Route ID: ${parsed.args.routeId}`);
      console.log(`📍 From Station: ${parsed.args.fromStation}`);
      console.log(`🎯 To Station: ${parsed.args.toStation}`);
      console.log(`🔋 Batteries: ${parsed.args.batteries.toString()}`);
      console.log(`⏰ ETA: ${parsed.args.eta}`);
      console.log(`🚨 Priority: ${parsed.args.priority}`);
      console.log(`💭 Reason: ${parsed.args.reason}`);
      console.log(`⏰ Timestamp: ${new Date(parsed.args.timestamp * 1000).toLocaleString()}`);
    }
    
  } catch (error) {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      console.log("🛑 Transaction rejected by user. Stopping script execution.");
      return;
    } else if (error.message.includes("Ownable")) {
      console.log("❌ Error: Only the contract owner can call this function");
      console.log("💡 Make sure you're using the owner account");
      return;
    } else {
      console.log("❌ Error generating AI route recommendation:", error.message);
      return;
    }
  }
  
  console.log("\n🎯 Script completed successfully!");
  console.log("💡 You can now monitor the blockchain for AIRecommendation events");
};

// Execute the function
generateAIRouteRecommendation()
  .then(() => {
    console.log("\n✨ Script execution finished");
  })
  .catch((error) => {
    console.error("💥 Script execution failed:", error);
  });
