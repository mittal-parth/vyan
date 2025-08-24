import { useEffect, useState } from "react";
import { TbCheck } from "react-icons/tb";

export default function PaymentSuccess() {
  const [isVisible, setIsVisible] = useState(false);
  const [circleScale, setCircleScale] = useState(0);
  const [tickOpacity, setTickOpacity] = useState(0);

  useEffect(() => {
    // Trigger animations on mount
    setIsVisible(true);
    
    // Animate circle scaling
    setTimeout(() => setCircleScale(1), 100);
    
    // Animate tick appearing
    setTimeout(() => setTickOpacity(1), 600);
  }, []);

  return (
    <div className="flex flex-col mt-32">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-8">
          {/* Animated Success Circle */}
          <div className="relative mx-auto w-32 h-32">
            {/* Outer Ring */}
            <div 
              className={`absolute inset-0 w-32 h-32 rounded-full border-4 border-emerald-400/30 transition-all duration-1000 ease-out ${
                isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
            />
            
            {/* Main Circle */}
            <div 
              className={`absolute top-2 left-2 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-neuro-dark-deep transition-all duration-1000 ease-out z-10 ${
                isVisible ? 'scale-100' : 'scale-0'
              }`}
              style={{ transform: `scale(${circleScale})` }}
            />
            
            {/* Tick Mark */}
            <div 
              className={`absolute top-2 left-2 w-28 h-28 flex items-center justify-center transition-all duration-500 ease-out z-20 ${
                tickOpacity ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <TbCheck 
                className="w-16 h-16 text-white drop-shadow-lg" 
                style={{ 
                  transform: `scale(${tickOpacity})`,
                  transition: 'transform 0.5s ease-out'
                }}
              />
            </div>
            
            {/* Glow Effect */}
            <div 
              className={`absolute inset-0 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl transition-all duration-1000 ease-out -z-10 ${
                isVisible ? 'scale-150 opacity-100' : 'scale-0 opacity-0'
              }`}
            />
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-neutral-200 text-2xl font-semibold">
              Payment Successful!
            </h1>
            <p className="text-neutral-400 text-xs max-w-sm mx-auto leading-relaxed">
              Thank you for using Vyan! Your payment has been processed and the swap process is now complete.
            </p>
          </div>

          {/* Additional Info Card */}
          <div className="bg-custom-bg-shadow-dark rounded-2xl shadow-neuro-dark-deep p-6 max-w-sm mx-auto">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Transaction ID</span>
                <span className="text-emerald-400 text-sm font-mono">#SWP-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Amount Paid</span>
                <span className="text-emerald-400 text-sm font-medium">5 STK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Status</span>
                <span className="text-emerald-400 text-sm font-medium">✓ Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
