"use client";

import { useAccount } from "wagmi";
import { useAuth } from "../context/AuthContext";

export function RequireWallet({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const { isAuthed, signIn, isLoading } = useAuth();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center max-w-md w-full mx-4 p-8 rounded-lg bg-white shadow-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access this page
            </p>
            <div className="flex justify-center">
              <w3m-button />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthed && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center max-w-md w-full mx-4 p-8 rounded-lg bg-white shadow-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign a message to authenticate your wallet
            </p>
            <div className="flex justify-center">
              <button
                onClick={signIn}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                         transition-colors duration-200 font-medium shadow-sm"
              >
                Sign Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center max-w-md w-full mx-4 p-8 rounded-lg bg-white shadow-lg">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
