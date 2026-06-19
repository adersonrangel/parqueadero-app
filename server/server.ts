import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDatabase, getDatabase, saveDatabase } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "dist", "public")));

// Registrar usuario
app.post("/api/usuarios", (req, res) => {
  const { placa, nombre, fecha_registro } = req.body;

  if (!placa || !nombre) {
    res.status(400).json({ error: "Placa y nombre son requeridos" });
    return;
  }

  const db = getDatabase();
  const fecha = fecha_registro || new Date().toISOString().split("T")[0];

  try {
    db.run("INSERT INTO usuarios (placa, nombre, fecha_registro) VALUES (?, ?, ?)", [
      placa.toUpperCase(),
      nombre,
      fecha,
    ]);
    saveDatabase();
    res.json({ message: "Usuario registrado exitosamente", placa: placa.toUpperCase() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    if (message.includes("UNIQUE")) {
      res.status(400).json({ error: "La placa ya esta registrada" });
      return;
    }
    res.status(500).json({ error: message });
  }
});

// Listar usuarios
app.get("/api/usuarios", (_req, res) => {
  const db = getDatabase();
  const results = db.exec("SELECT * FROM usuarios ORDER BY fecha_registro DESC");

  if (results.length === 0) {
    res.json([]);
    return;
  }

  const usuarios = results[0].values.map((row: unknown[]) => ({
    id: row[0],
    placa: row[1],
    nombre: row[2],
    fecha_registro: row[3],
  }));

  res.json(usuarios);
});

// Buscar usuario por placa
app.get("/api/usuarios/:placa", (req, res) => {
  const db = getDatabase();
  const placa = req.params.placa.toUpperCase();
  const results = db.exec("SELECT * FROM usuarios WHERE placa = ?", [placa]);

  if (results.length === 0 || results[0].values.length === 0) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const row = results[0].values[0];
  res.json({ id: row[0], placa: row[1], nombre: row[2], fecha_registro: row[3] });
});

// Registrar mensualidad
app.post("/api/mensualidades", (req, res) => {
  const { placa, valor_pagado, mes, anio } = req.body;

  if (!placa || !valor_pagado || !mes || !anio) {
    res.status(400).json({ error: "Placa, valor pagado, mes y anio son requeridos" });
    return;
  }

  const db = getDatabase();

  const userCheck = db.exec("SELECT placa FROM usuarios WHERE placa = ?", [placa.toUpperCase()]);
  if (userCheck.length === 0 || userCheck[0].values.length === 0) {
    res.status(404).json({ error: "No existe un usuario con esa placa" });
    return;
  }

  const existing = db.exec(
    "SELECT id FROM mensualidades WHERE placa = ? AND mes = ? AND anio = ?",
    [placa.toUpperCase(), mes, parseInt(anio)],
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    res.status(400).json({ error: "Ya existe un pago registrado para ese mes y anio" });
    return;
  }

  try {
    db.run(
      "INSERT INTO mensualidades (placa, valor_pagado, mes, anio) VALUES (?, ?, ?, ?)",
      [placa.toUpperCase(), parseFloat(valor_pagado), mes, parseInt(anio)],
    );
    saveDatabase();
    res.json({ message: "Mensualidad registrada exitosamente" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: message });
  }
});

// Listar mensualidades
app.get("/api/mensualidades", (_req, res) => {
  const db = getDatabase();
  const results = db.exec(`
    SELECT m.id, m.placa, u.nombre, m.valor_pagado, m.fecha_pago, m.mes, m.anio
    FROM mensualidades m
    INNER JOIN usuarios u ON m.placa = u.placa
    ORDER BY m.anio DESC, 
    CASE m.mes
      WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
      WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
      WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
      WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
    END DESC
  `);

  if (results.length === 0) {
    res.json([]);
    return;
  }

  const mensualidades = results[0].values.map((row: unknown[]) => ({
    id: row[0],
    placa: row[1],
    nombre: row[2],
    valor_pagado: row[3],
    fecha_pago: row[4],
    mes: row[5],
    anio: row[6],
  }));

  res.json(mensualidades);
});

// Dashboard - estadisticas
app.get("/api/dashboard", (_req, res) => {
  const db = getDatabase();

  const totalUsuarios = db.exec("SELECT COUNT(*) FROM usuarios");
  const totalMensualidades = db.exec("SELECT COUNT(*) FROM mensualidades");
  const totalRecaudado = db.exec("SELECT COALESCE(SUM(valor_pagado), 0) FROM mensualidades");
  const promedioMensual = db.exec("SELECT COALESCE(AVG(valor_pagado), 0) FROM mensualidades");

  const recaudadoPorMes = db.exec(`
    SELECT mes, anio, SUM(valor_pagado) as total
    FROM mensualidades
    GROUP BY mes, anio
    ORDER BY anio DESC,
    CASE mes
      WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
      WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
      WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
      WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
    END DESC
  `);

  const pagosPorUsuario = db.exec(`
    SELECT u.placa, u.nombre, COUNT(m.id) as total_pagos, SUM(m.valor_pagado) as total_pagado
    FROM usuarios u
    LEFT JOIN mensualidades m ON u.placa = m.placa
    GROUP BY u.placa
    ORDER BY total_pagado DESC
  `);

  const mesActual = new Date().toLocaleString("es-CO", { month: "long" });
  const anioActual = new Date().getFullYear();
  const pagosMesActual = db.exec(
    `
    SELECT COUNT(*), COALESCE(SUM(valor_pagado), 0)
    FROM mensualidades WHERE mes = ? AND anio = ?
  `,
    [mesActual.charAt(0).toUpperCase() + mesActual.slice(1), anioActual],
  );

  const formatQuery = (result: { values: unknown[][] }[]) => {
    if (result.length === 0) return [];
    return result[0].values;
  };

  res.json({
    total_usuarios: totalUsuarios.length > 0 ? totalUsuarios[0].values[0][0] : 0,
    total_mensualidades: totalMensualidades.length > 0 ? totalMensualidades[0].values[0][0] : 0,
    total_recaudado: totalRecaudado.length > 0 ? totalRecaudado[0].values[0][0] : 0,
    promedio_mensual: promedioMensual.length > 0 ? promedioMensual[0].values[0][0] : 0,
    pagos_mes_actual:
      pagosMesActual.length > 0
        ? {
            cantidad: pagosMesActual[0].values[0][0],
            total: pagosMesActual[0].values[0][1],
          }
        : { cantidad: 0, total: 0 },
    recaudado_por_mes: formatQuery(recaudadoPorMes).map((r) => ({
      mes: r[0],
      anio: r[1],
      total: r[2],
    })),
    pagos_por_usuario: formatQuery(pagosPorUsuario).map((r) => ({
      placa: r[0],
      nombre: r[1],
      total_pagos: r[2],
      total_pagado: r[3],
    })),
  });
});

// Eliminar usuario
app.delete("/api/usuarios/:placa", (req, res) => {
  const db = getDatabase();
  const placa = req.params.placa.toUpperCase();

  db.run("DELETE FROM mensualidades WHERE placa = ?", [placa]);
  db.run("DELETE FROM usuarios WHERE placa = ?", [placa]);
  saveDatabase();

  res.json({ message: "Usuario eliminado exitosamente" });
});

// Eliminar mensualidad
app.delete("/api/mensualidades/:id", (req, res) => {
  const db = getDatabase();
  const id = parseInt(req.params.id);

  db.run("DELETE FROM mensualidades WHERE id = ?", [id]);
  saveDatabase();

  res.json({ message: "Mensualidad eliminada exitosamente" });
});

// Fallback: servir index.html para rutasSPA
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "public", "index.html"));
});

async function startServer(): Promise<void> {
  await initDatabase();
  console.log("Base de datos inicializada");

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();
