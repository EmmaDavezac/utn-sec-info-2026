'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface DniViewerProps {
    studentId: number
}

/**
 * Componente que muestra el DNI encriptado con un "ojito" para revelarlo temporalmente
 * Solo disponible para usuarios con permiso STUDENT_DNI_VIEW (Admin)
 * El DNI se muestra por 5 segundos y luego se oculta automáticamente
 */
export function DniViewer({ studentId }: DniViewerProps) {
    const [dni, setDni] = useState<string | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const showDni = async () => {
        if (isVisible) {
            setIsVisible(false)
            setDni(null)
            setError(null)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/student/${studentId}/dni`)
            
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('No tienes permiso para ver el DNI')
                }
                throw new Error('Error al obtener DNI')
            }

            const data = await response.json()
            setDni(data.dni)
            setIsVisible(true)

            // Ocultar automáticamente después de 5 segundos
            setTimeout(() => {
                setIsVisible(false)
                setDni(null)
            }, 5000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
            setTimeout(() => setError(null), 3000)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">DNI:</span>
            
            {isVisible && dni ? (
                <span className="font-mono text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 px-2 py-0.5 rounded border border-yellow-300 dark:border-yellow-700">
                    {dni}
                </span>
            ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-500">••••••••</span>
            )}

            <button
                onClick={showDni}
                disabled={isLoading}
                className={`
                    p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${error ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400'}
                `}
                title={isVisible ? 'Ocultar DNI' : 'Mostrar DNI (5 segundos)'}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isVisible ? (
                    <EyeOff className="w-4 h-4" />
                ) : (
                    <Eye className="w-4 h-4" />
                )}
            </button>

            {error && (
                <span className="text-xs text-red-500 dark:text-red-400">{error}</span>
            )}

            {isVisible && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
                    (oculta en 5s)
                </span>
            )}
        </div>
    )
}
