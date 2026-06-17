let usuarios = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fechaRegistro').valueAsDate = new Date();
  cargarUsuarios();

  document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    await registrarUsuario();
  });
});

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(sectionId).classList.add('active');
  event.target.classList.add('active');

  if (sectionId === 'lista') {
    cargarUsuarios();
  }
}

async function registrarUsuario() {
  const placa = document.getElementById('placa').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const fecha_registro = document.getElementById('fechaRegistro').value;
  const msgDiv = document.getElementById('mensajeUsuario');

  try {
    const data = await apiPost('/usuarios', { placa, nombre, fecha_registro });
    msgDiv.className = 'message success';
    msgDiv.textContent = `Usuario ${data.placa} registrado exitosamente`;
    document.getElementById('formUsuario').reset();
    document.getElementById('fechaRegistro').valueAsDate = new Date();
    cargarUsuarios();
  } catch (err) {
    msgDiv.className = 'message error';
    msgDiv.textContent = err.message || 'Error de conexion con el servidor';
  }
}

async function cargarUsuarios() {
  try {
    usuarios = await apiGet('/usuarios');
    renderizarTabla(usuarios);
  } catch (err) {
    console.error('Error cargando usuarios:', err);
  }
}

function renderizarTabla(lista) {
  const tbody = document.querySelector('#tablaUsuarios tbody');
  const sinUsuarios = document.getElementById('sinUsuarios');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    sinUsuarios.style.display = 'block';
    return;
  }

  sinUsuarios.style.display = 'none';
  tbody.innerHTML = lista.map(u => `
    <tr>
      <td><strong>${u.placa}</strong></td>
      <td>${u.nombre}</td>
      <td>${u.fecha_registro}</td>
      <td>
        <button class="btn btn-danger" onclick="eliminarUsuario('${u.placa}')">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function filtrarUsuarios() {
  const busqueda = document.getElementById('buscarPlaca').value.toUpperCase();
  const filtrados = usuarios.filter(u => u.placa.includes(busqueda));
  renderizarTabla(filtrados);
}

async function eliminarUsuario(placa) {
  if (!confirm(`Desea eliminar al usuario con placa ${placa}? Se eliminaran todos sus pagos.`)) {
    return;
  }

  try {
    await apiDelete(`/usuarios/${placa}`);
    cargarUsuarios();
  } catch (err) {
    console.error('Error eliminando usuario:', err);
  }
}
