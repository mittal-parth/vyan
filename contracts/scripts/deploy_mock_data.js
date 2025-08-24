// SPDX-License-Identifier: MIT
// Remix deployment script for Vyan contract mock data
// To run: Deploy Vyan contract first, then run this script in Remix
import { ethers } from 'ethers'

const deployMockData = async () => {
  console.log("🚀 Starting mock data deployment...");
  
  // Get the deployed contract instance
  // Replace 'YOUR_CONTRACT_ADDRESS' with actual deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS";
  const vyan = await ethers.getContractAt("Vyan", contractAddress);
  
  // Get signers - Account 0 will be user, Account 1 will be station operator
  const [userAccount, operatorAccount] = await ethers.getSigners();
  
  console.log(`👤 User Account: ${userAccount.address}`);
  console.log(`🏪 Station Operator Account: ${operatorAccount.address}`);
  
  // Account verification check with transaction confirmation
  console.log("\n⚠️  ACCOUNT VERIFICATION REQUIRED ⚠️");
  console.log("Please verify the accounts above are correct:");
  console.log("- User Account should be your first MetaMask account");
  console.log("- Operator Account should be your second MetaMask account");
  console.log("\n🔐 CONFIRMATION REQUIRED:");
  console.log("A confirmation transaction will appear in MetaMask...");
  console.log("🛑 TO STOP: REJECT/CANCEL the transaction");
  console.log("✅ TO CONTINUE: APPROVE/CONFIRM the transaction");
  
  try {
    console.log("\n⏳ Waiting for your confirmation...");
    
    // Send a small confirmation transaction (0.0001 SEI) from user to operator
    // This serves as confirmation that accounts are correct
    const confirmationAmount = ethers.utils.parseEther("0.0000000001"); // Very small amount
    
    console.log("💳 Please confirm the transaction in MetaMask to proceed...");
    console.log(`📝 Sending ${ethers.utils.formatEther(confirmationAmount)} SEI from user to operator as confirmation`);
    
    const confirmationTx = await userAccount.sendTransaction({
      to: operatorAccount.address,
      value: confirmationAmount,
      gasLimit: 21000
    });
    
    console.log("⏳ Waiting for confirmation transaction to be mined...");
    await confirmationTx.wait();
    
    console.log("✅ Confirmation received! Accounts verified.");
    console.log(`📄 Confirmation TX Hash: ${confirmationTx.hash}`);
    console.log("✅ Proceeding with deployment...");
    
  } catch (error) {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      console.log("🛑 Transaction rejected by user. Stopping script execution.");
      console.log("❌ Script terminated - accounts not confirmed.");
      return; // Stop execution
    } else {
      console.log("❌ Error during confirmation:", error.message);
      console.log("🛑 Stopping script execution due to error.");
      return; // Stop execution
    }
  }
  
  console.log("\n📍 Adding stations to blockchain...");
  
  // Station data - 4 stations (coordinates converted to int256)
  const stations = [
    {
      id: "A",
      name: "Cubbon Park Metro EV Hub",
      location: "Cubbon Park Metro Station, MG Road, Bangalore 560001",
      latitude: 12976200, // 12.9762 * 1e6
      longitude: 77595900, // 77.5959 * 1e6
      totalSlots: 20,
      baseFee: ethers.utils.parseEther("0.0005"), // 0.005 SEI
      rating: 47,
      availableSlots: 15
    },
    {
      id: "B", 
      name: "Trinity Metro Power Station",
      location: "Trinity Metro Station, MG Road, Bangalore 560001",
      latitude: 12978300, // 12.9783 * 1e6
      longitude: 77619900, // 77.6199 * 1e6
      totalSlots: 20,
      baseFee: ethers.utils.parseEther("0.0005"),
      rating: 40,
      availableSlots: 6
    },
    {
      id: "C",
      name: "Indiranagar Metro EV Center", 
      location: "Indiranagar Metro Station, 100 Feet Road, Bangalore 560038",
      latitude: 12971900, // 12.9719 * 1e6
      longitude: 77640800, // 77.6408 * 1e6
      totalSlots: 20,
      baseFee: ethers.utils.parseEther("0.0005"),
      rating: 46,
      availableSlots: 2
    },
    {
      id: "D",
      name: "Forum Koramangala Power Point",
      location: "The Forum Mall, 80 Feet Road, Koramangala, Bangalore 560095", 
      latitude: 12934300, // 12.9343 * 1e6
      longitude: 77611200, // 77.6112 * 1e6
      totalSlots: 20,
      baseFee: ethers.utils.parseEther("0.0005"),
      rating: 45,
      availableSlots: 18
    }
  ];
  
  // Register all stations with operator account
  console.log("🏪 Registering stations with operator account...");
  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    console.log(`📍 Registering station ${station.id}: ${station.name}...`);
    
    try {
      // Use operator account to register stations
      const tx = await vyan.connect(operatorAccount).registerStation(
        station.id,
        station.name,
        station.location,
        station.latitude,
        station.longitude,
        station.totalSlots,
        station.baseFee,
        station.rating,
        station.availableSlots
      );
      await tx.wait();
      console.log(`✅ Station ${station.id} registered successfully by operator!`);
    } catch (error) {
      console.log(`❌ Error registering station ${station.id}:`, error.message);
    }
  }
  
  console.log("\n🔋 Adding batteries to blockchain...");
  
  // Battery configurations - 12 batteries with varied specs
  const batteryConfigs = [
    // Station operator batteries (most batteries - 9 out of 12)
    { capacity: 75000, currentCharge: 95, healthScore: 98, owner: operatorAccount.address }, // Battery 1
    { capacity: 60000, currentCharge: 88, healthScore: 92, owner: operatorAccount.address }, // Battery 2
    { capacity: 50000, currentCharge: 85, healthScore: 87, owner: operatorAccount.address }, // Battery 3
    { capacity: 65000, currentCharge: 90, healthScore: 94, owner: operatorAccount.address }, // Battery 4
    { capacity: 55000, currentCharge: 82, healthScore: 89, owner: operatorAccount.address }, // Battery 5
    { capacity: 70000, currentCharge: 96, healthScore: 96, owner: operatorAccount.address }, // Battery 6
    { capacity: 60000, currentCharge: 78, healthScore: 85, owner: operatorAccount.address }, // Battery 7
    { capacity: 50000, currentCharge: 92, healthScore: 91, owner: operatorAccount.address }, // Battery 8
    { capacity: 65000, currentCharge: 86, healthScore: 93, owner: operatorAccount.address }, // Battery 9
    
    // User batteries (3 out of 12)
    { capacity: 75000, currentCharge: 45, healthScore: 88, owner: userAccount.address },     // Battery 10 - User's low charge battery
    { capacity: 60000, currentCharge: 25, healthScore: 85, owner: userAccount.address },     // Battery 11 - User's low charge battery
    { capacity: 50000, currentCharge: 15, healthScore: 82, owner: userAccount.address }      // Battery 12 - User's low charge battery
  ];
  
  const batteryIds = [];
  
  // Register all batteries
  for (let i = 0; i < batteryConfigs.length; i++) {
    const battery = batteryConfigs[i];
    const isOperatorBattery = battery.owner === operatorAccount.address;
    const ownerType = isOperatorBattery ? "operator" : "user";
    
    console.log(`🔋 Registering ${ownerType} battery ${i + 1}: ${battery.capacity/1000}kWh, ${battery.currentCharge}% charge, ${battery.healthScore}% health...`);
    
    try {
      // Use appropriate account to register battery
      const account = isOperatorBattery ? operatorAccount : userAccount;
      const tx = await vyan.connect(account).registerBattery(
        battery.capacity,
        battery.currentCharge,
        battery.healthScore,
        battery.owner
      );
      const receipt = await tx.wait();
      
      const batteryId = i + 1; // Battery IDs start from 1
      batteryIds.push(batteryId);
      
      console.log(`✅ Battery ${batteryId} registered successfully for ${ownerType}!`);
    } catch (error) {
      console.log(`❌ Error registering battery ${i + 1}:`, error.message);
    }
  }
  
  console.log("\n🏪 Distributing operator batteries to stations randomly...");
  
  // Only distribute operator-owned batteries to stations (batteries 1-9)
  const operatorBatteries = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const stationIds = ["A", "B", "C", "D"];
  
  // Shuffle operator batteries for random distribution
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  const shuffledBatteries = shuffleArray(operatorBatteries);
  
  // Distribute batteries randomly across stations (roughly equal distribution)
  const batteriesPerStation = Math.floor(operatorBatteries.length / stationIds.length);
  const extraBatteries = operatorBatteries.length % stationIds.length;
  
  let batteryIndex = 0;
  const distribution = {};
  
  for (let i = 0; i < stationIds.length; i++) {
    const stationId = stationIds[i];
    const batteryCount = batteriesPerStation + (i < extraBatteries ? 1 : 0);
    const stationBatteries = shuffledBatteries.slice(batteryIndex, batteryIndex + batteryCount);
    distribution[stationId] = stationBatteries;
    batteryIndex += batteryCount;
  }
  
  console.log("🎲 Random distribution plan:");
  for (const [stationId, batteries] of Object.entries(distribution)) {
    console.log(`📍 Station ${stationId}: Batteries [${batteries.join(', ')}]`);
  }
  
  // Deposit batteries to stations
  for (const [stationId, batteries] of Object.entries(distribution)) {
    console.log(`\n🏪 Adding ${batteries.length} batteries to station ${stationId}...`);
    
    for (const batteryId of batteries) {
      try {
        // Use operator account to deposit batteries to stations
        const tx = await vyan.connect(operatorAccount).depositBatteryToStation(stationId, batteryId);
        await tx.wait();
        console.log(`✅ Battery ${batteryId} deposited to station ${stationId} by operator`);
      } catch (error) {
        console.log(`❌ Error depositing battery ${batteryId} to station ${stationId}:`, error.message);
      }
    }
  }
  
  console.log("\n📊 Deployment Summary:");
  console.log(`✅ ${stations.length} stations registered (owned by operator)`);
  console.log(`✅ ${batteryConfigs.length} batteries registered total:`);
  console.log(`   📦 ${operatorBatteries.length} batteries owned by operator (distributed to stations)`);
  console.log(`   👤 ${batteryConfigs.length - operatorBatteries.length} batteries owned by user`);
  console.log(`✅ Operator batteries randomly distributed across ${stationIds.length} stations`);
  console.log("\n🎉 Mock data deployment completed!");
  
  // Display accounts info
  console.log("\n📋 Account Information:");
  console.log(`👤 User Account: ${userAccount.address}`);
  console.log(`   - Owns batteries: [10, 11, 12] (low charge - needs swapping)`);
  console.log(`🏪 Operator Account: ${operatorAccount.address}`);
  console.log(`   - Owns all 4 stations`);
  console.log(`   - Owns batteries: [1-9] (distributed across stations)`);
  
  // Display verification commands
  console.log("\n📋 Quick verification commands:");
  console.log("- Check station details: await vyan.getStationDetails('A')");
  console.log("- Check battery details: await vyan.getBatteryDetails(1)");
  console.log("- Check station batteries: await vyan.getStationBatteries('A')");
  console.log(`- Check user batteries: await vyan.getUserBatteries('${userAccount.address}')`);
  console.log(`- Check operator batteries: await vyan.getUserBatteries('${operatorAccount.address}')`);
  
  console.log("\n🔄 Test swap simulation:");
  console.log("1. User (low charge battery) can swap at any station");
  console.log("2. User will get a high-charge battery from station");
  console.log("3. Station will receive user's low-charge battery");
};

// Execute the deployment
deployMockData()
  .then(() => {
    console.log("✅ Script execution completed!");
  })
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
  });