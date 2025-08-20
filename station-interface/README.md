# Battery Swap Station Interface

A lightweight React-based interface for battery swap stations running on Raspberry Pi devices. This interface handles NFC authentication, battery swap operations, and communicates with the SwapToken smart contract.

## Features

- **NFC Authentication**: Secure user authentication via NFC tap
- **Real-time Status**: Display station battery levels and available batteries
- **Swap Operations**: Complete battery swap process with visual feedback
- **Token Integration**: Automatic SwapToken rewards for completed swaps
- **Priority Lane**: Support for priority lane access based on staked tokens
- **Responsive Design**: Optimized for touch interfaces on Pi displays

## User Journey

1. **User Arrives**: Rider finds nearest station with capacity visible
2. **NFC Authentication**: User taps phone via NFC → station authenticates
3. **Backend Recording**: Station sends signed swap event to backend
4. **Contract Update**: Smart contract receives update event and mints tokens
5. **Token Reward**: Frontend displays token reward to user

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Raspberry Pi with touch display (recommended)

### Installation

1. Clone the repository and navigate to the station interface:
```bash
cd station-interface
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

For deployment on Raspberry Pi:

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

Create a `.env.local` file in the station interface directory:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # SwapToken contract address
NEXT_PUBLIC_STATION_ID=1 # Unique station identifier
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 # Backend API URL
```

### Station Registration

Each station must be registered in the SwapToken contract before it can process swaps. The contract owner can register stations using the `registerStation` function.

## Interface Components

### Main States

1. **Idle State**: Waiting for NFC authentication
2. **Authentication**: User taps NFC, verifying identity
3. **User Info**: Displaying user details and swap tokens
4. **Swap Progress**: Visual feedback during battery swap
5. **Completion**: Success confirmation and token rewards

### Key Features

- **Station Status**: Real-time battery levels and availability
- **NFC Simulation**: Button for testing without physical NFC hardware
- **Token Display**: Show user's SwapToken balance and priority lane status
- **Progress Indicators**: Visual feedback for all operations
- **Error Handling**: Graceful error states and recovery

## Integration with Smart Contract

The station interface integrates with the SwapToken smart contract for:

- **Token Rewards**: Automatic minting of 10 SWAP tokens per swap
- **Priority Lane**: Check user's staked tokens for priority access
- **Event Tracking**: Record all swap events on-chain
- **Statistics**: Track user and station performance metrics

## Styling

The interface uses the same neumorphic design system as the main frontend:

- Dark theme with gradient backgrounds
- Neumorphic shadows and highlights
- Consistent color palette and typography
- Touch-friendly button sizes and spacing

## Development

### File Structure

```
station-interface/
├── src/
│   └── app/
│       ├── globals.css      # Global styles
│       ├── layout.tsx       # Root layout
│       └── page.tsx         # Main interface
├── tailwind.config.ts       # Tailwind configuration
├── package.json            # Dependencies
└── README.md              # This file
```

### Adding Features

1. **New Components**: Add to `src/app/page.tsx` or create separate component files
2. **Styling**: Use existing Tailwind classes and neumorphic design patterns
3. **State Management**: Use React hooks for local state management
4. **API Integration**: Add backend communication functions as needed

## Troubleshooting

### Common Issues

1. **NFC Not Working**: Use the "Simulate NFC Tap" button for testing
2. **Contract Connection**: Verify contract address in environment variables
3. **Styling Issues**: Ensure Tailwind CSS is properly configured
4. **Performance**: Optimize for Raspberry Pi hardware limitations

### Performance Tips

- Use lightweight images and icons
- Minimize JavaScript bundle size
- Optimize for touch interactions
- Cache static assets locally

## License

MIT License - see LICENSE file for details
