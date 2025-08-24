import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { contract } from "@/app/client";
import { Station } from "@/data/stations";
import { transformContractStation, ContractStation } from "@/utils/contractTransform";

export const useOperatorStations = (operatorAddress?: string) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperatorStations = async (operator: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call the getOperatorStations function from the smart contract
      const contractStations = await readContract({
        contract,
        method: "function getOperatorStations(address operator) view returns ((string id, string name, string location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, uint256[] batteries, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)[])",
        params: [operator]
      }) as ContractStation[];

      // Transform contract data to frontend format
      const transformedStations = contractStations.map((station, index) => 
        transformContractStation(station, index)
      );

      setStations(transformedStations);
    } catch (err) {
      console.error("Error fetching operator stations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch operator stations");
      
      // Fallback to empty array
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (operatorAddress) {
      fetchOperatorStations(operatorAddress);
    } else {
      setLoading(false);
      setStations([]);
    }
  }, [operatorAddress]);

  const refetchStations = async () => {
    if (operatorAddress) {
      await fetchOperatorStations(operatorAddress);
    }
  };

  return {
    stations,
    loading,
    error,
    refetchStations,
  };
};
