import { Station } from "@/data/stations";

// Define the contract station structure based on the Solidity struct
export interface ContractStation {
  id: string;
  name: string;
  location: string;
  latitude: bigint;
  longitude: bigint;
  operator: string;
  totalSlots: bigint;
  availableSlots: bigint;
  batteries: readonly bigint[]; // Updated to readonly to match contract return type
  isActive: boolean;
  createdAt: bigint;
  baseFee: bigint;
  rating: number;
}

// Transform contract station data to frontend Station interface
export const transformContractStation = (contractStation: ContractStation, index: number): Station => {
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
    rating: contractStation.rating / 10, // Convert from uint16 to decimal (assuming stored as rating * 10)
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
