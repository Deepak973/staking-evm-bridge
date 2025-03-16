import type { Metadata } from "next";
import { headers } from "next/headers"; // added
import "./globals.css";
import ContextProvider from "@/app/context";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "Staking It",
  description: "Staking It",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get("cookie");

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Toaster position="bottom-right" />

        <ContextProvider cookies={cookies}>
          <AuthProvider>
            <Nav />

            <main className="container mx-auto px-4 flex-grow">{children}</main>

            <Footer />
          </AuthProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
