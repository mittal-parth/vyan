"use client";

import { useState, useCallback } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  TbBatteryFilled,
  TbMap,
  TbSettings,
  TbCoin,
  TbRobot,
  TbTruck,
  TbChartLine,
  TbBolt,
  TbAlertTriangle,
  TbCircleFilled,
  TbCheck,
  TbMapPin,
  TbCrown,
  TbGift,
  TbMenu2,
  TbX,
  TbDashboard,
  TbTrendingUp,
  TbUsers,
} from "react-icons/tb";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "stations" | "ai-plan" | "tokens" | "settings"
  >("stations");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-custom-bg-light to-custom-bg-dark">
      <div className="flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          <div className="p-6 space-y-6">
            <DashboardHeader
              setSidebarOpen={setSidebarOpen}
              sidebarOpen={sidebarOpen}
            />
            <StatsOverview />
            <MainContent activeTab={activeTab} />
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardHeader({
  setSidebarOpen,
  sidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden w-10 h-10 rounded-xl bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center hover:shadow-neuro-dark-pressed transition-all duration-200"
        >
          {sidebarOpen ? (
            <TbX className="w-5 h-5 text-neutral-400" />
          ) : (
            <TbMenu2 className="w-5 h-5 text-neutral-400" />
          )}
        </button>
        <div>
          <h1 className="text-neutral-200 text-2xl font-bold">
            Station Dashboard
          </h1>
          <p className="text-neutral-400 text-sm">
            Manage your EV battery swap network
          </p>
        </div>
      </div>

      <button className="w-12 h-12 rounded-2xl bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center hover:shadow-neuro-dark-pressed transition-all duration-200">
        <div className="w-7 h-7 rounded-full bg-custom-bg-light shadow-neuro-dark-inset"></div>
      </button>
    </div>
  );
}

function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}: {
  activeTab: string;
  setActiveTab: (tab: "stations" | "ai-plan" | "tokens" | "settings") => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const tabs = [
    { id: "stations", label: "Stations", icon: TbDashboard },
    { id: "ai-plan", label: "AI Plan", icon: TbRobot },
    { id: "tokens", label: "Tokens", icon: TbCoin },
    { id: "settings", label: "Settings", icon: TbSettings },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-custom-bg-shadow-dark shadow-neuro-dark-deeper transition-all duration-300 z-50 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="p-4">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <TbBolt className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <div>
              <h2 className="text-neutral-200 font-bold text-lg">Vyan</h2>
              <p className="text-neutral-400 text-xs">Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-emerald-600/20 text-emerald-400 shadow-neuro-dark-inset"
                  : "text-neutral-400 hover:text-neutral-300 hover:bg-custom-bg-light/30"
              }`}
              title={!isOpen ? tab.label : undefined}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-center p-2 rounded-xl bg-custom-bg-light shadow-neuro-dark-outset hover:shadow-neuro-dark-pressed transition-all duration-200"
        >
          <TbMenu2 className="w-5 h-5 text-neutral-400" />
        </button>
      </div>
    </div>
  );
}

function StatsOverview() {
  const stats = [
    {
      title: "Total Stations",
      value: "6",
      change: "+2 this month",
      icon: TbMap,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "Active Batteries",
      value: "41/120",
      change: "68% capacity",
      icon: TbBatteryFilled,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    },
    {
      title: "Daily Swaps",
      value: "247",
      change: "+12% vs yesterday",
      icon: TbTrendingUp,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
    {
      title: "Revenue Today",
      value: "$1,847",
      change: "+8% vs avg",
      icon: TbCoin,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-xl p-4 hover:shadow-neuro-dark-pressed transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>

          <div>
            <p className="text-neutral-400 text-sm font-medium">{stat.title}</p>
            <p className="text-neutral-200 text-2xl font-bold mb-1">
              {stat.value}
            </p>
            <p className="text-neutral-500 text-xs">{stat.change}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MainContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case "stations":
      return <StationsView />;
    case "ai-plan":
      return <AIPlanView />;
    case "tokens":
      return <TokensView />;
    case "settings":
      return <SettingsView />;
    default:
      return <StationsView />;
  }
}

function StationsView() {
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 10,
  });

  const stations = [
    {
      id: "A",
      location: "Downtown Hub",
      charged: 12,
      total: 20,
      status: "ok",
      forecast: [8, 12, 15, 12, 10, 8, 6],
      coordinates: [-122.4194, 37.7749],
      address: "123 Market St, San Francisco, CA",
    },
    {
      id: "B",
      location: "Airport Terminal",
      charged: 3,
      total: 20,
      status: "at-risk",
      forecast: [10, 8, 6, 3, 2, 4, 6],
      coordinates: [-122.375, 37.6189],
      address: "SFO International Airport, San Francisco, CA",
    },
    {
      id: "C",
      location: "Mall Complex",
      charged: 0,
      total: 20,
      status: "shortage",
      forecast: [12, 10, 8, 5, 2, 0, 0],
      coordinates: [-122.4064, 37.7858],
      address: "456 Union Square, San Francisco, CA",
    },
    {
      id: "D",
      location: "Tech District",
      charged: 18,
      total: 20,
      status: "ok",
      forecast: [15, 18, 20, 18, 16, 14, 12],
      coordinates: [-122.3871, 37.7849],
      address: "789 Mission St, San Francisco, CA",
    }
  ];

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <TbCheck className="w-4 h-4 text-green-400" />;
      case "at-risk":
        return <TbAlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "shortage":
        return <TbCircleFilled className="w-4 h-4 text-red-400" />;
      default:
        return <TbCircleFilled className="w-4 h-4 text-neutral-400" />;
    }
  };

  const onMarkerClick = useCallback((station: any) => {
    setSelectedStation(station);
  }, []);

  const onMapClick = useCallback(() => {
    setSelectedStation(null);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Station List */}
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-neutral-200 text-xl font-semibold">
          Station Overview
        </h2>
        <div className="space-y-6">
          {stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onClick={() => onMarkerClick(station)}
              isSelected={selectedStation?.id === station.id}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Interactive Map */}
      <div className="lg:col-span-2">
        <h3 className="text-neutral-200 text-lg font-semibold mb-4">
          Network Overview
        </h3>
        <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-6 h-screen">
          <div className="h-full rounded-xl overflow-hidden">
            <Map
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              onClick={onMapClick}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              mapboxAccessToken={
                process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
              }
              style={{ width: "100%", height: "100%" }}
            >
              {/* Map Controls */}
              <NavigationControl position="top-left" />
              <FullscreenControl position="top-right" />
              <GeolocateControl
                position="top-right"
                trackUserLocation={true}
                showUserHeading={true}
              />

              {/* Station Markers */}
              {stations.map((station) => (
                <Marker
                  key={station.id}
                  longitude={station.coordinates[0]}
                  latitude={station.coordinates[1]}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    onMarkerClick(station);
                  }}
                >
                  <div className="relative">
                    {/* SVG Pin */}
                    <svg 
                      height="32" 
                      width="24" 
                      viewBox="0 0 24 24" 
                      className="cursor-pointer transform hover:scale-110 transition-transform duration-200 drop-shadow-lg"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                    >
                      <path 
                        d="M20.2,15.7L20.2,15.7c1.1-1.6,1.8-3.6,1.8-5.7c0-5.6-4.5-10-10-10S2,4.5,2,10c0,2,0.6,3.9,1.6,5.4c0,0.1,0.1,0.2,0.2,0.3c0,0,0.1,0.1,0.1,0.2c0.2,0.3,0.4,0.6,0.7,0.9c2.6,3.1,7.4,7.6,7.4,7.6s4.8-4.5,7.4-7.5c0.2-0.3,0.5-0.6,0.7-0.9C20.1,15.8,20.2,15.8,20.2,15.7z"
                        fill={getStatusColor(station.status)}
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
                  </div>
                </Marker>
              ))}

              {/* Station Popup */}
              {selectedStation && (
                <Popup
                  longitude={selectedStation.coordinates[0]}
                  latitude={selectedStation.coordinates[1]}
                  anchor="top"
                  offset={[0, 10]}
                  onClose={() => setSelectedStation(null)}
                  closeButton={true}
                  closeOnClick={false}
                  className="custom-popup"
                >
                  <div className="p-3 min-w-48">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        Station {selectedStation.id}
                      </h4>
                      {getStatusIcon(selectedStation.status)}
                    </div>
                    <p className="text-gray-700 text-sm mb-2">
                      {selectedStation.location}
                    </p>
                    <p className="text-gray-600 text-xs mb-3">
                      {selectedStation.address}
                    </p>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 text-xs">
                          Battery Stock
                        </span>
                        <span className="text-gray-900 text-sm font-medium">
                          {selectedStation.charged}/{selectedStation.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (selectedStation.charged /
                                selectedStation.total) *
                              100
                            }%`,
                            backgroundColor: getStatusColor(
                              selectedStation.status
                            ),
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <TbChartLine className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        {selectedStation.status === "ok"
                          ? "Optimal"
                          : selectedStation.status === "at-risk"
                          ? "At Risk"
                          : "Critical"}
                      </span>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        </div>
      </div>
    </div>
  );
}

function StationCard({
  station,
  onClick,
  isSelected,
}: {
  station: any;
  onClick: () => void;
  isSelected: boolean;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <TbCheck className="w-5 h-5 text-green-400" />;
      case "at-risk":
        return <TbAlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "shortage":
        return <TbCircleFilled className="w-5 h-5 text-red-400" />;
      default:
        return <TbCircleFilled className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "text-green-400";
      case "at-risk":
        return "text-yellow-400";
      case "shortage":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  const percentage = (station.charged / station.total) * 100;

  return (
    <div
      className={`bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-xl p-4 hover:shadow-neuro-dark-pressed transition-all duration-200 cursor-pointer ${
        isSelected ? "ring-2 ring-emerald-500/50 bg-emerald-600/10" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-neutral-200 font-semibold">
            Station {station.id}
          </h4>
          <p className="text-neutral-400 text-sm">{station.location}</p>
        </div>
        {getStatusIcon(station.status)}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-neutral-400 text-sm">Battery Stock</span>
          <span className="text-neutral-200 text-sm font-medium">
            {station.charged}/{station.total}
          </span>
        </div>
        <div className="w-full bg-custom-bg-light shadow-neuro-dark-inset rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage > 60
                ? "bg-green-500"
                : percentage > 30
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <TbChartLine className="w-4 h-4 text-neutral-400" />
        <span
          className={`text-xs font-medium ${getStatusColor(station.status)}`}
        >
          {station.status === "ok"
            ? "Optimal"
            : station.status === "at-risk"
            ? "At Risk"
            : "Critical"}
        </span>
      </div>
    </div>
  );
}

function AIPlanView() {
  const suggestedMoves = [
    {
      from: "Station A",
      to: "Station C",
      batteries: 3,
      eta: "22m",
      priority: "high",
    },
    {
      from: "Station D",
      to: "Station B",
      batteries: 2,
      eta: "35m",
      priority: "medium",
    },
    {
      from: "Station A",
      to: "Station F",
      batteries: 4,
      eta: "18m",
      priority: "high",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map View */}
      <div className="lg:col-span-2">
        <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-6 h-96">
          <h3 className="text-neutral-200 text-lg font-semibold mb-4">
            Optimized Route Plan
          </h3>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <TbTruck className="w-24 h-24 text-emerald-400 mx-auto mb-4" />
              <p className="text-neutral-400">AI-generated delivery routes</p>
              <p className="text-neutral-500 text-sm">
                Optimized for efficiency and demand
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Moves Panel */}
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-neutral-200 text-xl font-semibold">
          Suggested Moves
        </h2>
        <div className="space-y-3">
          {suggestedMoves.map((move, index) => (
            <div
              key={index}
              className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-xl p-4 hover:shadow-neuro-dark-pressed transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    move.priority === "high"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {move.priority.toUpperCase()}
                </span>
                <span className="text-neutral-400 text-sm">ETA {move.eta}</span>
              </div>

              <div className="space-y-2">
                <p className="text-neutral-200 font-medium">
                  Move {move.batteries} batteries
                </p>
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <span>{move.from}</span>
                  <span>→</span>
                  <span>{move.to}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-neuro-dark-outset hover:shadow-neuro-dark-pressed rounded-xl py-3 px-4 text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2">
          <TbCheck className="w-5 h-5" />
          <span>Apply Plan</span>
        </button>
      </div>
    </div>
  );
}

function TokensView() {
  const topUsers = [
    { name: "Alice Johnson", swaps: 87, tokens: 1245 },
    { name: "Bob Chen", swaps: 72, tokens: 1103 },
    { name: "Carol Davis", swaps: 65, tokens: 987 },
    { name: "David Wilson", swaps: 58, tokens: 876 },
    { name: "Eva Martinez", swaps: 52, tokens: 743 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Token Chart */}
      <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-6">
        <h3 className="text-neutral-200 text-lg font-semibold mb-4">
          SwapTokens Minted
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TbChartLine className="w-24 h-24 text-green-400 mx-auto mb-4" />
            <p className="text-neutral-400">Token analytics chart</p>
            <p className="text-neutral-500 text-sm">Monthly minting trends</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-6">
        <h3 className="text-neutral-200 text-lg font-semibold mb-4">
          Top Green Swappers
        </h3>
        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-custom-bg-light shadow-neuro-dark-inset rounded-lg hover:shadow-neuro-dark-pressed transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-custom-bg-dark shadow-neuro-dark-outset">
                {index === 0 ? (
                  <TbCrown className="w-4 h-4 text-yellow-400" />
                ) : (
                  <span className="text-neutral-400 font-medium text-sm">
                    {index + 1}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <p className="text-neutral-200 font-medium text-sm">
                  {user.name}
                </p>
                <p className="text-neutral-400 text-xs">
                  {user.swaps} green swaps
                </p>
              </div>

              <div className="text-right">
                <p className="text-green-400 font-semibold text-sm">
                  {user.tokens}
                </p>
                <p className="text-neutral-500 text-xs">tokens</p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 shadow-neuro-dark-outset hover:shadow-neuro-dark-pressed rounded-xl py-3 px-4 text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2">
          <TbGift className="w-5 h-5" />
          <span>Claim Rewards</span>
        </button>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-6">
        <h3 className="text-neutral-200 text-lg font-semibold mb-6">
          Dashboard Settings
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-neutral-200 font-medium mb-2">
              Station Alerts
            </label>
            <div className="flex items-center space-x-3">
              <button className="w-14 h-7 rounded-full bg-emerald-500 relative">
                <div className="w-6 h-6 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm"></div>
              </button>
              <span className="text-neutral-400 text-sm">
                Enable low battery notifications
              </span>
            </div>
          </div>

          <div>
            <label className="block text-neutral-200 font-medium mb-2">
              AI Planning
            </label>
            <div className="flex items-center space-x-3">
              <button className="w-14 h-7 rounded-full bg-custom-bg-dark shadow-neuro-dark-inset relative">
                <div className="w-6 h-6 rounded-full bg-custom-bg-light shadow-neuro-dark-outset absolute top-0.5 left-0.5"></div>
              </button>
              <span className="text-neutral-400 text-sm">
                Auto-apply AI suggestions
              </span>
            </div>
          </div>

          <div>
            <label className="block text-neutral-200 font-medium mb-2">
              Refresh Interval
            </label>
            <select className="w-full bg-custom-bg-light shadow-neuro-dark-inset rounded-lg p-3 text-neutral-200 focus:outline-none">
              <option>30 seconds</option>
              <option>1 minute</option>
              <option>5 minutes</option>
              <option>Manual</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TbRobot className="w-5 h-5 text-emerald-400" />
          <span className="text-neutral-400 text-sm">
            Last AI plan generated at 12:05 PM
          </span>
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-700 shadow-neuro-dark-outset hover:shadow-neuro-dark-pressed rounded-lg py-2 px-4 text-white font-medium transition-all duration-200 text-sm">
          Apply Plan
        </button>
      </div>
    </div>
  );
}
