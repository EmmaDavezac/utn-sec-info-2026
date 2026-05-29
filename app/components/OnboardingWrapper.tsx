"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, FormEvent } from "react";

export function OnboardingWrapper() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const needsOnboarding = session?.user && (session.user as any).needsOnboarding;

  if (!needsOnboarding) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const dniRegex = /^\d{7,8}$/;
    if (!name.trim() || !dni.trim()) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    if (!dniRegex.test(dni.trim())) {
      setError("El DNI debe ser un número de 7 u 8 dígitos.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/google-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), dni: dni.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ocurrió un error al completar el registro.");
        setLoading(false);
        return;
      }

      // Update the session to refresh needsOnboarding status
      await update();
    } catch (err) {
      console.error(err);
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-2xl">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Completa tu registro
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Por favor, confirma tus datos e introduce tu DNI para terminar el registro de Estudiante.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nombre completo
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              DNI del Estudiante
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 12345678"
                className="mt-3 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500"
                required
              />
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-3 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? "Completando..." : "Confirmar registro"}
          </button>
        </form>
      </div>
    </div>
  );
}
