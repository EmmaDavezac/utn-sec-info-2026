-- Migración para Habilitar y Configurar Row Level Security (RLS)
-- Creado: 2026-06-19

-- 1. Habilitar RLS en todas las tablas del esquema público
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar política de lectura anterior en la tabla students
DROP POLICY IF EXISTS "role_based_select" ON students;

-- 3. Crear política de lectura corregida para la tabla students
-- Administradores ('admin') y Profesores ('profesor') pueden consultar todos los registros de alumnos.
-- Los Estudiantes ('estudiante') solo pueden consultar su propia fila (basado en la coincidencia de su email en el JWT).
CREATE POLICY "role_based_select"
ON students
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'admin'
    OR (auth.jwt() ->> 'user_role') = 'profesor'
    OR email = (auth.jwt() ->> 'email')
);

-- Comentarios explicativos de auditoría
COMMENT ON POLICY "role_based_select" ON students IS 'Restringe el acceso SELECT en students por rol (admin/profesor ven todo; estudiante solo lo propio).';
