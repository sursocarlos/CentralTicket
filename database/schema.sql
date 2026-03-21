-- SCRIPT DE CREACIÓN DE BASE DE DATOS: CENTRAL TICKET
-- Proyecto Intermodular DAW
-- Carlos Flores Hernández

-- 1. Usuarios (Debe ir primero porque otras tablas dependen de ella)
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT CHECK (rol IN ('admin', 'tecnico', 'empleado')) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categorías
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL
);

-- 3. Incidencias (Tickets)
CREATE TABLE incidencias (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT CHECK (estado IN ('abierta', 'en proceso', 'resuelta')) DEFAULT 'abierta',
  prioridad TEXT CHECK (prioridad IN ('baja', 'media', 'alta')) DEFAULT 'media',
  url_adjunto TEXT,
  id_creador INTEGER REFERENCES usuarios(id),
  id_tecnico INTEGER REFERENCES usuarios(id),
  id_categoria INTEGER REFERENCES categorias(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Comentarios
CREATE TABLE comentarios (
  id SERIAL PRIMARY KEY,
  contenido TEXT NOT NULL,
  id_incidencia INTEGER REFERENCES incidencias(id) ON DELETE CASCADE,
  id_usuario INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);