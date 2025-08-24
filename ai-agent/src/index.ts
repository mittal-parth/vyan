import { config, validateConfig } from './config';
import { EthersClient } from './contract/ethersClient';
import { VyanContract } from './contract/vyanContract';
import { RebalancingService } from './services/rebalancingService';
import { EventMonitor } from './services/eventMonitor';

class VyanAIAgent {
  private ethersClient: EthersClient;
  private vyanContract: VyanContract;
  private rebalancingService: RebalancingService;
  private eventMonitor: EventMonitor;
  private operatorAddress: string;

  constructor() {
    this.ethersClient = new EthersClient();
    this.vyanContract = new VyanContract(this.ethersClient);
    this.rebalancingService = new RebalancingService(this.vyanContract);
    
    // For now, we'll use a placeholder operator address
    // In production, this would come from environment or configuration
    this.operatorAddress = '0x3e6891b1A5D3aB9696e4d888E9b1eAAfA4F57D53';
    
    this.eventMonitor = new EventMonitor(
      this.vyanContract,
      this.rebalancingService,
      this.operatorAddress
    );
  }

  /**
   * Initialize the AI Agent
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Vyan AI Agent...');
      
      // Validate configuration
      validateConfig();
      console.log('✅ Configuration validated');

      // Initialize Ethers client
      await this.ethersClient.initialize();
      console.log('✅ Ethers client initialized');

      // Get operator address from wallet
      this.operatorAddress = await this.ethersClient.getAccountAddress();
      console.log(`✅ Operator address: ${this.operatorAddress}`);

      // Update event monitor with correct operator address
      this.eventMonitor = new EventMonitor(
        this.vyanContract,
        this.rebalancingService,
        this.operatorAddress
      );

      // Test contract connection
      await this.testContractConnection();
      console.log('✅ Contract connection tested');

      console.log('🎉 Vyan AI Agent initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize Vyan AI Agent:', error);
      throw error;
    }
  }

  /**
   * Test contract connection by making a simple query
   */
  private async testContractConnection(): Promise<void> {
    try {
      const stations = await this.vyanContract.getAllStations();
      console.log(`📡 Contract connection successful. Found ${stations.length} total stations`);
      
      // Check if operator has any stations
      const operatorStations = await this.vyanContract.getOperatorStations(this.operatorAddress);
      console.log(`🏪 Operator has ${operatorStations.length} stations`);
      
    } catch (error) {
      console.error('❌ Contract connection test failed:', error);
      throw error;
    }
  }

  /**
   * Start the AI Agent
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Starting Vyan AI Agent...');
      
      // Start event monitoring
      await this.eventMonitor.startMonitoring();
      console.log('✅ Event monitoring started');

      // Perform initial rebalancing analysis
      console.log('🔍 Performing initial rebalancing analysis...');
      await this.eventMonitor.manualRebalancingAnalysis();

      console.log('🎯 Vyan AI Agent is now running and monitoring for rebalancing opportunities');
      console.log('Press Ctrl+C to stop the agent');

      // Keep the process running
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start Vyan AI Agent:', error);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down Vyan AI Agent...');
      
      try {
        // Stop event monitoring
        this.eventMonitor.stopMonitoring();
        
        // Disconnect Ethers client
        await this.ethersClient.disconnect();
        
        console.log('✅ Vyan AI Agent shut down gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      this.eventMonitor.stopMonitoring();
      await this.ethersClient.disconnect();
      process.exit(0);
    });
  }

  /**
   * Get agent status
   */
  getStatus(): {
    isInitialized: boolean;
    eventMonitorStatus: any;
    operatorAddress: string;
  } {
    return {
      isInitialized: !!this.ethersClient,
      eventMonitorStatus: this.eventMonitor.getStatus(),
      operatorAddress: this.operatorAddress
    };
  }

  /**
   * Get vyan contract for testing purposes
   */
  getVyanContract() {
    return this.vyanContract;
  }

  /**
   * Test Gemini optimization functionality
   */
  async testGeminiOptimization(): Promise<void> {
    await this.eventMonitor.testGeminiOptimization();
  }

  /**
   * Test AI route recommendation emission functionality
   */
  async testAIRouteRecommendationEmission(): Promise<void> {
    await this.eventMonitor.testAIRouteRecommendationEmission();
  }
}

// Main execution
async function main() {
  const agent = new VyanAIAgent();
  
  try {
    await agent.initialize();
    await agent.start();
  } catch (error) {
    console.error('❌ Fatal error in Vyan AI Agent:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the agent if this file is run directly
if (require.main === module) {
  main();
}

export { VyanAIAgent };
