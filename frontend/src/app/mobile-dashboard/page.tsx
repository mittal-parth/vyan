"use client";

import { useState } from "react";
import { TbBatteryFilled, TbGauge, TbTemperature } from "react-icons/tb";
import { Header } from "@/components/Header";

export default function Home() {
  const [isACOn, setIsACOn] = useState(false);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto space-y-2">
        <Header />
        <CarSection />
        <StatusSection />
        <InformationSection />
        <ACControl isACOn={isACOn} setIsACOn={setIsACOn} />
      </div>
    </div>
  );
}



function CarSection() {
  return (
    <div className="p-2 flex items-center justify-center">
      {/* Cybertruck image */}
      <img 
        src="/cybertruck.png" 
        alt="Tesla Cybertruck" 
        className="object-contain w-100 h-100"
      />
    </div>
  );
}

function StatusSection() {
  return (
    <div>
      <h2 className="text-neutral-200 text-lg font-semibold">Status</h2>
      <div className="flex justify-between space-x-3 p-4">
        <StatusCard
          label="Battery"
          value="54%"
          icon={TbBatteryFilled}
        />
        <StatusCard
          label="Range"
          value="297km"
          icon={TbGauge}
        />
        <StatusCard
          label="Temperature"
          value="27°C"
          icon={TbTemperature}
        />
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon: Icon }: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex-1 py-4 px-2 flex items-start space-x-2">
      <Icon className="w-5 h-5 text-neutral-400" />
      <div className="flex flex-col space-y-1">
        <span className="text-neutral-400 text-sm font-medium">{label}</span>
        <p className="text-neutral-200 font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}

function InformationSection() {
  return (
    <div>
      <h2 className="text-neutral-200 text-lg font-semibold mb-4">Information</h2>
      <div className="flex space-x-5">
        <InfoCard
          title="Engine"
          subtitle="Active"
        />
        <InfoCard
          title="Climate"
          subtitle="A/C is ON"
        />
        <InfoCard
          title="Fan speed"
          subtitle="Low"
        />
      </div>
    </div>
  );
}

export function InfoCard({ title, subtitle, className = "flex-1" }: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={`bg-custom-bg-shadow-dark rounded-lg shadow-neuro-dark-deep p-4 ${className} flex flex-col justify-end h-24 mb-8`}>
      <h3 className="text-neutral-200 font-semibold text-sm">{title}</h3>
      <p className="text-neutral-400 text-xs">{subtitle}</p>
    </div>
  );
}

function ACControl({ isACOn, setIsACOn }: {
  isACOn: boolean;
  setIsACOn: (value: boolean) => void;
}) {
  return (
    <div className="bg-custom-bg-dark shadow-neuro-dark-deeper rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-neutral-200 font-semibold text-base">A/C is {isACOn ? 'ON' : 'OFF'}</span>
        <button
          onClick={() => setIsACOn(!isACOn)}
          className={`w-14 h-7 rounded-full relative transition-all duration-300 ${
            isACOn ? 'bg-blue-500' : 'bg-custom-bg-dark shadow-neuro-dark-inset'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full bg-custom-bg-light shadow-neuro-dark-outset absolute top-0.5 transition-transform duration-300 ${
              isACOn ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          ></div>
        </button>
      </div>
      <p className="text-neutral-400 text-xs leading-relaxed">
        Tap to turn off or swipe to control A/C / Fan speed, configure shortcut for a fast setup.
      </p>
    </div>
  );
}