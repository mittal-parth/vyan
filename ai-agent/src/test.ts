import { VyanAIAgent } from './index';

async function testAgent() {
  console.log('🧪 Testing Vyan AI Agent...');
  
  try {
    const agent = new VyanAIAgent();
    
    // Test initialization
    console.log('Testing agent initialization...');
    await agent.initialize();
    
    // Get status
    const status = agent.getStatus();
    console.log('Agent status:', status);
    
    // Test Gemini optimization functionality
    console.log('\n🧠 Testing Gemini optimization...');
    await agent.testGeminiOptimization();
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAgent();
}

export { testAgent };
