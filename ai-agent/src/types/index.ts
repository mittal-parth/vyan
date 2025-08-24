// Types based on Vyan.sol smart contract

export interface Station {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  operator: string;
  totalSlots: number;
  availableSlots: number;
  batteries: number[];
  isActive: boolean;
  createdAt: number;
  baseFee: number;
  rating: number;
}

export interface Battery {
  id: number;
  capacity: number;
  currentCharge: number;
  healthScore: number;
  cycleCount: number;
  manufactureDate: number;
  currentStationId: string;
  currentOwner: string;
  isAvailableForSwap: boolean;
}

export interface BatterySwappedEvent {
  user: string;
  stationId: string;
  oldBatteryId: number;
  newBatteryId: number;
  swapFee: number;
  timestamp: number;
}

export interface RebalancingRoute {
  fromStation: string;
  toStation: string;
  batteryCount: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedDistance?: number;
}

export interface StationStatus {
  stationId: string;
  availableSlots: number;
  totalSlots: number;
  utilizationRate: number;
  needsRebalancing: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface RebalancingRecommendation {
  routes: RebalancingRoute[];
  summary: string;
  totalBatteriesToMove: number;
  estimatedCost: number;
  timestamp: number;
}

export interface TrafficData {
  location: string;
  latitude: number;
  longitude: number;
  trafficLevel: 'low' | 'medium' | 'high' | 'very_high';
  congestionScore: number; // 0-100
  peakHours: string[];
  averageSpeed: number; // km/h
  timestamp: number;
}

export interface StationLog {
  stationId: string;
  timestamp: number;
  batterySwaps: number;
  utilizationRate: number;
  peakHour: boolean;
  weatherCondition: 'sunny' | 'rainy' | 'cloudy';
  specialEvent: string | null;
}

export interface OptimizedRebalancingPlan {
  optimizedRoutes: RebalancingRoute[];
  trafficConsiderations: string[];
  demandForecast: {
    stationId: string;
    predictedDemand: 'low' | 'medium' | 'high';
    confidence: number;
    peakHours: string[];
  }[];
  executionSchedule: {
    routeId: string;
    startTime: string;
    estimatedDuration: number;
    driverInstructions: string;
  }[];
  summary: string;
  estimatedEfficiency: number; // percentage improvement
  riskFactors: string[];
}


