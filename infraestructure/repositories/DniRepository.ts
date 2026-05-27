import { getSupabaseClient } from '@/infraestructure/database/supabaseClient'

export class DniRepository {
    private readonly encryptionKey: string

    constructor() {
        // En producción, esta clave debe venir de variables de entorno
        this.encryptionKey = process.env.DB_ENCRYPTION_KEY || 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345'
        
        if (!process.env.DB_ENCRYPTION_KEY) {
            console.warn('⚠️  Usando clave de encriptación por defecto. Configurar DB_ENCRYPTION_KEY en producción')
        }
    }

    /**
     * Obtener DNI desencriptado de un estudiante
     * Solo disponible para usuarios con el permiso adecuado
     */
    async getDniByStudentId(studentId: number): Promise<string | null> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.rpc('get_student_dni', {
            p_student_id: studentId,
            p_encryption_key: this.encryptionKey
        })

        if (error) {
            console.error('Error al obtener DNI:', error)
            throw new Error(`Error al obtener DNI: ${error.message}`)
        }

        return data
    }
}
