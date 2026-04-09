'use client'

import { api } from '@/app/lib/api'
import { AddMessageResponse } from '@/application/command/AddMessageHandler'

const BASE_URL = '/api/chat'

export const useChatApi = () => {
    const addMessage = async (message: string): Promise<AddMessageResponse> => {
        return api.post<AddMessageResponse>(BASE_URL, { message })
    }

    return {
        addMessage
    }
}