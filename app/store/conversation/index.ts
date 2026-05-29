import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ConversationStore, UserRole, Message } from './types'

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversation: [],

      addTeacherMessage: (message: string) => set({ conversation: [...get().conversation, { id:crypto.randomUUID(), text: message, role: UserRole.Teacher }] }),
      addAiAgentMessage: (message: string) => set({ conversation: [...get().conversation, { id:crypto.randomUUID(), text: message, role: UserRole.Admin }] }),
      clearConversation: () => set({ conversation: [] }),
      
    }),
    {
      name: 'conversation-store',
    }
  )
)

export { UserRole }
export type { Message }
