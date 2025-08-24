"use client";

import { TbX, TbMenu2 } from "react-icons/tb";
import { ConnectWallet } from "./ConnectWallet";

interface DashboardHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  title?: string;
  subtitle?: string;
}

export function DashboardHeader({
  setSidebarOpen,
  sidebarOpen,
  title = "Station Dashboard",
  subtitle = "Manage your EV battery swap network"
}: DashboardHeaderProps) {
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
            {title}
          </h1>
          <p className="text-neutral-400 text-sm">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Connect Wallet */}
      <ConnectWallet />
    </div>
  );
}
