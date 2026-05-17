-- =========================================================================
-- DUMP DE BASE DE DATOS BANANA SONG COMPATIBLE CON POSTGRESQL (ESQUEMA NORMALIZADO)
-- Generado automáticamente para subida e integración en IAs de Postgres
-- Fecha de generación: 2026-05-17T05:51:22.040Z
-- =========================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    bio VARCHAR(255),
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    hearts INTEGER DEFAULT 5,
    email VARCHAR(255) UNIQUE,
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS difficulties (
    id SERIAL PRIMARY KEY,
    level VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS instruments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS levels (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    stars INTEGER DEFAULT 0,
    instrument VARCHAR(255) DEFAULT 'ukulele',
    difficulty_id INTEGER REFERENCES difficulties(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_instruments (
    id SERIAL PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    instrument_id INTEGER REFERENCES instruments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    score INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    max_combo INTEGER DEFAULT 0,
    accuracy FLOAT DEFAULT 0.0,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_id INTEGER REFERENCES levels(id) ON DELETE CASCADE,
    instrument_id INTEGER REFERENCES instruments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --- DATOS DE USUARIOS ---
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('0318c158-8440-4b57-adf6-ee26b65400e9', 'LuisM', NULL, 0, 0, 5, 'luis.manuel0456@gmail.com', FALSE, '2026-05-16T21:16:53.000Z', '2026-05-16T21:17:15.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('455e0cd3-26fe-4091-a381-03bc9e8107ce', 'Pitt zahot', NULL, 0, 0, 5, 'Pittzahot@example.com', FALSE, '2026-05-17T02:13:03.000Z', '2026-05-17T02:48:45.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('4bb7045a-972d-4997-be8b-5ca21eb3c896', 'tester', NULL, 44, 4, 5, NULL, FALSE, '2026-05-16T05:33:48.000Z', '2026-05-16T05:43:49.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('6e3e7035-63d4-4a1b-ae67-d6d5dd313b1e', 'testuser_123456', NULL, 0, 0, 5, NULL, FALSE, '2026-05-16T20:58:59.000Z', '2026-05-16T21:23:19.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('72f1d2b7-d754-46ad-8d20-67e774d588c0', 'testuser', NULL, 0, 0, 5, NULL, FALSE, '2026-05-16T20:55:00.000Z', '2026-05-16T20:55:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('90eaedca-3953-4a9a-9ddc-ff7347d77ece', 'alvaro', NULL, 0, 0, 5, NULL, FALSE, '2026-05-16T20:30:27.000Z', '2026-05-16T20:30:27.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('9110880c-3494-4c58-9847-c5bef5d35721', 'Test02', NULL, 182, 10, 5, 'test02@example.com', FALSE, '2026-05-16T22:08:12.000Z', '2026-05-17T04:49:49.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('a9451a35-9d3e-43d7-9b15-94981c12657b', 'Jugador1', NULL, 180, 19, 5, NULL, FALSE, '2026-03-19T04:37:58.000Z', '2026-05-16T20:42:20.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('bfc2b276-f839-4ad2-aaf9-fed982f86f42', 'Test03', NULL, 10500, 5, 5, 'test03@example.com', FALSE, '2026-05-16T22:37:36.000Z', '2026-05-17T04:16:19.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('d634928f-67e1-46b3-9e31-727a07b0f4ac', 'tester789', NULL, 0, 0, 5, 'tester789@example.com', FALSE, '2026-05-16T21:24:24.000Z', '2026-05-16T21:24:48.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('dcafe4eb-0b73-4807-855c-b4f90c2ebcd5', 'Test04', NULL, 183, 9, 5, 'test04@example.com', FALSE, '2026-05-17T04:18:06.000Z', '2026-05-17T04:48:44.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('ffa72c54-3d85-4d40-bd0e-e805aae32d3f', 'pruebaDrako', NULL, 0, 0, 5, 'pedo@si.com', FALSE, '2026-05-17T03:44:52.000Z', '2026-05-17T03:45:48.000Z') ON CONFLICT (id) DO NOTHING;

-- --- DATOS DE DIFICULTADES ---
INSERT INTO difficulties (id, level) VALUES (1, 'easy') ON CONFLICT (id) DO NOTHING;
INSERT INTO difficulties (id, level) VALUES (3, 'hard') ON CONFLICT (id) DO NOTHING;
INSERT INTO difficulties (id, level) VALUES (2, 'medium') ON CONFLICT (id) DO NOTHING;

-- --- DATOS DE INSTRUMENTOS ---
INSERT INTO instruments (id, name) VALUES (2, 'guitar_acoustic') ON CONFLICT (id) DO NOTHING;
INSERT INTO instruments (id, name) VALUES (3, 'guitar_electric') ON CONFLICT (id) DO NOTHING;
INSERT INTO instruments (id, name) VALUES (1, 'ukulele') ON CONFLICT (id) DO NOTHING;
INSERT INTO instruments (id, name) VALUES (4, 'violin') ON CONFLICT (id) DO NOTHING;

-- --- DATOS DE NIVELES ---
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (1, 'Lección 1: Cuerdas al Aire', NULL, 0, 'ukulele', NULL, '2026-03-19T04:30:13.000Z', '2026-03-19T04:30:13.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (2, 'La Cucaracha', NULL, 0, 'ukulele', NULL, '2026-05-15T17:01:57.000Z', '2026-05-15T17:01:57.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (3, 'Estrellita Dónde Estás (Twinkle Twinkle)', NULL, 0, 'ukulele', NULL, '2026-05-15T17:04:14.000Z', '2026-05-15T17:04:14.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (5, 'María tenía un corderito', NULL, 0, 'ukulele', NULL, '2026-05-15T17:04:14.000Z', '2026-05-15T17:04:14.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (6, 'Martinillo (Frère Jacques)', NULL, 0, 'ukulele', NULL, '2026-05-15T17:04:14.000Z', '2026-05-15T17:04:14.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (7, 'Cumpleaños Feliz', NULL, 0, 'ukulele', NULL, '2026-05-15T17:04:14.000Z', '2026-05-15T17:04:14.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (13, 'Himno a la Alegría (EXTENDIDA)', NULL, 0, 'ukulele', NULL, '2026-05-15T19:44:58.000Z', '2026-05-15T19:44:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (14, 'Canon en Re (SESIÓN LARGA)', NULL, 0, 'ukulele', NULL, '2026-05-15T19:44:58.000Z', '2026-05-15T19:44:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (15, 'Para Elisa (CONCIERTO)', NULL, 0, 'ukulele', NULL, '2026-05-15T19:44:58.000Z', '2026-05-15T19:44:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (16, 'Guitarra Acústica 101: Cuerdas al aire', NULL, 0, 'guitar_acoustic', NULL, '2026-05-17T03:14:58.000Z', '2026-05-17T03:14:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (17, 'Twinkle Twinkle (Guitarra Acústica)', NULL, 0, 'guitar_acoustic', NULL, '2026-05-17T03:14:58.000Z', '2026-05-17T03:14:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (18, 'Guitarra Eléctrica 101: Riff al aire', NULL, 0, 'guitar_electric', NULL, '2026-05-17T03:14:58.000Z', '2026-05-17T03:14:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (19, 'Riff de Rock Clásico (Smoke on the Water)', NULL, 0, 'guitar_electric', NULL, '2026-05-17T03:14:58.000Z', '2026-05-17T03:14:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (20, 'Violín 101: Cuerdas al aire', NULL, 0, 'violin', NULL, '2026-05-17T03:14:58.000Z', '2026-05-17T03:14:58.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (21, 'Himno a la Alegría (Violín)', NULL, 0, 'violin', NULL, '2026-05-17T03:14:58.000Z', '2026-05-17T03:14:58.000Z') ON CONFLICT (id) DO NOTHING;

-- --- DATOS DE ESTADÍSTICAS POR INSTRUMENTO ---

-- --- DATOS DE PROGRESO DE NIVELES ---

-- --- RESETEAR SECUENCIAS PARA SERIALES ---
SELECT setval('difficulties_id_seq', COALESCE((SELECT MAX(id)+1 FROM difficulties), 1), false);
SELECT setval('instruments_id_seq', COALESCE((SELECT MAX(id)+1 FROM instruments), 1), false);
SELECT setval('levels_id_seq', COALESCE((SELECT MAX(id)+1 FROM levels), 1), false);
SELECT setval('user_instruments_id_seq', COALESCE((SELECT MAX(id)+1 FROM user_instruments), 1), false);
SELECT setval('progress_id_seq', COALESCE((SELECT MAX(id)+1 FROM progress), 1), false);
