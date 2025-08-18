"use client";

import { useState } from "react";
import { Header } from "../page";
import {
  TbSearch,
  TbStar,
  TbMapPin,
  TbClock,
  TbArrowRight,
} from "react-icons/tb";

interface Station {
  id: number;
  name: string;
  location: string;
  distance: string;
  rating: number;
  image: string;
}

export default function StationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for nearby stations
  const stations: Station[] = [
    {
      id: 1,
      name: "Supercharge Station",
      location: "Westheimer Rd. Santa Ana, Illinois 85486",
      distance: "4.2 km",
      rating: 4.2,
      image: "/battery-1.png",
    },
    {
      id: 2,
      name: "ElectroHub Charging",
      location: "Main Street, Downtown District, CA 90210",
      distance: "1.8 km",
      rating: 4.7,
      image: "/battery-1.png",
    },
    {
      id: 3,
      name: "Green Energy Station",
      location: "Oak Avenue, Riverside Park, NY 10001",
      distance: "6.5 km",
      rating: 4.1,
      image: "/battery-1.png",
    },
    {
      id: 4,
      name: "PowerPoint EV",
      location: "Tech Boulevard, Innovation Center, TX 75001",
      distance: "3.1 km",
      rating: 4.5,
      image: "/battery-1.png",
    },
    {
      id: 5,
      name: "EcoCharge Plus",
      location: "Sunset Drive, Beachfront Plaza, FL 33101",
      distance: "8.9 km",
      rating: 4.3,
      image: "/battery-1.png",
    },
    {
      id: 6,
      name: "VoltStation Express",
      location: "Mountain View Road, Valley Center, WA 98001",
      distance: "5.7 km",
      rating: 4.6,
      image: "/battery-1.png",
    },
  ];

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
  return (
    <div className="bg-custom-bg-shadow-dark rounded-lg shadow-neuro-dark-deep p-6 m-4">
      {/* Top Section */}
      <div className="flex items-center space-x-4">
        {/* Left Side - Image with Rating */}
        <div className="relative flex-shrink-0">
          <img 
            src={station.image} 
            alt={station.name}
            className="w-16 h-20 rounded-lg object-cover"
          />
          <div className="absolute -top-1 -left-1 bg-emerald-900 rounded-lg px-1.5 py-0.5 flex items-center space-x-1">
            <TbStar className="w-3 h-3 text-white flex-shrink-0" />
            <span className="text-white text-xs font-medium">
              {station.rating}
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
              <span className="text-neutral-400 text-xs">{station.distance}</span>
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
