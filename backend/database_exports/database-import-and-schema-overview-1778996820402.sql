--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (PGlite 0.2.0)
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: meta; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA meta;


ALTER SCHEMA meta OWNER TO postgres;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: embeddings; Type: TABLE; Schema: meta; Owner: postgres
--

CREATE TABLE meta.embeddings (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    content text NOT NULL,
    embedding public.vector(384) NOT NULL
);


ALTER TABLE meta.embeddings OWNER TO postgres;

--
-- Name: embeddings_id_seq; Type: SEQUENCE; Schema: meta; Owner: postgres
--

ALTER TABLE meta.embeddings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME meta.embeddings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migrations; Type: TABLE; Schema: meta; Owner: postgres
--

CREATE TABLE meta.migrations (
    version text NOT NULL,
    name text,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE meta.migrations OWNER TO postgres;

--
-- Name: difficulties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.difficulties (
    id integer NOT NULL,
    level text NOT NULL
);


ALTER TABLE public.difficulties OWNER TO postgres;

--
-- Name: difficulties_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.difficulties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.difficulties_id_seq OWNER TO postgres;

--
-- Name: difficulties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.difficulties_id_seq OWNED BY public.difficulties.id;


--
-- Name: instruments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instruments (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.instruments OWNER TO postgres;

--
-- Name: instruments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.instruments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instruments_id_seq OWNER TO postgres;

--
-- Name: instruments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.instruments_id_seq OWNED BY public.instruments.id;


--
-- Name: levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.levels (
    id integer NOT NULL,
    title text NOT NULL,
    notes text,
    stars integer DEFAULT 0,
    instrument text DEFAULT 'ukulele'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    difficulty_id integer
);


ALTER TABLE public.levels OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.levels_id_seq OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.levels_id_seq OWNED BY public.levels.id;


--
-- Name: progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progress (
    id integer NOT NULL,
    score integer DEFAULT 0,
    stars integer DEFAULT 0,
    completed boolean DEFAULT false,
    max_combo integer DEFAULT 0,
    accuracy double precision DEFAULT 0.0,
    user_id uuid,
    level_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    instrument_id integer
);


ALTER TABLE public.progress OWNER TO postgres;

--
-- Name: progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progress_id_seq OWNER TO postgres;

--
-- Name: progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progress_id_seq OWNED BY public.progress.id;


--
-- Name: user_instruments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_instruments (
    id integer NOT NULL,
    xp integer DEFAULT 0,
    level integer DEFAULT 1,
    badges text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    instrument_id integer
);


ALTER TABLE public.user_instruments OWNER TO postgres;

--
-- Name: user_instruments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_instruments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_instruments_id_seq OWNER TO postgres;

--
-- Name: user_instruments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_instruments_id_seq OWNED BY public.user_instruments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username text NOT NULL,
    bio text,
    xp integer DEFAULT 0,
    streak integer DEFAULT 0,
    hearts integer DEFAULT 5,
    email text,
    is_confirmed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: difficulties id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.difficulties ALTER COLUMN id SET DEFAULT nextval('public.difficulties_id_seq'::regclass);


--
-- Name: instruments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruments ALTER COLUMN id SET DEFAULT nextval('public.instruments_id_seq'::regclass);


--
-- Name: levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels ALTER COLUMN id SET DEFAULT nextval('public.levels_id_seq'::regclass);


--
-- Name: progress id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress ALTER COLUMN id SET DEFAULT nextval('public.progress_id_seq'::regclass);


--
-- Name: user_instruments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_instruments ALTER COLUMN id SET DEFAULT nextval('public.user_instruments_id_seq'::regclass);


--
-- Data for Name: embeddings; Type: TABLE DATA; Schema: meta; Owner: postgres
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: meta; Owner: postgres
--

INSERT INTO meta.migrations VALUES ('202407160001', 'embeddings', '2026-05-17 05:28:05.375+00');


--
-- Data for Name: difficulties; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.difficulties VALUES (1, 'easy');
INSERT INTO public.difficulties VALUES (2, 'medium');
INSERT INTO public.difficulties VALUES (3, 'hard');


--
-- Data for Name: instruments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.instruments VALUES (1, 'ukulele');
INSERT INTO public.instruments VALUES (2, 'guitar');
INSERT INTO public.instruments VALUES (3, 'piano');


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.levels VALUES (1, 'Lección 1: Cuerdas al Aire', NULL, 0, 'ukulele', '2026-03-19 04:30:13+00', '2026-03-19 04:30:13+00', NULL);
INSERT INTO public.levels VALUES (2, 'La Cucaracha', NULL, 0, 'ukulele', '2026-05-15 17:01:57+00', '2026-05-15 17:01:57+00', NULL);
INSERT INTO public.levels VALUES (3, 'Estrellita Dónde Estás (Twinkle Twinkle)', NULL, 0, 'ukulele', '2026-05-15 17:04:14+00', '2026-05-15 17:04:14+00', NULL);
INSERT INTO public.levels VALUES (5, 'María tenía un corderito', NULL, 0, 'ukulele', '2026-05-15 17:04:14+00', '2026-05-15 17:04:14+00', NULL);
INSERT INTO public.levels VALUES (6, 'Martinillo (Frère Jacques)', NULL, 0, 'ukulele', '2026-05-15 17:04:14+00', '2026-05-15 17:04:14+00', NULL);
INSERT INTO public.levels VALUES (7, 'Cumpleaños Feliz', NULL, 0, 'ukulele', '2026-05-15 17:04:14+00', '2026-05-15 17:04:14+00', NULL);
INSERT INTO public.levels VALUES (13, 'Himno a la Alegría (EXTENDIDA)', NULL, 0, 'ukulele', '2026-05-15 19:44:58+00', '2026-05-15 19:44:58+00', NULL);
INSERT INTO public.levels VALUES (14, 'Canon en Re (SESIÓN LARGA)', NULL, 0, 'ukulele', '2026-05-15 19:44:58+00', '2026-05-15 19:44:58+00', NULL);
INSERT INTO public.levels VALUES (15, 'Para Elisa (CONCIERTO)', NULL, 0, 'ukulele', '2026-05-15 19:44:58+00', '2026-05-15 19:44:58+00', NULL);
INSERT INTO public.levels VALUES (16, 'Guitarra Acústica 101: Cuerdas al aire', NULL, 0, 'guitar_acoustic', '2026-05-17 03:14:58+00', '2026-05-17 03:14:58+00', NULL);
INSERT INTO public.levels VALUES (17, 'Twinkle Twinkle (Guitarra Acústica)', NULL, 0, 'guitar_acoustic', '2026-05-17 03:14:58+00', '2026-05-17 03:14:58+00', NULL);
INSERT INTO public.levels VALUES (18, 'Guitarra Eléctrica 101: Riff al aire', NULL, 0, 'guitar_electric', '2026-05-17 03:14:58+00', '2026-05-17 03:14:58+00', NULL);
INSERT INTO public.levels VALUES (19, 'Riff de Rock Clásico (Smoke on the Water)', NULL, 0, 'guitar_electric', '2026-05-17 03:14:58+00', '2026-05-17 03:14:58+00', NULL);
INSERT INTO public.levels VALUES (20, 'Violín 101: Cuerdas al aire', NULL, 0, 'violin', '2026-05-17 03:14:58+00', '2026-05-17 03:14:58+00', NULL);
INSERT INTO public.levels VALUES (21, 'Himno a la Alegría (Violín)', NULL, 0, 'violin', '2026-05-17 03:14:58+00', '2026-05-17 03:14:58+00', NULL);


--
-- Data for Name: progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.progress VALUES (1, 80, 3, true, 4, 100, 'a9451a35-9d3e-43d7-9b15-94981c12657b', 1, '2026-05-15 16:13:10+00', '2026-05-16 19:11:53+00', NULL);
INSERT INTO public.progress VALUES (2, 222, 3, true, 11, 90, 'a9451a35-9d3e-43d7-9b15-94981c12657b', 5, '2026-05-15 17:24:29+00', '2026-05-16 20:41:02+00', NULL);
INSERT INTO public.progress VALUES (3, 250, 2, true, 15, 85, 'a9451a35-9d3e-43d7-9b15-94981c12657b', 2, '2026-05-15 17:58:37+00', '2026-05-16 20:41:44+00', NULL);
INSERT INTO public.progress VALUES (4, 80, 3, true, 4, 100, '4bb7045a-972d-4997-be8b-5ca21eb3c896', 1, '2026-05-16 05:35:01+00', '2026-05-16 05:35:01+00', NULL);
INSERT INTO public.progress VALUES (5, 230, 2, true, 15, 82, '4bb7045a-972d-4997-be8b-5ca21eb3c896', 2, '2026-05-16 05:43:49+00', '2026-05-16 05:43:49+00', NULL);
INSERT INTO public.progress VALUES (6, 80, 3, true, 4, 100, '9110880c-3494-4c58-9847-c5bef5d35721', 1, '2026-05-16 22:22:35+00', '2026-05-16 22:22:35+00', NULL);
INSERT INTO public.progress VALUES (7, 280, 2, true, 15, 88, '9110880c-3494-4c58-9847-c5bef5d35721', 2, '2026-05-16 22:23:19+00', '2026-05-16 22:23:19+00', NULL);
INSERT INTO public.progress VALUES (8, 70, 3, true, 4, 94, 'bfc2b276-f839-4ad2-aaf9-fed982f86f42', 1, '2026-05-16 22:49:04+00', '2026-05-16 22:49:04+00', NULL);
INSERT INTO public.progress VALUES (9, 300, 3, true, 17, 94, 'bfc2b276-f839-4ad2-aaf9-fed982f86f42', 2, '2026-05-16 22:49:43+00', '2026-05-16 22:49:43+00', NULL);
INSERT INTO public.progress VALUES (10, 200, 2, true, 6, 80, 'bfc2b276-f839-4ad2-aaf9-fed982f86f42', 3, '2026-05-16 22:50:46+00', '2026-05-16 23:12:29+00', NULL);
INSERT INTO public.progress VALUES (11, 135, 2, true, 6, 73, 'bfc2b276-f839-4ad2-aaf9-fed982f86f42', 7, '2026-05-16 23:11:15+00', '2026-05-16 23:11:15+00', NULL);
INSERT INTO public.progress VALUES (12, 170, 2, true, 3, 71, 'dcafe4eb-0b73-4807-855c-b4f90c2ebcd5', 3, '2026-05-17 04:20:46+00', '2026-05-17 04:40:51+00', NULL);
INSERT INTO public.progress VALUES (13, 80, 3, true, 4, 100, 'dcafe4eb-0b73-4807-855c-b4f90c2ebcd5', 1, '2026-05-17 04:22:00+00', '2026-05-17 04:22:00+00', NULL);
INSERT INTO public.progress VALUES (14, 285, 3, true, 16, 91, 'dcafe4eb-0b73-4807-855c-b4f90c2ebcd5', 2, '2026-05-17 04:22:33+00', '2026-05-17 04:46:39+00', NULL);
INSERT INTO public.progress VALUES (15, 185, 2, true, 7, 80, '9110880c-3494-4c58-9847-c5bef5d35721', 3, '2026-05-17 04:40:05+00', '2026-05-17 04:49:49+00', NULL);


--
-- Data for Name: user_instruments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_instruments VALUES (1, 44, 1, '[]', '4bb7045a-972d-4997-be8b-5ca21eb3c896', '2026-05-16 23:09:04+00', '2026-05-16 23:09:04+00', NULL);
INSERT INTO public.user_instruments VALUES (2, 182, 1, '[]', '9110880c-3494-4c58-9847-c5bef5d35721', '2026-05-16 23:09:04+00', '2026-05-17 04:49:49+00', NULL);
INSERT INTO public.user_instruments VALUES (3, 180, 1, '[]', 'a9451a35-9d3e-43d7-9b15-94981c12657b', '2026-05-16 23:09:04+00', '2026-05-16 23:09:04+00', NULL);
INSERT INTO public.user_instruments VALUES (4, 10500, 11, '["novice","apprentice","specialist","master"]', 'bfc2b276-f839-4ad2-aaf9-fed982f86f42', '2026-05-16 23:09:04+00', '2026-05-16 23:48:46+00', NULL);
INSERT INTO public.user_instruments VALUES (5, 0, 1, '[]', '455e0cd3-26fe-4091-a381-03bc9e8107ce', '2026-05-17 03:48:00+00', '2026-05-17 03:48:00+00', NULL);
INSERT INTO public.user_instruments VALUES (6, 0, 1, '[]', 'bfc2b276-f839-4ad2-aaf9-fed982f86f42', '2026-05-17 04:11:13+00', '2026-05-17 04:11:13+00', NULL);
INSERT INTO public.user_instruments VALUES (7, 183, 1, '[]', 'dcafe4eb-0b73-4807-855c-b4f90c2ebcd5', '2026-05-17 04:20:46+00', '2026-05-17 04:48:44+00', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES ('0318c158-8440-4b57-adf6-ee26b65400e9', 'LuisM', NULL, 0, 0, 5, 'luis.manuel0456@gmail.com', false, '2026-05-16 21:16:53+00', '2026-05-16 21:17:15+00');
INSERT INTO public.users VALUES ('455e0cd3-26fe-4091-a381-03bc9e8107ce', 'Pitt zahot', NULL, 0, 0, 5, 'Pittzahot@example.com', false, '2026-05-17 02:13:03+00', '2026-05-17 02:48:45+00');
INSERT INTO public.users VALUES ('4bb7045a-972d-4997-be8b-5ca21eb3c896', 'tester', NULL, 44, 4, 5, NULL, false, '2026-05-16 05:33:48+00', '2026-05-16 05:43:49+00');
INSERT INTO public.users VALUES ('6e3e7035-63d4-4a1b-ae67-d6d5dd313b1e', 'testuser_123456', NULL, 0, 0, 5, NULL, false, '2026-05-16 20:58:59+00', '2026-05-16 21:23:19+00');
INSERT INTO public.users VALUES ('72f1d2b7-d754-46ad-8d20-67e774d588c0', 'testuser', NULL, 0, 0, 5, NULL, false, '2026-05-16 20:55:00+00', '2026-05-16 20:55:00+00');
INSERT INTO public.users VALUES ('90eaedca-3953-4a9a-9ddc-ff7347d77ece', 'alvaro', NULL, 0, 0, 5, NULL, false, '2026-05-16 20:30:27+00', '2026-05-16 20:30:27+00');
INSERT INTO public.users VALUES ('9110880c-3494-4c58-9847-c5bef5d35721', 'Test02', NULL, 182, 10, 5, 'test02@example.com', false, '2026-05-16 22:08:12+00', '2026-05-17 04:49:49+00');
INSERT INTO public.users VALUES ('a9451a35-9d3e-43d7-9b15-94981c12657b', 'Jugador1', NULL, 180, 19, 5, NULL, false, '2026-03-19 04:37:58+00', '2026-05-16 20:42:20+00');
INSERT INTO public.users VALUES ('bfc2b276-f839-4ad2-aaf9-fed982f86f42', 'Test03', NULL, 10500, 5, 5, 'test03@example.com', false, '2026-05-16 22:37:36+00', '2026-05-17 04:16:19+00');
INSERT INTO public.users VALUES ('d634928f-67e1-46b3-9e31-727a07b0f4ac', 'tester789', NULL, 0, 0, 5, 'tester789@example.com', false, '2026-05-16 21:24:24+00', '2026-05-16 21:24:48+00');
INSERT INTO public.users VALUES ('dcafe4eb-0b73-4807-855c-b4f90c2ebcd5', 'Test04', NULL, 183, 9, 5, 'test04@example.com', false, '2026-05-17 04:18:06+00', '2026-05-17 04:48:44+00');
INSERT INTO public.users VALUES ('ffa72c54-3d85-4d40-bd0e-e805aae32d3f', 'pruebaDrako', NULL, 0, 0, 5, 'pedo@si.com', false, '2026-05-17 03:44:52+00', '2026-05-17 03:45:48+00');


--
-- Name: embeddings_id_seq; Type: SEQUENCE SET; Schema: meta; Owner: postgres
--

SELECT pg_catalog.setval('meta.embeddings_id_seq', 1, false);


--
-- Name: difficulties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.difficulties_id_seq', 3, true);


--
-- Name: instruments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.instruments_id_seq', 3, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 22, false);


--
-- Name: progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progress_id_seq', 16, false);


--
-- Name: user_instruments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_instruments_id_seq', 8, false);


--
-- Name: embeddings embeddings_pkey; Type: CONSTRAINT; Schema: meta; Owner: postgres
--

ALTER TABLE ONLY meta.embeddings
    ADD CONSTRAINT embeddings_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: meta; Owner: postgres
--

ALTER TABLE ONLY meta.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: difficulties difficulties_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.difficulties
    ADD CONSTRAINT difficulties_level_key UNIQUE (level);


--
-- Name: difficulties difficulties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.difficulties
    ADD CONSTRAINT difficulties_pkey PRIMARY KEY (id);


--
-- Name: instruments instruments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruments
    ADD CONSTRAINT instruments_name_key UNIQUE (name);


--
-- Name: instruments instruments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instruments
    ADD CONSTRAINT instruments_pkey PRIMARY KEY (id);


--
-- Name: levels levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_pkey PRIMARY KEY (id);


--
-- Name: progress progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_pkey PRIMARY KEY (id);


--
-- Name: user_instruments user_instruments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_instruments
    ADD CONSTRAINT user_instruments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_levels_difficulty_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_levels_difficulty_id ON public.levels USING btree (difficulty_id);


--
-- Name: idx_levels_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_levels_title ON public.levels USING btree (title);


--
-- Name: idx_progress_instrument_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_progress_instrument_id ON public.progress USING btree (instrument_id);


--
-- Name: idx_user_instruments_instrument_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_instruments_instrument_id ON public.user_instruments USING btree (instrument_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: levels levels_difficulty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_difficulty_id_fkey FOREIGN KEY (difficulty_id) REFERENCES public.difficulties(id);


--
-- Name: progress progress_instrument_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.instruments(id);


--
-- Name: progress progress_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE;


--
-- Name: progress progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_instruments user_instruments_instrument_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_instruments
    ADD CONSTRAINT user_instruments_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.instruments(id);


--
-- Name: user_instruments user_instruments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_instruments
    ADD CONSTRAINT user_instruments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

