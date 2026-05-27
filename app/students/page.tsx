"use client"

import { useEffect, useState } from "react"
import { Guard } from "@/app/components/Guard"
import { useStudents } from "@/app/hooks/useStudents"
import { PERMISSION } from "@/domain/identity/permissions"
import { Unauthorized } from '@/app/components/Unauthorized'
import { useStudentsStore, Student } from "@/app/store/students"
import { StudentDetailEditor } from "@/app/students/components/StudentDetailEditor"
import { DniViewer } from "@/app/students/components/DniViewer"

export default function StudentsPage() {
  const { fetchStudents, editStudentDetail } = useStudents()
  const { students } = useStudentsStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStudents = async () => {
      try {
        await fetchStudents()
      } catch (error) {
        console.error("Error fetching students:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStudents()
  }, [])

  return (
    <Guard permission={PERMISSION.STUDENTS_LIST} fallback={<Unauthorized />}>
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
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando estudiantes...
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
                        <span className="text-lg font-medium text-zinc-600 dark:text-zinc-300">{student.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{student.email || `ID: ${student.id}`}</p>
                        
                        {/* DNI Viewer */}
                        <div className="mt-2">
                          <DniViewer studentId={student.id} />
                        </div>

                        <Guard permission={PERMISSION.STUDENT_DETAIL_EDIT}
                          fallback={student.detail ? (
                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 italic leading-relaxed">{student.detail}</p>
                          ) : null}
                        >
                          <StudentDetailEditor student={student} onSave={editStudentDetail} />
                        </Guard>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </Guard>
  )
}