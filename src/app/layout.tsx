import "./globals.css";
import Providers from "./providers";
import Header from "../components/Header";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Bouncccer - Quest on Arbitrum",
  description:
    "A transparent quest-and-bounty platform on Arbitrum where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
  keywords: `
    bouncccer, bouncccer io, bouncccer web3, bouncccer arbitrum,
    quest platform, bounty platform, web3 quest, web3 bounty,
    arbitrum bounty, arbitrum quest, crypto bounty platform,
    bouncccer quest, bouncccer bounty
  `,

  icons: {
    icon: "/images/quintle-logo.png",
    shortcut: "/images/quintle-logo.png",
    apple: "/images/quintle-logo.png",
  },
  openGraph: {
    title: "Bouncccer - Quest on Arbitrum",
    description:
      "A transparent quest-and-bounty platform on Arbitrum where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
    images: ["/images/quintle-logo.png"],
    siteName: "Bouncccer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bouncccer - Quest on Arbitrum",
    description:
      "A transparent quest-and-bounty platform on Arbitrum where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
    images: ["/images/quintle-logo.png"],
  },
};

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakartaSans.variable}`} suppressHydrationWarning>
      <head>
      </head>
      <body className={`${jakartaSans.className} antialiased bg-black text-white selection:bg-blue-500/30`} suppressHydrationWarning>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
