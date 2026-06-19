"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import PasswordInput from "@/app/components/PasswordInput";
import { useToast } from "@/app/providers";

type ActiveTab = "signin" | "register";

const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("signin");
  const [isMounted, setIsMounted] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dni, setDni] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    } else {
      setActiveTab("signin");
    }

    const error = searchParams?.get("error");
    if (error) {
      const message =
        error === "OAuthCallback"
          ? "La autenticación con Google falló. Revisa tu configuración de OAuth y prueba de nuevo."
          : "Hubo un problema al iniciar sesión. Por favor, inténtalo otra vez.";
      setOauthError(message);
    } else {
      setOauthError(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isMounted && status === "authenticated") {
      router.replace("/");
    }
  }, [status, router, isMounted]);

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSignInError(null);
    setRegisterError(null);
    setRegisterSuccess(null);
    router.replace(`/auth?tab=${tab}`, { scroll: false });
  };

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setSignInError(null);
    setIsSigningIn(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: signInEmail,
      password: signInPassword,
    });

    setIsSigningIn(false);

    if (!result?.ok) {
      toast.error("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/");
  };

 const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    // 1. Validar que las contraseñas coincidan
    if (registerPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    // 2. Validar que la contraseña tenga al menos 8 caracteres
    if (registerPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    // 3. Validar DNI (7 u 8 dígitos)
    const dniRegex = /^\d{7,8}$/;
    if (!dni.trim()) {
      toast.error("El DNI es obligatorio.");
      return;
    }
    if (!dniRegex.test(dni.trim())) {
      toast.error("El DNI debe ser un número de 7 u 8 dígitos.");
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: registerEmail.trim(), 
          password: registerPassword,
          dni: dni.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "No se pudo registrar el usuario.");
        setIsRegistering(false);
        return;
      }

      toast.success("Cuenta creada con éxito. Iniciando sesión...");
      
      // Iniciar sesión automáticamente
      const result = await signIn("credentials", {
        redirect: false,
        email: registerEmail.trim(),
        password: registerPassword,
      });

      setIsRegistering(false);

      if (!result?.ok) {
        toast.error("Registro exitoso, pero ocurrió un error al iniciar sesión automáticamente.");
        return;
      }

      // Limpiar campos
      setName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
      setDni("");

      router.push("/");
    } catch (error) {
      setRegisterError("Error de conexión. Inténtalo de nuevo.");
      setIsRegistering(false);
    }
  };

  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-4">
        Cargando sesión...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-6xl rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-2xl shadow-zinc-200/20 dark:shadow-black/40 p-8 backdrop-blur-sm">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <aside className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400 mb-4">
                Secure Campus IA
              </p>
              <h1 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Inicia sesión o crea tu cuenta para acceder a Secure Campus IA
              </h1>
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Entra a un espacio diseñado para estudiantes y profesores. Consulta tus dudas academicas al chatbot.
              </p>
            </div>
            <div className="mt-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-sm text-zinc-600 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Acceso rápido</p>
              <p>Regístrate si eres estudiante o ingresa con estas credenciales para probar la app desde distintos roles:</p>
              <div className="mt-3 text-zinc-800 dark:text-zinc-100 break-words">
                <ul>
                  <li><strong>Admin:</strong> admin@example.com</li>
                  <li><strong>Profesor:</strong> profesor@example.com</li>
                  <li><strong>Estudiante:</strong> estudiante@example.com</li>
                </ul>
              </div>
              <div className="mt-2">
               <strong>Contraseña:</strong> password123
              </div>
            </div>
          </aside>

          <section className="min-h-[640px] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
            <div className="mb-6 flex overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => switchTab("signin")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "signin"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "register"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {activeTab === "signin" ? (
              <form className="space-y-5 h-full animate-fade-in" onSubmit={handleSignIn}>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Correo electrónico
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(event) => setSignInEmail(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-zinc-500/30 transition-all duration-300 focus:shadow-md hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                      required
                    />
                  </label>
                </div>
                <div>
                  <PasswordInput
                    label="Contraseña"
                    value={signInPassword}
                    onChange={setSignInPassword}
                    required
                  />
                </div>

                {signInError && <p className="text-sm text-red-600 dark:text-red-500">{signInError}</p>}
                {oauthError && <p className="text-sm text-red-600 dark:text-red-500">{oauthError}</p>}

                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full rounded-2xl border border-zinc-100/30 bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:shadow-none shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isSigningIn ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {googleEnabled && (
                  <div className="mt-4">
                    <div className="relative flex items-center justify-center mb-4">
                      <span className="absolute inset-x-0 h-px bg-zinc-200 dark:bg-zinc-800" />
                      <span className="relative px-3 text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900">
                        o continuar con
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: "/" })}
                      className="w-full rounded-2xl border border-zinc-900 bg-white text-zinc-900 py-3 text-sm font-semibold hover:bg-zinc-50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:border-zinc-700 shadow-sm hover:shadow-md"
                    >
                      Iniciar sesión con Google
                    </button>
                  </div>
                )}

                <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab("register")}
                    className="font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Crear cuenta
                  </button>
                </p>
              </form>
            ) : (
              <form className="space-y-5 animate-fade-in" onSubmit={handleRegister}>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Nombre completo
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-zinc-500/30 transition-all duration-300 focus:shadow-md hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Correo electrónico
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(event) => setRegisterEmail(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-zinc-500/30 transition-all duration-300 focus:shadow-md hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
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
                      onChange={(event) => setDni(event.target.value)}
                      placeholder="Ej: 12345678"
                      className="mt-3 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-zinc-500/30 transition-all duration-300 focus:shadow-md hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                      required
                    />
                  </label>
                </div>
                <div>
                  <PasswordInput
                    label="Contraseña"
                    value={registerPassword}
                    onChange={setRegisterPassword}
                    required
                  />
                </div>
                <small className="text-xs text-zinc-500 dark:text-zinc-400 block">
                  La contraseña debe tener al menos 8 caracteres.
                </small>
                <div>
                  <PasswordInput
                    label="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                  />
                </div>

                {registerError && <p className="text-sm text-red-600 dark:text-red-500">{registerError}</p>}
                {registerSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{registerSuccess}</p>}

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full rounded-2xl border border-zinc-100/30 bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:shadow-none shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registrando...
                    </>
                  ) : (
                    "Crear cuenta"
                  )}
                </button>

                <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  ¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={() => switchTab("signin")} className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Iniciar sesión
                  </button>
                </p>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
