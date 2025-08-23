"use client";

import Link from "next/link";
import { TbHome, TbUser } from "react-icons/tb";

interface HeaderProps {
  title?: string;
  homeHref?: string;
  accountHref?: string;
  className?: string;
}

export function Header({ 
  title = "Vyan", 
  homeHref = "/", 
  accountHref = "/account",
  className = ""
}: HeaderProps) {
  return (
    <div className={`flex items-center justify-between pt-6 pb-12 px-6 ${className}`}>
      {/* Home Button */}
      <Link href={homeHref}>
        <button className="w-10 h-10 rounded-2xl bg-neutral-800 nm-highlight-neutral-700/50 nm-shadow-neutral-950/70 nm-protrude-md flex items-center justify-center hover:nm-dent-sm transition-all duration-200">
          <TbHome className="w-5 h-5 text-neutral-400" />
        </button>
      </Link>
      
      {/* Title */}
      <div className="text-center">
        <p className="text-neutral-400 text-medium font-medium">{title}</p>
      </div>
      
      {/* Account */}
      <Link href={accountHref}>
        <button className="w-10 h-10 rounded-2xl bg-custom-bg-light shadow-neuro-dark-outset flex items-center justify-center hover:shadow-neuro-dark-pressed transition-all duration-200">
          <TbUser className="w-5 h-5 text-neutral-400" />
        </button>
      </Link>
    </div>
  );
}
