import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APIForge — API Testing Playground",
  description: "A lightweight browser-based API testing and request debugging playground for developers.",
  openGraph: {
    title: "APIForge — API Testing Playground",
    description: "A lightweight browser-based API testing and request debugging playground for developers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APIForge — API Testing Playground",
    description: "A lightweight browser-based API testing and request debugging playground for developers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
