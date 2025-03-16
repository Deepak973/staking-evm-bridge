"use client";

import { CrossChainBridge } from "@/app/components/CrossChainBridge";

export default function BridgePage() {
  return (
    <div className="py-8 max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Information Panel */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Cross-Chain Bridge</h2>

          <div>
            <h3 className="text-lg font-medium mb-2">Supported Chains</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Arbitrum Sepolia</li>
              <li>• Ethereum Sepolia</li>
              <li>• Optimism Sepolia</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Supported Token</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• USDC</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">How it works</h3>
            <ul className="space-y-2 text-gray-600">
              <li>1. Select destination chain</li>
              <li>2. Enter receiver address</li>
              <li>3. Enter USDC amount</li>
              <li>4. Approve USDC spending</li>
              <li>5. Confirm cross-chain transfer</li>
            </ul>
          </div>
        </div>

        {/* Bridge Form */}
        <div className="md:col-span-2">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">
              Transfer USDC Cross-Chain
            </h1>
            <CrossChainBridge />
          </div>
        </div>
      </div>
    </div>
  );
}
