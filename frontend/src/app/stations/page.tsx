"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { STATIONS, type Station } from "@/data/stations";
import {
  TbSearch,
  TbStar,
  TbMapPin,
  TbClock,
  TbArrowRight,
} from "react-icons/tb";

export default function StationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Get stations from centralized data
  const stations: Station[] = STATIONS;

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto space-y-6">
        <Header />
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <StationsList stations={filteredStations} />
      </div>
    </div>
  );
}

function SearchBar({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  return (
    <div className="relative m-6 pt-2">
      <div className="relative">
        <input
          type="text"
          placeholder="Search stations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-custom-bg-light rounded-2xl shadow-neuro-dark-inset text-neutral-200 placeholder-neutral-500 focus:outline-none focus:shadow-neuro-dark-pressed transition-all duration-200"
        />
        <TbSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
      </div>
    </div>
  );
}

function StationsList({ stations }: { stations: Station[] }) {
  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {stations.map((station) => (
        <StationCard key={station.id} station={station} />
      ))}
    </div>
  );
}

function StationCard({ station }: { station: Station }) {
  const router = useRouter();

  const handleCardClick = () => {
    // Convert station.id (A, B, C, etc.) to numeric ID for URL
    const numericId = station.id.charCodeAt(0) - 64;
    router.push(`/stations/${numericId}`);
  };

  return (
    <div 
      className="bg-custom-bg-shadow-dark rounded-lg shadow-neuro-dark-deep p-6 m-4 cursor-pointer hover:shadow-neuro-dark-pressed transition-all duration-200"
      onClick={handleCardClick}
    >
      {/* Top Section */}
      <div className="flex items-center space-x-4">
        {/* Left Side - Image with Rating */}
        <div className="relative flex-shrink-0">
          <img 
            src={station.image || "/battery-1.png"} 
            alt={station.name}
            className="w-16 h-20 rounded-lg object-cover"
          />
          <div className="absolute -top-1 -left-1 bg-emerald-900 rounded-lg px-1.5 py-0.5 flex items-center space-x-1">
            <TbStar className="w-3 h-3 text-white flex-shrink-0" />
            <span className="text-white text-xs font-medium">
              {station.rating || 4.0}
            </span>
          </div>
        </div>
        
        {/* Right Side - Text Details */}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-neutral-200 font-semibold text-sm mb-2">{station.name}</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TbMapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-400 text-xs truncate">{station.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TbClock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-400 text-xs">{station.distance || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Action Button */}
      {/* <button className="w-full bg-custom-bg-dark shadow-neuro-dark-inset hover:shadow-neuro-dark-pressed rounded-lg py-3 px-4 flex items-center justify-center space-x-2 transition-all duration-200">
        <span className="text-neutral-200 font-medium text-sm">Give me direction</span>
        <TbArrowRight className="w-4 h-4 text-neutral-200" />
      </button> */}
    </div>
  );
}
