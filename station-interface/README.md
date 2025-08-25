# Vyan Battery Station Interface

A lightweight React-based interface for battery swap stations running on Raspberry Pi devices. This interface handles QR code authentication, battery swap operations, and integrates with the Vyan mobile app ecosystem.

## Features

- **QR Code Authentication**: Secure user authentication via QR code scanning
- **Auto-Refresh QR**: QR codes refresh every 30 seconds for security
- **Real-time Status**: Display station battery levels and available batteries
- **Swap Operations**: Complete battery swap process with visual feedback
- **ThirdWeb Integration**: Blockchain integration for token rewards
- **Clean UI**: Neumorphic design optimized for touch interfaces on Pi displays

## User Journey

1. **Tap to Start**: User taps "Tap to Get Started" on station display
2. **QR Code Display**: Station shows QR code that refreshes every 30 seconds
3. **Mobile App Scan**: User scans QR with Vyan mobile app
4. **Authentication**: Station displays "Hi [username], follow instructions on your app"
5. **Swap Process**: User follows mobile app instructions to complete swap
6. **Success**: Station shows success message and returns to idle state

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

2. Install dependencies using bun:
```bash
bun install
```

3. Create environment file:
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. Start the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

For deployment on Raspberry Pi:

```bash
bun run build
bun start
```

## Configuration

### Environment Variables

Create a `.env.local` file in the station interface directory:

```env
NEXT_PUBLIC_TEMPLATE_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # SwapToken contract address
NEXT_PUBLIC_STATION_ID=1 # Unique station identifier
NEXT_PUBLIC_APP_URL=https://your-vyan-app.com # Vyan mobile app URL
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
