import { NextRequest, NextResponse } from 'next/server'
import { withPermission, UserInfo } from '@/app/lib/withPermission'
import { UpdateStudentDetailHandler } from '@/application/command/UpdateStudentDetailHandler'
import { PERMISSION } from '@/domain/identity/permissions'
import { SqlInjectionGuard } from '@/app/lib/security/SqlInjectionGuard'

const patchStudentDetailHandler = async (
    request: NextRequest,
    userInfo: UserInfo,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
    const { id } = await params
    const studentId = parseInt(id, 10)
    if (isNaN(studentId)) {
        return NextResponse.json({ error: 'ID de estudiante inválido.' }, { status: 400 })
    }

    const body = await request.json()
    if (typeof body.detail !== 'string') {
        return NextResponse.json({ error: 'El campo "detail" debe ser un texto.' }, { status: 400 })
    }

    // Validación SQL Injection a nivel de aplicación
    const validation = SqlInjectionGuard.validateInput(body.detail, 'detail', userInfo.email ?? userInfo.userId)
    if (!validation.isValid) {
        return NextResponse.json(
            { error: 'Entrada rechazada debido a patrones de consulta no permitidos.' },
            { status: 400 }
        )
    }

    const handler = new UpdateStudentDetailHandler()
    await handler.handle({ studentId, detail: body.detail })

    return NextResponse.json({ success: true })
}

export const PATCH = withPermission(PERMISSION.STUDENT_DETAIL_EDIT, patchStudentDetailHandler)
