import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import StudentsListClient from "@/app/students/StudentsListClient"

export default async function StudentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth")
  }

  const role = ((session.user as any)?.role as string | undefined)?.trim().toLowerCase() ?? "";

  if (!session.user || !["profesor", "administrador", "admin"].includes(role)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 shadow-lg text-center">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">403 - Acceso denegado</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            No tienes permiso para ver esta ruta. Solo usuarios con rol de <strong>Profesor</strong> o <strong>Administrador</strong> pueden acceder.
          </p>
          <a
            href="/chat"
            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Volver al chat
          </a>
        </div>
      </main>
    )
  }

  return <StudentsListClient />
}
