-- ============================================================
--  Monitor-HUB  |  Database Schema
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tipo: roles ───────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_rol AS ENUM ('estudiante', 'monitor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_estado AS ENUM ('pendiente', 'confirmada', 'completada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE modalidad_tipo AS ENUM ('Virtual', 'Presencial', 'Ambas');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notif_tipo AS ENUM (
        'booking_new', 'booking_confirmed', 'booking_cancelled',
        'booking_completed', 'review_new', 'system'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Tabla: users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(120)    NOT NULL,
    programa            VARCHAR(180)    NOT NULL,
    email               VARCHAR(180)    UNIQUE NOT NULL,
    password_hash       TEXT            NOT NULL,
    rol                 user_rol        NOT NULL DEFAULT 'estudiante',
    avatar_url          TEXT,
    bio                 TEXT,
    semestre            SMALLINT        CHECK (semestre BETWEEN 1 AND 12),
    calificacion_promedio NUMERIC(3,2)  DEFAULT 0 CHECK (calificacion_promedio BETWEEN 0 AND 5),
    total_sesiones      INT             DEFAULT 0,
    activo              BOOLEAN         DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── Tabla: offers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
    id              SERIAL PRIMARY KEY,
    tutor_id        INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    materia         VARCHAR(180)    NOT NULL,
    tarifa          INT             NOT NULL CHECK (tarifa >= 0),   -- COP por hora
    modalidad       modalidad_tipo  NOT NULL,
    descripcion     TEXT,
    nivel           VARCHAR(60),                                    -- Básico, Intermedio, Avanzado
    activa          BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── Tabla: availability ───────────────────────────────────────
-- Bloques de disponibilidad horaria del monitor
CREATE TABLE IF NOT EXISTS availability (
    id          SERIAL PRIMARY KEY,
    tutor_id    INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dia_semana  SMALLINT        NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Dom, 6=Sab
    hora_inicio TIME            NOT NULL,
    hora_fin    TIME            NOT NULL,
    CHECK (hora_fin > hora_inicio)
);

-- ── Tabla: bookings ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id              SERIAL PRIMARY KEY,
    estudiante_id   INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id        INT             NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    fecha           DATE            NOT NULL,
    hora            TIME            NOT NULL,
    modalidad       modalidad_tipo  NOT NULL,
    notas           TEXT,
    estado          booking_estado  NOT NULL DEFAULT 'pendiente',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── Tabla: reviews ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id              SERIAL PRIMARY KEY,
    booking_id      INT         UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    estudiante_id   INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id        INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calificacion    SMALLINT    NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabla: notifications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo            notif_tipo  NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT,
    leida           BOOLEAN     DEFAULT FALSE,
    referencia_id   INT,        -- booking_id o review_id según contexto
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offers_tutor_id   ON offers(tutor_id);
CREATE INDEX IF NOT EXISTS idx_offers_activa      ON offers(activa);
CREATE INDEX IF NOT EXISTS idx_bookings_student   ON bookings(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_bookings_offer     ON bookings(offer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_estado    ON bookings(estado);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor      ON reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_leida   ON notifications(user_id, leida);
CREATE INDEX IF NOT EXISTS idx_availability_tutor ON availability(tutor_id);

-- ── Función: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Función: recalcular calificación promedio del tutor ───────
CREATE OR REPLACE FUNCTION recalc_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET calificacion_promedio = (
        SELECT ROUND(AVG(calificacion)::NUMERIC, 2)
        FROM reviews
        WHERE tutor_id = NEW.tutor_id
    ),
    total_sesiones = (
        SELECT COUNT(*)
        FROM bookings b
        JOIN offers o ON o.id = b.offer_id
        WHERE o.tutor_id = NEW.tutor_id AND b.estado = 'completada'
    )
    WHERE id = NEW.tutor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_recalc_rating
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION recalc_tutor_rating();

-- ── Seed: usuario demo ────────────────────────────────────────
-- password: 123456  →  bcrypt hash generado con cost=10
INSERT INTO users (nombre, programa, email, password_hash, rol, bio, semestre)
VALUES
    ('Demo Estudiante', 'Ingeniería de Sistemas',
     'demo@unimagdalena.edu.co',
     '$2a$10$p.JIx0AsyjxSueUUw4rgHe2vvVJBVgnuMfhNOEfspVR/ZuA1VPR8K',
     'estudiante', 'Estudiante de demostración del sistema Monitor-HUB.', 5),
    ('Juan Simancas', 'Ingeniería de Sistemas',
     'juan@unimagdalena.edu.co',
     '$2a$10$p.JIx0AsyjxSueUUw4rgHe2vvVJBVgnuMfhNOEfspVR/ZuA1VPR8K',
     'monitor', 'Monitor de Compiladores y Lenguajes Formales. 3 semestres de experiencia.', 8),
    ('Jossy Rojas', 'Ingeniería de Sistemas',
     'jossy@unimagdalena.edu.co',
     '$2a$10$p.JIx0AsyjxSueUUw4rgHe2vvVJBVgnuMfhNOEfspVR/ZuA1VPR8K',
     'monitor', 'Monitora de Estructuras de Datos y Programación Orientada a Objetos.', 7),
    ('Moises Davila', 'Ingeniería de Sistemas',
     'moises@unimagdalena.edu.co',
     '$2a$10$p.JIx0AsyjxSueUUw4rgHe2vvVJBVgnuMfhNOEfspVR/ZuA1VPR8K',
     'monitor', 'Monitor de Bases de Datos relacionales y NoSQL.', 9),
    ('Admin Sistema', 'Ingeniería de Sistemas',
     'admin@unimagdalena.edu.co',
     '$2a$10$p.JIx0AsyjxSueUUw4rgHe2vvVJBVgnuMfhNOEfspVR/ZuA1VPR8K',
     'admin', 'Administrador del sistema Monitor-HUB con acceso completo.', 10)
ON CONFLICT (email) DO NOTHING;

-- Seed: ofertas de demo
INSERT INTO offers (tutor_id, materia, tarifa, modalidad, descripcion, nivel)
SELECT u.id, 'Compiladores', 14000, 'Virtual',
       'Aprende análisis léxico, sintáctico y generación de código paso a paso.', 'Intermedio'
FROM users u WHERE u.email = 'juan@unimagdalena.edu.co'
ON CONFLICT DO NOTHING;

INSERT INTO offers (tutor_id, materia, tarifa, modalidad, descripcion, nivel)
SELECT u.id, 'Estructuras de Datos', 12000, 'Virtual',
       'Listas, árboles, grafos y algoritmos de ordenamiento explicados con claridad.', 'Básico'
FROM users u WHERE u.email = 'jossy@unimagdalena.edu.co'
ON CONFLICT DO NOTHING;

INSERT INTO offers (tutor_id, materia, tarifa, modalidad, descripcion, nivel)
SELECT u.id, 'Bases de Datos', 13000, 'Ambas',
       'SQL avanzado, normalización, transacciones e introducción a MongoDB.', 'Intermedio'
FROM users u WHERE u.email = 'moises@unimagdalena.edu.co'
ON CONFLICT DO NOTHING;
