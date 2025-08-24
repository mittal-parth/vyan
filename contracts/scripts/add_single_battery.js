// SPDX-License-Identifier: MIT
// Remix script to add a single battery to Vyan contract
// To run: Deploy Vyan contract first, then run this script in Remix

const addSingleBattery = async () => {
  console.log("🔋 Adding single battery to blockchain...");
  
  // Get the deployed contract instance
  // Replace 'YOUR_CONTRACT_ADDRESS' with actual deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS";
  const vyan = await ethers.getContractAt("Vyan", contractAddress);
  
  // Get signers
  const [userAccount, operatorAccount] = await ethers.getSigners();
  
  console.log(`👤 User Account: ${userAccount.address}`);
  console.log(`🏪 Station Operator Account: ${operatorAccount.address}`);
  
  // ====== CUSTOMIZE YOUR BATTERY HERE ======
  const newBattery = {
    capacity: 60000,           // Battery capacity in Wh (60kWh = 60000Wh)
    currentCharge: 85,         // Current charge percentage (0-100)
    healthScore: 92,           // Health score (0-100, 100 = perfect)
    ownerType: "operator",     // "user" or "operator" - who should own this battery
    depositToStation: "A"      // Station ID to deposit to (set to null to keep with owner)
  };
  // ==========================================
  
  // Determine owner based on ownerType
  const batteryOwner = newBattery.ownerType === "operator" ? operatorAccount.address : userAccount.address;
  const ownerAccount = newBattery.ownerType === "operator" ? operatorAccount : userAccount;
  
  console.log("\n🔋 Battery Configuration:");
  console.log(`⚡ Capacity: ${newBattery.capacity/1000} kWh`);
  console.log(`🔌 Current Charge: ${newBattery.currentCharge}%`);
  console.log(`💚 Health Score: ${newBattery.healthScore}%`);
  console.log(`👤 Owner Type: ${newBattery.ownerType}`);
  console.log(`👤 Owner Address: ${batteryOwner}`);
  if (newBattery.depositToStation) {
    console.log(`🏪 Will be deposited to Station: ${newBattery.depositToStation}`);
  } else {
    console.log(`📦 Will stay with owner (not deposited to station)`);
  }
  
  // Validation
  if (newBattery.currentCharge > 100) {
    console.log("❌ Error: Current charge cannot be greater than 100%");
    return;
  }
  if (newBattery.healthScore > 100) {
    console.log("❌ Error: Health score cannot be greater than 100%");
    return;
  }
  
  // Confirmation transaction
  console.log("\n🔐 CONFIRMATION REQUIRED:");
  console.log("🛑 TO STOP: REJECT the confirmation transaction");
  console.log("✅ TO CONTINUE: APPROVE the confirmation transaction");
  
  try {
    console.log("\n⏳ Waiting for your confirmation...");
    
    const confirmationAmount = ethers.utils.parseEther("0.0000000001");
    console.log("💳 Please confirm the transaction in MetaMask to proceed...");
    
    const confirmationTx = await userAccount.sendTransaction({
      to: operatorAccount.address,
      value: confirmationAmount,
      gasLimit: 21000
    });
    
    await confirmationTx.wait();
    console.log("✅ Confirmation received! Proceeding with battery registration...");
    
  } catch (error) {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      console.log("🛑 Transaction rejected by user. Stopping script execution.");
      return;
    } else {
      console.log("❌ Error during confirmation:", error.message);
      return;
    }
  }
  
  // Register the battery
  console.log(`\n🔋 Registering battery with ${newBattery.ownerType} account...`);
  
  let batteryId;
  try {
    const tx = await vyan.connect(ownerAccount).registerBattery(
      newBattery.capacity,
      newBattery.currentCharge,
      newBattery.healthScore,
      batteryOwner
    );
    
    console.log("⏳ Transaction submitted, waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ Battery registered successfully!");
    console.log(`📄 Transaction Hash: ${receipt.transactionHash}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    
    // Get the battery ID (assuming it's the latest one)
    // You might need to check events for exact ID
    const currentId = await vyan._batteryIdCounter();
    batteryId = currentId.sub(1).toString(); // Latest battery ID
    console.log(`🆔 Battery ID: ${batteryId}`);
    
  } catch (error) {
    console.log("❌ Error registering battery:", error.message);
    return;
  }
  
  // Deposit to station if specified
  if (newBattery.depositToStation && newBattery.ownerType === "operator") {
    console.log(`\n🏪 Depositing battery ${batteryId} to station ${newBattery.depositToStation}...`);
    
    try {
      const depositTx = await vyan.connect(operatorAccount).depositBatteryToStation(
        newBattery.depositToStation,
        batteryId
      );
      
      console.log("⏳ Deposit transaction submitted, waiting for confirmation...");
      await depositTx.wait();
      
      console.log(`✅ Battery ${batteryId} deposited to station ${newBattery.depositToStation} successfully!`);
      
    } catch (error) {
      console.log("❌ Error depositing battery to station:", error.message);
      console.log("💡 Battery was created but not deposited. You can deposit manually later.");
    }
  } else if (newBattery.depositToStation && newBattery.ownerType === "user") {
    console.log("⚠️  Note: User-owned batteries cannot be deposited to stations directly.");
    console.log("💡 Only the station operator can deposit batteries to stations.");
  }
  
  // Verify battery registration
  console.log("\n🔍 Verifying battery registration...");
  
  try {
    const batteryDetails = await vyan.getBatteryDetails(batteryId);
    
    console.log("📊 Battery Details Retrieved:");
    console.log(`⚡ Capacity: ${batteryDetails[0].toString()} Wh (${batteryDetails[0]/1000} kWh)`);
    console.log(`🔌 Current Charge: ${batteryDetails[1].toString()}%`);
    console.log(`💚 Health Score: ${batteryDetails[2].toString()}%`);
    console.log(`🔄 Cycle Count: ${batteryDetails[3].toString()}`);
    console.log(`📅 Manufacture Date: ${batteryDetails[4].toString()}`);
    console.log(`👤 Current Owner: ${batteryDetails[5]}`);
    console.log(`🏪 Current Station: ${batteryDetails[6] || 'Not at station'}`);
    console.log(`✅ Available for Swap: ${batteryDetails[7]}`);
    
  } catch (error) {
    console.log("❌ Error retrieving battery details:", error.message);
  }
  
  console.log("\n🎉 Single battery addition completed!");
  console.log("\n📋 Next steps:");
  if (newBattery.ownerType === "operator" && !newBattery.depositToStation) {
    console.log("- Deposit this battery to a station using depositBatteryToStation()");
  }
  if (newBattery.ownerType === "user") {
    console.log("- This battery is ready for swapping at any station");
  }
  console.log(`- Check battery details: await vyan.getBatteryDetails(${batteryId})`);
  console.log(`- Check owner's batteries: await vyan.getUserBatteries('${batteryOwner}')`);
};

// Execute the script
addSingleBattery()
  .then(() => {
    console.log("✅ Script execution completed!");
  })
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
  });
