import { EventMonitor } from './services/eventMonitor';
import { VyanContract } from './contract/vyanContract';
import { RebalancingService } from './services/rebalancingService';
import { RebalancingRecommendation } from './types';

// Mock classes for testing
class MockVyanContract extends VyanContract {
  constructor() {
    super({} as any); // Pass empty object as ethersClient
  }
  
  async getAllStations() {
    return [];
  }
  
  async getOperatorStations() {
    return [];
  }
  
  async getStationDetails(stationId: string) {
    return {
      id: stationId,
      name: 'Test Station',
      location: 'Test Location',
      latitude: 12.9716,
      longitude: 77.5946,
      operator: 'test_operator',
      totalSlots: 10,
      availableSlots: 5,
      batteries: [],
      isActive: true,
      createdAt: Date.now(),
      baseFee: 1.0,
      rating: 4.5
    };
  }
  
  async getBatterySwappedEvents() {
    return [];
  }
}

class MockRebalancingService extends RebalancingService {
  constructor() {
    super({} as any); // Pass empty object as vyanContract
  }
  
  async generateRebalancingRecommendation(): Promise<RebalancingRecommendation> {
    return {
      routes: [
        {
          fromStation: 'station_001',
          toStation: 'station_002',
          batteryCount: 5,
          priority: 'high',
          reason: 'Station 001 has excess batteries, Station 002 is running low'
        },
        {
          fromStation: 'station_003',
          toStation: 'station_004',
          batteryCount: 3,
          priority: 'medium',
          reason: 'Balancing battery distribution between stations'
        }
      ],
      summary: 'Mock rebalancing recommendation for testing',
      totalBatteriesToMove: 8,
      estimatedCost: 25.5,
      timestamp: Date.now()
    };
  }
}

async function testGeminiOptimization() {
  console.log('🧠 Testing Gemini Optimization...');
  
  try {
    // Create mock instances
    const mockVyanContract = new MockVyanContract();
    const mockRebalancingService = new MockRebalancingService();
    const eventMonitor = new EventMonitor(
      mockVyanContract,
      mockRebalancingService,
      'test_operator_address'
    );
    
    // Test the Gemini optimization
    console.log('Testing optimizeRoutesWithGemini...');
    const mockRecommendation = await mockRebalancingService.generateRebalancingRecommendation();
    
    // Use reflection to access private method for testing
    const optimizeMethod = (eventMonitor as any).optimizeRoutesWithGemini.bind(eventMonitor);
    const result = await optimizeMethod(mockRecommendation);
    
    console.log('✅ Gemini optimization test completed successfully!');
    console.log('Result summary:', result.summary);
    console.log('Estimated efficiency improvement:', result.estimatedEfficiency + '%');
    console.log('Number of optimized routes:', result.optimizedRoutes.length);
    console.log('Traffic considerations:', result.trafficConsiderations.length);
    console.log('Demand forecast entries:', result.demandForecast.length);
    console.log('Execution schedule items:', result.executionSchedule.length);
    
    if (result.riskFactors.length > 0) {
      console.log('Risk factors identified:', result.riskFactors);
    }
    
  } catch (error) {
    console.error('❌ Gemini optimization test failed:', error);
    
    if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
      console.log('💡 Make sure you have set the GEMINI_API_KEY environment variable');
      console.log('💡 You can set it in your .env file or export it in your shell');
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testGeminiOptimization();
}

export { testGeminiOptimization };
