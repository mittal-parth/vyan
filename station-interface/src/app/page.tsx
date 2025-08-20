"use client";

import { useState, useEffect } from "react";
import { TbBatteryFilled, TbWifi, TbSignal, TbNfc, TbCheck, TbX, TbLoader } from "react-icons/tb";

export default function StationInterface() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapComplete, setSwapComplete] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [availableBatteries, setAvailableBatteries] = useState(12);
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleNFCTap = async () => {
    setIsAuthenticated(true);
    // Simulate NFC authentication
    setTimeout(() => {
      setUserInfo({
        id: "user_123",
        name: "John Doe",
        swapTokens: 150,
        priorityLane: true
      });
    }, 1000);
  };

  const handleSwap = async () => {
    setIsSwapping(true);
    // Simulate battery swap process
    setTimeout(() => {
      setIsSwapping(false);
      setSwapComplete(true);
      setBatteryLevel(100);
      setAvailableBatteries(prev => prev - 1);
    }, 3000);
  };

  const resetStation = () => {
    setIsAuthenticated(false);
    setIsSwapping(false);
    setSwapComplete(false);
    setUserInfo(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto space-y-4">
        <Header />
        <StationStatus batteryLevel={batteryLevel} availableBatteries={availableBatteries} />
        
        {!isAuthenticated && (
          <NFCAuthentication onTap={handleNFCTap} />
        )}

        {isAuthenticated && userInfo && !isSwapping && !swapComplete && (
          <UserAuthentication userInfo={userInfo} onSwap={handleSwap} />
        )}

        {isSwapping && (
          <SwapInProgress />
        )}

        {swapComplete && (
          <SwapComplete userInfo={userInfo} onReset={resetStation} />
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      {/* Station Info */}
      <div className="text-center">
        <p className="text-neutral-400 text-sm font-medium">Station</p>
        <h1 className="text-neutral-200 text-lg font-semibold">Battery Swap</h1>
      </div>
      
      {/* Status Indicators */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-neuro-dark-outset"></div>
        <TbWifi className="w-5 h-5 text-neutral-400" />
        <TbSignal className="w-5 h-5 text-neutral-400" />
      </div>
    </div>
  );
}

function StationStatus({ batteryLevel, availableBatteries }: {
  batteryLevel: number;
  availableBatteries: number;
}) {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-5">
      <h2 className="text-neutral-200 text-lg font-semibold mb-4">Station Status</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TbBatteryFilled className="w-6 h-6 text-neutral-400" />
            <span className="text-neutral-400 text-sm">Available Batteries</span>
          </div>
          <span className="text-neutral-200 font-bold text-lg">{availableBatteries}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-sm">Current Battery</span>
          <span className="text-neutral-200 font-bold text-lg">{batteryLevel}%</span>
        </div>
      </div>
    </div>
  );
}

function NFCAuthentication({ onTap }: { onTap: () => void }) {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-8 text-center">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center">
          <TbNfc className="w-10 h-10 text-neutral-400" />
        </div>
        <h2 className="text-neutral-200 text-xl font-semibold mb-2">Tap to Authenticate</h2>
        <p className="text-neutral-400 text-sm">Place your phone near the NFC reader</p>
      </div>
      
      <button
        onClick={onTap}
        className="w-full py-4 bg-custom-bg-light shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
      >
        <span className="text-neutral-200 font-semibold">Simulate NFC Tap</span>
      </button>
    </div>
  );
}

function UserAuthentication({ userInfo, onSwap }: {
  userInfo: any;
  onSwap: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-5">
        <h2 className="text-neutral-200 text-lg font-semibold mb-4">User Authenticated</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-400 text-sm">Name</span>
            <span className="text-neutral-200 font-semibold">{userInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400 text-sm">Swap Tokens</span>
            <span className="text-neutral-200 font-semibold">{userInfo.swapTokens}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400 text-sm">Priority Lane</span>
            <span className="text-neutral-200 font-semibold">
              {userInfo.priorityLane ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onSwap}
        className="w-full py-4 bg-green-600 shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
      >
        <span className="text-white font-semibold text-lg">Start Battery Swap</span>
      </button>
    </div>
  );
}

function SwapInProgress() {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-8 text-center">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center">
          <TbLoader className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
        <h2 className="text-neutral-200 text-xl font-semibold mb-2">Swapping Battery</h2>
        <p className="text-neutral-400 text-sm">Please wait while we swap your battery...</p>
      </div>
      
      <div className="w-full bg-custom-bg-light rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  );
}

function SwapComplete({ userInfo, onReset }: {
  userInfo: any;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-600 shadow-neuro-dark-outset flex items-center justify-center">
            <TbCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-neutral-200 text-xl font-semibold mb-2">Swap Complete!</h2>
          <p className="text-neutral-400 text-sm">Your battery has been successfully swapped</p>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-neutral-400 text-sm">New Balance</span>
            <span className="text-neutral-200 font-semibold">{userInfo.swapTokens + 10} tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400 text-sm">Battery Level</span>
            <span className="text-neutral-200 font-semibold">100%</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onReset}
        className="w-full py-4 bg-custom-bg-light shadow-neuro-dark-outset rounded-xl hover:shadow-neuro-dark-pressed transition-all duration-200"
      >
        <span className="text-neutral-200 font-semibold">Ready for Next User</span>
      </button>
    </div>
  );
}
