# Vyan AI Agent

An intelligent agent for suggesting truck rebalancing routes between EV battery swapping stations on the SEI blockchain.

## Features

- **Real-time Event Monitoring**: Listens to `BatterySwapped` events from the Vyan smart contract
- **Automatic Rebalancing Analysis**: Analyzes station status and determines rebalancing needs
- **Route Generation**: Generates optimal rebalancing routes between stations
- **Priority-based Recommendations**: Prioritizes routes based on station utilization and urgency
- **SEI Blockchain Integration**: Built for the SEI blockchain using ethers.js with burner wallet support
- **Gemini AI Integration**: Uses Google's Gemini AI for intelligent route optimization with traffic data and demand forecasting

## Architecture

```
src/
├── config/           # Configuration and environment variables
├── contract/         # SEI blockchain and Vyan contract integration
├── services/         # Core business logic services
├── types/            # TypeScript type definitions
└── index.ts          # Main entry point
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- SEI blockchain RPC endpoint access
- Vyan smart contract address
- Gemini API key (for AI-powered route optimization)
- Burner wallet private key (hex format)

## Installation

1. Clone the repository and navigate to the ai-agent directory:
```bash
cd ai-agent
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and configure it:
```bash
cp env.example .env
```

4. Edit `.env` with your configuration:
```env
# SEI Blockchain Configuration
SEI_RPC_URL=https://your-sei-rpc-endpoint
SEI_CHAIN_ID=sei_9000-1

# Contract Configuration
VYAN_CONTRACT_ADDRESS=your_contract_address_here

# Private Key (Burner wallet for on-chain interactions)
PRIVATE_KEY=your_burner_private_key_here

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Rebalancing Thresholds
MIN_AVAILABLE_SLOTS=3
REBALANCING_THRESHOLD=0.2
```

## Usage

### Development Mode

Run the agent in development mode with hot reloading:
```bash
npm run dev
```

### Production Mode

Build and run the agent:
```bash
npm run build
npm start
```

### Watch Mode

Build with file watching:
```bash
npm run watch
```

## How It Works

### 1. Event Monitoring
The agent continuously monitors the SEI blockchain for `BatterySwapped` events emitted by the Vyan contract. When an event is detected:

- Checks if the affected station belongs to the monitored operator

### 2. Gemini AI Route Optimization
The agent uses Google's Gemini AI to optimize rebalancing routes by analyzing:

- **Traffic Data**: Real-time traffic patterns around Bangalore EV stations (Cubbon Park, Trinity Circle, Indiranagar, Forum Mall Koramangala)
- **Demand Forecasting**: Historical station activity logs from the past 7 days
- **Route Optimization**: AI-generated recommendations considering traffic, demand patterns, and optimal timing
- **Risk Assessment**: Identification of potential issues and efficiency improvements

The optimization process includes:
- Mock traffic data generation for testing
- Station activity pattern analysis
- AI-powered route optimization
- Execution scheduling recommendations
- Efficiency improvement estimates

## Testing

### Run All Tests
```bash
npm test
```

### Test Gemini Optimization
Test the AI route optimization functionality:
```bash
npm run test:gemini
```

**Note**: Make sure you have set the `GEMINI_API_KEY` environment variable before running the Gemini tests.
- Triggers rebalancing analysis if needed

### 2. Station Analysis
For each station, the agent:
- Queries `getStationDetails` to get current status
- Calculates utilization rate and available slots
- Determines if rebalancing is needed based on configurable thresholds

### 3. Rebalancing Route Generation
The agent generates rebalancing routes by:
- Identifying stations with excess batteries (high available slots)
- Finding stations that need batteries (low available slots)
- Calculating optimal routes considering distance and priority
- Prioritizing routes based on urgency and impact

### 4. Route Optimization (Future)
Integration with Gemini API will provide:
- AI-powered route optimization
- Traffic and weather considerations
- Cost-benefit analysis
- Multi-vehicle routing

## Testing

### Test Gemini Integration

Test the new Gemini API integration:

```bash
# Test basic Gemini functionality
npm run test:simple-gemini

# Test full rebalancing with Gemini optimization
npm run test:gemini

# Run all tests
npm test
```

**Note**: Make sure you have set the `GEMINI_API_KEY` environment variable before running Gemini tests.

### Test Structure

- `test:simple-gemini`: Tests basic Gemini API connectivity and structured output
- `test:gemini`: Tests the full rebalancing service with Gemini optimization
- `test`: Runs all non-Gemini tests

## Configuration

### Rebalancing Thresholds

- `MIN_AVAILABLE_SLOTS`: Minimum number of available slots before rebalancing is needed
- `REBALANCING_THRESHOLD`: Utilization rate threshold (0.2 = 80% utilization triggers rebalancing)

### Monitoring Intervals

- `EVENT_POLLING_INTERVAL`: How often to check for new events (default: 30 seconds)
- `REBALANCING_CHECK_INTERVAL`: How often to perform rebalancing analysis (default: 5 minutes)

## API Reference

### VyanContract

- `getAllStations()`: Get all stations from the contract
- `getStationDetails(stationId)`: Get detailed station information
- `getOperatorStations(operator)`: Get stations operated by a specific address
- `getStationBatteries(stationId)`: Get batteries at a specific station

### RebalancingService

- `analyzeStationStatus(stationId)`: Analyze if a station needs rebalancing
- `generateRebalancingRoutes(source, target)`: Generate routes between stations
- `generateRebalancingRecommendation(operator)`: Get comprehensive rebalancing plan

### EventMonitor

- `startMonitoring()`: Start listening to blockchain events
- `stopMonitoring()`: Stop event monitoring
- `manualRebalancingAnalysis()`: Trigger manual rebalancing analysis

## Example Output

```
🚀 Initializing Vyan AI Agent...
✅ Configuration validated
✅ SEI client initialized
✅ Operator address: sei1abc...xyz
📡 Contract connection successful. Found 15 total stations
🏪 Operator has 8 stations
✅ Contract connection tested
🎉 Vyan AI Agent initialized successfully!
🚀 Starting Vyan AI Agent...
✅ Event monitoring started
🔍 Performing initial rebalancing analysis...
Rebalancing analysis complete. 3 stations require immediate attention.
Generated 5 rebalancing routes (2 high priority).
Total batteries to move: 12.
High priority rebalancing routes:
  station_001 → station_005: 4 batteries (Rebalance from excess station (8/10) to needy station (1/10))
  station_003 → station_007: 3 batteries (Rebalance from excess station (6/8) to needy station (2/8))
🎯 Vyan AI Agent is now running and monitoring for rebalancing opportunities
```

## Error Handling

The agent includes comprehensive error handling:
- Graceful degradation on blockchain errors
- Automatic retry mechanisms
- Detailed logging for debugging
- Graceful shutdown on SIGINT/SIGTERM

## Security Considerations

- **Private Key Management**: Uses environment variables for sensitive data
- **Network Security**: Validates RPC endpoints and contract addresses
- **Error Logging**: Avoids logging sensitive information
- **Rate Limiting**: Configurable polling intervals to prevent spam

## Future Enhancements

- [x] Gemini API integration for route optimization
- [ ] Multi-operator support
- [ ] Historical data analysis
- [ ] Predictive rebalancing
- [ ] Web dashboard for monitoring
- [ ] SMS/email alerts for urgent rebalancing needs
- [ ] Integration with fleet management systems

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the logs for detailed error information
- Verify your configuration and network connectivity
