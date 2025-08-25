"use client";

import { useState, useCallback, useEffect } from "react";
import Map, {
  Marker,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { STATIONS, AI_ROUTES, AI_ALERTS, getStatusColor, type Station, type AIRoute, type AIAlert } from "@/data/stations";
import { MapPin } from "@/components/MapPin";
import { StationPopup } from "@/components/StationPopup";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useActiveAccount } from "thirdweb/react";
import { useOperatorStations } from "@/hooks/useOperatorStations";
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
  TbArrowRight,
  TbLoader2,
  TbUser,
} from "react-icons/tb";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "stations" | "tokens" | "settings"
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
          </div>
        </div>
      </div>
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
  setActiveTab: (tab: "stations" | "tokens" | "settings") => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const tabs = [
    { id: "stations", label: "Stations", icon: TbDashboard },
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
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [dispatchedRoutes, setDispatchedRoutes] = useState<string[]>([]);
  const [truckPositions, setTruckPositions] = useState<{[key: string]: number}>({});
  const [toasts, setToasts] = useState<{id: string, message: string, type: string}[]>([]);
  const [viewState, setViewState] = useState({
    longitude: 77.5959,
    latitude: 12.9762,
    zoom: 10,
  });

  // Get connected wallet account
  const account = useActiveAccount();
  
  // Fetch operator stations from contract
  const { stations: contractStations, loading: stationsLoading, error: stationsError, refetchStations } = useOperatorStations(account?.address);
  
  // Fallback to static data if no contract data or not connected
  const [stations, setStations] = useState<Station[]>([]);
  
  // Update stations when contract data changes
  useEffect(() => {
    if (contractStations && contractStations.length > 0) {
      setStations(contractStations);
    } else if (account?.address) {
      // If wallet is connected but no stations, show empty array
      setStations([]);
    } else {
      // If no wallet connected, also show empty array
      setStations([]);
    }
  }, [contractStations, account?.address]);

  // AI-generated truck routes for rebalancing from centralized data
  const aiRoutes = AI_ROUTES;

  // AI predictions and alerts from centralized data
  const aiAlerts = AI_ALERTS;

  // Use centralized status color function

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

  // Create route line data for the map - only show selected route
  const routeLineData = {
    type: "FeatureCollection" as const,
    features: selectedRoute 
      ? aiRoutes
          .filter(route => route.id === selectedRoute)
          .map(route => ({
            type: "Feature" as const,
            properties: {
              id: route.id,
              priority: route.priority,
              from: route.from,
              to: route.to,
              batteries: route.batteries,
              eta: route.eta,
            },
            geometry: {
              type: "LineString" as const,
              coordinates: [route.fromCoords, route.toCoords]
            }
          }))
      : []
  };

  // Handle route card click
  const handleRouteClick = (routeId: string) => {
    setSelectedRoute(selectedRoute === routeId ? null : routeId);
  };

  // Handle dispatch click
  const handleDispatch = (routeId: string) => {
    setDispatchedRoutes(prev => [...prev, routeId]);
    setTruckPositions(prev => ({...prev, [routeId]: 0}));
    
    // Animate truck along route
    const animateTruck = () => {
      const startTime = Date.now();
      const duration = 15000; // 15 seconds animation for more realistic timing
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setTruckPositions(prev => ({...prev, [routeId]: progress}));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete - update station batteries
          updateStationBatteries(routeId);
          showDeliveryToast(routeId);
        }
      };
      
      requestAnimationFrame(animate);
    };
    
    animateTruck();
  };

  // Calculate truck position along route
  const getTruckPosition = (route: any, progress: number) => {
    const [startLng, startLat] = route.fromCoords;
    const [endLng, endLat] = route.toCoords;
    
    const lng = startLng + (endLng - startLng) * progress;
    const lat = startLat + (endLat - startLat) * progress;
    
    return [lng, lat];
  };

  // Update station battery counts and status
  const updateStationBatteries = (routeId: string) => {
    const route = aiRoutes.find(r => r.id === routeId);
    if (!route) return;

    setStations(prevStations => 
      prevStations.map(station => {
        if (station.id === route.from) {
          // Subtract batteries from source station
          const newCharged = Math.max(0, station.charged - route.batteries);
          return {
            ...station,
            charged: newCharged,
            status: getStationStatus(newCharged, station.total),
            predictedEmptyIn: newCharged === 0 ? "CRITICAL" : 
                            newCharged <= 3 ? "1.5 hours" : null
          };
        }
        if (station.id === route.to) {
          // Add batteries to destination station
          const newCharged = Math.min(station.total, station.charged + route.batteries);
          return {
            ...station,
            charged: newCharged,
            status: getStationStatus(newCharged, station.total),
            predictedEmptyIn: newCharged > 5 ? null : 
                            newCharged === 0 ? "CRITICAL" : "3 hours"
          };
        }
        return station;
      })
    );
  };

  // Determine station status based on battery count
  const getStationStatus = (charged: number, total: number) => {
    const percentage = (charged / total) * 100;
    if (percentage === 0) return "shortage";
    if (percentage <= 30) return "at-risk";
    return "ok";
  };

  // Toast management functions
  const showDeliveryToast = (routeId: string) => {
    const route = aiRoutes.find(r => r.id === routeId);
    if (!route) return;

    const toastId = `toast-${Date.now()}`;
    const toast = {
      id: toastId,
      message: `Delivery complete! ${route.batteries} batteries transferred from Station ${route.from} to Station ${route.to}`,
      type: "success"
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);
  };

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  // Show wallet connection prompt if no wallet connected
  if (!account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TbUser className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-neutral-200 text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-neutral-400 mb-4">Please connect your wallet to view and manage your stations</p>
            <p className="text-neutral-500 text-sm">Use the connect button in the top-right corner</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (stationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TbLoader2 className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p className="text-neutral-400">Loading your stations...</p>
            <p className="text-neutral-500 text-sm mt-2">Connected: {account.address?.slice(0, 6)}...{account.address?.slice(-4)}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (stationsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TbAlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-neutral-400 mb-2">Failed to load stations from contract</p>
            <p className="text-neutral-500 text-sm mb-4">{stationsError}</p>
            <button
              onClick={refetchStations}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 mx-auto"
            >
              <TbSettings className="w-4 h-4" />
              <span>Retry Loading</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show message when no stations found
  if (stations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TbMap className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-neutral-200 text-lg font-semibold mb-2">No Stations Found</h3>
            <p className="text-neutral-400 mb-4">You don&apos;t have any registered stations yet</p>
            <p className="text-neutral-500 text-sm mb-4">Connected: {account.address?.slice(0, 6)}...{account.address?.slice(-4)}</p>
            <button
              onClick={refetchStations}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 mx-auto"
            >
              <TbSettings className="w-4 h-4" />
              <span>Reload Stations</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Route Suggestions - Horizontal Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-neutral-200 text-xl font-semibold flex items-center space-x-2">
            <TbTruck className="w-6 h-6 text-emerald-400" />
            <span>AI Suggested Routes</span>
          </h2>
          <div className="flex items-center space-x-4 text-sm text-neutral-400">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-yellow-400 rounded"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-red-400 rounded"></div>
              <span>Critical</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiRoutes.map((route) => (
            <AIRouteCard 
              key={route.id} 
              route={route} 
              isSelected={selectedRoute === route.id}
              isDispatched={dispatchedRoutes.includes(route.id)}
              onClick={() => handleRouteClick(route.id)}
              onDispatch={() => handleDispatch(route.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Station List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-neutral-200 text-xl font-semibold">
            Station Overview
          </h2>
          <div className="space-y-4">
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
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-200 text-lg font-semibold">
              Network Overview
            </h3>
          </div>
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
                <GeolocateControl
                  position="top-right"
                  trackUserLocation={true}
                  showUserHeading={true}
                />

                {/* AI Route Lines */}
                <Source id="ai-routes" type="geojson" data={routeLineData}>
                  <Layer
                    id="route-lines"
                    type="line"
                    paint={{
                      'line-color': [
                        'case',
                        ['==', ['get', 'priority'], 'critical'], '#ef4444', // red for critical
                        ['==', ['get', 'priority'], 'high'], '#f59e0b', // yellow for high
                        '#6b7280' // gray for normal
                      ],
                      'line-width': 4,
                      'line-opacity': 0.8,
                    }}
                    layout={{
                      'line-cap': 'round',
                      'line-join': 'round'
                    }}
                  />
                  <Layer
                    id="route-arrows"
                    type="symbol"
                    layout={{
                      'symbol-placement': 'line',
                      'symbol-spacing': 100,
                      'icon-image': 'triangle-15',
                      'icon-size': 1,
                      'icon-rotation-alignment': 'map',
                      'icon-allow-overlap': true,
                    }}
                    paint={{
                      'icon-color': [
                        'case',
                        ['==', ['get', 'priority'], 'critical'], '#ef4444',
                        ['==', ['get', 'priority'], 'high'], '#f59e0b',
                        '#6b7280'
                      ],
                      'icon-opacity': 0.8,
                    }}
                  />
                </Source>

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
                    <MapPin 
                      station={station}
                      getStatusColor={getStatusColor}
                      onClick={onMarkerClick}
                    />
                  </Marker>
                ))}

                {/* Animated Truck Markers */}
                {Object.entries(truckPositions).map(([routeId, progress]) => {
                  const route = aiRoutes.find(r => r.id === routeId);
                  if (!route || progress >= 1) return null;
                  
                  const [lng, lat] = getTruckPosition(route, progress);
                  
                  return (
                    <Marker
                      key={`truck-${routeId}`}
                      longitude={lng}
                      latitude={lat}
                      anchor="center"
                    >
                      <div className="relative">
                        <TbTruck className="w-6 h-6 text-emerald-400 drop-shadow-lg animate-bounce" />
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    </Marker>
                  );
                })}

                {/* Enhanced Station Popup */}
                {selectedStation && (
                  <StationPopup
                    station={selectedStation}
                    getStatusColor={getStatusColor}
                    onClose={() => setSelectedStation(null)}
                    showRating={false}
                    showAIWarnings={true}
                  />
                )}
              </Map>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// AI Alert Component
function AIAlert({ alert }: { alert: any }) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/20 border-red-500/30 text-red-400";
      case "warning":
        return "bg-yellow-900/20 border-yellow-500/30 text-yellow-400";
      case "info":
        return "bg-blue-900/20 border-blue-500/30 text-blue-400";
      default:
        return "bg-neutral-800/20 border-neutral-500/30 text-neutral-400";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <TbAlertTriangle className="w-4 h-4" />;
      case "warning":
        return <TbAlertTriangle className="w-4 h-4" />;
      case "info":
        return <TbRobot className="w-4 h-4" />;
      default:
        return <TbRobot className="w-4 h-4" />;
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getSeverityStyles(alert.severity)}`}>
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(alert.severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Station {alert.station}</span>
            <span className="text-xs opacity-75">{alert.timeAgo}</span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}

// AI Route Card Component - Horizontal Layout
function AIRouteCard({ 
  route, 
  isSelected, 
  isDispatched, 
  onClick, 
  onDispatch 
}: { 
  route: any; 
  isSelected: boolean; 
  isDispatched: boolean; 
  onClick: () => void; 
  onDispatch: () => void; 
}) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500/30 bg-red-900/10";
      case "high":
        return "border-yellow-500/30 bg-yellow-900/10";
      default:
        return "border-neutral-500/30 bg-neutral-800/10";
    }
  };

  return (
    <div 
      className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
        getPriorityStyles(route.priority)
      } ${
        isSelected 
          ? "ring-2 ring-emerald-500/50 bg-emerald-600/10 shadow-neuro-dark-pressed" 
          : "bg-custom-bg-shadow-dark shadow-neuro-dark-deep hover:shadow-neuro-dark-pressed"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Route Info */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Priority Badge */}
          <div className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${
            route.priority === "critical" 
              ? "bg-red-500/20 text-red-400" 
              : route.priority === "high"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-neutral-500/20 text-neutral-400"
          }`}>
            {route.priority.toUpperCase()}
          </div>
          
          {/* Route Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <div className="flex items-center space-x-2 text-neutral-200 font-medium">
                <span className="bg-neutral-700 text-neutral-200 px-2 py-1 rounded text-sm">
                  {route.from}
                </span>
                <TbArrowRight className="w-4 h-4 text-emerald-400" />
                <span className="bg-neutral-700 text-neutral-200 px-2 py-1 rounded text-sm">
                  {route.to}
                </span>
              </div>
              <div className="text-neutral-400 text-sm">
                {route.batteries} batteries
              </div>
            </div>
            <p className="text-xs text-neutral-500 italic truncate">{route.reason}</p>
          </div>
        </div>

        {/* Right Section - ETA & Action */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          
          <div className="text-right">
            <div className="text-neutral-300 text-sm font-medium">ETA</div>
            <div className="text-neutral-400 text-xs">{route.eta}</div>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDispatch();
            }}
            disabled={isDispatched}
            className={`rounded-lg py-2 px-4 text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              isDispatched
                ? "bg-green-600/20 border border-green-500/30 text-green-400 cursor-not-allowed"
                : "bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400"
            }`}
          >
            {isDispatched ? (
              <>
                <TbCheck className="w-4 h-4" />
                <span>Dispatched</span>
              </>
            ) : (
              <>
                <TbTruck className="w-4 h-4" />
                <span>Dispatch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: {id: string, message: string, type: string}[]; 
  onRemove: (id: string) => void; 
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Individual Toast Component
function Toast({ 
  toast, 
  onRemove 
}: { 
  toast: {id: string, message: string, type: string}; 
  onRemove: (id: string) => void; 
}) {
  return (
    <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-xl p-4 max-w-sm border border-emerald-500/30 transform transition-all duration-300 ease-out animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <TbCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-medium mb-1">
                Delivery Complete!
              </p>
              <p className="text-neutral-300 text-xs leading-relaxed">
                {toast.message}
              </p>
            </div>
            
            <button
              onClick={() => onRemove(toast.id)}
              className="ml-2 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <TbX className="w-4 h-4" />
            </button>
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
          <h4 className="text-neutral-200 font-semibold flex items-center space-x-2">
            <span>Station {station.id}</span>
            {station.predictedEmptyIn && (
              <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                station.predictedEmptyIn === "CRITICAL" 
                  ? "bg-red-500/20 text-red-400 animate-pulse" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {station.predictedEmptyIn === "CRITICAL" ? "⚠ EMPTY" : "⚠"}
              </div>
            )}
          </h4>
          <p className="text-neutral-400 text-sm">{station.location}</p>
        </div>
        {getStatusIcon(station.status)}
      </div>

      {/* AI Prediction */}
      {station.predictedEmptyIn && (
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
