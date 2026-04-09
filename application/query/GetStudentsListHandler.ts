import { getStudentsByRole } from '@/app/lib/db'

export class GetStudentsListHandler {

    async handle(): Promise<GetStudentsListResponse> {
        const students = getStudentsByRole('Estudiante')

        const response = students.map((student) => ({
            id: student.id,
            name: student.name,
            email: student.email,
            active: true,
        }))

        return { list: response }
    }
}

export type GetStudentsListQuery = Record<string, never>

export interface GetStudentsListResponse {
    list: Student[]
}

export interface Student {
    id: string
    name: string
    email: string
    active: boolean
}