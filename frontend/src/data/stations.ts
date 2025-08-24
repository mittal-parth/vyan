// Centralized station data and interfaces for the frontend application

export interface Station {
  id: string;
  name: string;
  location: string;
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

// Comprehensive station data for Bangalore area
export const STATIONS: Station[] = [
  {
    id: "A",
    name: "Cubbon Park Metro EV Hub", 
    location: "Near State Central Library, Cubbon Park Metro Station, MG Road, Bangalore 560001",
    coordinates: [77.5959, 12.9762],
    distance: "0.1 km",
    rating: 4.5,
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
  {
    id: "B",
    name: "Trinity Metro Power Station",
    location: "Trinity Metro Station, MG Road, Near Holy Trinity Church, Bangalore 560001",
    coordinates: [77.6199, 12.9783],
    distance: "1.2 km",
    rating: 4.3,
    image: "/battery-1.png",
    charged: 6,
    total: 20,
    status: "at-risk",
    percentage: 30,
    predictedEmptyIn: "3.2 hours",
    forecast: [8, 6, 4, 2, 1, 3, 5],
    swapFee: 5,
    availableBatteries: 3,
    totalSlots: 10,
  },
  {
    id: "C",
    name: "Indiranagar Metro EV Center",
    location: "Indiranagar Metro Station, 100 Feet Road, HAL 2nd Stage, Bangalore 560038",
    coordinates: [77.6408, 12.9719],
    distance: "5.8 km",
    rating: 4.1,
    image: "/battery-1.png",
    charged: 0,
    total: 20,
    status: "shortage",
    percentage: 0,
    predictedEmptyIn: "CRITICAL",
    forecast: [10, 8, 5, 2, 0, 0, 0],
    swapFee: 5,
    availableBatteries: 0,
    totalSlots: 10,
  },
  {
    id: "D",
    name: "Forum Koramangala Power Point",
    location: "The Forum Mall, 80 Feet Road, 7th Block, Koramangala, Bangalore 560095",
    coordinates: [77.6112, 12.9343],
    distance: "4.8 km",
    rating: 4.6,
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
    name: "Whitefield Metro Tech Hub",
    location: "Whitefield Metro Station, ITPL Main Road, Whitefield, Bangalore 560066",
    coordinates: [77.7399, 12.9763],
    distance: "16.5 km",
    rating: 4.4,
    image: "/battery-1.png",
    charged: 9,
    total: 20,
    status: "ok",
    percentage: 45,
    predictedEmptyIn: null,
    forecast: [7, 9, 11, 9, 7, 5, 4],
    swapFee: 5,
    availableBatteries: 5,
    totalSlots: 10,
  },
  {
    id: "F",
    name: "Electronic City Infosys Station",
    location: "Near Infosys Gate 1, Electronics City Phase 1, Bangalore 560100",
    coordinates: [77.6599, 12.8502],
    distance: "14.2 km",
    rating: 4.2,
    image: "/battery-1.png",
    charged: 12,
    total: 20,
    status: "ok",
    percentage: 60,
    predictedEmptyIn: null,
    forecast: [10, 12, 14, 12, 10, 8, 6],
    swapFee: 5,
    availableBatteries: 6,
    totalSlots: 10,
  }
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
    fromCoords: [77.6112, 12.9343], // From Forum Koramangala
    toCoords: [77.6408, 12.9719], // To Indiranagar Metro
    batteries: 8,
    eta: "18 min",
    priority: "critical",
    reason: "Station C is out of batteries",
  },
  {
    id: "route2", 
    from: "A",
    to: "B",
    fromCoords: [77.5959, 12.9762], // From Cubbon Park Metro
    toCoords: [77.6199, 12.9783], // To Trinity Metro
    batteries: 4,
    eta: "10 min",
    priority: "high",
    reason: "Station B predicted shortage in 3.2h",
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
    message: "Station C (Indiranagar) is out of batteries! Immediate action required.",
    severity: "critical",
    timeAgo: "2 min ago",
  },
  {
    id: "alert2",
    type: "prediction",
    station: "B",
    message: "Station B (MG Road) will run out in 3.2 hours based on demand patterns.",
    severity: "warning",
    timeAgo: "5 min ago",
  },
  {
    id: "alert3",
    type: "prediction",
    station: "G",
    message: "Station G (Jayanagar) will run out in 1.8 hours based on demand patterns.",
    severity: "warning",
    timeAgo: "7 min ago",
  },
  {
    id: "alert4",
    type: "optimization",
    station: "All",
    message: "Route optimization complete. 3 truck routes suggested for efficiency.",
    severity: "info",
    timeAgo: "10 min ago",
  }
];
