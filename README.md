# Vyan - Battery Swap Ecosystem

A complete battery swap ecosystem with mobile app, station interface, and blockchain integration. Users can find nearby stations, swap batteries via NFC, and earn tokens for discounts and priority access.

## 🚀 Project Overview

Vyan is a decentralized battery swap network that enables electric vehicle users to quickly swap their depleted batteries for fully charged ones. The system includes:

- **Mobile App**: Find stations, view capacity, and manage tokens
- **Station Interface**: Raspberry Pi-based station control system
- **Smart Contract**: SwapToken ERC20 contract for rewards and staking
- **Backend**: API for station management and user data

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │ Station Interface│    │  Smart Contract │
│   (Frontend)    │◄──►│   (Raspberry Pi) │◄──►│   (SwapToken)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Backend API  │
                    │   (Node.js)     │
                    └─────────────────┘
```

## 📱 User Journey

1. **Find Station**: User opens app, finds nearest station with capacity
2. **Arrive & Tap**: User arrives at station, taps phone via NFC
3. **Authentication**: Station Pi verifies identity and releases battery
4. **Backend Record**: Pi sends signed swap event to backend
5. **Token Reward**: User receives SwapTokens in their wallet
6. **Redeem**: Tokens can be staked for priority lane or used for discounts

## 🛠️ Components

### Frontend (`/frontend`)
- Tesla Cybertruck-inspired mobile interface
- Neumorphic design system
- Real-time vehicle status monitoring
- Battery and climate controls

### Station Interface (`/station-interface`)
- Lightweight React app for Raspberry Pi
- NFC authentication simulation
- Battery swap process management
- Token reward display
- Same styling as main frontend

### Smart Contract (`/contracts`)
- **SwapToken.sol**: ERC20 token with staking functionality
- Automatic token rewards (10 SWAP per swap)
- Priority lane staking (100+ tokens for 7+ days)
- Station registration and management
- Comprehensive event tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Hardhat (for smart contract development)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd vyan
```

2. **Install dependencies**:
```bash
# Frontend
cd frontend
npm install

# Station Interface
cd ../station-interface
npm install

# Smart Contract
cd ../contracts
npm install
```

3. **Start development servers**:
```bash
# Frontend (port 3000)
cd frontend
npm run dev

# Station Interface (port 3001)
cd ../station-interface
npm run dev
```

4. **Deploy smart contract**:
```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

## 🎨 Design System

The project uses a consistent neumorphic design system:

- **Colors**: Dark theme with custom color palette
- **Shadows**: Neumorphic shadows for depth and interaction
- **Typography**: Inter font family
- **Components**: Reusable UI components across interfaces

### Key Design Elements
- `bg-custom-bg-dark`: Primary background (#111114)
- `bg-custom-bg-light`: Secondary background (#36363C)
- `shadow-neuro-dark-outset`: Outset shadows for buttons
- `shadow-neuro-dark-inset`: Inset shadows for pressed states

## 🔧 Configuration

### Environment Variables

#### Frontend
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### Station Interface
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STATION_ID=1
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### Smart Contract
```env
PRIVATE_KEY=your_private_key
INFURA_URL=your_infura_url
```

## 📊 Smart Contract Features

### SwapToken (SWAP)
- **Total Supply**: 1,000,000 tokens
- **Swap Reward**: 10 tokens per battery swap
- **Minimum Stake**: 100 tokens for priority lane
- **Lock Duration**: 7 days minimum for staking

### Key Functions
- `completeBatterySwap()`: Process swap and reward tokens
- `stakeForPriorityLane()`: Stake tokens for priority access
- `registerStation()`: Register new swap stations
- `getUserStats()`: Get user statistics and balances

## 🔐 Security Features

- **Access Controls**: Only registered stations can process swaps
- **Reentrancy Protection**: Secure against reentrancy attacks
- **Input Validation**: Comprehensive parameter validation
- **Event Logging**: All operations logged on-chain

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test
```

### Smart Contract Testing
```bash
cd contracts
npx hardhat test
npx hardhat coverage
```

### Integration Testing
1. Deploy contract to testnet
2. Register test station
3. Test complete swap flow
4. Verify token rewards and staking

## 📈 Performance

### Frontend
- Optimized for mobile devices
- Lazy loading and code splitting
- Efficient state management

### Station Interface
- Lightweight for Raspberry Pi
- Touch-optimized interactions
- Minimal resource usage

### Smart Contract
- Gas-optimized operations
- Efficient storage patterns
- Batch operations where possible

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy to your preferred platform
```

### Station Interface (Raspberry Pi)
```bash
cd station-interface
npm run build
npm start
```

### Smart Contract (Mainnet)
```bash
cd contracts
npx hardhat run scripts/deploy.js --network mainnet
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Open a new issue with details
4. Contact the development team

## 🔮 Roadmap

- [ ] Real NFC hardware integration
- [ ] Multi-chain support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] IoT sensor integration
- [ ] Machine learning for demand prediction

---

Built with ❤️ for the future of sustainable transportation
