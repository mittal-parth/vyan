"use client";

import { TbX, TbMenu2, TbUser } from "react-icons/tb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "../app/client";

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
  const account = useActiveAccount();
  
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
      <div className="relative">
        <ConnectButton
          client={client}
          connectButton={{
            style: {
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              backgroundColor: "transparent",
              border: "none",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              color: "transparent",
              fontSize: "0",
            },
            className: "!w-12 !h-12 !rounded-2xl !bg-custom-bg-light !shadow-neuro-dark-outset hover:!shadow-neuro-dark-pressed !transition-all !duration-200 !border-none !p-0 !flex !items-center !justify-center !text-transparent !text-[0px]",
            label: ""
          }}
          connectModal={{
            size: "compact",
          }}
          detailsButton={{
            style: {
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              backgroundColor: "transparent",
              border: "none",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            },
            className: "!w-12 !h-12 !rounded-2xl !bg-custom-bg-light !shadow-neuro-dark-outset hover:!shadow-neuro-dark-pressed !transition-all !duration-200 !border-none !p-0 !flex !items-center !justify-center"
          }}
        />
        {!account && (
          <TbUser className="absolute inset-0 w-6 h-6 text-neutral-400 pointer-events-none m-auto" />
        )}
      </div>
    </div>
  );
}
