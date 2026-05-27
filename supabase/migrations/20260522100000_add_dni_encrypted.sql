-- Habilitar pgcrypto si no está habilitado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Agregar columna para DNI encriptado
ALTER TABLE students ADD COLUMN IF NOT EXISTS dni_encrypted BYTEA;

-- Función para encriptar DNI
CREATE OR REPLACE FUNCTION encrypt_dni(
    dni_text TEXT,
    encryption_key TEXT
) RETURNS BYTEA AS $$
BEGIN
    -- Usar extensions.pgp_sym_encrypt (esquema de Supabase para extensiones)
    RETURN extensions.pgp_sym_encrypt(dni_text, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para desencriptar DNI
CREATE OR REPLACE FUNCTION decrypt_dni(
    dni_encrypted BYTEA,
    encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
    IF dni_encrypted IS NULL THEN
        RETURN NULL;
    END IF;
    -- Usar extensions.pgp_sym_decrypt (esquema de Supabase para extensiones)
    RETURN extensions.pgp_sym_decrypt(dni_encrypted, encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener DNI desencriptado de un estudiante
CREATE OR REPLACE FUNCTION get_student_dni(
    p_student_id INTEGER,
    p_encryption_key TEXT
) RETURNS TEXT AS $$
DECLARE
    dni_value TEXT;
BEGIN
    SELECT decrypt_dni(dni_encrypted, p_encryption_key)
    INTO dni_value
    FROM students
    WHERE id = p_student_id;
    
    RETURN dni_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generar DNIs random (algunos duplicados intencionalmente)
DO $$
DECLARE
    demo_key TEXT := 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345';
    student_record RECORD;
    random_dni TEXT;
    dni_pool TEXT[] := ARRAY[
        '12345678',
        '23456789',
        '34567890',
        '45678901',
        '56789012',
        '67890123',
        '78901234',
        '89012345',
        '12345678', -- Duplicado intencional
        '23456789', -- Duplicado intencional
        '98765432',
        '87654321',
        '76543210',
        '65432109',
        '54321098',
        '43210987'
    ];
    idx INTEGER := 1;
BEGIN
    FOR student_record IN 
        SELECT id FROM students ORDER BY id
    LOOP
        -- Asignar DNI del pool (circular)
        random_dni := dni_pool[((idx - 1) % array_length(dni_pool, 1)) + 1];
        
        UPDATE students
        SET dni_encrypted = encrypt_dni(random_dni, demo_key)
        WHERE id = student_record.id;
        
        idx := idx + 1;
    END LOOP;
    
    RAISE NOTICE 'DNIs encriptados generados con algunos duplicados';
END $$;

-- Comentarios
COMMENT ON COLUMN students.dni_encrypted IS 'DNI encriptado usando AES-256. Solo desencriptable con clave correcta.';
COMMENT ON FUNCTION encrypt_dni IS 'Encripta DNI usando AES-256 con PGCRYPTO';
COMMENT ON FUNCTION decrypt_dni IS 'Desencripta DNI. Retorna NULL si falla.';
COMMENT ON FUNCTION get_student_dni IS 'Obtiene DNI desencriptado de un estudiante específico';
