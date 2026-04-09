"use client";

import { FormEvent, useState, use } from "react"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Validar coincidencia
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // 2. Validar seguridad robusta (Regex)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!strongPasswordRegex.test(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }), 
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "El enlace ha expirado o no es válido.");
      } else {
        setSuccess("Contraseña restablecida exitosamente. Redirigiendo...");
        setTimeout(() => router.push("/auth"), 2500);
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        
        <div className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Nueva contraseña
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Crea una credencial segura para recuperar el acceso a tu cuenta.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <PasswordInput
                label="Nueva contraseña"
                value={password}
                onChange={setPassword}
                required
              />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 px-1">
                Usa 8+ caracteres, una mayúscula, un número y un símbolo (@$!%*?&).
              </p>
            </div>

            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-4 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-4 text-xs text-emerald-700 dark:text-emerald-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !!success}
              className="w-full rounded-2xl bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Restableciendo..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/auth"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  );
}