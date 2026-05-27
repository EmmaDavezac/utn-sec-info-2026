import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
}

// Singleton para reutilizar la conexión entre invocaciones en el mismo proceso
let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
    if (!client) {
        client = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
            auth: { persistSession: false },
        })
    }
    return client
}
