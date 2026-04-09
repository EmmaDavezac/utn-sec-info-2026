"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

const NavLink = ({ href, children, currentPath }: { href: string; children: React.ReactNode; currentPath?: string | null }) => {
  const isActive = currentPath != null && (currentPath === href || currentPath.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-zinc-900 text-white shadow-sm"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
      )}
    </Link>
  );
};

export function Header({ session }: { session?: Session | null }) {
  const auth = useSession();
  const sessionData = session ?? auth.data;
  const status = auth.status;
  const role = ((sessionData?.user as any)?.role as string | undefined)?.trim().toLowerCase() ?? "";
  const userName =
    ((sessionData?.user as any)?.name as string | undefined) ||
    ((sessionData?.user as any)?.email as string | undefined) ||
    "Usuario";
  const userInitial = userName.charAt(0).toUpperCase();
  const userRoleText = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "";
  const isAuthenticated = Boolean(sessionData) || status === "authenticated";
  const canViewStudents =
    isAuthenticated && ["profesor", "administrador", "admin"].includes(role);
  const canViewAdmin = isAuthenticated && ["administrador", "admin"].includes(role);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPath(pathname ?? null);
  }, [pathname]);

  const handleSignOut = () => {
    if (window.confirm("¿Estás seguro que quieres cerrar sesión?")) {
      signOut({ callbackUrl: "/" });
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b bg-[var(--header-background)] border-[var(--header-border)] text-[var(--header-text)] shadow-sm shrink-0 z-20 w-full">
      <div className="flex flex-1 flex-wrap items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold tracking-wide uppercase">
            Secure Campus IA
          </h1>
          <button
            type="button"
            onClick={() => setIsNavOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-400 sm:hidden dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            aria-label={isNavOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isNavOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M6 6l12 12M6 18L18 6"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="currentColor"
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        <nav
          suppressHydrationWarning
          className={`w-full ${isNavOpen ? "flex" : "hidden"} flex-col gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-2 border-t border-zinc-200 pt-4 mt-4 sm:border-0 sm:pt-0 sm:mt-0 dark:border-zinc-700`}
        >
          <NavLink href="/chat" currentPath={currentPath}>
            Chat
          </NavLink>
          {canViewStudents && (
            <NavLink href="/students" currentPath={currentPath}>
              Estudiantes
            </NavLink>
          )}
          {canViewAdmin && (
            <NavLink href="/admin" currentPath={currentPath}>
              Administración
            </NavLink>
          )}
        </nav>
      </div>
      <div className="relative flex items-center gap-3 min-w-0" ref={menuRef}>
        {status === "authenticated" && (
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <span className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center text-sm font-semibold">
              {userInitial}
            </span>
            <div className="hidden sm:flex flex-col text-left">
              <span>{userName}</span>
              {userRoleText && <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{userRoleText}</span>}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 transition-transform ${isMenuOpen ? "rotate-180" : "rotate-0"}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {status === "authenticated" && isMenuOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:shadow-zinc-900/20">
            <Link
              href="/profile"
              className="block px-4 py-3 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Mi perfil
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 text-sm text-red-700 transition  hover:bg-zinc-50 hover:text-red-900 dark:text-red-300 dark:hover:bg-zinc-700 dark:hover:text-red-100"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}