let mensualidades = [];
let usuarios = [];

document.addEventListener('DOMContentLoaded', () => {
  const anioInput = document.getElementById('anio');
  anioInput.value = new Date().getFullYear();

  cargarDatos();

  document.getElementById('formMensualidad').addEventListener('submit', async (e) => {
    e.preventDefault();
    await registrarPago();
  });

  document.getElementById('placaPago').addEventListener('input', (e) => {
    const placa = e.target.value.toUpperCase();
    const usuario = usuarios.find(u => u.placa === placa);
    document.getElementById('propietario').value = usuario ? usuario.nombre : '';
  });
});

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(sectionId).classList.add('active');
  event.target.classList.add('active');

  if (sectionId === 'historial') {
    cargarMensualidades();
  }
}

async function cargarDatos() {
  await Promise.all([cargarUsuarios(), cargarMensualidades()]);
}

async function cargarUsuarios() {
  try {
    usuarios = await apiGet('/usuarios');
    const datalist = document.getElementById('placasDisponibles');
    datalist.innerHTML = usuarios.map(u =>
      `<option value="${u.placa}">${u.nombre}</option>`
    ).join('');
  } catch (err) {
    console.error('Error cargando usuarios:', err);
  }
}

async function cargarMensualidades() {
  try {
    mensualidades = await apiGet('/mensualidades');
    renderizarHistorial(mensualidades);
    actualizarFiltros();
  } catch (err) {
    console.error('Error cargando mensualidades:', err);
  }
}

function renderizarHistorial(lista) {
  const tbody = document.querySelector('#tablaMensualidades tbody');
  const sinPagos = document.getElementById('sinPagos');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    sinPagos.style.display = 'block';
    return;
  }

  sinPagos.style.display = 'none';
  tbody.innerHTML = lista.map(m => `
    <tr>
      <td><strong>${m.placa}</strong></td>
      <td>${m.nombre}</td>
      <td>${m.mes}</td>
      <td>${m.anio}</td>
      <td>$${m.valor_pagado.toLocaleString()}</td>
      <td>${m.fecha_pago}</td>
      <td>
        <button class="btn btn-danger" onclick="eliminarMensualidad(${m.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function actualizarFiltros() {
  const anios = [...new Set(mensualidades.map(m => m.anio))].sort((a, b) => b - a);
  const selectAnio = document.getElementById('filtroAnio');
  const anioActual = selectAnio.value;

  selectAnio.innerHTML = '<option value="">Todos los anios</option>' +
    anios.map(a => `<option value="${a}" ${a == anioActual ? 'selected' : ''}>${a}</option>`).join('');
}

function filtrarHistorial() {
  const mes = document.getElementById('filtroMes').value;
  const anio = document.getElementById('filtroAnio').value;

  let filtrados = mensualidades;
  if (mes) filtrados = filtrados.filter(m => m.mes === mes);
  if (anio) filtrados = filtrados.filter(m => m.anio == anio);

  renderizarTabla(filtrados);
}

function renderizarTabla(lista) {
  const tbody = document.querySelector('#tablaMensualidades tbody');
  const sinPagos = document.getElementById('sinPagos');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    sinPagos.style.display = 'block';
    return;
  }

  sinPagos.style.display = 'none';
  tbody.innerHTML = lista.map(m => `
    <tr>
      <td><strong>${m.placa}</strong></td>
      <td>${m.nombre}</td>
      <td>${m.mes}</td>
      <td>${m.anio}</td>
      <td>$${m.valor_pagado.toLocaleString()}</td>
      <td>${m.fecha_pago}</td>
      <td>
        <button class="btn btn-danger" onclick="eliminarMensualidad(${m.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

async function registrarPago() {
  const placa = document.getElementById('placaPago').value.trim().toUpperCase();
  const mes = document.getElementById('mes').value;
  const anio = document.getElementById('anio').value;
  const valor_pagado = document.getElementById('valorPagado').value;
  const msgDiv = document.getElementById('mensajePago');

  try {
    await apiPost('/mensualidades', { placa, valor_pagado, mes, anio });
    msgDiv.className = 'message success';
    msgDiv.textContent = 'Mensualidad registrada exitosamente';
    document.getElementById('formMensualidad').reset();
    document.getElementById('anio').value = new Date().getFullYear();
    cargarMensualidades();
  } catch (err) {
    msgDiv.className = 'message error';
    msgDiv.textContent = err.message || 'Error de conexion con el servidor';
  }
}

async function eliminarMensualidad(id) {
  if (!confirm('Desea eliminar este registro de mensualidad?')) return;

  try {
    await apiDelete(`/mensualidades/${id}`);
    cargarMensualidades();
  } catch (err) {
    console.error('Error eliminando mensualidad:', err);
  }
}
