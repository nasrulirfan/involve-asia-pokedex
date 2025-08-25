import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SWRProvider from "@/components/providers/SWRProvider";
import DevToolsProvider from "@/components/providers/DevToolsProvider";
import PerformanceProvider from "@/components/providers/PerformanceProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pokédex App",
  description: "Browse and search Pokémon with an interactive interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <PerformanceProvider>
          <SWRProvider>
            <DevToolsProvider>
              {children}
            </DevToolsProvider>
          </SWRProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
