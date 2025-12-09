// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
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
    title: "SmartQuote AI",
    description: "Inteligentny system wycen projektów",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
            {children}
            {/* USUNIĘTE: <GlobalAIChat /> */}
        </Providers>
        </body>
        </html>
    );
}