"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ConfirmOptions {
  title?: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmOptions | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const toast = {
    success: (msg: string) => showToast(msg, "success"),
    error: (msg: string) => showToast(msg, "error"),
    info: (msg: string) => showToast(msg, "info"),
  };

  const confirm = (message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({
        title,
        message,
        resolve: (val) => {
          setConfirmDialog(null);
          resolve(val);
        },
      });
    });
  };

  return (
    <SessionProvider session={session}>
      <ToastContext.Provider value={{ toast, confirm }}>
        {children}
        
        {/* Toast rendering */}
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-lg border text-sm font-medium animate-slide-in-up flex items-center justify-between gap-3 ${
                t.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-250 dark:border-emerald-900/50"
                  : t.type === "error"
                  ? "bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-200 border-red-250 dark:border-red-900/50"
                  : "bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-250 dark:border-blue-900/50"
              }`}
            >
              <span>{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 font-bold px-1 rounded transition-colors"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Confirm modal rendering */}
        {confirmDialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 animate-scale-up">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {confirmDialog.title || "Confirmación"}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {confirmDialog.message}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => confirmDialog.resolve(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 hover:scale-102 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDialog.resolve(true)}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </ToastContext.Provider>
    </SessionProvider>
  );
}
