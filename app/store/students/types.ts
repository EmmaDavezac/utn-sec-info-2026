
export interface Student {
  id: number
  name: string
  email: string
  active: boolean
  detail: string | null
}

export interface StudentsStore {
  students: Student[]
  setStudents: (students: Student[]) => void
  updateStudentDetail: (studentId: number, detail: string) => void
}