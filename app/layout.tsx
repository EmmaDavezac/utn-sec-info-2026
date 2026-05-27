import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { Providers } from "@/app/providers";
import SessionInitializer from "@/app/store/SessionInitializer";
import { UserSession } from "@/app/store/session";
import { Header } from "@/app/Header";
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
  title: "Secure Campus IA",
  description: "Plataforma de gestión inteligente para el campus universitario",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Obtenemos el usuario activo directo desde el servidor con NextAuth
  const session = await getServerSession(authOptions);

  // 2. Formateamos la data para que coincida con tu interface UserSession de Zustand
  const user = session?.user as { id?: string; image?: string; role?: string; name?: string; email?: string } | undefined;
  const userSession: UserSession | null = user ? {
    id: user.id ?? "",
    firstName: user.name?.split(" ")[0] ?? "",
    lastName: user.name?.split(" ").slice(1).join(" ") ?? "",
    email: user.email ?? undefined,
    imageUrl: user.image ?? "",
    role: user.role?.toLowerCase() === "administrador" ? "admin" : "student",
  } : null;

  return (
    <Providers session={session}>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-[100dvh] antialiased overflow-hidden`}
      >
        <body className="h-full flex flex-col overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
          {/* 3. Inyectamos la sesión inicial en el store de Zustand */}
          <SessionInitializer user={userSession} />
          <Header />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </body>
      </html>
    </Providers>
  );
}