import { NextRequest, NextResponse } from 'next/server'
import { DniRepository } from '@/infraestructure/repositories/DniRepository'
import { withPermission, UserInfo } from '@/app/lib/withPermission'
import { PERMISSION } from '@/domain/identity/permissions'

const getDniHandler = async (
    request: NextRequest,
    _userInfo: UserInfo,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
    try {
        const { id } = await params
        const studentId = parseInt(id, 10)

        if (isNaN(studentId)) {
            return NextResponse.json(
                { error: 'ID de estudiante inválido' },
                { status: 400 }
            )
        }

        const dniRepo = new DniRepository()
        const dni = await dniRepo.getDniByStudentId(studentId)

        if (!dni) {
            return NextResponse.json(
                { error: 'DNI no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({ dni })
    } catch (error) {
        console.error('Error en endpoint DNI:', error)
        return NextResponse.json(
            { error: 'Error al obtener DNI' },
            { status: 500 }
        )
    }
}

// Proteger endpoint: requiere autenticación y permiso STUDENT_DNI_VIEW (solo Admin)
export const GET = withPermission(PERMISSION.STUDENT_DNI_VIEW, getDniHandler)
