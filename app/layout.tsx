import type { Metadata } from "next";
import { Inter, Space_Grotesk, Anton, Condiment, Caveat } from "next/font/google";
import "./globals.css";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./radix-landing.css";
import NavbarWrapper from "@/app/components/NavbarWrapper";
import StructuredData from "@/app/components/StructuredData";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-space-grotesk' });
const anton = Anton({ subsets: ["latin"], weight: '400', display: 'swap', variable: '--font-grotesk' });
const condiment = Condiment({ subsets: ["latin"], weight: '400', display: 'swap', variable: '--font-condiment' });
const caveat = Caveat({ subsets: ["latin"], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-caveat' });

export const metadata: Metadata = {
  metadataBase: new URL("https://radixrobotics.com"),
  title: {
    default: "RADIX Robotics | Turnkey Composite Skill Labs for Schools",
    template: "%s | RADIX Robotics",
  },
  description:
    "RADIX Robotics provides turnkey composite skill labs for schools. Empower students with robotics, AI, hardware, and advanced STEM education aligned with NEP.",
  keywords: [
    "robotics education",
    "STEM labs India",
    "composite skill labs",
    "school robotics",
    "AI education",
    "NEP 2020",
    "Atal Tinkering Lab",
    "RADIX Robotics",
  ],
  authors: [{ name: "RADIX Robotics", url: "https://radixrobotics.com" }],
  creator: "RADIX Robotics",
  publisher: "RADIX Robotics",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://radixrobotics.com",
    siteName: "RADIX Robotics",
    title: "RADIX Robotics — Composite Skill Labs for Schools",
    description:
      "Turnkey robotics, AI, and drone labs for Indian schools. NEP 2020 compliant. 300+ lesson plans. Resident engineer support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RADIX Robotics — Building India's Next Generation of Tech Leaders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RADIX Robotics — Composite Skill Labs for Schools",
    description:
      "Turnkey robotics, AI, and drone labs for Indian schools. NEP 2020 compliant.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  alternates: {
    canonical: "https://radixrobotics.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${spaceGrotesk.variable} ${anton.variable} ${condiment.variable} ${caveat.variable} overflow-x-clip`} suppressHydrationWarning>
        <StructuredData />
        <NavbarWrapper />
        {children}
      </body>
    </html>
  );
}
