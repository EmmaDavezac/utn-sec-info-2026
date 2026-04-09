import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { Header } from "@/app/Header";
import { Providers } from "@/app/providers";
import { authOptions } from "@/app/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Secure Campus",
  description: "Aplicación con control de acceso y chat de IA",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-[100dvh] antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-white text-zinc-950 transition-colors duration-200">
        <Providers session={session}>
          <Header session={session} />
          {children}
        </Providers>
      </body>
    </html>
  );
}