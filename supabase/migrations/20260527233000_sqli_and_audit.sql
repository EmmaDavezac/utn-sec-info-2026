-- Migración de Entrega 4: Prevención SQLi e implementación de PGAUDIT
-- Creado: 2026-05-28

-- 1. Habilitar la extensión pgaudit
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- 2. Configurar la auditoría a nivel de Roles
-- Como es una base de datos administrada por Supabase, configuramos pgaudit para los roles principales.
-- Esto registrará todas las operaciones de modificación de datos (WRITE) y cambios estructurales (DDL).
ALTER ROLE authenticator SET pgaudit.log = 'write, ddl';
ALTER ROLE postgres SET pgaudit.log = 'write, ddl';

-- 3. Corregir la función vulnerable eliminando la inyección SQL (SQLi)
-- Reemplazamos la concatenación dinámica y EXECUTE por un UPDATE parametrizado nativo de PL/pgSQL
CREATE OR REPLACE FUNCTION actualizar_descripcion_vulnerable(
    p_estudiante_id int,
    p_nueva_descripcion text
)
RETURNS boolean AS $$
BEGIN
    -- Query parametrizada estática y segura. El motor de Postgres separa el comando de los datos.
    UPDATE "students" 
    SET "detail" = p_nueva_descripcion 
    WHERE "id" = p_estudiante_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios explicativos para auditoría
COMMENT ON FUNCTION actualizar_descripcion_vulnerable IS 'Actualiza la descripción de un estudiante de manera segura utilizando SQL parametrizado estático.';
