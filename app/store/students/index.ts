import { create } from 'zustand'
import { Student, StudentsStore } from './types'

export const useStudentsStore = create<StudentsStore>()(
  (set, get) => ({
    students: [],
    
    setStudents: (students: Student[]) => set({ students }),
  }),
)

export type { Student }
