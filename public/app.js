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
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placa, nombre, fecha_registro })
    });

    const data = await res.json();

    if (!res.ok) {
      msgDiv.className = 'message error';
      msgDiv.textContent = data.error;
      return;
    }

    msgDiv.className = 'message success';
    msgDiv.textContent = `Usuario ${data.placa} registrado exitosamente`;
    document.getElementById('formUsuario').reset();
    document.getElementById('fechaRegistro').valueAsDate = new Date();
    cargarUsuarios();
  } catch (err) {
    msgDiv.className = 'message error';
    msgDiv.textContent = 'Error de conexion con el servidor';
  }
}

async function cargarUsuarios() {
  try {
    const res = await fetch('/api/usuarios');
    usuarios = await res.json();
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
    await fetch(`/api/usuarios/${placa}`, { method: 'DELETE' });
    cargarUsuarios();
  } catch (err) {
    console.error('Error eliminando usuario:', err);
  }
}
