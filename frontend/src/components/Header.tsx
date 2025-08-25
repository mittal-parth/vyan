"use client";

import Link from "next/link";
import { ConnectWallet } from "./ConnectWallet";

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
  return (
    <div className={`flex items-center justify-between pt-6 pb-12 px-6 ${className}`}>

      
      {/* Logo and Title */}
      <Link href={homeHref} className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="Vyan Logo" 
          className="h-8 w-auto"
        />
        <p className="text-neutral-400 text-medium font-medium">{title}</p>
      </Link>
      
      {/* Connect Wallet */}
      <ConnectWallet />
    </div>
  );
}
