"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import PaymentSuccess from "@/components/PaymentSuccess";
import AnimatedBattery from "@/components/AnimatedBattery";
import DraggableSlider from "@/components/DraggableSlider";
import { getStationByNumericId, type Station } from "@/data/stations";
import { TbBattery, TbBolt, TbCoin, TbWallet, TbArrowLeft, TbQrcode, TbCamera } from "react-icons/tb";

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
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [batteryInserted, setBatteryInserted] = useState(false);
  const [batteryReady, setBatteryReady] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
          // Start 5-second countdown after camera is visible
          timeoutRef.current = setTimeout(() => {
            stopCamera();
            setHasScanned(true);
          }, 5000);
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
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleStartScan = () => {
    startCamera();
  };

  const handleBatteryInserted = () => {
    setBatteryInserted(true);
    setBatteryReady(true);
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
        // Trigger swap process here
        setTimeout(() => {
          setShowToast(true);
          setIsSliderActive(false);
          setSliderPosition(0);
          // Show payment success after toast
          setTimeout(() => {
            setPaymentSuccessful(true);
          }, 1000);
        }, 500);
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
        // Trigger swap process here
        setTimeout(() => {
          setShowToast(true);
          setIsSliderActive(false);
          setSliderPosition(0);
          // Show payment success after toast
          setTimeout(() => {
            setPaymentSuccessful(true);
          }, 1000);
        }, 500);
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
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{cameraError}</p>
                  <button
                    onClick={() => setCameraError(null)}
                    className="mt-2 text-red-300 text-xs underline hover:text-red-200"
                  >
                    Try Again
                  </button>
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
                  subtitle={`${station.swapFee || 5} STK`}
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
                  <button
                    onClick={handleBatteryInserted}
                    className="bg-custom-bg-shadow-dark hover:bg-custom-bg-dark text-emerald-400 text-sm hover:text-emerald-300 px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 mx-auto shadow-neuro-dark-outset hover:shadow-neuro-dark-pressed border border-custom-bg-light/20"
                  >
                    <TbBattery className="w-5 h-5" />
                    <span>Battery Inserted</span>
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
              subtitle={`${station.swapFee || 5} STK`}
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
          <DraggableSlider
            isSliderActive={isSliderActive}
            sliderPosition={sliderPosition}
            sliderRef={sliderRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        </div>
      </div>
    </div>
    </div>
  );
}



