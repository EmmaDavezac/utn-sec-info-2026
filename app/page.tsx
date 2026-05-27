"use client";

import { Guard } from "@/app/components/Guard"
import { PERMISSION } from "@/domain/identity/permissions"
import { Unauthorized } from '@/app/components/Unauthorized'
import { useConversation } from '@/app/hooks/useConversation'
import { useState, useRef, useEffect, FormEvent } from "react"
import { useConversationStore, UserRole, Message } from '@/app/store/conversation'

export default function Home() {
  const { conversation, clearConversation } = useConversationStore() as any
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation, isLoading])

  const { addMessageConversation } = useConversation()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    setIsLoading(true)

    try {
      await addMessageConversation(inputValue.trim())
      setInputValue("")
    } catch (error) {
      console.error("Error al obtener la respuesta de la IA:", error)
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <Guard permission={PERMISSION.HOME_CHAT} fallback={<Unauthorized />}>
      <main className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-zinc-950 h-full w-full overflow-hidden">
        <div className="flex flex-col w-full max-w-3xl flex-1 bg-white dark:bg-zinc-900/50 shadow-sm border-x border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
          {/* Toolbar de Chat */}
          {conversation.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 shrink-0">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {conversation.length} {conversation.length === 1 ? 'mensaje' : 'mensajes'}
              </span>
              <button
                onClick={() => clearConversation?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 active:scale-95"
                title="Limpiar conversación"
                aria-label="Limpiar conversación"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Limpiar chat
              </button>
            </div>
          )}

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {conversation.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm text-center">
                Inicia la conversación enviando un mensaje.
              </div>
            ) : (
              conversation.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.role === UserRole.Teacher ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === UserRole.Teacher
                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm"
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-bl-sm"
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="max-w-[85%] px-4 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 rounded-bl-sm flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensaje */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex gap-2 shrink-0 z-20"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500 transition-shadow"
              disabled={isLoading}
              suppressHydrationWarning
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center aspect-square"
              aria-label="Enviar mensaje"
              suppressHydrationWarning
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -ml-0.5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </Guard>
  )
}
