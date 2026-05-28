"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Guard } from "@/app/components/Guard";
import { useSessionStore } from "@/app/store/session";
import { PERMISSION } from "@/domain/identity/permissions";
import { useSession, signOut } from "next-auth/react";

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
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const { user, setUser } = useSessionStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const u = session.user as { id?: string; role?: string; name?: string; email?: string; image?: string };
      const rawRole = u.role ?? "Estudiante";
      const role = rawRole.toLowerCase() === "administrador" ? "admin" : (rawRole.toLowerCase() === "profesor" ? "profesor" : "estudiante");
      
      if (u.id !== user?.id || user?.role !== role) {
        setUser({
          id: u.id ?? "",
          firstName: u.name?.split(" ")[0] ?? "",
          lastName: u.name?.split(" ").slice(1).join(" ") ?? "",
          email: u.email ?? undefined,
          imageUrl: u.image ?? "",
          role: role,
        });
      }
    } else if (status === "unauthenticated" && user) {
      setUser(null);
    }
  }, [status, session, user, setUser]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSignOut = () => {
    if (window.confirm("¿Estás seguro que quieres cerrar sesión?")) {
      signOut({ callbackUrl: "/auth" });
    }
  };

  const userName = session?.user?.name || session?.user?.email || "Usuario";
  const userInitial = userName.charAt(0).toUpperCase();

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
            <Guard permission={PERMISSION.ADMIN_PANEL}>
              <NavLink href="/admin">Administración</NavLink>
            </Guard>
          </nav>
        )}
      </div>

      {/* Lado Derecho: Autenticación */}
      <div className="flex items-center gap-4" ref={menuRef}>        
        {isLoaded && status === "authenticated" && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm justify-center ring-1 ring-zinc-200 dark:ring-zinc-800 hover:opacity-85 transition-opacity"
              type="button"
              aria-label="Abrir menú de usuario"
            >
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={userName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                userInitial
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {session.user?.email}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mi perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-zinc-50 dark:text-red-400 dark:hover:bg-zinc-800 transition-colors border-t border-zinc-100 dark:border-zinc-800"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}