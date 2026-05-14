import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { AddMessageHandler, AddMessageCommand, AddMessageResponse } from '@/application/command/AddMessageHandler'

const addMessageCommandHandler = async (request: NextRequest): Promise<NextResponse> => {
    try {
        // Obtener sesión del usuario para auditoría
        const session = await getServerSession()
        const userId = (session?.user as any)?.id || session?.user?.email

        const handler = new AddMessageHandler(userId)
        
        const command: AddMessageCommand = await request.json()
        const response = await handler.handle(command)

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error procesando el mensaje:", error)
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        return NextResponse.json(
            { error: errorMessage || "Ocurrió un error al procesar la solicitud" },
            { status: 400 }
        )
    }
}

export const POST = addMessageCommandHandler