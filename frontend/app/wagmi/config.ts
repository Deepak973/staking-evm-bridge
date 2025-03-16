"use client";
import { defaultWagmiConfig } from "@web3modal/wagmi/react";
import { baseSepolia } from "wagmi/chains";
import { createWeb3Modal } from "@web3modal/wagmi/react";

// Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";

const metadata = {
  name: "Staking It",
  description: "Staking and Bridge Application",
  url: "https://your-site.com", // TODO: update this
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const config = defaultWagmiConfig({
  chains: [baseSepolia],
  projectId,
  metadata,
  ssr: true,
});

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: "dark",
});
