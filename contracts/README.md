# SwapToken Smart Contract

A Solidity smart contract for managing battery swap rewards and priority lane access. This contract implements an ERC20 token system with staking functionality for the battery swap ecosystem.

## Features

- **ERC20 Token**: Standard token implementation for SwapToken (SWAP)
- **Battery Swap Rewards**: Automatic token minting for completed swaps
- **Priority Lane Staking**: Stake tokens to unlock priority lane access
- **Station Management**: Register and manage battery swap stations
- **Event Tracking**: Comprehensive event logging for all operations
- **Security**: Reentrancy protection and access controls

## Contract Overview

### Core Functionality

1. **Token Rewards**: Users receive 10 SWAP tokens for each completed battery swap
2. **Priority Lane**: Stake 100+ tokens for 7+ days to unlock priority lane access
3. **Station Registration**: Only registered stations can process swaps
4. **Statistics Tracking**: Monitor user and station performance metrics

### Key Constants

- `MINIMUM_STAKE_AMOUNT`: 100 tokens (100 * 10^18 wei)
- `MINIMUM_STAKE_DURATION`: 7 days
- `SWAP_REWARD_AMOUNT`: 10 tokens per swap (10 * 10^18 wei)

## Contract Functions

### Station Management

#### `registerStation(address stationAddress, string location)`
- **Access**: Owner only
- **Purpose**: Register a new battery swap station
- **Parameters**:
  - `stationAddress`: Contract/interface address of the station
  - `location`: Physical location description

#### `completeBatterySwap(address user, uint256 stationId)`
- **Access**: Registered stations only
- **Purpose**: Complete a battery swap and reward tokens
- **Parameters**:
  - `user`: Address of the user who completed the swap
  - `stationId`: ID of the station where swap occurred

### Staking Functions

#### `stakeForPriorityLane(uint256 amount, uint256 lockDuration)`
- **Purpose**: Stake tokens for priority lane access
- **Requirements**:
  - Minimum 100 tokens
  - Minimum 7 days lock duration
  - Sufficient token balance
  - No active stake

#### `unstakeFromPriorityLane()`
- **Purpose**: Unstake tokens after lock period
- **Requirements**: Active stake with expired lock period

#### `hasPriorityAccess(address user)`
- **Purpose**: Check if user has priority lane access
- **Returns**: Boolean indicating priority access status

### Query Functions

#### `getPriorityStake(address user)`
- **Purpose**: Get user's priority stake information
- **Returns**: Stake amount, lock times, status, and unstake eligibility

#### `getStation(uint256 stationId)`
- **Purpose**: Get station information
- **Returns**: Station address, location, status, and statistics

#### `getUserStats(address user)`
- **Purpose**: Get user statistics
- **Returns**: Total swaps, total rewards, and current balance

### Administrative Functions

#### `deactivateStation(uint256 stationId)`
- **Access**: Owner only
- **Purpose**: Deactivate a station in emergency situations

## Events

### `BatterySwapCompleted`
- Emitted when a battery swap is completed
- Parameters: user address, station ID, tokens rewarded, timestamp

### `PriorityLaneStaked`
- Emitted when tokens are staked for priority lane
- Parameters: user address, amount, lock duration, timestamp

### `PriorityLaneUnstaked`
- Emitted when tokens are unstaked from priority lane
- Parameters: user address, amount, timestamp

### `StationRegistered`
- Emitted when a new station is registered
- Parameters: station ID, station address, location, timestamp

## Deployment

### Prerequisites

- Hardhat or Truffle development environment
- OpenZeppelin contracts library
- Solidity compiler 0.8.19+

### Installation

1. Install dependencies:
```bash
npm install @openzeppelin/contracts
```

2. Deploy the contract:
```bash
npx hardhat run scripts/deploy.js --network <network>
```

### Initial Setup

1. **Deploy Contract**: Deploy SwapToken to your target network
2. **Register Stations**: Call `registerStation` for each battery swap station
3. **Configure Frontend**: Update frontend with contract address
4. **Test Integration**: Verify station-station interface communication

## Security Considerations

### Access Controls
- Only contract owner can register stations
- Only registered stations can complete swaps
- Users cannot transfer tokens while staked

### Reentrancy Protection
- All external calls are protected against reentrancy attacks
- State changes occur before external calls

### Input Validation
- All function parameters are validated
- Address zero checks for user addresses
- Minimum requirements for staking operations

## Integration Guide

### Frontend Integration

1. **Contract Address**: Store deployed contract address
2. **Web3 Provider**: Connect to blockchain network
3. **Event Listening**: Listen for swap completion events
4. **User Interface**: Display token balances and staking status

### Station Interface Integration

1. **Station Registration**: Each station must be registered
2. **Swap Completion**: Call `completeBatterySwap` after successful swap
3. **User Authentication**: Verify user identity before processing
4. **Error Handling**: Handle contract call failures gracefully

### Backend Integration

1. **Event Monitoring**: Monitor contract events for swap completions
2. **User Management**: Track user statistics and preferences
3. **Station Management**: Monitor station performance and status
4. **Analytics**: Collect data for business intelligence

## Testing

### Unit Tests

Run the test suite:
```bash
npx hardhat test
```

### Test Coverage

Generate coverage report:
```bash
npx hardhat coverage
```

### Manual Testing

1. **Deploy to Testnet**: Use Sepolia or Goerli for testing
2. **Register Test Station**: Create test station for development
3. **Simulate Swaps**: Test complete swap flow
4. **Test Staking**: Verify priority lane functionality

## Gas Optimization

### Current Gas Costs

- `registerStation`: ~50,000 gas
- `completeBatterySwap`: ~80,000 gas
- `stakeForPriorityLane`: ~120,000 gas
- `unstakeFromPriorityLane`: ~60,000 gas

### Optimization Tips

- Batch operations where possible
- Use events for off-chain data
- Optimize storage patterns
- Minimize external calls

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
1. Check the documentation
2. Review the test files
3. Open an issue on GitHub
4. Contact the development team
