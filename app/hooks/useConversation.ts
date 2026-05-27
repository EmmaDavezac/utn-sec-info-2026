import { useCallback } from 'react'
import { useChatApi } from '@/app/lib/clients/useChatApi'
import { useConversationStore } from '@/app/store/conversation'

export const useConversation = () => {
  
    const {
        addTeacherMessage,
        addAiAgentMessage
    } = useConversationStore()
    
    const { addMessage } = useChatApi()

    const addMessageConversation = useCallback(async (message: string) => {
        try {
            addTeacherMessage(message)
            const response = await addMessage(message)
            addAiAgentMessage(response.message)
        } catch {
            addAiAgentMessage("Disculpa, no pude generar una respuesta.")
        }
    }, [addTeacherMessage, addAiAgentMessage, addMessage])

    return {
        addMessageConversation,
    }
}