-- La policy anterior usaba auth.jwt() ->> 'role', pero 'role' es un claim
-- reservado de Supabase para el rol de base de datos (authenticated/anon).
-- Ahora los JWTs se generan con el claim 'user_role' para el rol de la app.

DROP POLICY IF EXISTS "role_based_select" ON students;

CREATE POLICY "role_based_select"
ON students
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'admin'
    OR email = (auth.jwt() ->> 'email')
);
