"use client";

import { useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  FullscreenControl,
  GeolocateControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { STATIONS, getStatusColor, type Station } from "@/data/stations";
import {
  TbBatteryFilled,
  TbMapPin,
  TbStar,
  TbTemperature,
  TbCloud,
  TbMenu2,
  TbSettings,
  TbCheck,
  TbAlertTriangle,
  TbCircleFilled,
} from "react-icons/tb";

export default function MobileDashboard() {
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 11,
  });

  // Get stations from centralized data
  const stations: Station[] = STATIONS.slice(0, 4); // Use first 4 stations

  // Use centralized status color function

  return (
    <div className="min-h-screen bg-gradient-to-br from-custom-bg-light to-custom-bg-dark">
      <div className="max-w-sm mx-auto">
        {/* Header Section */}
        <MobileHeader />
        
        {/* Car Info Section */}
        <CarInfoSection />
        
        {/* Weather & Favorite Station Row */}
        <WeatherFavoriteSection />
        
        {/* Map Section */}
        <MapSection 
          viewState={viewState}
          setViewState={setViewState}
          stations={stations}
          getStatusColor={getStatusColor}
        />
      </div>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="pt-12 pb-4 px-6">

      
      <div>
        <p className="text-neutral-400 text-sm">Good morning, Parth!</p>
      </div>
    </div>
  );
}

function CarInfoSection() {
  return (
    <div className="px-6 mb-6">
      <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-4 relative overflow-hidden">
        {/* Background car image */}
        <div className="absolute right-0 top-0 opacity-80">
          <img 
            src="/cybertruck.png" 
            alt="Tesla Model X"
            className="w-32 h-20 object-contain"
          />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-neutral-400 text-sm">Tesla Model X</p>
              <p className="text-neutral-500 text-xs">F23 4XB</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <TbBatteryFilled className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold text-lg">37%</span>
            <span className="text-neutral-400 text-sm">Battery</span>
          </div>
          
          <div className="w-full bg-custom-bg-light shadow-neuro-dark-inset rounded-full h-2">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: "37%" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherFavoriteSection() {
  return (
    <div className="px-6 mb-4">
      <div className="grid grid-cols-2 gap-5">
        {/* Weather Card */}
        <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-xl p-3">
          <div className="flex items-center space-x-1 mb-1">
            <TbCloud className="w-4 h-4 text-blue-400" />
            <span className="text-neutral-400 text-xs">New York, USA</span>
          </div>
          <div className="text-neutral-200 text-xl font-bold mb-0.5">81°F</div>
          <div className="text-neutral-500 text-xs">Day 83°F • Night 76°F</div>
        </div>
        
        {/* Favorite Station Card */}
        <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-xl p-3">
          <div className="flex items-center space-x-1 mb-1">
            <TbMapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-neutral-400 text-xs">Favorite station</span>
          </div>
          <div className="text-neutral-200 font-semibold text-sm mb-0.5">Tesla Station</div>
          <div className="text-neutral-500 text-xs">Hanover St. 24</div>
          <div className="text-emerald-400 text-xs font-medium">1.2 mi</div>
        </div>
      </div>
    </div>
  );
}

function MapSection({ 
  viewState, 
  setViewState, 
  stations, 
  getStatusColor 
}: {
  viewState: any;
  setViewState: (state: any) => void;
  stations: Station[];
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="px-6">
      <div className="bg-custom-bg-shadow-dark shadow-neuro-dark-deep rounded-2xl p-4 h-96">
        <div className="h-full rounded-xl overflow-hidden">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
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
              >
                <div className="relative">
                  {/* Custom Pin */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white"
                    style={{ backgroundColor: getStatusColor(station.status) }}
                  >
                    {station.id}
                  </div>
                  
                  {/* Status indicator */}
                  {station.status === "shortage" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  {station.status === "at-risk" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </Marker>
            ))}
          </Map>
        </div>
      </div>
    </div>
  );
}
