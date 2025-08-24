// SPDX-License-Identifier: MIT
// Remix script to add a single station to Vyan contract
// To run: Deploy Vyan contract first, then run this script in Remix

const addSingleStation = async () => {
  console.log("🏪 Adding single station to blockchain...");
  
  // Get the deployed contract instance
  // Replace 'YOUR_CONTRACT_ADDRESS' with actual deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS";
  const vyan = await ethers.getContractAt("Vyan", contractAddress);
  
  // Get signers
  const [userAccount, operatorAccount] = await ethers.getSigners();
  
  console.log(`👤 User Account: ${userAccount.address}`);
  console.log(`🏪 Station Operator Account: ${operatorAccount.address}`);
  
  // ====== CUSTOMIZE YOUR STATION HERE ======
  const newStation = {
    id: "TEST1",                    // Change this to your desired station ID
    name: "Test Station One",       // Change this to your desired station name
    location: "Test Location, Bangalore 560001", // Change this to your desired location
    latitude: 12976200,             // 12.9762 * 1e6 (Bangalore coordinates example)
    longitude: 77595900,            // 77.5959 * 1e6 (Bangalore coordinates example)
    totalSlots: 15,                 // Change this to desired number of slots
    rating: 47,
    availableSlots: 15,
    baseFee: ethers.utils.parseEther("0.0005") // Change this to desired base fee in SEI
  };
  // ==========================================
  
  console.log("\n📍 Station Configuration:");
  console.log(`🆔 ID: ${newStation.id}`);
  console.log(`📛 Name: ${newStation.name}`);
  console.log(`📍 Location: ${newStation.location}`);
  console.log(`🌍 Coordinates: ${newStation.latitude/1e6}, ${newStation.longitude/1e6}`);
  console.log(`🔌 Total Slots: ${newStation.totalSlots}`);
  console.log(`💰 Base Fee: ${ethers.utils.formatEther(newStation.baseFee)} SEI`);
  
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
    console.log("✅ Confirmation received! Proceeding with station registration...");
    
  } catch (error) {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      console.log("🛑 Transaction rejected by user. Stopping script execution.");
      return;
    } else {
      console.log("❌ Error during confirmation:", error.message);
      return;
    }
  }
  
  // Register the station
  console.log("\n📍 Registering station with operator account...");
  
  try {
    const tx = await vyan.connect(operatorAccount).registerStation(
      newStation.id,
      newStation.name,
      newStation.location,
      newStation.latitude,
      newStation.longitude,
      newStation.totalSlots,
      newStation.baseFee,
      newStation.rating,
      newStation.availableSlots
    );
    
    console.log("⏳ Transaction submitted, waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ Station registered successfully!");
    console.log(`📄 Transaction Hash: ${receipt.transactionHash}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    
  } catch (error) {
    console.log("❌ Error registering station:", error.message);
    return;
  }
  
  // Verify registration
  console.log("\n🔍 Verifying station registration...");
  
  try {
    const stationDetails = await vyan.getStationDetails(newStation.id);
    
    console.log("📊 Station Details Retrieved:");
    console.log(`📛 Name: ${stationDetails[0]}`);
    console.log(`📍 Location: ${stationDetails[1]}`);
    console.log(`🌍 Latitude: ${stationDetails[2].toString()}`);
    console.log(`🌍 Longitude: ${stationDetails[3].toString()}`);
    console.log(`👤 Operator: ${stationDetails[4]}`);
    console.log(`🔌 Total Slots: ${stationDetails[5].toString()}`);
    console.log(`🔌 Available Slots: ${stationDetails[6].toString()}`);
    console.log(`✅ Is Active: ${stationDetails[7]}`);
    console.log(`📅 Created At: ${stationDetails[8].toString()}`);
    console.log(`💰 Base Fee: ${ethers.utils.formatEther(stationDetails[9])} SEI`);
    console.log(`⭐ Rating: ${stationDetails[10].toString()}`);
    
  } catch (error) {
    console.log("❌ Error retrieving station details:", error.message);
  }
  
  console.log("\n🎉 Single station addition completed!");
  console.log("\n📋 Next steps:");
  console.log("- Add batteries to this station using add_single_battery.js");
  console.log("- Use depositBatteryToStation() to add existing batteries");
  console.log(`- Check station batteries: await vyan.getStationBatteries('${newStation.id}')`);
};

// Execute the script
addSingleStation()
  .then(() => {
    console.log("✅ Script execution completed!");
  })
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
  });
