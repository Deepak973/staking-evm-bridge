"use client";

import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { usePathname } from "next/navigation";

export const Nav = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Staked Assets" },
    { href: "/stake", label: "Stake" },
    { href: "/bridge", label: "Cross-Chain Bridge" },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          <h1 className="text-xl font-bold">Staking Bridge</h1>
          <div className="flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-gray-300 ${
                  pathname === link.href ? "text-blue-400" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
};
