"use client";

import { CrossChainBridge } from "@/app/components/CrossChainBridge";
import { RequireWallet } from "../components/RequireWallet";

export default function BridgePage() {
  return (
    <RequireWallet>
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Information Panel */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cross-Chain Bridge
              </h2>
              <p className="text-gray-600">
                Transfer your USDC tokens securely across different networks
                using Chainlink CCIP.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 p-2 rounded-lg">🌐</span>
                Supported Networks
              </h3>
              <div className="space-y-3">
                {[
                  "Arbitrum Sepolia",
                  "Ethereum Sepolia",
                  "Optimism Sepolia",
                ].map((chain) => (
                  <div
                    key={chain}
                    className="flex items-center gap-3 text-gray-700 bg-white/50 p-3 rounded-lg"
                  >
                    <div className="h-2 w-2 bg-green-400 rounded-full" />
                    {chain}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-purple-100 p-2 rounded-lg">📝</span>
                How it Works
              </h3>
              <ol className="space-y-3">
                {[
                  "Select your destination chain",
                  "Enter the receiver's address",
                  "Specify USDC amount",
                  "Approve token spending",
                  "Confirm the transfer",
                ].map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <span className="bg-white/50 h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Bridge Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">
                  Transfer USDC Cross-Chain
                </h1>
                <p className="text-gray-500 mt-1">
                  Bridge your USDC tokens to another network
                </p>
              </div>
              <div className="p-6">
                <CrossChainBridge />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireWallet>
  );
}
