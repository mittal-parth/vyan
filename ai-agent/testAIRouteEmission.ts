import { EventMonitor } from './src/services/eventMonitor';
import { VyanContract } from './src/contract/vyanContract';
import { RebalancingService } from './src/services/rebalancingService';
import { EthersClient } from './src/contract/ethersClient';
import { config } from './src/config';

/**
 * Test script for AI route recommendation emission
 * This demonstrates how the EventMonitor emits AI route recommendation events
 * after receiving responses from the Gemini API
 */
async function testAIRouteEmission() {
  try {
    console.log('🚀 Starting AI Route Recommendation Emission Test...\n');

    // Initialize dependencies
    const ethersClient = new EthersClient();
    const vyanContract = new VyanContract(ethersClient);
    const rebalancingService = new RebalancingService(vyanContract);
    
    // Create EventMonitor instance
    const eventMonitor = new EventMonitor(
      vyanContract,
      rebalancingService,
      '0x1234567890123456789012345678901234567890' // Mock operator address
    );

    console.log('✅ EventMonitor initialized successfully');
    console.log('📡 Testing AI route recommendation emission...\n');

    // Test the AI route recommendation emission
    await eventMonitor.testAIRouteRecommendationEmission();

    console.log('\n🎉 AI Route Recommendation Emission Test completed successfully!');
    console.log('\n📋 What happened:');
    console.log('1. Created a mock optimized rebalancing plan');
    console.log('2. Called emitAIRouteRecommendationEvents()');
    console.log('3. For each route, called vyanContract.generateAIRouteRecommendation()');
    console.log('4. This emitted AIRecommendation events on the blockchain');
    console.log('5. Each event contains route details, ETA, priority, and reason');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAIRouteEmission()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testAIRouteEmission };
