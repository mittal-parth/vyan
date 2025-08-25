import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { contract } from "@/app/client";

interface StationStatus {
  availableBatteries: number;
  totalBatteries: number;
  isActive: boolean;
  batteryLevel: number;
}

// Define the contract station structure based on frontend
interface ContractStation {
  id: string;
  name: string;
  location: string;
  latitude: bigint;
  longitude: bigint;
  operator: string;
  totalSlots: bigint;
  availableSlots: bigint;
  batteries: readonly bigint[];
  isActive: boolean;
  createdAt: bigint;
  baseFee: bigint;
  rating: number;
}

export const useStationStatus = (stationId: string) => {
  const [status, setStatus] = useState<StationStatus>({
    availableBatteries: 12,
    totalBatteries: 20,
    isActive: true,
    batteryLevel: 85
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from smart contract if available
      if (contract && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        try {
          // Try to get all stations first (like frontend does)
          const contractStations = await readContract({
            contract,
            method: "function getAllStations() view returns ((string id, string name, string location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, uint256[] batteries, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)[])",
            params: []
          }) as ContractStation[];

          // Find our specific station
          const ourStation = contractStations.find(station => 
            station.id === stationId || 
            station.id === `Station${stationId}` ||
            contractStations.indexOf(station) === parseInt(stationId) - 1
          );

          if (ourStation) {
            // Calculate available batteries from contract data
            const totalSlots = Number(ourStation.totalSlots);
            const availableSlots = Number(ourStation.availableSlots);
            const chargedBatteries = totalSlots - availableSlots; // Charged batteries available for swap
            
            setStatus({
              availableBatteries: chargedBatteries,
              totalBatteries: totalSlots,
              isActive: ourStation.isActive,
              batteryLevel: 85 // This will be set per user session
            });
          } else {
            throw new Error(`Station ${stationId} not found in contract`);
          }
        } catch (contractError) {
          console.warn("Contract call failed, using fallback data:", contractError);
          
          // Fallback to simulated data with a warning
          setError("Contract unavailable, showing demo data");
          setStatus({
            availableBatteries: Math.floor(Math.random() * 10) + 8, // 8-18
            totalBatteries: 20,
            isActive: true,
            batteryLevel: 85
          });
        }
      } else {
        // No contract configured, use demo data
        setError("No contract configured, showing demo data");
        setStatus({
          availableBatteries: Math.floor(Math.random() * 10) + 8, // 8-18
          totalBatteries: 20,
          isActive: true,
          batteryLevel: 85
        });
      }

    } catch (err) {
      console.error("Error fetching station status:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch station status");
      
      // Fallback data
      setStatus({
        availableBatteries: 10,
        totalBatteries: 20,
        isActive: false,
        batteryLevel: 85
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStationStatus, 30000);
    return () => clearInterval(interval);
  }, [stationId]);

  return {
    status,
    loading,
    error,
    refetch: fetchStationStatus,
  };
};
