"use client";

import { TbUser } from "react-icons/tb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "../app/client";
const THIRDWEB_API_KEY = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

// Custom sei-testnet chain configuration
const seiTestnet = {
  id: 1328,
  name: "Sei Testnet",
  nativeCurrency: {
    name: "Sei",
    symbol: "SEI",
    decimals: 18,
  },
  rpc: `https://1328.rpc.thirdweb.com/${THIRDWEB_API_KEY}`,
  blockExplorers: [
    {
      name: "Seitrace",
      url: "https://seitrace.com/",
    },
  ],
  testnet: true as const,
};


interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className = "" }: ConnectWalletProps) {
  const account = useActiveAccount();
  
  return (
    <div className={`relative ${className}`}>
      <ConnectButton
        client={client}
        chain={seiTestnet}
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
  );
}
