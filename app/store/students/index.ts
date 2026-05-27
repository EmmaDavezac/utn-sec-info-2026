import { create } from 'zustand'
import { Student, StudentsStore } from './types'

export const useStudentsStore = create<StudentsStore>()(
  (set) => ({
    students: [],
    setStudents: (students: Student[]) => set({ students }),
    updateStudentDetail: (studentId: number, detail: string) =>
      set(state => ({
        students: state.students.map(s =>
          s.id === studentId ? { ...s, detail } : s
        ),
      })),
  }),
)

export type { Student }
