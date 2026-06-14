import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/layout/TopNav";
import { WalletProvider } from "@/components/wallet/WalletProvider";

// next/font: fonts downloaded once at build time, served from Vercel edge CDN
// Zero blocking network requests — unlike @import url(fonts.googleapis.com)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-interface",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fiducia — Decentralized Underwriting",
  description: "GenLayer-native underwriting layer. Private evidence. Public trust. Consensus-backed credit decisions.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <TopNav />
          <main className="flex-1">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
