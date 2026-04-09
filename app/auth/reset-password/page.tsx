"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PasswordInput from "@/app/components/PasswordInput";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    // 1. Validar que coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // 2. Validar fuerza de la contraseña (Estandarizado con el resto de la app)
    // Criterios: 8+ caracteres, 1 Mayúscula, 1 Número, 1 Carácter Especial
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!strongPasswordRegex.test(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial (@$!%*?&)."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ocurrió un error. Intentá de nuevo.");
        return;
      }

      setMessage(data.message || "Tu contraseña ha sido restablecida con éxito.");
    } catch {
      setError("Error de red. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm text-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            El enlace no es válido o expiró.
          </p>
          <Link href="/auth/forgot-password" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Solicitá uno nuevo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Nueva contraseña
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Elegí una contraseña segura siguiendo los estándares de seguridad.
        </p>

        {message ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-400">
              {message}
            </div>
            <Link
              href="/auth"
              className="block text-center w-full rounded-2xl bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 transition-colors"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <PasswordInput
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              required
            />
            <small className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-[-10px] px-1">
              Mínimo 8 caracteres, una mayúscula, un número y un símbolo.
            </small>
            
            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />

            {error && <p className="text-xs text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/auth" className="font-semibold text-zinc-900 dark:text-zinc-100">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </main>
  );
}