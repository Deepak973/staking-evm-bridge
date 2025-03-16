"use client";

import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { usePathname } from "next/navigation";

export const Nav = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/staked", label: "Staked Assets", icon: "📊" },
    { href: "/stake", label: "Stake", icon: "🏦" },
    { href: "/bridge", label: "Bridge", icon: "🌉" },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-xl font-bold hover:text-blue-400 transition-colors"
          >
            <span className="text-2xl">⚡</span>
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
              Stake IT
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all
                  ${
                    pathname === link.href
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300 hover:text-white"
                  }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Connect Button */}
          <div className="flex items-center">
            {/* <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-[1px] rounded-lg"> */}
            {/* <div className="bg-white rounded-lg"> */}
            <ConnectButton />
            {/* </div> */}
            {/* </div> */}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto space-x-2 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 rounded-lg flex items-center space-x-1 whitespace-nowrap
                ${
                  pathname === link.href
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
            >
              <span className="text-sm">{link.icon}</span>
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
