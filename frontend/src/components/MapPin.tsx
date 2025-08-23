import { type Station } from "@/data/stations";

interface MapPinProps {
  station: Station;
  getStatusColor: (status: string) => string;
  onClick?: (station: Station) => void;
  showStatusColors?: boolean;
}

export function MapPin({
  station,
  getStatusColor,
  onClick,
  showStatusColors = true,
}: MapPinProps) {
  return (
    <div className="relative">
      {/* SVG Pin */}
      <svg
        height="32"
        width="24"
        viewBox="0 0 24 24"
        className={`cursor-pointer transform hover:scale-110 transition-transform duration-200 drop-shadow-lg ${
          onClick ? "cursor-pointer" : "cursor-default"
        }`}
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
        onClick={() => onClick?.(station)}
      >
        <path
          d="M20.2,15.7L20.2,15.7c1.1-1.6,1.8-3.6,1.8-5.7c0-5.6-4.5-10-10-10S2,4.5,2,10c0,2,0.6,3.9,1.6,5.4c0,0.1,0.1,0.2,0.2,0.3c0,0,0.1,0.1,0.1,0.2c0.2,0.3,0.4,0.6,0.7,0.9c2.6,3.1,7.4,7.6,7.4,7.6s4.8-4.5,7.4-7.5c0.2-0.3,0.5-0.6,0.7-0.9C20.1,15.8,20.2,15.8,20.2,15.7z"
          fill={showStatusColors ? getStatusColor(station.status) : "#10b981"}
          stroke="#ffffff"
          strokeWidth="1"
        />
      </svg>

      {/* Station ID Label */}
      <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
        <span className="text-white text-xs font-bold drop-shadow-sm">
          {station.id}
        </span>
      </div>

      {/* Status indicator */}
      {showStatusColors && station.status === "shortage" && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full font-bold animate-pulse">
          ⚠
        </div>
      )}
      {showStatusColors && station.status === "at-risk" && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-bold animate-pulse">
          !
        </div>
      )}

      {/* Prediction Badge for dashboard */}
      {showStatusColors && station.predictedEmptyIn && station.predictedEmptyIn !== "CRITICAL" && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-bold animate-pulse">
          !
        </div>
      )}
      {showStatusColors && station.predictedEmptyIn === "CRITICAL" && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full font-bold animate-pulse">
          ⚠
        </div>
      )}
    </div>
  );
}
