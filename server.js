require('dotenv').config();
const express = require('express');
const path = require('path');
const supabase = require('./supabase');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Registrar usuario
app.post('/api/usuarios', async (req, res) => {
  const { placa, nombre, fecha_registro } = req.body;

  if (!placa || !nombre) {
    return res.status(400).json({ error: 'Placa y nombre son requeridos' });
  }

  const fecha = fecha_registro || new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('usuarios')
    .insert({ placa: placa.toUpperCase(), nombre, fecha_registro: fecha });

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La placa ya esta registrada' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Usuario registrado exitosamente', placa: placa.toUpperCase() });
});

// Listar usuarios
app.get('/api/usuarios', async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('fecha_registro', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Buscar usuario por placa
app.get('/api/usuarios/:placa', async (req, res) => {
  const placa = req.params.placa.toUpperCase();
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('placa', placa)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json(data);
});

// Registrar mensualidad
app.post('/api/mensualidades', async (req, res) => {
  const { placa, valor_pagado, mes, anio } = req.body;

  if (!placa || !valor_pagado || !mes || !anio) {
    return res.status(400).json({ error: 'Placa, valor pagado, mes y anio son requeridos' });
  }

  const placaUpper = placa.toUpperCase();

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('placa')
    .eq('placa', placaUpper)
    .single();

  if (!usuario) {
    return res.status(404).json({ error: 'No existe un usuario con esa placa' });
  }

  const { data: existente } = await supabase
    .from('mensualidades')
    .select('id')
    .eq('placa', placaUpper)
    .eq('mes', mes)
    .eq('anio', parseInt(anio))
    .single();

  if (existente) {
    return res.status(400).json({ error: 'Ya existe un pago registrado para ese mes y anio' });
  }

  const { error } = await supabase
    .from('mensualidades')
    .insert({
      placa: placaUpper,
      valor_pagado: parseFloat(valor_pagado),
      mes,
      anio: parseInt(anio)
    });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Mensualidad registrada exitosamente' });
});

// Listar mensualidades
app.get('/api/mensualidades', async (req, res) => {
  const { data: mensualidades, error: errorMensualidades } = await supabase
    .from('mensualidades')
    .select('*')
    .order('anio', { ascending: false });

  if (errorMensualidades) return res.status(500).json({ error: errorMensualidades.message });

  if (!mensualidades || mensualidades.length === 0) {
    return res.json([]);
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

  res.json(result);
});

// Dashboard - estadisticas
app.get('/api/dashboard', async (req, res) => {
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

  res.json({
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
});

// Eliminar usuario
app.delete('/api/usuarios/:placa', async (req, res) => {
  const placa = req.params.placa.toUpperCase();
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('placa', placa);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Usuario eliminado exitosamente' });
});

// Eliminar mensualidad
app.delete('/api/mensualidades/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { error } = await supabase
    .from('mensualidades')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Mensualidad eliminada exitosamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
