import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

/**
 * Genera un JWT HS256 firmado con el secret de Supabase.
 * Contiene los claims necesarios para que las políticas RLS funcionen.
 */
function signSupabaseJWT(email: string, userRole: string, secret: string): string {
    const now = Math.floor(Date.now() / 1000)
    const b64url = (input: string | Buffer): string => {
        const buf = typeof input === 'string' ? Buffer.from(input) : input
        return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    }
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = b64url(JSON.stringify({
        role: 'authenticated',
        email,
        user_role: userRole,
        iat: now,
        exp: now + 3600,
    }))
    const sig = b64url(createHmac('sha256', secret).update(`${header}.${payload}`).digest())
    return `${header}.${payload}.${sig}`
}

/**
 * Cliente Supabase con anon key + JWT firmado con el secret de Supabase.
 * Respeta las políticas RLS — auth.jwt() en las policies devuelve email y user_role.
 */
export function getSupabaseAnonClient(email: string, userRole: string): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const jwtSecret = process.env.SUPABASE_JWT_SECRET

    if (!supabaseUrl || !supabaseAnonKey || !jwtSecret) {
        throw new Error('Faltan las variables de entorno SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y/o SUPABASE_JWT_SECRET')
    }

    const token = signSupabaseJWT(email, userRole, jwtSecret)

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: { Authorization: `Bearer ${token}` },
        },
        auth: { persistSession: false },
    })
}
