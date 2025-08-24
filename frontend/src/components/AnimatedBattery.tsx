"use client";

interface AnimatedBatteryProps {
  percentage: number;
}

export default function AnimatedBattery({ percentage }: AnimatedBatteryProps) {
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
