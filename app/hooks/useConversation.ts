import { useCallback } from 'react'
import { useChatApi } from '@/app/lib/clients/useChatApi'
import { useConversationStore } from '@/app/store/conversation'

export const useConversation = () => {
  const {
    addTeacherMessage,
    addAiAgentMessage,
  } = useConversationStore()

  const { addMessage } = useChatApi()

  const addMessageConversation = useCallback(async (message: string) => {
    addTeacherMessage(message)

    try {
      const response = await addMessage(message)
      addAiAgentMessage(response.message || "No pude generar una respuesta.")
    } catch (error) {
      addAiAgentMessage("Disculpa, no pude generar una respuesta.")
      throw error instanceof Error ? error : new Error("Error al enviar mensaje.")
    }
  }, [addTeacherMessage, addAiAgentMessage, addMessage])

  return {
    addMessageConversation,
  }
}