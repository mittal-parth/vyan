import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { contract } from "@/app/client";
import { Station } from "@/data/stations";

// Define the contract station structure based on the Solidity struct
interface ContractStation {
  id: string;
  name: string;
  location: string;
  latitude: bigint;
  longitude: bigint;
  operator: string;
  totalSlots: bigint;
  availableSlots: bigint;
  batteries: bigint[];
  isActive: boolean;
  createdAt: bigint;
  baseFee: bigint;
  rating: number;
}

// Transform contract station data to frontend Station interface
const transformContractStation = (contractStation: ContractStation, index: number): Station => {
  // Convert latitude/longitude from int256 (multiplied by 1e6) to decimal
  const latitude = Number(contractStation.latitude) / 1e6;
  const longitude = Number(contractStation.longitude) / 1e6;
  
  // Calculate charged batteries (total - available)
  const totalSlots = Number(contractStation.totalSlots);
  const availableSlots = Number(contractStation.availableSlots);
  const charged = totalSlots - availableSlots;
  
  // Calculate status based on availability
  const getStatus = (charged: number, total: number): "ok" | "at-risk" | "shortage" => {
    const percentage = (charged / total) * 100;
    if (percentage === 0) return "shortage";
    if (percentage <= 30) return "at-risk";
    return "ok";
  };

  // Generate some default values for frontend-specific fields
  const status = getStatus(charged, totalSlots);
  const percentage = totalSlots > 0 ? Math.round((charged / totalSlots) * 100) : 0;
  
  return {
    id: contractStation.id,
    name: contractStation.name,
    location: contractStation.location,
    coordinates: [longitude, latitude] as [number, number],
    distance: `${(Math.random() * 10 + 0.1).toFixed(1)} km`, // Placeholder distance
    rating: contractStation.rating / 10,
    image: "/battery-1.png", // Default image
    charged,
    total: totalSlots,
    status,
    percentage,
    predictedEmptyIn: status === "shortage" ? "CRITICAL" : 
                     status === "at-risk" ? `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)} hours` : 
                     null,
    forecast: Array.from({ length: 7 }, () => Math.floor(Math.random() * totalSlots)), // Generate forecast data
    swapFee: Number(contractStation.baseFee) / 1e18, // Convert from wei to ETH/SEI
    availableBatteries: charged,
    totalSlots: totalSlots,
  };
};

export const useStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the getAllStations function from the smart contract
      // Simple method name works if contract ABI is available
      const contractStations = await readContract({
        contract,
        method: "function getAllStations() view returns ((string id, string name, string location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, uint256[] batteries, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)[])",
        params: []
      });

      // Transform contract data to frontend format
      const transformedStations = contractStations.map((station, index) => 
        transformContractStation(station, index)
      );

      setStations(transformedStations);
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stations");
      
      // Fallback to empty array or you could import and use STATIONS as fallback
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const refetchStations = async () => {
    await fetchStations();
  };

  return {
    stations,
    loading,
    error,
    refetchStations,
  };
};
