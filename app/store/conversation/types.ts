
export type Message = {
  id: string
  role: UserRole
  text: string
}

export enum UserRole {
  Admin = 'ai',
  Teacher = 'teacher',
}

export interface ConversationStore {
  conversation: Message[]

  addTeacherMessage: (message: string) => void
  addAiAgentMessage: (message: string) => void
  clearConversation: () => void
}