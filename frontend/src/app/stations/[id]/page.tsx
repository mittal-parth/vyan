"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import PaymentSuccess from "@/components/PaymentSuccess";
import AnimatedBattery from "@/components/AnimatedBattery";
import DraggableSlider from "@/components/DraggableSlider";
import { getStationByNumericId, type Station } from "@/data/stations";
import { TbBattery, TbBolt, TbCoin, TbWallet, TbArrowLeft, TbQrcode, TbCamera } from "react-icons/tb";
import { readContract, prepareContractCall, sendTransaction, createThirdwebClient, getContract, defineChain, getRpcClient, eth_getBalance } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { contract, client, chain } from "@/app/client";
// QR Scanner will be dynamically imported to avoid SSR issues

// Station-specific InfoCard component
function StationInfoCard({ title, subtitle, className = "flex-1" }: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={`bg-custom-bg-shadow-dark rounded-lg shadow-neuro-dark-deep p-4 ${className} flex flex-col justify-center items-center text-center`}>
      <div className="text-emerald-600 text-2xl mb-1">{subtitle}</div>
      <div className="text-neutral-400 text-xs font-medium">{title}</div>
    </div>
  );
}

export default function StationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const account = useActiveAccount();
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [batteryInserted, setBatteryInserted] = useState(false);
  const [batteryReady, setBatteryReady] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scannedStationId, setScannedStationId] = useState<string | null>(null);
  const [swapFee, setSwapFee] = useState<bigint>(BigInt(0));
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userBatteryId, setUserBatteryId] = useState<bigint | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [batteryForm, setBatteryForm] = useState({
    capacity: '75',
    currentCharge: '15',
    healthScore: '85'
  });
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrScannerRef = useRef<any | null>(null);
  const isDragging = useRef(false);

  // Get station data from centralized data
  const station = getStationByNumericId(parseInt(params.id));
  
  if (!station) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-sm mx-auto space-y-8">
          <Header />
          <div className="text-center pt-6">
            <h1 className="text-neutral-200 text-2xl">Station Not Found</h1>
            <p className="text-neutral-400 text-sm mt-2">The requested station could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsScanning(true);
      
      // Dynamically import QR Scanner to avoid SSR issues
      const QrScanner = (await import('qr-scanner')).default;
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      // Wait for video to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          // Initialize QR Scanner
          qrScannerRef.current = new QrScanner(
            videoRef.current!,
            (result) => handleQRScanResult(result.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment'
            }
          );
          qrScannerRef.current.start();
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleQRScanResult = async (qrData: string) => {
    try {
      setQrResult(qrData);
      console.log('QR Scanned:', qrData);
      
      // Parse QR data (JSON from station interface backend)
      const qrInfo = JSON.parse(qrData);
      console.log('Parsed QR Info:', qrInfo);
      
      // Handle both field naming conventions
      const stationId = qrInfo.stationId || qrInfo.station_id;
      const token = qrInfo.token;
      const expiresAt = qrInfo.expiresAt || qrInfo.expires_at;
      
      if (!stationId || !token || !expiresAt) {
        console.error('Missing fields in QR:', { stationId, token, expiresAt });
        throw new Error('Invalid QR code format - missing required fields');
      }
      
      // Check if token has expired
      if (Date.now() > expiresAt) {
        throw new Error('QR code has expired');
      }
      
      setScannedStationId(stationId);
      
      // Stop camera
      stopCamera();
      
      // Start session with backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const sessionResponse = await fetch(`${backendUrl}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          userId: account?.address || 'anonymous', // Use wallet address as user ID
          token,
          expiresAt
        }),
      });
      
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to start session');
      }
      
      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.sessionId);
      
      // Load station details and calculate fee
      await loadStationDetails(stationId);
      
      // Proceed to next step
      setHasScanned(true);
      
    } catch (error) {
      console.error('QR scan error:', error);
      setCameraError(error instanceof Error ? error.message : 'Failed to process QR code');
      stopCamera();
    }
  };

  const checkUserBalance = async () => {
    if (!account) return BigInt(0);

    try {
      console.log('Checking balance for address:', account.address);
      console.log('Using chain ID:', chain.id);
      
      // Method 1: Try using eth_getBalance RPC call
      try {
        const rpcRequest = getRpcClient({ client, chain });
        const balance = await eth_getBalance(rpcRequest, {
          address: account.address,
          blockTag: "latest"
        });
        
        setUserBalance(balance);
        console.log('User SEI balance:', balance.toString(), 'wei');
        console.log('User SEI balance (ETH):', (Number(balance) / 1e18).toFixed(6), 'SEI');
        return balance;
      } catch (rpcError) {
        console.warn('RPC balance check failed, trying alternative method:', rpcError);
        
        // Method 2: Use direct RPC call as fallback
        const response = await fetch(`https://1328.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [account.address, 'latest'],
            id: 1
          })
        });
        
        const data = await response.json();
        console.log('RPC response:', data);
        if (data.result) {
          const balance = BigInt(data.result);
          setUserBalance(balance);
          console.log('User SEI balance (fallback):', balance.toString(), 'wei');
          console.log('User SEI balance (fallback ETH):', (Number(balance) / 1e18).toFixed(6), 'SEI');
          return balance;
        }
        
        throw new Error('Both balance check methods failed');
      }
    } catch (error) {
      console.error('Failed to check balance:', error);
      return BigInt(0);
    }
  };

  const loadStationDetails = async (stationId: string) => {
    try {
      if (!account) {
        console.warn('No wallet connected, using default fee');
        setSwapFee(BigInt("5000000000000000")); // 0.005 ETH default
        return;
      }

      // Check user balance first
      await checkUserBalance();

      // First check if station exists
      const stationExists = await readContract({
        contract,
        method: "function getStationExists(string memory stationId) view returns (bool)",
        params: [stationId]
      });

      if (!stationExists) {
        console.warn(`Station ${stationId} does not exist in contract`);
        
        // Check what stations exist
        console.log('Checking existing stations...');
        const allStations = await readContract({
          contract,
          method: "function getAllStations() view returns ((string id, string name, string location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, uint256[] batteries, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)[])",
          params: []
        });
        
        console.log('Existing stations:', allStations);
        
        // If there are existing stations, use the first one
        if (allStations.length > 0) {
          const existingStationId = allStations[0].id;
          console.log(`Using existing station: ${existingStationId}`);
          setScannedStationId(existingStationId);
          // Recursively call with existing station
          await loadStationDetails(existingStationId);
          return;
        }
        
        // No stations exist, need to register one
        console.log('No stations exist, registering station 1...');
        try {
          const registerStationTx = prepareContractCall({
            contract,
            method: "function registerStation(string memory _stationId, string memory _name, string memory _location, int256 _latitude, int256 _longitude, uint256 _totalSlots, uint256 _baseFee, uint16 _rating, uint256 _availableSlots)",
            params: [
              stationId,                    // _stationId
              `Battery Station ${stationId}`,  // _name
              `Location ${stationId}`,      // _location
              BigInt(37774900),             // _latitude (37.7749 * 1e6)
              BigInt(-122419400),           // _longitude (-122.4194 * 1e6)
              BigInt(20),                   // _totalSlots
              BigInt("5000000000000000"),   // _baseFee (0.005 ETH)
              BigInt(50),                   // _rating (5.0 out of 5)
              BigInt(12)                    // _availableSlots
            ]
          });
          
          console.log('Registering station...');
          const result = await sendTransaction({
            transaction: registerStationTx,
            account: account
          });
          
          console.log('Station registered:', result.transactionHash);
          
          // Wait for transaction to be processed
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Now recursively call with the registered station
          await loadStationDetails(stationId);
          return;
          
        } catch (regError) {
          console.error('Failed to register station:', regError);
          
          // Load user batteries anyway
          const userBatteries = await readContract({
            contract,
            method: "function getUserBatteries(address user) view returns ((uint256 id, uint256 capacity, uint256 currentCharge, uint256 healthScore, uint256 cycleCount, uint256 manufactureDate, string currentStationId, address currentOwner, bool isAvailableForSwap)[])",
            params: [account.address]
          });

          if (userBatteries.length > 0) {
            const batteryId = userBatteries[0].id;
            setUserBatteryId(batteryId);
          }
          
          setSwapFee(BigInt("5000000000000000")); // Default fee
          return;
        }
      }

      // Get station details from contract
      const stationData = await readContract({
        contract,
        method: "function getStationDetails(string memory stationId) view returns (string memory name, string memory location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)",
        params: [stationId]
      });

      console.log('Station data from contract:', stationData);

      // Calculate swap fee - need to get user's battery first
      const userBatteries = await readContract({
        contract,
        method: "function getUserBatteries(address user) view returns ((uint256 id, uint256 capacity, uint256 currentCharge, uint256 healthScore, uint256 cycleCount, uint256 manufactureDate, string currentStationId, address currentOwner, bool isAvailableForSwap)[])",
        params: [account.address]
      });

      // Get the first available battery for fee calculation
      if (userBatteries.length > 0) {
        const batteryId = userBatteries[0].id;
        setUserBatteryId(batteryId);
        
        const fee = await readContract({
          contract,
          method: "function calculateSwapFee(string memory stationId, uint256 batteryId) view returns (uint256)",
          params: [stationId, batteryId]
        });
        
        console.log('Calculated swap fee:', fee);
        setSwapFee(fee);
      } else {
        // User needs to register a battery first
        console.log('No batteries found - user needs to register one');
        setUserBatteryId(null);
        setSwapFee(BigInt("5000000000000000")); // Default fee for display
        throw new Error('No batteries found. Please register a battery first.');
      }

    } catch (error) {
      console.error('Failed to load station details:', error);
      // Use fallback fee
      setSwapFee(BigInt("5000000000000000")); // 0.005 ETH
    }
  };

  const handleStartScan = () => {
    startCamera();
  };

  const handleBatteryInserted = () => {
    setBatteryInserted(true);
    setBatteryReady(true);
  };

  const handleRegisterBattery = async () => {
    if (!account) {
      setCameraError('Please connect your wallet first');
      return;
    }

    // Validate form inputs
    const capacity = parseFloat(batteryForm.capacity);
    const currentCharge = parseFloat(batteryForm.currentCharge);
    const healthScore = parseFloat(batteryForm.healthScore);

    if (capacity <= 0 || capacity > 200) {
      setCameraError('Battery capacity must be between 1-200 kWh');
      return;
    }
    if (currentCharge < 0 || currentCharge > 100) {
      setCameraError('Current charge must be between 0-100%');
      return;
    }
    if (healthScore < 0 || healthScore > 100) {
      setCameraError('Health score must be between 0-100%');
      return;
    }

    try {
      setIsProcessingPayment(true);
      console.log('Registering new battery...', {
        capacity: capacity * 1000, // kWh * 1000 as per contract requirement
        currentCharge,
        healthScore
      });

      const registerTx = prepareContractCall({
        contract,
        method: "function registerBattery(uint256 _capacity, uint256 _currentCharge, uint256 _healthScore, address _initialOwner)",
        params: [
          BigInt(Math.round(capacity * 1000)), // kWh * 1000 as specified in contract
          BigInt(Math.round(currentCharge)),   // 0-100 percentage
          BigInt(Math.round(healthScore)),     // 0-100 percentage  
          account.address                      // initial owner
        ]
      });
      
      const registerResult = await sendTransaction({
        transaction: registerTx,
        account: account
      });
      
      console.log('Battery registered:', registerResult.transactionHash);
      
      // Wait a moment for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload station details to get the new battery
      if (scannedStationId) {
        await loadStationDetails(scannedStationId);
      }
      
      setCameraError(null);
      setShowRegisterForm(false);
      alert('Battery registered successfully! You can now proceed with the swap.');
      
    } catch (error) {
      console.error('Battery registration failed:', error);
      if (error instanceof Error) {
        setCameraError(`Failed to register battery: ${error.message}`);
      } else {
        setCameraError('Failed to register battery. Please try again.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSwapPayment = async () => {
    if (!account) {
      setCameraError('Please connect your wallet to continue');
      setIsSliderActive(false);
      setSliderPosition(0);
      return;
    }

    if (!scannedStationId || !sessionId) {
      setCameraError('Invalid session. Please scan QR code again.');
      setIsSliderActive(false);
      setSliderPosition(0);
      return;
    }

    try {
      setIsProcessingPayment(true);
      setShowToast(true);
      
      console.log('Starting blockchain transaction...');
      
      // Check balance before proceeding
      const currentBalance = await checkUserBalance();
      
      // Debug logging
      console.log('Balance check details:');
      console.log('- Current balance (wei):', currentBalance.toString());
      console.log('- Swap fee (wei):', swapFee.toString());
      console.log('- Current balance (SEI):', (Number(currentBalance) / 1e18).toFixed(6));
      console.log('- Swap fee (SEI):', (Number(swapFee) / 1e18).toFixed(6));
      console.log('- Comparison result (insufficient?):', currentBalance < swapFee);
      
      if (currentBalance < swapFee) {
        const balanceETH = (Number(currentBalance) / 1e18).toFixed(6);
        const feeETH = (Number(swapFee) / 1e18).toFixed(6);
        
        console.log('ERROR: Insufficient balance detected');
        setShowInsufficientFunds(true);
        setCameraError(`Insufficient SEI balance. You have ${balanceETH} SEI but need ${feeETH} SEI for this swap.`);
        setIsProcessingPayment(false);
        setShowToast(false);
        setIsSliderActive(false);
        setSliderPosition(0);
        return;
      }
      
      console.log('✅ Balance check passed, proceeding with transaction');
      console.log('Station ID:', scannedStationId);
      console.log('Session ID:', sessionId);
      console.log('Swap Fee:', swapFee.toString());

      if (!userBatteryId) {
        throw new Error('No battery available for swap. Please register a battery first.');
      }

      console.log('User Battery ID:', userBatteryId.toString());

      // Execute blockchain transaction
      const swapTransaction = prepareContractCall({
        contract,
        method: "function swapBattery(string memory stationId, uint256 userBatteryId)",
        params: [scannedStationId, userBatteryId],
        value: swapFee // Pay the swap fee in native currency
      });
      
      console.log('Sending transaction...');
      const result = await sendTransaction({
        transaction: swapTransaction,
        account: account
      });
      
      console.log('Transaction successful:', result.transactionHash);
      
      // Update session status to payment_confirmed with real transaction hash
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/session/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: 'payment_confirmed',
          transactionHash: result.transactionHash,
          batterySlot: 'A-7'
        }),
      });
      
      console.log('Session updated with transaction hash');
      
      // Reset slider and show success
      setIsSliderActive(false);
      setSliderPosition(0);
      setIsProcessingPayment(false);
      
      // Show payment success after toast
      setTimeout(() => {
        setPaymentSuccessful(true);
      }, 1000);
      
    } catch (error) {
      console.error('Payment failed:', error);
      setIsSliderActive(false);
      setSliderPosition(0);
      setIsProcessingPayment(false);
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          setCameraError('Transaction cancelled by user.');
        } else if (error.message.includes('insufficient funds')) {
          setCameraError('Insufficient funds for transaction.');
        } else {
          setCameraError(`Transaction failed: ${error.message}`);
        }
      } else {
        setCameraError('Transaction failed. Please try again.');
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    
    try {
      const rect = sliderRef.current.getBoundingClientRect();
      const newPosition = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setSliderPosition(newPosition);
      
      if (newPosition >= 90) {
        setIsSliderActive(true);
        // Trigger actual swap process with blockchain
        handleSwapPayment();
      }
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
      isDragging.current = false;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    
    try {
      const rect = sliderRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const newPosition = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
      setSliderPosition(newPosition);
      
      if (newPosition >= 90) {
        setIsSliderActive(true);
        // Trigger actual swap process with blockchain
        handleSwapPayment();
      }
    } catch (error) {
      console.error('Error in handleTouchMove:', error);
      isDragging.current = false;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (!isSliderActive) {
      setSliderPosition(0);
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (!isSliderActive) {
      setSliderPosition(0);
    }
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Show QR Scanner Interface
  if (!hasScanned) {
    return (
      <div className="min-h-screen">
        <div className="max-w-sm mx-auto space-y-8">
          <Header />
          
          <div className="px-6">
            {/* Station Name */}
            <div className="text-center pb-8">
              <h1 className="text-neutral-200 text-2xl">{station.name}</h1>
              <p className="text-neutral-400 text-sm mt-2">{station.location}</p>
            </div>

            {/* QR Scanner Interface */}
            <div className="text-center space-y-6">
              {!isScanning ? (
                <>
                  <div className="bg-custom-bg-shadow-dark rounded-2xl shadow-neuro-dark-deep p-8">
                    <TbQrcode className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-neutral-200 text-xl mb-2">Scan QR Code</h2>
                    <p className="text-neutral-400 text-sm mb-6">
                      Scan the QR code on your battery to begin the swap process
                    </p>
                    <button
                      onClick={handleStartScan}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
                    >
                      <TbCamera className="w-5 h-5" />
                      <span>Start Scanning</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-custom-bg-shadow-dark rounded-2xl shadow-neuro-dark-deep p-8">
                    <div className="relative w-64 h-64 mx-auto mb-6">
                      {/* Camera Frame with Video */}
                      <div className="absolute inset-0 border-4 border-emerald-400 rounded-2xl overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Corner Indicators */}
                          <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-emerald-400"></div>
                          <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-emerald-400"></div>
                          <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-emerald-400"></div>
                          <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-emerald-400"></div>
                          
                          {/* Center Crosshair */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 border-2 border-emerald-400 rounded-lg relative">
                              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400 transform -translate-y-1/2"></div>
                              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-400 transform -translate-x-1/2"></div>
                            </div>
                          </div>
                          
                          {/* Scanning Lines */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 animate-pulse"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 animate-pulse" style={{ animationDelay: '1s' }}></div>
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <h2 className="text-neutral-200 text-xl mb-2">Scanning...</h2>
                    <p className="text-neutral-400 text-sm">
                      Please hold the QR code steady in the frame
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-6 w-full bg-custom-bg-dark rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-2 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: '20%' }}
                      ></div>
                    </div>
                    
                    <p className="text-emerald-400 text-sm mt-2">Processing...</p>
                  </div>
                </>
              )}
              
              {/* Camera Error Display */}
              {cameraError && (
                <div className="space-y-4">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{cameraError}</p>
                    <button
                      onClick={() => {
                        setCameraError(null);
                        setShowInsufficientFunds(false);
                      }}
                      className="mt-2 text-red-300 text-xs underline hover:text-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                  
                  {showInsufficientFunds && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                      <h3 className="text-yellow-400 font-semibold mb-3">💰 Need SEI Tokens?</h3>
                      <p className="text-custom-text-light/80 text-sm mb-4">
                        Get free SEI tokens from the testnet faucet:
                      </p>
                      <div className="space-y-3">
                        <a
                          href="https://faucet.sei-testnet.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                        >
                          🚰 SEI Testnet Faucet
                        </a>
                        <p className="text-xs text-custom-text-light/60">
                          Copy your wallet address and request testnet SEI tokens
                        </p>
                        {account && (
                          <div className="bg-custom-bg-darker rounded-lg p-3">
                            <p className="text-xs text-custom-text-light/60 mb-1">Your wallet address:</p>
                            <p className="text-xs font-mono text-custom-text-light break-all">
                              {account.address}
                            </p>
                            <button
                              onClick={() => navigator.clipboard.writeText(account.address)}
                              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              📋 Copy Address
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Battery Info and Insertion Flow after QR scan
  if (!batteryReady) {
    return (
      <div className="min-h-screen">
        <div className="max-w-sm mx-auto space-y-8">
          <Header />
          
          <div className="px-6">
            {/* Station Name */}
            <div className="text-center pb-8">
              <h1 className="text-neutral-200 text-2xl">{station.name}</h1>
              <p className="text-neutral-400 text-sm mt-2">{station.location}</p>
              {scannedStationId && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
                  <p className="text-green-400 text-sm">
                    ✓ Connected to Station {scannedStationId}
                  </p>
                  {sessionId && (
                    <p className="text-green-300 text-xs mt-1">
                      Session: {sessionId.substring(0, 8)}...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Main Content: Battery + Info Cards */}
            <div className="flex space-x-8 p-6">
              {/* Left Half: Animated Battery */}
              <div className="flex-1 flex items-end justify-center">
                <AnimatedBattery percentage={station.percentage || Math.round((station.charged / station.total) * 100)} />
              </div>
              
              {/* Right Half: Three Info Cards */}
              <div className="flex-1 space-y-4">
                <StationInfoCard
                  title="Available Batteries"
                  subtitle={`${station.availableBatteries || station.charged}/${station.totalSlots || station.total}`}
                  className="w-full h-20"
                />
                <StationInfoCard
                  title="Swap Fee"
                  subtitle={`${(Number(swapFee) / 1e18).toFixed(4)} SEI`}
                  className="w-full h-20"
                />
                <StationInfoCard
                  title="Wallet Balance"
                  subtitle="150 STK"
                  className="w-full h-20"
                />
              </div>
            </div>

            {/* Battery Insertion Instructions */}
            <div className="text-center space-y-6">
              {!batteryInserted ? (
                <div className="p-6">
                  <p className="text-neutral-400 text-xs mb-6">
                    Please insert your discharged battery into the designated slot and press the button below once completed.
                  </p>
                  
                  {/* Battery Registration Required */}
                  {!userBatteryId && account && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                      <h4 className="text-red-400 text-sm font-medium mb-2">Battery Registration Required</h4>
                      <p className="text-neutral-400 text-xs mb-3">
                        You need to register a battery before you can swap. This only needs to be done once.
                      </p>
                      
                      {!showRegisterForm ? (
                        <button
                          onClick={() => setShowRegisterForm(true)}
                          className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Register My Battery
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-neutral-400 text-xs mb-1">
                              Battery Capacity (kWh)
                              <span className="text-neutral-500 ml-1">• Will be stored as kWh × 1000</span>
                            </label>
                            <input
                              type="number"
                              value={batteryForm.capacity}
                              onChange={(e) => setBatteryForm(prev => ({ ...prev, capacity: e.target.value }))}
                              placeholder="75"
                              min="1"
                              max="200"
                              step="0.1"
                              className="w-full px-3 py-2 bg-custom-bg-dark border border-neutral-600 rounded-lg text-neutral-200 text-sm focus:border-red-500 focus:outline-none"
                            />
                            <p className="text-neutral-500 text-xs mt-1">Example: 75 kWh for standard EV battery</p>
                          </div>
                          
                          <div>
                            <label className="block text-neutral-400 text-xs mb-1">
                              Current Charge Level (%)
                              <span className="text-neutral-500 ml-1">• 0-100 percentage</span>
                            </label>
                            <input
                              type="number"
                              value={batteryForm.currentCharge}
                              onChange={(e) => setBatteryForm(prev => ({ ...prev, currentCharge: e.target.value }))}
                              placeholder="15"
                              min="0"
                              max="100"
                              step="1"
                              className="w-full px-3 py-2 bg-custom-bg-dark border border-neutral-600 rounded-lg text-neutral-200 text-sm focus:border-red-500 focus:outline-none"
                            />
                            <p className="text-neutral-500 text-xs mt-1">Current battery charge percentage</p>
                          </div>
                          
                          <div>
                            <label className="block text-neutral-400 text-xs mb-1">
                              Battery Health Score (%)
                              <span className="text-neutral-500 ml-1">• 0-100, 100 = perfect</span>
                            </label>
                            <input
                              type="number"
                              value={batteryForm.healthScore}
                              onChange={(e) => setBatteryForm(prev => ({ ...prev, healthScore: e.target.value }))}
                              placeholder="85"
                              min="0"
                              max="100"
                              step="1"
                              className="w-full px-3 py-2 bg-custom-bg-dark border border-neutral-600 rounded-lg text-neutral-200 text-sm focus:border-red-500 focus:outline-none"
                            />
                            <p className="text-neutral-500 text-xs mt-1">Battery condition: 100% = new, 85% = good, 70% = fair</p>
                          </div>
                          
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => setShowRegisterForm(false)}
                              className="flex-1 py-2 bg-neutral-600 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleRegisterBattery}
                              disabled={isProcessingPayment}
                              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
                            >
                              {isProcessingPayment ? 'Registering...' : 'Register'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transaction Preview */}
                  {swapFee > 0 && userBatteryId && (
                    <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                      <h4 className="text-blue-400 text-sm font-medium mb-2">Transaction Preview</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Swap Fee:</span>
                          <span className="text-blue-300">{(Number(swapFee) / 1e18).toFixed(4)} SEI</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Battery ID:</span>
                          <span className="text-green-400">#{userBatteryId?.toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Your Balance:</span>
                          <span className={`${userBalance >= swapFee ? 'text-green-400' : 'text-red-400'}`}>
                            {(Number(userBalance) / 1e18).toFixed(4)} SEI
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Wallet Connected:</span>
                          <span className="text-green-400">{account ? '✓' : '✗'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleBatteryInserted}
                    disabled={!userBatteryId}
                    className="bg-custom-bg-shadow-dark hover:bg-custom-bg-dark text-emerald-400 text-sm hover:text-emerald-300 px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 mx-auto shadow-neuro-dark-outset hover:shadow-neuro-dark-pressed border border-custom-bg-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TbBattery className="w-5 h-5" />
                    <span>{!userBatteryId ? 'Register Battery First' : 'Battery Inserted'}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Payment Success Screen
  if (paymentSuccessful) {
    return (
      <div className="min-h-screen">
        <div className="max-w-sm mx-auto">
          <Header />
          <PaymentSuccess />
        </div>
      </div>
    );
  }

  // Show Existing UI with slider after battery is ready
  return (
    <div className="min-h-screen">
      <div className="max-w-sm mx-auto space-y-8">
        <Header />
        
        <div className="px-6">
        {/* Station Name */}
        <div className="text-center pb-8">
          <h1 className="text-neutral-200 text-2xl">{station.name}</h1>
          <p className="text-neutral-400 text-sm mt-2">{station.location}</p>
          {scannedStationId && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm">
                ✓ Connected to Station {scannedStationId}
              </p>
              {sessionId && (
                <p className="text-green-300 text-xs mt-1">
                  Session: {sessionId.substring(0, 8)}...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Main Content: Battery + Info Cards */}
        <div className="flex space-x-8 p-6">
          {/* Left Half: Animated Battery */}
          <div className="flex-1 flex items-end justify-center">
            <AnimatedBattery percentage={station.percentage || Math.round((station.charged / station.total) * 100)} />
          </div>
          
          {/* Right Half: Three Info Cards */}
          <div className="flex-1 space-y-4">
            <StationInfoCard
              title="Available Batteries"
              subtitle={`${station.availableBatteries || station.charged}/${station.totalSlots || station.total}`}
              className="w-full h-20"
            />
            <StationInfoCard
              title="Swap Fee"
              subtitle={`${(Number(swapFee) / 1e18).toFixed(4)} SEI`}
              className="w-full h-20"
            />
            <StationInfoCard
              title="Wallet Balance"
              subtitle="150 STK"
              className="w-full h-20"
            />
          </div>
        </div>

        {/* Battery Status Message */}
        {batteryInserted && (
          <div className="text-center pt-6">
            <p className="text-emerald-400 text-sm font-medium">
              ✓ Your battery has been inserted
            </p>
          </div>
        )}

        {/* Draggable Slider Component */}
        <div className="pt-6">
          {!account ? (
            <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">Please connect your wallet to continue</p>
            </div>
          ) : isProcessingPayment ? (
            <div className="text-center p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-blue-400 text-sm font-medium">Processing Payment...</p>
              <p className="text-blue-300 text-xs mt-1">Please confirm transaction in your wallet</p>
            </div>
          ) : (
            <DraggableSlider
              isSliderActive={isSliderActive}
              sliderPosition={sliderPosition}
              sliderRef={sliderRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            />
          )}
        </div>
      </div>
    </div>
    </div>
  );
}



