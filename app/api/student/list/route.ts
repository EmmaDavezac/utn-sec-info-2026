import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { GetStudentsListHandler, GetStudentsListQuery } from '@/application/query/GetStudentsListHandler'

const getStudentsListQueryHandler = async (request: NextRequest): Promise<NextResponse> => {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
        const role = (token?.role as string | undefined)?.trim().toLowerCase() ?? ""
        if (!token || !['profesor', 'administrador', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
        }

        const handler = new GetStudentsListHandler()
        const response = await handler.handle()

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error procesando el mensaje:', error)
        return NextResponse.json(
            { error: 'Ocurrió un error al procesar la solicitud' },
            { status: 500 }
        )
    }
}

export const GET = getStudentsListQueryHandler
