-- Habilitar pgcrypto si no está habilitado (ya debería estarlo, pero por seguridad)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear función para encriptar la dirección IP
CREATE OR REPLACE FUNCTION encrypt_ip(
    ip_text TEXT,
    encryption_key TEXT
) RETURNS BYTEA AS $$
BEGIN
    IF ip_text IS NULL THEN
        RETURN NULL;
    END IF;
    -- Usar extensions.pgp_sym_encrypt (esquema de Supabase para extensiones)
    RETURN extensions.pgp_sym_encrypt(ip_text, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para desencriptar la dirección IP
CREATE OR REPLACE FUNCTION decrypt_ip(
    ip_encrypted BYTEA,
    encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
    IF ip_encrypted IS NULL THEN
        RETURN NULL;
    END IF;
    -- Usar extensions.pgp_sym_decrypt (esquema de Supabase para extensiones)
    RETURN extensions.pgp_sym_decrypt(ip_encrypted, encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modificar la columna ip en login_logs para que sea de tipo BYTEA
-- Si ya existen datos, los encriptamos usando la clave de demostración por defecto
ALTER TABLE login_logs 
    ALTER COLUMN ip TYPE BYTEA 
    USING encrypt_ip(COALESCE(ip, 'unknown'), 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345');

-- Comentarios de documentación para Supabase
COMMENT ON COLUMN login_logs.ip IS 'Dirección IP del cliente encriptada con AES-256 usando pgcrypto.';
COMMENT ON FUNCTION encrypt_ip IS 'Encripta la dirección IP de cliente usando AES-256 con PGCRYPTO';
COMMENT ON FUNCTION decrypt_ip IS 'Desencripta la dirección IP. Retorna unknown si falla o es incorrecta la clave.';
