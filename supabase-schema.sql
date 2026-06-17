-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  placa TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS mensualidades (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  placa TEXT NOT NULL REFERENCES usuarios(placa) ON DELETE CASCADE,
  valor_pagado NUMERIC NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  mes TEXT NOT NULL,
  anio INTEGER NOT NULL,
  UNIQUE(placa, mes, anio)
);

-- Habilitar Row Level Security (RLS) - opcional pero recomendado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensualidades ENABLE ROW LEVEL SECURITY;

-- Politicas para permitir acceso completo (ajusta segun necesites)
CREATE POLICY "Allow all operations on usuarios" ON usuarios FOR ALL USING (true);
CREATE POLICY "Allow all operations on mensualidades" ON mensualidades FOR ALL USING (true);
