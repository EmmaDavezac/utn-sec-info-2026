"use client"

import { useEffect, useState } from "react"
import { useStudents } from "@/app/hooks/useStudents"
import { useStudentsStore, Student } from "@/app/store/students"

export default function StudentsListClient() {
  const { fetchStudents } = useStudents()
  const { students } = useStudentsStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStudents = async () => {
      try {
        await fetchStudents()
      } catch (error) {
        console.error("Error fetching students:", error)
        setError("No se pudo cargar la lista de estudiantes.")
      } finally {
        setIsLoading(false)
      }
    }

    loadStudents()
  }, [fetchStudents])

  return (
    <main className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-zinc-950 h-full w-full overflow-hidden">
      <div className="flex flex-col w-full max-w-4xl flex-1 bg-white dark:bg-zinc-900/50 shadow-sm border-x border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Listado de Estudiantes
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Esta es la lista de estudiantes actualmente en el sistema.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              Cargando estudiantes...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : students.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              No se encontraron estudiantes.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {students.map((student: Student) => (
                <li key={student.id} className="p-4 sm:p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      <span className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{student.email || `ID: ${student.id}`}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
