import { VyanAIAgent } from './src/index';

async function testBlockRangeFix() {
  console.log('🧪 Testing Block Range Fix...');
  
  try {
    const agent = new VyanAIAgent();
    
    // Initialize the agent
    await agent.initialize();
    console.log('✅ Agent initialized successfully');
    
    // Test getting current block number
    const vyanContract = agent.getVyanContract();
    const currentBlock = await vyanContract.getCurrentBlockNumber();
    console.log(`✅ Current block number: ${currentBlock}`);
    
    // Test getting events with a reasonable block range
    const events = await vyanContract.getBatterySwappedEvents(currentBlock - 100);
    console.log(`✅ Retrieved ${events.length} events from recent blocks`);
    
    console.log('🎉 Block range fix test completed successfully!');
    
  } catch (error) {
    console.error('❌ Block range fix test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testBlockRangeFix();
}

export { testBlockRangeFix };
