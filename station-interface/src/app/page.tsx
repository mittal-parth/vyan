"use client";

import { useState, useEffect, useRef } from "react";
import { TbBatteryFilled, TbWifi, TbWifiOff, TbQrcode, TbX, TbCheck, TbRefresh } from "react-icons/tb";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { useStationStatus } from "@/hooks/useStationStatus";

type SessionState = 'idle' | 'waiting' | 'authenticated' | 'processing' | 'success' | 'error';

interface SessionData {
  id: string;
  qrCode: string;
  username?: string;
  expiresAt: number;
}

export default function StationInterface() {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Get station status from contract
  const stationId = process.env.NEXT_PUBLIC_STATION_ID || "1";
  const { status, loading, error } = useStationStatus(stationId);
  
  const [availableBatteries, setAvailableBatteries] = useState(status.availableBatteries);

  // Auto-refresh QR code every 2 minutes
  useEffect(() => {
    if (sessionState === 'waiting' && currentSession) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Just refresh the QR, don't create new session
            refreshQRCode();
            return 120;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionState, currentSession]);

  const refreshQRCode = async () => {
    if (!currentSession) return;
    
    try {
      const qrCode = await generateQRCode();
      setCurrentSession(prev => prev ? { ...prev, qrCode } : null);
    } catch (error) {
      console.error('Failed to refresh QR:', error);
    }
  };

  // Ensure QR renders when session is created or canvas ref is available
  useEffect(() => {
    if (currentSession && qrCanvasRef.current && sessionState === 'waiting') {
      renderQRToCanvas(currentSession.qrCode);
    }
  }, [currentSession, sessionState]);

  // Check for session expiry (but don't reload page)
  useEffect(() => {
    if (currentSession && sessionState === 'waiting') {
      const checkExpiry = () => {
        if (Date.now() > currentSession.expiresAt) {
          setSessionState('idle');
          setCurrentSession(null);
        }
      };
      
      // Check expiry every 30 seconds, not continuously
      const interval = setInterval(checkExpiry, 30000);
      return () => clearInterval(interval);
    }
  }, [currentSession, sessionState]);

  // Poll for active sessions (real backend integration)
  useEffect(() => {
    if (sessionState === 'waiting' || sessionState === 'authenticated') {
      const checkInterval = setInterval(async () => {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
          const stationId = process.env.NEXT_PUBLIC_STATION_ID || '1';
          
          const response = await fetch(`${backendUrl}/station/${stationId}/active-session`);
          const data = await response.json();
          
          if (data.session && currentSession) {
            console.log('Session status:', data.session.status, 'Current state:', sessionState);
            console.log('Session created at:', data.session.createdAt, 'QR created at:', currentSession.expiresAt - 300000);
            
            // Only process sessions created after our QR code was generated
            const qrGeneratedAt = currentSession.expiresAt - 300000; // 5 minutes ago
            if (data.session.createdAt < qrGeneratedAt) {
              console.log('Ignoring old session');
              return;
            }
            
            if (data.session.status === 'pending' && sessionState === 'waiting') {
              // User scanned QR - show authenticated state
              handleUserAuthenticated(data.session.userId);
            } else if (data.session.status === 'payment_confirmed' && sessionState === 'authenticated') {
              // Payment completed - proceed to processing and success
              console.log('Payment confirmed, proceeding to success');
              setSessionState('processing');
              
              // Show processing for 3 seconds then success
              setTimeout(() => {
                setSessionState('success');
                
                // Update available batteries count
                setAvailableBatteries(prev => prev - 1);
                
                // Return to idle after 10 seconds
                setTimeout(() => {
                  setSessionState('idle');
                  setCurrentSession(null);
                }, 10000);
              }, 3000);
            }
          }
        } catch (error) {
          console.error('Failed to check session status:', error);
        }
      }, 2000);

      return () => clearInterval(checkInterval);
    }
  }, [sessionState, currentSession]);

  const generateQRCode = async (): Promise<string> => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const stationId = process.env.NEXT_PUBLIC_STATION_ID || '1';
    
    // Fetch secure QR data from backend
    const response = await fetch(`${backendUrl}/station/${stationId}/qr`);
    
    if (!response.ok) {
      throw new Error(`Failed to generate QR: ${response.status}`);
    }
    
    const data = await response.json();
    const qrString = data.qrString;
    
    // Render QR to canvas
    await renderQRToCanvas(qrString);
    return qrString;
  };

  const renderQRToCanvas = async (qrString: string) => {
    if (!qrCanvasRef.current) {
      console.warn('QR Canvas ref not available');
      return;
    }

    try {
      // Clear the canvas first
      const canvas = qrCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Generate QR code
      await QRCode.toCanvas(canvas, qrString, {
        width: 240,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Failed to render QR to canvas:', error);
    }
  };

  const cleanupOldSessions = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const stationId = process.env.NEXT_PUBLIC_STATION_ID || '1';
      
      // Get any existing session and mark it as aborted
      const response = await fetch(`${backendUrl}/station/${stationId}/active-session`);
      const data = await response.json();
      
      if (data.session) {
        console.log('Cleaning up old session:', data.sessionId);
        await fetch(`${backendUrl}/session/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            status: 'aborted'
          }),
        });
      }
    } catch (error) {
      console.log('No old sessions to clean up or backend unavailable');
    }
  };

  const generateNewSession = async () => {
    const sessionId = uuidv4();
    
    try {
      // Clean up any old sessions first
      await cleanupOldSessions();
      
      const qrCode = await generateQRCode();
      
      setCurrentSession({
        id: sessionId,
        qrCode,
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes for session
      });
      setSessionState('waiting');
      setCountdown(120);
    } catch (error) {
      console.error('Failed to generate session:', error);
      alert('Failed to generate QR code. Please ensure the backend server is running.');
      // Keep trying to generate QR
      setTimeout(() => generateNewSession(), 2000);
    }
  };

  const handleStartSession = async () => {
    setShowQRModal(false);
    await generateNewSession();
  };

  const handleUserAuthenticated = (username: string) => {
    setCurrentSession(prev => prev ? { ...prev, username } : null);
    setSessionState('authenticated');
    
    // Stay in authenticated state - wait for payment confirmation from polling
    // The polling mechanism will detect payment_confirmed and proceed to success
  };

  const handleAbortTransaction = async () => {
    // Clean up any active sessions
    await cleanupOldSessions();
    
    setSessionState('idle');
    setCurrentSession(null);
    setShowQRModal(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto space-y-4">
        <Header />
        <StationStatus 
          availableBatteries={availableBatteries}
          isActive={status.isActive}
        />
        
        {sessionState === 'idle' && (
          <IdleState onStartSession={() => setShowQRModal(true)} />
        )}

        {sessionState === 'waiting' && currentSession && (
          <WaitingState 
            session={currentSession}
            countdown={countdown}
            qrCanvasRef={qrCanvasRef}
            onAbort={handleAbortTransaction}
            onRefresh={refreshQRCode}
          />
        )}

        {sessionState === 'authenticated' && currentSession && (
          <AuthenticatedState 
            username={currentSession.username!}
            onAbort={handleAbortTransaction}
          />
        )}

        {sessionState === 'processing' && (
          <ProcessingState />
        )}

        {sessionState === 'success' && (
          <SuccessState />
        )}

        {showQRModal && (
          <QRModal 
            onStart={handleStartSession}
            onClose={() => setShowQRModal(false)}
          />
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-400">Loading station data...</p>
      </div>
    </div>
  );
}

function Header() {
  const [isOnline, setIsOnline] = useState(true);
  
  // Simulate network status
  useEffect(() => {
    const checkConnection = () => {
      // In real implementation, this would check actual network connectivity
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="Vyan Logo" 
          className="h-12 w-auto"
        />
        <div className="text-left">
          <h1 className="text-neutral-200 text-2xl font-bold tracking-tight">Vyan</h1>
          <p className="text-neutral-400 text-sm font-medium">
            Battery Station #{process.env.NEXT_PUBLIC_STATION_ID || "1"}
          </p>
        </div>
      </div>
      
      <div className="flex space-x-3 items-center">
        <div className={`w-3 h-3 rounded-full shadow-neuro-dark-outset ${
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}></div>
        {isOnline ? (
          <TbWifi className="w-5 h-5 text-green-400" />
        ) : (
          <TbWifiOff className="w-5 h-5 text-red-400" />
        )}
      </div>
    </div>
  );
}

function StationStatus({ 
  availableBatteries, 
  isActive
}: {
  availableBatteries: number;
  isActive: boolean;
}) {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-6">
      <h2 className="text-neutral-200 text-lg font-semibold mb-4">Station Status</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TbBatteryFilled className={`w-6 h-6 ${isActive ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-neutral-400 text-sm">Available Batteries</span>
          </div>
          <span className="text-neutral-200 font-bold text-xl">{availableBatteries}</span>
        </div>
        

        
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-sm">Station Status</span>
          <span className={`font-semibold text-sm ${isActive ? 'text-green-400' : 'text-red-400'}`}>
            {isActive ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}

function IdleState({ onStartSession }: { onStartSession: () => void }) {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-8 text-center">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center">
          <TbQrcode className="w-12 h-12 text-neutral-400" />
        </div>
        <h2 className="text-neutral-200 text-2xl font-bold mb-3">Ready for Next User</h2>
        <p className="text-neutral-400 text-base">Tap to start a new battery swap session</p>
      </div>
      
      <button
        onClick={onStartSession}
        className="w-full py-5 bg-blue-600 shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200 active:scale-98"
      >
        <span className="text-white font-bold text-xl">Tap to Get Started</span>
      </button>
    </div>
  );
}

function QRModal({ onStart, onClose }: { onStart: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-6 max-w-sm mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-neutral-200 text-lg font-semibold">Start Session</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center hover:shadow-neuro-dark-pressed transition-all duration-200"
          >
            <TbX className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
        
        <p className="text-neutral-400 text-sm mb-6">
          This will generate a QR code that refreshes every 30 seconds for security.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-custom-bg-light shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
          >
            <span className="text-neutral-200 font-medium">Cancel</span>
          </button>
          <button
            onClick={onStart}
            className="flex-1 py-3 bg-blue-600 shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
          >
            <span className="text-white font-medium">Start</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function WaitingState({ 
  session, 
  countdown, 
  qrCanvasRef, 
  onAbort, 
  onRefresh 
}: {
  session: SessionData;
  countdown: number;
  qrCanvasRef: React.RefObject<HTMLCanvasElement>;
  onAbort: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-6 text-center">
      <div className="mb-6">
        <h2 className="text-neutral-200 text-2xl font-bold mb-3">Scan QR Code</h2>
        <p className="text-neutral-400 text-base mb-6">
          Open your Vyan app and scan this QR code
        </p>
      </div>
      
      <div className="mb-6 flex justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-neuro-dark-inset">
          <canvas 
            ref={qrCanvasRef}
            className="block"
            style={{ width: '240px', height: '240px' }}
          />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <TbRefresh className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-400 text-sm font-medium">
            Refreshing in {countdown}s
          </span>
        </div>
        <div className="w-full bg-custom-bg-light rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 30) * 100}%` }}
          />
        </div>
      </div>
      

      
      <div className="flex space-x-3">
        <button
          onClick={onRefresh}
          className="flex-1 py-4 bg-custom-bg-light shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
        >
          <span className="text-neutral-200 font-medium">Refresh QR</span>
        </button>
        <button
          onClick={onAbort}
          className="flex-1 py-4 bg-red-600 shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
        >
          <span className="text-white font-medium">Abort</span>
        </button>
      </div>
    </div>
  );
}

function AuthenticatedState({ username, onAbort }: {
  username: string;
  onAbort: () => void;
}) {
  // Format wallet address for display
  const formatUserDisplay = (address: string) => {
    if (address === 'anonymous') return 'Anonymous User';
    
    // Check if it's a wallet address (starts with 0x and is long)
    if (address.startsWith('0x') && address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    // If it's already short, return as is
    return address.length > 20 ? `${address.slice(0, 17)}...` : address;
  };

  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-8 text-center">
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-600 shadow-neuro-dark-outset flex items-center justify-center">
          <TbCheck className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-neutral-200 text-2xl font-bold mb-3">
          Hi, {formatUserDisplay(username)}!
        </h2>
        <p className="text-neutral-400 text-base">
          Please follow the instructions on your Vyan App to continue
        </p>
      </div>
      
      <button
        onClick={onAbort}
        className="w-full py-4 bg-red-600 shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
      >
        <span className="text-white font-medium text-lg">Click Abort to Cancel Transaction</span>
      </button>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-8 text-center">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-neutral-200 text-2xl font-bold mb-3">Processing Swap</h2>
        <p className="text-neutral-400 text-base">Please wait while we swap your battery...</p>
      </div>
      
      <div className="w-full bg-custom-bg-light rounded-full h-3 overflow-hidden">
        <div className="bg-blue-500 h-3 rounded-full animate-pulse" style={{ width: '75%' }} />
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-8 text-center">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-600 shadow-neuro-dark-outset flex items-center justify-center">
          <TbCheck className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-neutral-200 text-2xl font-bold mb-4">Swap Complete!</h2>
        <p className="text-neutral-400 text-base mb-6">
          Your battery has been successfully swapped
        </p>
        
        <div className="bg-custom-bg-light shadow-neuro-dark-inset rounded-xl p-4 space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Tokens Earned</span>
            <span className="text-green-400 font-bold text-lg">+10 SWAP</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Battery Released</span>
            <span className="text-green-400 font-bold text-lg">Slot A-7</span>
          </div>
        </div>
      </div>
      
      <p className="text-neutral-400 text-sm">
        Session will end automatically in a few seconds...
      </p>
    </div>
  );
}