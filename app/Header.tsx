"use client";

import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Guard } from "@/app/components/Guard";
import { useSessionStore } from "@/app/store/session";
import { PERMISSION } from "@/domain/identity/permissions";
import {
  UserButton, 
  useUser,
  useSession
} from '@clerk/nextjs';

const NavLink = ({ href, children }: { href: string; children: ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
};

export function Header() {
  const { session } = useSession()
  const { isLoaded, user: clerkUser } = useUser()
  
  const { user, setUser } = useSessionStore();

  useEffect(() => {
    if (isLoaded && clerkUser && session) {
      // Intentamos leer del claim del token, si no, vamos a la metadata del usuario
      const userRole = (clerkUser.publicMetadata?.role as string);

      if (clerkUser.id !== user?.id || user?.role !== userRole) {
        setUser({
          id: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          imageUrl: clerkUser.imageUrl,
          role: userRole
        });
      }
    } else if (isLoaded && !clerkUser && user) {
      setUser(null);
    }
  }, [isLoaded, clerkUser, session, user?.id, user?.role, setUser]);

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0 z-20 w-full">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold tracking-wide text-zinc-800 dark:text-zinc-200 uppercase">
          Secure Campus IA
        </h1>
        {isLoaded && (
          <nav className="flex items-center gap-2">
            <Guard permission={PERMISSION.HOME_CHAT}>
              <NavLink href="/">Chat</NavLink>
            </Guard>
            <Guard permission={PERMISSION.STUDENTS_LIST}>
              <NavLink href="/students">Estudiantes</NavLink>
            </Guard>
          </nav>
        )}
      </div>

      {/* Lado Derecho: Autenticación */}
      <div className="flex items-center gap-4">        
        {isLoaded && (
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 ring-1 ring-zinc-200 dark:ring-zinc-800"
                }
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}