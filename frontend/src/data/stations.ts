// Centralized station data and interfaces for the frontend application

export interface Station {
  id: string;
  name: string;
  location: string;
  address: string;
  coordinates: [number, number];
  distance?: string;
  rating?: number;
  image?: string;
  charged: number;
  total: number;
  status: "ok" | "at-risk" | "shortage";
  percentage?: number;
  predictedEmptyIn?: string | null;
  forecast?: number[];
  swapFee?: number; // in STK tokens
  availableBatteries?: number;
  totalSlots?: number;
}

// Comprehensive station data
export const STATIONS: Station[] = [
  {
    id: "A",
    name: "Supercharge Station", 
    location: "Downtown Hub",
    address: "123 Market St, San Francisco, CA",
    coordinates: [-122.4194, 37.7749],
    distance: "1.2 km",
    rating: 4.2,
    image: "/battery-1.png",
    charged: 12,
    total: 20,
    status: "ok",
    percentage: 60,
    predictedEmptyIn: null,
    forecast: [8, 12, 15, 12, 10, 8, 6],
    swapFee: 5,
    availableBatteries: 7,
    totalSlots: 10,
  },
  {
    id: "B",
    name: "ElectroHub Charging",
    location: "Airport Terminal",
    address: "SFO International Airport, San Francisco, CA",
    coordinates: [-122.375, 37.6189],
    distance: "12.5 km",
    rating: 4.7,
    image: "/battery-1.png",
    charged: 3,
    total: 20,
    status: "at-risk",
    percentage: 15,
    predictedEmptyIn: "2.5 hours",
    forecast: [10, 8, 6, 3, 2, 4, 6],
    swapFee: 5,
    availableBatteries: 3,
    totalSlots: 10,
  },
  {
    id: "C",
    name: "Green Energy Station",
    location: "Mall Complex",
    address: "456 Union Square, San Francisco, CA",
    coordinates: [-122.4064, 37.7858],
    distance: "2.1 km",
    rating: 4.1,
    image: "/battery-1.png",
    charged: 0,
    total: 20,
    status: "shortage",
    percentage: 0,
    predictedEmptyIn: "CRITICAL",
    forecast: [12, 10, 8, 5, 2, 0, 0],
    swapFee: 5,
    availableBatteries: 0,
    totalSlots: 10,
  },
  {
    id: "D",
    name: "PowerPoint EV",
    location: "Tech District",
    address: "789 Mission St, San Francisco, CA",
    coordinates: [-122.3871, 37.7849],
    distance: "0.8 km",
    rating: 4.5,
    image: "/battery-1.png",
    charged: 18,
    total: 20,
    status: "ok",
    percentage: 90,
    predictedEmptyIn: null,
    forecast: [15, 18, 20, 18, 16, 14, 12],
    swapFee: 5,
    availableBatteries: 9,
    totalSlots: 10,
  },
  {
    id: "E",
    name: "EcoCharge Plus",
    location: "Beachfront Plaza",
    address: "Sunset Drive, Beachfront Plaza, FL 33101",
    coordinates: [-122.4894, 37.7549],
    distance: "8.9 km",
    rating: 4.3,
    image: "/battery-1.png",
    charged: 8,
    total: 20,
    status: "ok",
    percentage: 40,
    predictedEmptyIn: null,
    forecast: [6, 8, 10, 8, 6, 4, 3],
    swapFee: 5,
    availableBatteries: 4,
    totalSlots: 10,
  },
  {
    id: "F",
    name: "VoltStation Express",
    location: "Valley Center",
    address: "Mountain View Road, Valley Center, WA 98001",
    coordinates: [-122.3071, 37.7949],
    distance: "5.7 km",
    rating: 4.6,
    image: "/battery-1.png",
    charged: 15,
    total: 20,
    status: "ok",
    percentage: 75,
    predictedEmptyIn: null,
    forecast: [12, 15, 18, 15, 13, 11, 9],
    swapFee: 5,
    availableBatteries: 8,
    totalSlots: 10,
  },
];

// Helper functions
export const getStationById = (id: string): Station | undefined => {
  return STATIONS.find(station => station.id === id);
};

export const getStationByNumericId = (id: number): Station | undefined => {
  return STATIONS.find(station => station.id === id.toString() || station.id === String.fromCharCode(64 + id));
};

export const getStationStatus = (charged: number, total: number): "ok" | "at-risk" | "shortage" => {
  const percentage = (charged / total) * 100;
  if (percentage === 0) return "shortage";
  if (percentage <= 30) return "at-risk";
  return "ok";
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "ok":
      return "#10b981"; // emerald-500
    case "at-risk":
      return "#f59e0b"; // amber-500
    case "shortage":
      return "#ef4444"; // red-500
    default:
      return "#6b7280"; // gray-500
  }
};

// AI route data (previously scattered in dashboard)
export interface AIRoute {
  id: string;
  from: string;
  to: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  batteries: number;
  eta: string;
  priority: "critical" | "high" | "normal";
  reason: string;
}

export const AI_ROUTES: AIRoute[] = [
  {
    id: "route1",
    from: "D",
    to: "C",
    fromCoords: [-122.3871, 37.7849],
    toCoords: [-122.4064, 37.7858],
    batteries: 8,
    eta: "15 min",
    priority: "critical",
    reason: "Station C is out of batteries",
  },
  {
    id: "route2", 
    from: "A",
    to: "B",
    fromCoords: [-122.4194, 37.7749],
    toCoords: [-122.375, 37.6189],
    batteries: 4,
    eta: "22 min",
    priority: "high",
    reason: "Station B predicted shortage in 2.5h",
  }
];

// AI alerts data
export interface AIAlert {
  id: string;
  type: "shortage" | "prediction" | "optimization";
  station: string;
  message: string;
  severity: "critical" | "warning" | "info";
  timeAgo: string;
}

export const AI_ALERTS: AIAlert[] = [
  {
    id: "alert1",
    type: "shortage",
    station: "C",
    message: "Station C is out of batteries! Immediate action required.",
    severity: "critical",
    timeAgo: "2 min ago",
  },
  {
    id: "alert2",
    type: "prediction",
    station: "B",
    message: "Station B will run out in 2.5 hours based on demand patterns.",
    severity: "warning",
    timeAgo: "5 min ago",
  },
  {
    id: "alert3",
    type: "optimization",
    station: "All",
    message: "Route optimization complete. 2 truck routes suggested for efficiency.",
    severity: "info",
    timeAgo: "8 min ago",
  }
];
