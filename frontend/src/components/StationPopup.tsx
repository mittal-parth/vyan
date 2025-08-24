"use client";

import { Popup } from "react-map-gl/mapbox";
import { TbStar, TbCircleFilled, TbRobot, TbArrowRight } from "react-icons/tb";
import { useRouter } from "next/navigation";
import { type Station } from "@/data/stations";

interface StationPopupProps {
  station: Station;
  getStatusColor: (status: string) => string;
  onClose: () => void;
  showRating?: boolean;
  showAIWarnings?: boolean;
  enableNavigation?: boolean;
}

export function StationPopup({
  station,
  getStatusColor,
  onClose,
  showRating = true,
  showAIWarnings = false,
  enableNavigation = false,
}: StationPopupProps) {
  const router = useRouter();

  // Convert string ID to numeric ID for navigation
  const getNumericId = (stringId: string): number => {
    // If string ID is a single letter, convert using ASCII (A=1, B=2, etc.)
    if (stringId.length === 1 && stringId >= 'A' && stringId <= 'Z') {
      return stringId.charCodeAt(0) - 64; // A=1, B=2, etc.
    }
    // If it's already numeric, parse it
    const parsed = parseInt(stringId);
    return isNaN(parsed) ? 1 : parsed;
  };

  const handleStationClick = () => {
    if (enableNavigation) {
      const numericId = getNumericId(station.id);
      router.push(`/stations/${numericId}`);
    }
  };
  return (
    <Popup
      longitude={station.coordinates[0]}
      latitude={station.coordinates[1]}
      anchor="top"
      offset={[0, 10]}
      onClose={onClose}
      closeButton={false}
      closeOnClick={false}
      className="custom-popup"
    >
      <div 
        className={`p-3 min-w-48 bg-custom-bg-shadow-dark text-neutral-200 ${
          enableNavigation ? 'cursor-pointer hover:bg-custom-bg-dark transition-colors duration-200' : ''
        }`}
        onClick={handleStationClick}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-neutral-200">
            {station.name}
          </h4>
          {showRating && (
            <div className="flex items-center space-x-1 bg-emerald-900 rounded-lg px-2 py-1">
              <TbStar className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">
                {station.rating || 4.0}
              </span>
            </div>
          )}
        </div>
        
        <p className="text-neutral-400 text-sm mb-2">
          {station.location}
        </p>


        {/* AI Prediction - only show if enabled and prediction exists */}
        {showAIWarnings && station.predictedEmptyIn && (
          <div className={`mb-3 p-2 rounded-lg border ${
            station.predictedEmptyIn === "CRITICAL" 
              ? "bg-red-900/20 border-red-500/30" 
              : "bg-yellow-900/20 border-yellow-500/30"
          }`}>
            <div className="flex items-center space-x-1">
              <TbRobot className="w-3 h-3 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-300">
                AI Prediction:
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {station.predictedEmptyIn === "CRITICAL" 
                ? "Station is out of batteries!"
                : `Empty in ${station.predictedEmptyIn}`
              }
            </p>
          </div>
        )}

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-neutral-400 text-xs">
              Battery Stock
            </span>
            <span className="text-neutral-200 text-sm font-medium">
              {station.charged}/{station.total}
            </span>
          </div>
          <div className="w-full bg-custom-bg-light shadow-neuro-dark-inset rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(station.charged / station.total) * 100}%`,
                backgroundColor: getStatusColor(station.status),
              }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TbCircleFilled 
              className="w-3 h-3" 
              style={{ color: getStatusColor(station.status) }}
            />
            <span className="text-xs font-medium text-neutral-400">
              {station.status === "ok"
                ? "Optimal"
                : station.status === "at-risk"
                ? "At Risk"
                : "Critical"}
            </span>
          </div>
          {enableNavigation && (
            <div className="flex items-center space-x-1 text-emerald-400">
              <span className="text-xs">View Details</span>
              <TbArrowRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}
