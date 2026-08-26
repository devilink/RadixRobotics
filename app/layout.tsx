import type { Metadata } from "next";
import { Inter, Space_Grotesk, Anton, Condiment, Caveat } from "next/font/google";
import "./globals.css";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./radix-landing.css";
import NavbarWrapper from "@/app/components/NavbarWrapper";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-space-grotesk' });
const anton = Anton({ subsets: ["latin"], weight: '400', display: 'swap', variable: '--font-grotesk' });
const condiment = Condiment({ subsets: ["latin"], weight: '400', display: 'swap', variable: '--font-condiment' });
const caveat = Caveat({ subsets: ["latin"], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-caveat' });

export const metadata: Metadata = {
  title: "RADIX Robotics — Composite Labs for Schools",
  description: "RADIX Robotics installs world-class composite skill laboratories inside schools — empowering students with robotics, AI, and advanced tech education.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body className={`${inter.className} ${spaceGrotesk.variable} ${anton.variable} ${condiment.variable} ${caveat.variable}`} suppressHydrationWarning>
        <NavbarWrapper />
        {children}
      </body>
    </html>
  );
}
