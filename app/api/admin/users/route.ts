import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAllUsers, createUser, updateUser, deleteUser, getUserByEmail } from '@/app/lib/db'

const ADMIN_ROLES = ['administrador', 'admin']
const VALID_ROLES = ['Administrador', 'Profesor', 'Estudiante']

function getTokenRole(token: unknown) {
  const tokenData = token as { role?: string };
  return ((tokenData?.role as string | undefined)?.trim().toLowerCase() ?? '')
}

async function ensureAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const role = getTokenRole(token)
  if (!token || !ADMIN_ROLES.includes(role)) {
    return null
  }
  return token
}

export async function GET(request: NextRequest) {
  const token = await ensureAdmin(request)
  if (!token) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  const users = getAllUsers()
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const token = await ensureAdmin(request)
  if (!token) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password, role } = body as {
    name?: string
    email?: string
    password?: string
    role?: string
  }

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 })
  }

  const normalizedRole = role ? role : 'Estudiante'
  if (!VALID_ROLES.includes(normalizedRole)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
  }

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return NextResponse.json({ error: 'El correo ya está en uso.' }, { status: 409 })
  }

  const user = await createUser(name.trim(), email.trim(), password.trim(), normalizedRole)
  return NextResponse.json({ user }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const token = await ensureAdmin(request)
  if (!token) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const { id, name, email, role, active } = body as {
    id?: string
    name?: string
    email?: string
    role?: string
    active?: boolean
  }

  if (!id) {
    return NextResponse.json({ error: 'ID es obligatorio.' }, { status: 400 })
  }

  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
  }

  if (active !== undefined && typeof active !== 'boolean') {
    return NextResponse.json({ error: 'El estado activo debe ser booleano.' }, { status: 400 })
  }

  if (!name?.trim() && !email?.trim() && !role?.trim() && active === undefined) {
    return NextResponse.json({ error: 'Al menos un campo debe actualizarse.' }, { status: 400 })
  }

  try {
    const updated = updateUser(id, { name, email, role, active })
    if (!updated) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ user: updated })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = await ensureAdmin(request)
  if (!token) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const { id } = body as { id?: string }
  if (!id) {
    return NextResponse.json({ error: 'ID es obligatorio.' }, { status: 400 })
  }

  const deleted = deleteUser(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
