"use client";

import Link from "next/link";
import { TbHome, TbUser } from "react-icons/tb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "../app/client";

interface HeaderProps {
  title?: string;
  homeHref?: string;
  className?: string;
}

export function Header({ 
  title = "Vyan", 
  homeHref = "/", 
  className = ""
}: HeaderProps) {
  const account = useActiveAccount();
  
  return (
    <div className={`flex items-center justify-between pt-6 pb-12 px-6 ${className}`}>

      
      {/* Title */}
      <Link href={homeHref} className="text-center">
        <p className="text-neutral-400 text-medium font-medium">{title}</p>
      </Link>
      
      {/* Connect Wallet */}
      <div className="relative">
        <ConnectButton
          client={client}
          connectButton={{
            style: {
              width: "40px",
              height: "40px",
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
            className: "!w-10 !h-10 !rounded-2xl !bg-custom-bg-light !shadow-neuro-dark-outset hover:!shadow-neuro-dark-pressed !transition-all !duration-200 !border-none !p-0 !flex !items-center !justify-center !text-transparent !text-[0px]",
            label: ""
          }}
          connectModal={{
            size: "compact",
          }}
        />
        {!account && (
          <TbUser className="absolute inset-0 w-5 h-5 text-neutral-400 pointer-events-none m-auto" />
        )}
      </div>
    </div>
  );
}
