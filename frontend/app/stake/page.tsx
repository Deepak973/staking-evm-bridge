"use client";

import { StakeTokens } from "@/app/components/StakeToken";
import { RequireWallet } from "../components/RequireWallet";

export default function StakePage() {
  return (
    <RequireWallet>
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Information Panel */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Stake Your Assets
              </h2>
              <p className="text-gray-600">
                Earn rewards by staking your ETH or ERC20 tokens in our secure
                staking protocol.
              </p>
            </div>

            {/* Staking Periods */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 p-2 rounded-lg">⏳</span>
                Staking Periods
              </h3>
              <div className="space-y-3">
                {[
                  { period: "1 Month", days: "30 days" },
                  { period: "6 Months", days: "180 days" },
                  { period: "1 Year", days: "365 days" },
                  { period: "2 Years", days: "730 days" },
                ].map((duration) => (
                  <div
                    key={duration.period}
                    className="flex items-center justify-between text-gray-700 bg-white/50 p-3 rounded-lg"
                  >
                    <span className="font-medium">{duration.period}</span>
                    <span className="text-gray-500 text-sm">
                      {duration.days}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 p-2 rounded-lg">🎁</span>
                Rewards
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-gray-700">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>2% bonus rewards on staked amount</span>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Claimable after 180 days of staking</span>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Higher rewards for longer staking periods</span>
                </div>
              </div>
            </div>

            {/* Early Withdrawal */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-amber-100 p-2 rounded-lg">⚠️</span>
                Early Withdrawal
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-gray-700">
                  <div className="h-2 w-2 bg-amber-400 rounded-full mt-2" />
                  <span>10% penalty fee on withdrawn amount</span>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <div className="h-2 w-2 bg-amber-400 rounded-full mt-2" />
                  <span>Forfeiture of accumulated rewards</span>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <div className="h-2 w-2 bg-amber-400 rounded-full mt-2" />
                  <span>Penalty fees contribute to protocol treasury</span>
                </div>
              </div>
            </div>

            {/* Supported Assets */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-purple-100 p-2 rounded-lg">💎</span>
                Supported Assets
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700 bg-white/50 p-3 rounded-lg">
                  <div className="h-2 w-2 bg-blue-400 rounded-full" />
                  <span>Native ETH</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-white/50 p-3 rounded-lg">
                  <div className="h-2 w-2 bg-purple-400 rounded-full" />
                  <span>Any ERC20 Token</span>
                </div>
              </div>
            </div>
          </div>

          {/* Staking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">
                  Stake Your Assets
                </h1>
                <p className="text-gray-500 mt-1">
                  Choose your asset and staking duration to start earning
                  rewards
                </p>
              </div>
              <div className="p-6">
                <StakeTokens />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireWallet>
  );
}
