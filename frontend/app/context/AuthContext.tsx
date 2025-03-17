"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { verifySignature, getAuthMessage, signOutUser } from "../utils/auth";
import { useAccountEffect } from "wagmi";

interface AuthContextType {
  isAuthed: boolean;
  signIn: () => Promise<void>;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthed: false,
  signIn: async () => {},
  isLoading: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useAccountEffect({
    onDisconnect: () => {
      signOut();
      console.log("disconnected");
    },
  });
  const checkAuthCookie = () => {
    console.log("checking auth cookie");
    console.log(document.cookie);
    return document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("auth_token_client="));
  };

  const signIn = async () => {
    console.log("signing in kasdln");
    if (!address || !isConnected) {
      return;
    }

    try {
      setIsLoading(true);

      console.log("signing in message");
      // Sign the message
      const signature = await signMessageAsync({
        message: getAuthMessage(),
      });

      console.log("signature", signature);
      // Verify signature and create session
      const response = await verifySignature(address, signature);
      console.log("response", response);
      setIsAuthed(true); // added for now to bypass issues
      if (response.success) {
        setIsAuthed(true);
      } else {
        setIsAuthed(false);
      }
    } catch (error) {
      console.error("Error signing message:", error);
      setIsAuthed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await signOutUser();
    setIsAuthed(false);
  };

  useEffect(() => {
    if (checkAuthCookie()) {
      console.log("checking auth cookie");
      setIsLoading(false);
      setIsAuthed(true);
    } else {
      console.log("signing in");
      signIn();
    }
  }, [isConnected]);

  return (
    <AuthContext.Provider value={{ isAuthed, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
