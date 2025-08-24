// SPDX-License-Identifier: MIT
// Remix script to generate BatterySwapped events for testing
// To run: Deploy Vyan contract first, then run this script in Remix

const generateBatterySwappedEvent = async () => {
  console.log("🔋 Generating BatterySwapped Event for Testing...");
  
  // Get the deployed contract instance
  // Replace 'YOUR_CONTRACT_ADDRESS' with actual deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS";
  const vyan = await ethers.getContractAt("Vyan", contractAddress);
  
  // Get signers - Account 0 should be the contract owner
  const [ownerAccount] = await ethers.getSigners();
  
  console.log(`👑 Owner Account: ${ownerAccount.address}`);
  
  // ====== CUSTOMIZE YOUR BATTERY SWAP EVENT HERE ======
  const batterySwap = {
    user: "0x1234567890123456789012345678901234567890", // Change this to user address
    stationId: "A",                                      // Change this to station ID
    oldBatteryId: 1,                                     // Change this to old battery ID
    newBatteryId: 2,                                     // Change this to new battery ID
    swapFee: ethers.utils.parseEther("0.0005"),          // Change this to swap fee in SEI
    remainingBatteries: 12                               // Change this to remaining batteries at station
  };
  // ===================================================
  
  console.log("\n🔋 Battery Swap Event Configuration:");
  console.log(`👤 User Address: ${batterySwap.user}`);
  console.log(`🏪 Station ID: ${batterySwap.stationId}`);
  console.log(`🔋 Old Battery ID: ${batterySwap.oldBatteryId}`);
  console.log(`🔋 New Battery ID: ${batterySwap.newBatteryId}`);
  console.log(`💰 Swap Fee: ${ethers.utils.formatEther(batterySwap.swapFee)} SEI`);
  console.log(`🔋 Remaining Batteries: ${batterySwap.remainingBatteries}`);
  
  // Verify owner account
  console.log("\n🔐 OWNER VERIFICATION REQUIRED:");
  console.log("⚠️  Only the contract owner can generate test BatterySwapped events");
  console.log("🛑 TO STOP: REJECT the confirmation transaction");
  console.log("✅ TO CONTINUE: APPROVE the confirmation transaction");
  
  try {
    console.log("\n⏳ Waiting for your confirmation...");
    
    // Generate the BatterySwapped event
    console.log("🚀 Calling generateBatterySwappedEvent function...");
    
    const tx = await vyan.connect(ownerAccount).generateBatterySwappedEvent(
      batterySwap.user,
      batterySwap.stationId,
      batterySwap.oldBatteryId,
      batterySwap.newBatteryId,
      batterySwap.swapFee,
      batterySwap.remainingBatteries
    );
    
    console.log("⏳ Transaction submitted, waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ BatterySwapped event generated successfully!");
    console.log(`📄 Transaction Hash: ${receipt.transactionHash}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    
    // Look for the BatterySwapped event in the receipt
    const event = receipt.logs.find(log => {
      try {
        const parsed = vyan.interface.parseLog(log);
        return parsed.name === 'BatterySwapped';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = vyan.interface.parseLog(event);
      console.log("\n🎉 BatterySwapped Event Details:");
      console.log(`👤 User: ${parsed.args.user}`);
      console.log(`🏪 Station ID: ${parsed.args.stationId}`);
      console.log(`🔋 Old Battery ID: ${parsed.args.oldBatteryId.toString()}`);
      console.log(`🔋 New Battery ID: ${parsed.args.newBatteryId.toString()}`);
      console.log(`💰 Swap Fee: ${ethers.utils.formatEther(parsed.args.swapFee)} SEI`);
      console.log(`⏰ Timestamp: ${new Date(parsed.args.timestamp * 1000).toLocaleString()}`);
      console.log(`🔋 Remaining Batteries: ${parsed.args.remainingBatteries.toString()}`);
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
      console.log("❌ Error generating BatterySwapped event:", error.message);
      return;
    }
  }
  
  console.log("\n🎯 Script completed successfully!");
  console.log("💡 You can now monitor the blockchain for BatterySwapped events");
  console.log("⚠️  Note: This is a test event - no actual battery swap occurred");
};

// Execute the function
generateBatterySwappedEvent()
  .then(() => {
    console.log("\n✨ Script execution finished");
  })
  .catch((error) => {
    console.error("💥 Script execution failed:", error);
  });
