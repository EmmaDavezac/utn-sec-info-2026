import { NextRequest, NextResponse } from 'next/server'
import { AddMessageHandler, AddMessageCommand, AddMessageResponse } from '@/application/command/AddMessageHandler'

const addMessageCommandHandler = async (request: NextRequest): Promise<NextResponse> => {
    try {
        const handler = new AddMessageHandler()
        
        const command: AddMessageCommand = await request.json()
        const response = await handler.handle(command)

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error procesando el mensaje:", error)
        return NextResponse.json(
            { error: "Ocurrió un error al procesar la solicitud" },
            { status: 500 }
        )
    }
}

export const POST = addMessageCommandHandler