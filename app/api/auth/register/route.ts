import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'El correo ya está en uso.' }, { status: 409 })
    }

    const user = await createUser(name.trim(), email.trim(), password)
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 })
  } catch (error) {
    console.error('Error registrando usuario:', error)
    return NextResponse.json({ error: 'Ocurrió un error registrando el usuario.' }, { status: 500 })
  }
}
