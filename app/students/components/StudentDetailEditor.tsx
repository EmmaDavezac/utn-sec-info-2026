'use client'

import { useState } from 'react'
import { Student } from '@/app/store/students'

interface StudentDetailEditorProps {
  student: Student
  onSave: (id: number, detail: string) => Promise<void>
}

export function StudentDetailEditor({ student, onSave }: StudentDetailEditorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(student.detail ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(student.id, value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(student.detail ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={3}
          placeholder="Escribí un detalle sobre el estudiante..."
          className="w-full text-sm rounded-lg border border-blue-400 dark:border-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando…
              </>
            ) : 'Guardar'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="text-xs font-medium px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 group/detail flex items-start gap-2">
      {student.detail ? (
        <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {student.detail}
        </p>
      ) : (
        <p className="flex-1 text-sm text-zinc-400 dark:text-zinc-600 italic">
          Sin detalle
        </p>
      )}
      <button
        onClick={() => setEditing(true)}
        title="Editar detalle"
        className="flex-shrink-0 opacity-0 group-hover/detail:opacity-100 focus:opacity-100 p-1 rounded text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  )
}
