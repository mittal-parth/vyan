import { EthersClient } from './ethersClient';
import { ethers } from 'ethers';
import { Station, Battery } from '../types';
import { config } from '../config';

// Vyan contract ABI - we'll need the function signatures for the contract calls
const VYAN_ABI = [
  "function getAllStations() external view returns (tuple(string id, string name, string location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, uint256[] batteries, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)[] memory)",
  "function getStationDetails(string memory stationId) external view returns (string memory name, string memory location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)",
  "function getOperatorStations(address operator) external view returns (tuple(string id, string name, string location, int256 latitude, int256 longitude, address operator, uint256 totalSlots, uint256 availableSlots, uint256[] batteries, bool isActive, uint256 createdAt, uint256 baseFee, uint16 rating)[] memory)",
  "function getStationBatteries(string memory stationId) external view returns (uint256[] memory)",
  "function generateAIRouteRecommendation(string memory routeId, string memory fromStation, string memory toStation, uint256 batteryCount, string memory eta, string memory priority, string memory reason) external",
  "event BatterySwapped(address indexed user, string indexed stationId, uint256 indexed oldBatteryId, uint256 newBatteryId, uint256 swapFee, uint256 timestamp)"
];

export class VyanContract {
  private ethersClient: EthersClient;
  private contractAddress: string;
  private contract: ethers.Contract | null = null;

  constructor(ethersClient: EthersClient) {
    this.ethersClient = ethersClient;
    this.contractAddress = config.contract.address;
  }

  /**
   * Initialize the contract instance
   */
  private async getContract(): Promise<ethers.Contract> {
    if (!this.contract) {
      const signer = await this.ethersClient.getSigner();
      this.contract = new ethers.Contract(this.contractAddress, VYAN_ABI, signer);
    }
    return this.contract;
  }

  /**
   * Get all stations from the contract
   */
  async getAllStations(): Promise<Station[]> {
    try {
      const contract = await this.getContract();
      const result = await contract.getAllStations();
      
      // Transform the result to match our Station interface
      return result.map((station: any) => ({
        id: station[0],
        name: station[1],
        location: station[2],
        latitude: Number(station[3]),
        longitude: Number(station[4]),
        operator: station[5],
        totalSlots: Number(station[6]),
        availableSlots: Number(station[7]),
        batteries: station[8].map((batteryId: any) => Number(batteryId)),
        isActive: station[9],
        createdAt: Number(station[10]),
        baseFee: Number(station[11]),
        rating: Number(station[12])
      }));
    } catch (error) {
      console.error('Failed to get all stations:', error);
      throw error;
    }
  }

  /**
   * Get station details by station ID
   */
  async getStationDetails(stationId: string): Promise<{
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    operator: string;
    totalSlots: number;
    availableSlots: number;
    isActive: boolean;
    createdAt: number;
    baseFee: number;
    rating: number;
  }> {
    try {
      const contract = await this.getContract();
      const result = await contract.getStationDetails(stationId);

      return {
        name: result[0],
        location: result[1],
        latitude: Number(result[2]),
        longitude: Number(result[3]),
        operator: result[4],
        totalSlots: Number(result[5]),
        availableSlots: Number(result[6]),
        isActive: result[7],
        createdAt: Number(result[8]),
        baseFee: Number(result[9]),
        rating: Number(result[10])
      };
    } catch (error) {
      console.error(`Failed to get station details for ${stationId}:`, error);
      throw error;
    }
  }

  /**
   * Get operator stations
   */
  async getOperatorStations(operator: string): Promise<Station[]> {
    try {
      const contract = await this.getContract();
      const result = await contract.getOperatorStations(operator);
      
      // Transform the result to match our Station interface
      return result.map((station: any) => ({
        id: station[0],
        name: station[1],
        location: station[2],
        latitude: Number(station[3]),
        longitude: Number(station[4]),
        operator: station[5],
        totalSlots: Number(station[6]),
        availableSlots: Number(station[7]),
        batteries: station[8].map((batteryId: any) => Number(batteryId)),
        isActive: station[9],
        createdAt: Number(station[10]),
        baseFee: Number(station[11]),
        rating: Number(station[12])
      }));
    } catch (error) {
      console.error(`Failed to get operator stations for ${operator}:`, error);
      throw error;
    }
  }

  /**
   * Get station batteries
   */
  async getStationBatteries(stationId: string): Promise<number[]> {
    try {
      const contract = await this.getContract();
      const result = await contract.getStationBatteries(stationId);
      return result.map((batteryId: any) => Number(batteryId));
    } catch (error) {
      console.error(`Failed to get station batteries for ${stationId}:`, error);
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlockNumber(): Promise<number> {
    try {
      return await this.ethersClient.getCurrentBlockNumber();
    } catch (error) {
      console.error('Failed to get current block number:', error);
      throw error;
    }
  }

  /**
   * Listen to BatterySwapped events
   * This uses ethers event filtering capabilities with pagination to handle large block ranges
   */
  async getBatterySwappedEvents(fromBlock?: number): Promise<any[]> {
    try {
      const contract = await this.getContract();
      const provider = await this.ethersClient.getProvider();
      
      // If no fromBlock specified, start from a recent block to avoid large queries
      let startBlock = fromBlock;
      if (!startBlock || startBlock === 0) {
        // Get current block number and start from 1000 blocks ago
        const currentBlock = await provider.getBlockNumber();
        startBlock = Math.max(0, currentBlock - 1000);
        console.log(`No fromBlock specified, starting from block ${startBlock} (1000 blocks ago)`);
      }

      const allEvents: any[] = [];
      const maxBlockRange = 2000; // RPC provider limit
      let currentBlock = startBlock;
      
      // Get current block number to know where to stop
      const latestBlock = await provider.getBlockNumber();
      
      // If the range is still too large, limit it further
      if (latestBlock - startBlock > maxBlockRange) {
        startBlock = Math.max(0, latestBlock - maxBlockRange);
        currentBlock = startBlock;
        console.log(`Block range still too large, limiting to last ${maxBlockRange} blocks starting from ${startBlock}`);
      }
      
      // Query events in chunks to respect RPC provider limits
      while (currentBlock <= latestBlock) {
        const toBlock = Math.min(currentBlock + maxBlockRange - 1, latestBlock);
        
        console.log(`Querying events from block ${currentBlock} to ${toBlock}`);
        
        try {
          const filter = contract.filters.BatterySwapped();
          const events = await contract.queryFilter(filter, currentBlock, toBlock);
          
          // Transform events to match our BatterySwappedEvent interface
          const transformedEvents = events.map(event => {
            if (event instanceof ethers.EventLog) {
              return {
                user: event.args[0],
                stationId: event.args[1],
                oldBatteryId: Number(event.args[2]),
                newBatteryId: Number(event.args[3]),
                swapFee: Number(event.args[4]),
                timestamp: Number(event.args[5]),
                blockNumber: event.blockNumber
              };
            }
            return null;
          }).filter(Boolean);
          
          allEvents.push(...transformedEvents);
          
        } catch (chunkError) {
          console.error(`Failed to query events from block ${currentBlock} to ${toBlock}:`, chunkError);
          // Continue with next chunk instead of failing completely
        }
        
        // Move to next chunk
        currentBlock = toBlock + 1;
        
        // Add small delay to avoid overwhelming the RPC provider
        if (currentBlock <= latestBlock) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Retrieved ${allEvents.length} BatterySwapped events from block ${startBlock} to ${latestBlock}`);
      return allEvents;
      
    } catch (error) {
      console.error('Failed to get BatterySwapped events:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time BatterySwapped events
   */
  async subscribeToBatterySwappedEvents(
    callback: (event: any) => void
  ): Promise<void> {
    try {
      const contract = await this.getContract();
      
      // Set up event listener
      contract.on('BatterySwapped', (user: string, stationId: string, oldBatteryId: bigint, newBatteryId: bigint, swapFee: bigint, timestamp: bigint, event: ethers.EventLog) => {
        const batterySwappedEvent = {
          user,
          stationId,
          oldBatteryId: Number(oldBatteryId),
          newBatteryId: Number(newBatteryId),
          swapFee: Number(swapFee),
          timestamp: Number(timestamp),
          blockNumber: event.blockNumber
        };
        
        callback(batterySwappedEvent);
      });
      
      console.log('Subscribed to BatterySwapped events');
    } catch (error) {
      console.error('Failed to subscribe to BatterySwapped events:', error);
      throw error;
    }
  }

  /**
   * Generate AI route recommendation by calling the smart contract function
   * This will emit an AIRecommendation event on the blockchain
   */
  async generateAIRouteRecommendation(
    routeId: string,
    fromStation: string,
    toStation: string,
    batteryCount: number,
    eta: string,
    priority: string,
    reason: string
  ): Promise<void> {
    try {
      const contract = await this.getContract();
      
      console.log(`Emitting AI route recommendation: ${routeId} from ${fromStation} to ${toStation}`);
      
      // Call the smart contract function to emit the event
      const tx = await contract.generateAIRouteRecommendation(
        routeId,
        fromStation,
        toStation,
        batteryCount,
        eta,
        priority,
        reason
      );
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      console.log(`AI route recommendation event emitted successfully! Transaction hash: ${receipt.hash}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.error('Failed to generate AI route recommendation:', error);
      throw error;
    }
  }
}
