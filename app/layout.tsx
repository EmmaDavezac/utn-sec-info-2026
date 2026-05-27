import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
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
  // 1. Obtenemos el usuario activo directo desde el servidor con Clerk
  const clerkUser = await currentUser();

  // 2. Formateamos la data para que coincida con tu interface UserSession de Zustand
  const userSession: UserSession | null = clerkUser ? {
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    email: clerkUser.emailAddresses[0]?.emailAddress,
    imageUrl: clerkUser.imageUrl,
    role: (clerkUser.publicMetadata?.role as string) ?? 'student',
  } : null;

  return (
    <ClerkProvider signInUrl="/" signUpUrl="/">
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
    </ClerkProvider>
  );
}