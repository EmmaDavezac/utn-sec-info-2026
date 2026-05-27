"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validations
    if (formData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "La nueva contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Las contraseñas no coinciden",
      });
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setMessage({
        type: "error",
        text: "La nueva contraseña debe ser diferente a la actual",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar la contraseña");
      }

      setMessage({ type: "success", text: "Contraseña cambiada correctamente" });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Cambiar contraseña</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
            Actualiza tu contraseña para mantener tu cuenta segura
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <PasswordInput
                label="Contraseña actual"
                value={formData.currentPassword}
                onChange={(value) => handleChange("currentPassword", value)}
                required
              />
            </div>

            <div>
              <PasswordInput
                label="Nueva contraseña"
                value={formData.newPassword}
                onChange={(value) => handleChange("newPassword", value)}
                required
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Mínimo 6 caracteres
              </p>
            </div>

            <div>
              <PasswordInput
                label="Confirmar nueva contraseña"
                value={formData.confirmPassword}
                onChange={(value) => handleChange("confirmPassword", value)}
                required
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl border border-zinc-100/30 bg-zinc-900 text-white py-3 px-6 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isLoading ? "Cambiando..." : "Cambiar contraseña"}
              </button>
              <Link
                href="/profile"
                className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-3 px-6 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Volver
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
