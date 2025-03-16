"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { toast } from "react-hot-toast";
import { verifySignature, getAuthMessage } from "../utils/auth";

interface AuthContextType {
  isAuthed: boolean;
  signIn: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthed: false,
  signIn: async () => {},
  isLoading: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthCookie = () => {
    return document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("auth_token="));
  };

  const signIn = async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      // Get nonce from backend

      // Sign the message
      const signature = await signMessageAsync({
        message: getAuthMessage(),
      });

      // Verify signature and create session
      const response = await verifySignature(address, signature);

      if (response.csrfToken) {
        // setCsrfToken(response.csrfToken);
      }

      setIsAuthed(true);
      toast.success("Successfully authenticated!");
    } catch (error) {
      console.error("Error signing message:", error);
      toast.error("Failed to authenticate");
      setIsAuthed(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (checkAuthCookie()) {
      setIsAuthed(true);
    } else {
      signIn();
    }
  }, [isConnected]);

  return (
    <AuthContext.Provider value={{ isAuthed, signIn, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
