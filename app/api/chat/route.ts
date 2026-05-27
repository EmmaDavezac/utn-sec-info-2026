import { NextRequest, NextResponse } from 'next/server'
import { AddMessageHandler, AddMessageCommand } from '@/application/command/AddMessageHandler'
import { withApiRoute } from '@/app/lib/withApiRoute'

const addMessageCommandHandler = async (request: NextRequest): Promise<NextResponse> => {
    const handler = new AddMessageHandler()
    
    const command: AddMessageCommand = await request.json()
    const response = await handler.handle(command)
    return NextResponse.json(response)
}

export const POST = withApiRoute(addMessageCommandHandler)