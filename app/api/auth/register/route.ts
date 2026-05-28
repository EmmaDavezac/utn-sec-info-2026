import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, checkDniExists } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, dni } = await request.json()

    if (!name?.trim() || !email?.trim() || !password?.trim() || !dni?.trim()) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 })
    }

    const dniRegex = /^\d{7,8}$/
    if (!dniRegex.test(dni.trim())) {
      return NextResponse.json({ error: 'El DNI debe ser un número de 7 u 8 dígitos.' }, { status: 400 })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'El correo ya está en uso.' }, { status: 409 })
    }

    const dniInUse = await checkDniExists(dni)
    if (dniInUse) {
      return NextResponse.json({ error: 'El DNI ya está registrado en el sistema.' }, { status: 409 })
    }

    const user = await createUser(name.trim(), email.trim(), password, "Estudiante", dni.trim())
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 })
  } catch (error) {
    console.error('Error registrando usuario:', error)
    return NextResponse.json({ error: 'Ocurrió un error registrando el usuario.' }, { status: 500 })
  }
}
