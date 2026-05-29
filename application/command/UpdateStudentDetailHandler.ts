import { StudentRepository } from '@/infraestructure/repositories/StudentRepository'

export class UpdateStudentDetailHandler {
    private readonly repository: StudentRepository

    constructor() {
        this.repository = new StudentRepository()
    }

    async handle(command: UpdateStudentDetailCommand): Promise<void> {
        await this.repository.updateDetail(command.studentId, command.detail)
    }
}

export interface UpdateStudentDetailCommand {
    studentId: number
    detail: string
}
