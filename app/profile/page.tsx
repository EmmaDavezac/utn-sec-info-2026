"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PasswordInput from "@/app/components/PasswordInput";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  // Estados de Modo y Visibilidad
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Estados del Perfil
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Estados de Contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setName(session.user.name ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session, status]);

  useEffect(() => {
    if (isMounted && status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router, isMounted]);

  // --- LÓGICA DE PERFIL ---

  const handleCancelProfile = () => {
    if (name !== session?.user?.name || email !== session?.user?.email) {
      if (!confirm("¿Descartar los cambios realizados?")) return;
    }
    // Revertir a los valores de la sesión
    setName(session?.user?.name ?? "");
    setEmail(session?.user?.email ?? "");
    setIsEditingProfile(false);
    setProfileError(null);
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!confirm("¿Estás seguro de que deseas guardar estos cambios?")) return;

    setProfileError(null);
    setProfileMessage(null);

    if (!name.trim() || !email.trim()) {
      setProfileError("El nombre y el correo son obligatorios.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setProfileError(data.error || "No se pudo actualizar el perfil.");
        return;
      }

      await update({
        ...session,
        user: { ...session?.user, name: name.trim(), email: email.trim() },
      });

      setProfileMessage("Perfil actualizado correctamente.");
      setIsEditingProfile(false); // Volver a modo lectura
    } catch (error) {
      setProfileError("Error al actualizar el perfil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- LÓGICA DE CONTRASEÑA ---

  const handleCancelPassword = () => {
    if (currentPassword || newPassword || confirmPassword) {
      if (!confirm("¿Cancelar el cambio de contraseña? Se perderán los datos ingresados.")) return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordSection(false);
    setPasswordError(null);
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // 1. Validar que coincidan
    if (newPassword !== confirmPassword) {
      setPasswordError("Las nuevas contraseñas no coinciden.");
      return;
    }

    // 2. Validar fuerza de la contraseña (Regex)
    // Criterios: 8+ caracteres, 1 Mayus, 1 Número, 1 Caracter Especial
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!strongPasswordRegex.test(newPassword)) {
      setPasswordError(
        "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial (@$!%*?&)."
      );
      return;
    }

    // 3. Confirmación del usuario
    if (!confirm("¿Confirmas el cambio de contraseña?")) return;

    setPasswordError(null);
    setPasswordMessage(null);
    setIsUpdatingPassword(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setPasswordError(data.error || "Error al cambiar la contraseña.");
        return;
      }

      setPasswordMessage("Contraseña actualizada con éxito.");
      
      // Limpiar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Cerrar sección después de un breve delay
      setTimeout(() => setShowPasswordSection(false), 2000);
    } catch (error) {
      setPasswordError("Error al conectar con el servidor.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!isMounted || status === "unauthenticated") {
    return <main className="flex min-h-screen items-center justify-center dark:bg-zinc-950 text-zinc-100">Cargando perfil...</main>;
  }

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        
        {/* Encabezado */}
        <div className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Mi perfil</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Gestiona la seguridad y datos de tu cuenta.</p>
        </div>

        {/* SECCIÓN PERFIL (Solo se muestra si no estamos cambiando contraseña) */}
        {!showPasswordSection && (
          <section className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Datos de la cuenta</h2>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Editar datos
                </button>
              )}
            </div>

            <form className="space-y-5" onSubmit={handleProfileSubmit}>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={name}
                  readOnly={!isEditingProfile}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-3xl border px-4 py-3 text-sm transition outline-none ${
                    isEditingProfile 
                    ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 focus:ring-2 focus:ring-zinc-200" 
                    : "border-transparent bg-transparent cursor-default font-semibold text-zinc-600 dark:text-zinc-400 dark:border-zinc-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  readOnly={!isEditingProfile}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-3xl border px-4 py-3 text-sm transition outline-none ${
                    isEditingProfile 
                    ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 focus:ring-2 focus:ring-zinc-200" 
                    : "border-transparent bg-transparent cursor-default font-semibold text-zinc-600 dark:text-zinc-400 dark:border-zinc-800"
                  }`}
                />
              </div>

              {profileError && <p className="text-sm text-red-600">{profileError}</p>}
              {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}

              {isEditingProfile ? (
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 hover:dark:bg-zinc-200"
                  >
                    {isUpdatingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelProfile}
                    className="flex-1 rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(true)}
                  className="w-full text-center text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 pt-4"
                >
                  ¿Deseas cambiar tu contraseña?
                </button>
              )}
            </form>
          </section>
        )}

        {/* SECCIÓN CONTRASEÑA (Solo se muestra si presionaron el botón) */}
        {showPasswordSection && (
          <section className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Cambiar contraseña</h2>
            <form className="space-y-5" onSubmit={handlePasswordSubmit}>
              <PasswordInput label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} required />
              <PasswordInput label="Nueva contraseña" value={newPassword} onChange={setNewPassword} required />
              <small className="text-xs text-zinc-500 dark:text-zinc-400 block">
                La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial.
              </small>
              <PasswordInput label="Confirmar nueva contraseña" value={confirmPassword} onChange={setConfirmPassword} required />

              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 hover:dark:bg-zinc-200"
                >
                  {isUpdatingPassword ? "Cambiando..." : "Actualizar contraseña"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  className="flex-1 rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}