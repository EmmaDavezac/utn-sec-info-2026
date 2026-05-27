import { NextRequest, NextResponse } from 'next/server'
import { withPermission, UserInfo } from '@/app/lib/withPermission'
import { UpdateStudentDetailHandler } from '@/application/command/UpdateStudentDetailHandler'
import { PERMISSION } from '@/domain/identity/permissions'

const patchStudentDetailHandler = async (
    request: NextRequest,
    _userInfo: UserInfo,
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

    const handler = new UpdateStudentDetailHandler()
    await handler.handle({ studentId, detail: body.detail })

    return NextResponse.json({ success: true })
}

export const PATCH = withPermission(PERMISSION.STUDENT_DETAIL_EDIT, patchStudentDetailHandler)
