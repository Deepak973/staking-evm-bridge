import type { Metadata } from "next";

import { headers } from "next/headers"; // added
import "./globals.css";
import ContextProvider from "@/app/context";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Staking Bridge",
  description: "Staking Bridge",
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
        <ContextProvider cookies={cookies}>
          <Nav />
          <main className="container mx-auto px-4 flex-grow">{children}</main>
          <Footer />
        </ContextProvider>
      </body>
    </html>
  );
}
