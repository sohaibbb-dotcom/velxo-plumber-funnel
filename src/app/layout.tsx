import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { siteConfig } from "@/config/site";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — Stop Losing Plumbing Jobs to Missed Calls`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
