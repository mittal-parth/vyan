"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { getStationByNumericId, type Station } from "@/data/stations";
import { TbBattery, TbBolt, TbCoin, TbWallet, TbArrowRight, TbArrowLeft } from "react-icons/tb";

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
  const sliderRef = useRef<HTMLDivElement>(null);
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
        }, 500);
        
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3500);
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
        }, 500);
        
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3500);
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

  return (
    <div className="min-h-screen">
      <div className="max-w-sm mx-auto space-y-8">
        <Header />
        
        <div className="px-6">
        {/* Station Name */}
        <div className="text-center pb-8">
          <h1 className="text-neutral-200 text-2xl">{station.name}</h1>
          <p className="text-neutral-400 text-sm mt-2">{station.address || station.location}</p>
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
        
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-900 text-white px-6 py-3 rounded-2xl shadow-lg z-50 transition-all duration-300 ease-out">
            <div className="flex items-center space-x-2">
              <TbBolt className="w-5 h-5" />
              <span className="font-medium">Swap process initiated!</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// Animated Battery Component
function AnimatedBattery({ percentage }: { percentage: number }) {
  return (
    <div className="relative w-32 h-64">
      {/* Battery Outline */}
      <div className="absolute inset-0 bg-custom-bg-shadow-dark rounded-2xl shadow-neuro-dark-inset border-2 border-custom-bg-light">
        {/* Battery Top Cap */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-custom-bg-light rounded-t-lg shadow-neuro-dark-outset"></div>
        
        {/* Battery Fluid Container */}
        <div className="absolute inset-2 rounded-xl overflow-hidden">
          {/* Battery Fluid with Enhanced Wave Animation */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-700 via-emerald-800 to-emerald-900 transition-all duration-1000 ease-out"
            style={{ 
              height: `${percentage}%`,
              animation: 'fluidWave 4s ease-in-out infinite'
            }}
          >
            {/* Multiple Wave Layers for More Dynamic Effect */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-emerald-600/40 to-transparent rounded-t-full animate-pulse"></div>
            <div className="absolute top-2 left-0 right-0 h-2 bg-gradient-to-b from-emerald-500/30 to-transparent rounded-t-full" style={{ animation: 'waveMove 3s ease-in-out infinite' }}></div>
            <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-b from-emerald-400/20 to-transparent rounded-t-full" style={{ animation: 'waveMove 2.5s ease-in-out infinite reverse' }}></div>
            
            {/* Floating Particles Effect */}
            <div className="absolute top-2 left-1/4 w-1 h-1 bg-emerald-500/60 rounded-full" style={{ animation: 'floatUp 6s ease-in-out infinite' }}></div>
            <div className="absolute top-4 right-1/3 w-1.5 h-1.5 bg-emerald-600/50 rounded-full" style={{ animation: 'floatUp 5s ease-in-out infinite 1s' }}></div>
            <div className="absolute top-6 left-1/2 w-1 h-1 bg-emerald-500/40 rounded-full" style={{ animation: 'floatUp 7s ease-in-out infinite 2s' }}></div>
          </div>
        </div>
        
        {/* Battery Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-neutral-200 text-lg z-10">{percentage}%</span>
        </div>
      </div>
      
      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes fluidWave {
          0%, 100% { 
            transform: translateY(0px) scaleY(1);
            border-radius: 0 0 12px 12px;
          }
          25% { 
            transform: translateY(-3px) scaleY(1.02);
            border-radius: 0 0 14px 14px;
          }
          50% { 
            transform: translateY(-1px) scaleY(1.01);
            border-radius: 0 0 13px 13px;
          }
          75% { 
            transform: translateY(-2px) scaleY(1.015);
            border-radius: 0 0 15px 15px;
          }
        }
        
        @keyframes waveMove {
          0%, 100% { 
            transform: translateX(0px) scaleX(1);
            opacity: 0.8;
          }
          50% { 
            transform: translateX(2px) scaleX(1.1);
            opacity: 1;
          }
        }
        
        @keyframes floatUp {
          0%, 100% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0.6;
          }
          25% { 
            transform: translateY(-4px) translateX(1px);
            opacity: 1;
          }
          50% { 
            transform: translateY(-2px) translateX(-1px);
            opacity: 0.8;
          }
          75% { 
            transform: translateY(-3px) translateX(2px);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}

// Draggable Slider Component
function DraggableSlider({
  isSliderActive,
  sliderPosition,
  sliderRef,
  onMouseDown,
  onTouchStart
}: {
  isSliderActive: boolean;
  sliderPosition: number;
  sliderRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}) {
  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <p className="text-neutral-400 text-sm">Slide to start battery swap</p>
      </div>
      
      <div 
        ref={sliderRef}
        className="relative w-full h-16 bg-custom-bg-shadow-dark rounded-3xl shadow-neuro-dark-inset overflow-hidden"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Slider Track */}
        <div className="absolute inset-0 bg-custom-bg-dark rounded-3xl" />
        
        {/* Progress Bar */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-700 transition-all duration-200 ease-out"
          style={{ width: `${sliderPosition}%` }}
        />
        
        {/* Slider Button */}
        <div 
          className="absolute top-2 w-12 h-12 bg-custom-bg-light rounded-2xl shadow-neuro-dark-outset flex items-center justify-center cursor-pointer transition-all duration-200 ease-out hover:shadow-neuro-dark-pressed"
          style={{ left: `max(0px, calc(${sliderPosition}% - 24px))` }}
        >
          <TbArrowRight className="w-6 h-6 text-emerald-400" />
        </div>
        
        {/* Slider Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-emerald-400 text-sm font-medium">
            {isSliderActive ? "Processing..." : "Slide to swap"}
          </span>
        </div>
      </div>
    </div>
  );
}