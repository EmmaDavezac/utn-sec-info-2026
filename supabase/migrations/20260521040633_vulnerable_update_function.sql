-- Creamos la función utilizando SQL Parametrizado (Adiós a la inyección SQL)
CREATE OR REPLACE FUNCTION actualizar_descripcion_vulnerable(
    p_estudiante_id int,
    p_nueva_descripcion text
)
RETURNS boolean AS $$
DECLARE
    v_query text;
BEGIN
    v_query := 'UPDATE "students" SET "detail" = ''' || p_nueva_descripcion || ''' WHERE "id" = ''' || p_estudiante_id || '''';
    
    EXECUTE v_query;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;