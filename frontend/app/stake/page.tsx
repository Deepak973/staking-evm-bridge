"use client";

import { StakeTokens } from "@/app/components/StakeToken";
import { useAuth } from "../context/AuthContext";
import { RequireWallet } from "../components/RequireWallet";

export default function StakePage() {
  const { isAuthed } = useAuth();
  // if (!isAuthed) {
  //   return <div>Please sign in to stake</div>;
  // }
  return (
    <RequireWallet>
      <div className="py-8 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Staking Information Panel */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Staking Information</h2>

            {/* Staking Periods */}
            <div>
              <h3 className="text-lg font-medium mb-2">Staking Periods</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 1 Month (30 days)</li>
                <li>• 6 Months (180 days)</li>
                <li>• 1 Year (365 days)</li>
                <li>• 2 Years (730 days)</li>
              </ul>
            </div>

            {/* Rewards */}
            <div>
              <h3 className="text-lg font-medium mb-2">Rewards</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 2% bonus rewards</li>
                <li>• Claimable after 180 days</li>
                <li>• Higher rewards for longer periods</li>
              </ul>
            </div>

            {/* Penalties */}
            <div>
              <h3 className="text-lg font-medium mb-2">Early Withdrawal</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 10% penalty fee</li>
                <li>• No rewards eligibility</li>
                <li>• Penalty goes to treasury</li>
              </ul>
            </div>

            {/* Supported Assets */}
            <div>
              <h3 className="text-lg font-medium mb-2">Supported Assets</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Native ETH</li>
                <li>• Any ERC20 Token</li>
              </ul>
            </div>
          </div>

          {/* Staking Form */}
          <div className="md:col-span-2">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h1 className="text-2xl font-bold mb-6">Stake Your Assets</h1>
              <StakeTokens />
            </div>
          </div>
        </div>
      </div>
    </RequireWallet>
  );
}
