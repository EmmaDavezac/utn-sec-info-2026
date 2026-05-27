CREATE TABLE IF NOT EXISTS students (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo
INSERT INTO students (name, email, active) VALUES
    ('Fernando Rodriguez', 'fernando.rodriguez.cora@gmail.com', TRUE),
    ('Juan Pérez',      'juan.perez@example.com',       TRUE),
    ('María Gómez',      'maria.gomez@example.com',      TRUE),
    ('Carlos López',     'carlos.lopez@example.com',     TRUE),
    ('Ana Martínez',     'ana.martinez@example.com',     TRUE),
    ('Luis Fernández',   'luis.fernandez@example.com',   TRUE),
    ('Sofía Ramírez',    'sofia.ramirez@example.com',    TRUE),
    ('Diego Torres',     'diego.torres@example.com',     TRUE),
    ('Valentina Ruiz',   'valentina.ruiz@example.com',   TRUE),
    ('Pedro Sánchez',    'pedro.sanchez@example.com',    TRUE),
    ('Lucía Herrera',    'lucia.herrera@example.com',    TRUE),
    ('Miguel Castro',    'miguel.castro@example.com',    TRUE),
    ('Camila Ortiz',     'camila.ortiz@example.com',     TRUE),
    ('Jorge Díaz',       'jorge.diaz@example.com',       TRUE),
    ('Paula Morales',    'paula.morales@example.com',    TRUE),
    ('Andrés Vega',      'andres.vega@example.com',      TRUE);
