import { create } from 'zustand'
import { ConversationStore, Message, UserRole } from './types'

export const useConversationStore = create<ConversationStore>()(
  (set, get) => ({
    conversation: [],

    addTeacherMessage: (message: string) => set({ conversation: [...get().conversation, { id:crypto.randomUUID(), text: message, role: UserRole.Teacher }] }),
    addAiAgentMessage: (message: string) => set({ conversation: [...get().conversation, { id:crypto.randomUUID(), text: message, role: UserRole.Admin }] }),
    clearConversation: () => set({ conversation: [] }),
  })
)

export { UserRole }
export type { Message }
