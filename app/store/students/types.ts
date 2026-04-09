
export interface Student {
  id: string
  name: string
  email: string
  active: boolean
}

export interface StudentsStore {
  students: Student[]

  setStudents: (students: Student[]) => void
}