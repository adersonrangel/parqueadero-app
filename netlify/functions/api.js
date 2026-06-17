const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
    // POST /api/usuarios
    if (method === 'POST' && path === '/usuarios') {
      const { placa, nombre, fecha_registro } = parseBody(event);
      if (!placa || !nombre) {
        return jsonResponse(400, { error: 'Placa y nombre son requeridos' });
      }
      const fecha = fecha_registro || new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('usuarios')
        .insert({ placa: placa.toUpperCase(), nombre, fecha_registro: fecha });

      if (error) {
        if (error.code === '23505') {
          return jsonResponse(400, { error: 'La placa ya esta registrada' });
        }
        return jsonResponse(500, { error: error.message });
      }

      return jsonResponse(200, { message: 'Usuario registrado exitosamente', placa: placa.toUpperCase() });
    }

    // GET /api/usuarios
    if (method === 'GET' && path === '/usuarios') {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, data);
    }

    // GET /api/usuarios/:placa
    const usuarioMatch = path.match(/^\/usuarios\/(.+)$/);
    if (method === 'GET' && usuarioMatch) {
      const placa = usuarioMatch[1].toUpperCase();
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('placa', placa)
        .single();

      if (error || !data) {
        return jsonResponse(404, { error: 'Usuario no encontrado' });
      }
      return jsonResponse(200, data);
    }

    // DELETE /api/usuarios/:placa
    if (method === 'DELETE' && usuarioMatch) {
      const placa = usuarioMatch[1].toUpperCase();
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('placa', placa);

      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { message: 'Usuario eliminado exitosamente' });
    }

    // POST /api/mensualidades
    if (method === 'POST' && path === '/mensualidades') {
      const { placa, valor_pagado, mes, anio } = parseBody(event);
      if (!placa || !valor_pagado || !mes || !anio) {
        return jsonResponse(400, { error: 'Placa, valor pagado, mes y anio son requeridos' });
      }

      const placaUpper = placa.toUpperCase();

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('placa')
        .eq('placa', placaUpper)
        .single();

      if (!usuario) {
        return jsonResponse(404, { error: 'No existe un usuario con esa placa' });
      }

      const { data: existente } = await supabase
        .from('mensualidades')
        .select('id')
        .eq('placa', placaUpper)
        .eq('mes', mes)
        .eq('anio', parseInt(anio))
        .single();

      if (existente) {
        return jsonResponse(400, { error: 'Ya existe un pago registrado para ese mes y anio' });
      }

      const { error } = await supabase
        .from('mensualidades')
        .insert({
          placa: placaUpper,
          valor_pagado: parseFloat(valor_pagado),
          mes,
          anio: parseInt(anio)
        });

      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { message: 'Mensualidad registrada exitosamente' });
    }

    // GET /api/mensualidades
    if (method === 'GET' && path === '/mensualidades') {
      const { data: mensualidades, error: errorMensualidades } = await supabase
        .from('mensualidades')
        .select('*')
        .order('anio', { ascending: false });

      if (errorMensualidades) return jsonResponse(500, { error: errorMensualidades.message });

      if (!mensualidades || mensualidades.length === 0) {
        return jsonResponse(200, []);
      }

      const placas = [...new Set(mensualidades.map(m => m.placa))];
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('placa, nombre')
        .in('placa', placas);

      const usuariosMap = {};
      if (usuarios) {
        usuarios.forEach(u => { usuariosMap[u.placa] = u.nombre; });
      }

      const mesOrder = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
        'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
        'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
      };

      mensualidades.sort((a, b) => {
        if (b.anio !== a.anio) return b.anio - a.anio;
        return (mesOrder[b.mes] || 0) - (mesOrder[a.mes] || 0);
      });

      const result = mensualidades.map(m => ({
        id: m.id,
        placa: m.placa,
        nombre: usuariosMap[m.placa] || '',
        valor_pagado: m.valor_pagado,
        fecha_pago: m.fecha_pago,
        mes: m.mes,
        anio: m.anio
      }));

      return jsonResponse(200, result);
    }

    // DELETE /api/mensualidades/:id
    const mensualidadMatch = path.match(/^\/mensualidades\/(\d+)$/);
    if (method === 'DELETE' && mensualidadMatch) {
      const id = parseInt(mensualidadMatch[1]);
      const { error } = await supabase
        .from('mensualidades')
        .delete()
        .eq('id', id);

      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { message: 'Mensualidad eliminada exitosamente' });
    }

    // GET /api/dashboard
    if (method === 'GET' && path === '/dashboard') {
      const { count: totalUsuarios } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      const { count: totalMensualidades } = await supabase
        .from('mensualidades')
        .select('*', { count: 'exact', head: true });

      const { data: sumResult } = await supabase
        .from('mensualidades')
        .select('valor_pagado');

      const totalRecaudado = sumResult
        ? sumResult.reduce((sum, m) => sum + parseFloat(m.valor_pagado), 0)
        : 0;

      const promedioMensual = totalMensualidades > 0
        ? totalRecaudado / totalMensualidades
        : 0;

      const { data: todasMensualidades } = await supabase
        .from('mensualidades')
        .select('*');

      const mesOrder = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
        'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
        'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
      };

      const recaudadoPorMes = {};
      if (todasMensualidades) {
        todasMensualidades.forEach(m => {
          const key = `${m.mes}-${m.anio}`;
          if (!recaudadoPorMes[key]) {
            recaudadoPorMes[key] = { mes: m.mes, anio: m.anio, total: 0 };
          }
          recaudadoPorMes[key].total += parseFloat(m.valor_pagado);
        });
      }

      const recaudadoArray = Object.values(recaudadoPorMes).sort((a, b) => {
        if (b.anio !== a.anio) return b.anio - a.anio;
        return (mesOrder[b.mes] || 0) - (mesOrder[a.mes] || 0);
      });

      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('placa, nombre');

      const pagosPorUsuario = {};
      if (usuariosData) {
        usuariosData.forEach(u => {
          pagosPorUsuario[u.placa] = {
            placa: u.placa,
            nombre: u.nombre,
            total_pagos: 0,
            total_pagado: 0
          };
        });
      }

      if (todasMensualidades) {
        todasMensualidades.forEach(m => {
          if (pagosPorUsuario[m.placa]) {
            pagosPorUsuario[m.placa].total_pagos++;
            pagosPorUsuario[m.placa].total_pagado += parseFloat(m.valor_pagado);
          }
        });
      }

      const pagosArray = Object.values(pagosPorUsuario)
        .sort((a, b) => b.total_pagado - a.total_pagado);

      const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const mesActual = meses[new Date().getMonth()];
      const anioActual = new Date().getFullYear();

      const pagosMesActual = (todasMensualidades || []).filter(
        m => m.mes === mesActual && m.anio === anioActual
      );

      return jsonResponse(200, {
        total_usuarios: totalUsuarios || 0,
        total_mensualidades: totalMensualidades || 0,
        total_recaudado: totalRecaudado,
        promedio_mensual: promedioMensual,
        pagos_mes_actual: {
          cantidad: pagosMesActual.length,
          total: pagosMesActual.reduce((sum, m) => sum + parseFloat(m.valor_pagado), 0)
        },
        recaudado_por_mes: recaudadoArray,
        pagos_por_usuario: pagosArray
      });
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
};
