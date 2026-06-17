const initSqlJs = require('sql.js');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      fecha_registro TEXT NOT NULL DEFAULT (date('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mensualidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL,
      valor_pagado REAL NOT NULL,
      fecha_pago TEXT NOT NULL DEFAULT (date('now')),
      mes TEXT NOT NULL,
      anio INTEGER NOT NULL,
      FOREIGN KEY (placa) REFERENCES usuarios(placa)
    )
  `);

  return db;
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  const path = event.path.replace(/^\/.netlify\/functions\/api/, '') || '/';
  const method = event.httpMethod;

  try {
    const db = await getDb();

    // POST /api/usuarios
    if (method === 'POST' && path === '/usuarios') {
      const { placa, nombre, fecha_registro } = parseBody(event);
      if (!placa || !nombre) {
        return jsonResponse(400, { error: 'Placa y nombre son requeridos' });
      }
      const fecha = fecha_registro || new Date().toISOString().split('T')[0];
      try {
        db.run('INSERT INTO usuarios (placa, nombre, fecha_registro) VALUES (?, ?, ?)', [placa.toUpperCase(), nombre, fecha]);
        return jsonResponse(200, { message: 'Usuario registrado exitosamente', placa: placa.toUpperCase() });
      } catch (err) {
        if (err.message.includes('UNIQUE')) {
          return jsonResponse(400, { error: 'La placa ya esta registrada' });
        }
        return jsonResponse(500, { error: err.message });
      }
    }

    // GET /api/usuarios
    if (method === 'GET' && path === '/usuarios') {
      const results = db.exec('SELECT * FROM usuarios ORDER BY fecha_registro DESC');
      if (results.length === 0) return jsonResponse(200, []);
      const usuarios = results[0].values.map(row => ({
        id: row[0], placa: row[1], nombre: row[2], fecha_registro: row[3]
      }));
      return jsonResponse(200, usuarios);
    }

    // GET /api/usuarios/:placa
    const usuarioMatch = path.match(/^\/usuarios\/(.+)$/);
    if (method === 'GET' && usuarioMatch) {
      const placa = usuarioMatch[1].toUpperCase();
      const results = db.exec('SELECT * FROM usuarios WHERE placa = ?', [placa]);
      if (results.length === 0 || results[0].values.length === 0) {
        return jsonResponse(404, { error: 'Usuario no encontrado' });
      }
      const row = results[0].values[0];
      return jsonResponse(200, { id: row[0], placa: row[1], nombre: row[2], fecha_registro: row[3] });
    }

    // DELETE /api/usuarios/:placa
    if (method === 'DELETE' && usuarioMatch) {
      const placa = usuarioMatch[1].toUpperCase();
      db.run('DELETE FROM mensualidades WHERE placa = ?', [placa]);
      db.run('DELETE FROM usuarios WHERE placa = ?', [placa]);
      return jsonResponse(200, { message: 'Usuario eliminado exitosamente' });
    }

    // POST /api/mensualidades
    if (method === 'POST' && path === '/mensualidades') {
      const { placa, valor_pagado, mes, anio } = parseBody(event);
      if (!placa || !valor_pagado || !mes || !anio) {
        return jsonResponse(400, { error: 'Placa, valor pagado, mes y anio son requeridos' });
      }

      const userCheck = db.exec('SELECT placa FROM usuarios WHERE placa = ?', [placa.toUpperCase()]);
      if (userCheck.length === 0 || userCheck[0].values.length === 0) {
        return jsonResponse(404, { error: 'No existe un usuario con esa placa' });
      }

      const existing = db.exec('SELECT id FROM mensualidades WHERE placa = ? AND mes = ? AND anio = ?', [placa.toUpperCase(), mes, parseInt(anio)]);
      if (existing.length > 0 && existing[0].values.length > 0) {
        return jsonResponse(400, { error: 'Ya existe un pago registrado para ese mes y anio' });
      }

      try {
        db.run('INSERT INTO mensualidades (placa, valor_pagado, mes, anio) VALUES (?, ?, ?, ?)', [placa.toUpperCase(), parseFloat(valor_pagado), mes, parseInt(anio)]);
        return jsonResponse(200, { message: 'Mensualidad registrada exitosamente' });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // GET /api/mensualidades
    if (method === 'GET' && path === '/mensualidades') {
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
      if (results.length === 0) return jsonResponse(200, []);
      const mensualidades = results[0].values.map(row => ({
        id: row[0], placa: row[1], nombre: row[2], valor_pagado: row[3], fecha_pago: row[4], mes: row[5], anio: row[6]
      }));
      return jsonResponse(200, mensualidades);
    }

    // DELETE /api/mensualidades/:id
    const mensualidadMatch = path.match(/^\/mensualidades\/(\d+)$/);
    if (method === 'DELETE' && mensualidadMatch) {
      const id = parseInt(mensualidadMatch[1]);
      db.run('DELETE FROM mensualidades WHERE id = ?', [id]);
      return jsonResponse(200, { message: 'Mensualidad eliminada exitosamente' });
    }

    // GET /api/dashboard
    if (method === 'GET' && path === '/dashboard') {
      const totalUsuarios = db.exec('SELECT COUNT(*) FROM usuarios');
      const totalMensualidades = db.exec('SELECT COUNT(*) FROM mensualidades');
      const totalRecaudado = db.exec('SELECT COALESCE(SUM(valor_pagado), 0) FROM mensualidades');
      const promedioMensual = db.exec('SELECT COALESCE(AVG(valor_pagado), 0) FROM mensualidades');

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

      const mesActual = new Date().toLocaleString('es-CO', { month: 'long' });
      const anioActual = new Date().getFullYear();
      const pagosMesActual = db.exec(`
        SELECT COUNT(*), COALESCE(SUM(valor_pagado), 0)
        FROM mensualidades WHERE mes = ? AND anio = ?
      `, [mesActual.charAt(0).toUpperCase() + mesActual.slice(1), anioActual]);

      const formatQuery = (result) => {
        if (result.length === 0) return [];
        return result[0].values;
      };

      return jsonResponse(200, {
        total_usuarios: totalUsuarios.length > 0 ? totalUsuarios[0].values[0][0] : 0,
        total_mensualidades: totalMensualidades.length > 0 ? totalMensualidades[0].values[0][0] : 0,
        total_recaudado: totalRecaudado.length > 0 ? totalRecaudado[0].values[0][0] : 0,
        promedio_mensual: promedioMensual.length > 0 ? promedioMensual[0].values[0][0] : 0,
        pagos_mes_actual: pagosMesActual.length > 0 ? {
          cantidad: pagosMesActual[0].values[0][0],
          total: pagosMesActual[0].values[0][1]
        } : { cantidad: 0, total: 0 },
        recaudado_por_mes: formatQuery(recaudadoPorMes).map(r => ({
          mes: r[0], anio: r[1], total: r[2]
        })),
        pagos_por_usuario: formatQuery(pagosPorUsuario).map(r => ({
          placa: r[0], nombre: r[1], total_pagos: r[2], total_pagado: r[3]
        }))
      });
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
};
