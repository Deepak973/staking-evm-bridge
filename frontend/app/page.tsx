"use client";

import { useAccount } from "wagmi";
import Link from "next/link";

export default function Home() {
  return (
    <div className="py-8 max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Stake IT</h1>
        <p className="text-xl text-gray-600 mb-8">
          Secure Cross-Chain Staking & Bridge Solution
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Staking Card */}
        <Link href="/stake" className="transform transition hover:scale-105">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">🏦</div>
            <h2 className="text-xl font-semibold mb-2">Stake Assets</h2>
            <p className="text-gray-600">
              Stake your ETH or ERC20 tokens and earn rewards with flexible
              durations.
            </p>
          </div>
        </Link>

        {/* Bridge Card */}
        <Link href="/bridge" className="transform transition hover:scale-105">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">🌉</div>
            <h2 className="text-xl font-semibold mb-2">Cross-Chain Bridge</h2>
            <p className="text-gray-600">
              Transfer your assets seamlessly across different blockchain
              networks.
            </p>
          </div>
        </Link>

        {/* Portfolio Card */}
        <Link href="/staked" className="transform transition hover:scale-105">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">Your Portfolio</h2>
            <p className="text-gray-600">
              Track your staked assets and manage your investments in one place.
            </p>
          </div>
        </Link>
      </div>

      {/* Features Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4">
            <h3 className="font-semibold mb-2">Flexible Staking</h3>
            <p className="text-gray-600">
              Choose from multiple staking periods with different reward rates
            </p>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Secure Bridge</h3>
            <p className="text-gray-600">
              Powered by Chainlink CCIP for secure cross-chain transfers
            </p>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Reward System</h3>
            <p className="text-gray-600">
              Earn additional rewards for longer staking periods
            </p>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Multi-Token Support</h3>
            <p className="text-gray-600">
              Stake ETH or any compatible ERC20 tokens
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
