document.addEventListener('DOMContentLoaded', () => {
  cargarDashboard();
});

async function cargarDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    renderizarDashboard(data);
  } catch (err) {
    console.error('Error cargando dashboard:', err);
  }
}

function renderizarDashboard(data) {
  document.getElementById('totalUsuarios').textContent = data.total_usuarios;
  document.getElementById('totalMensualidades').textContent = data.total_mensualidades;
  document.getElementById('totalRecaudado').textContent = '$' + data.total_recaudado.toLocaleString();
  document.getElementById('promedioMensual').textContent = '$' + Math.round(data.promedio_mensual).toLocaleString();

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const mesActual = meses[new Date().getMonth()];
  document.getElementById('mesActual').textContent = mesActual + ' ' + new Date().getFullYear();
  document.getElementById('pagosMesActual').textContent = data.pagos_mes_actual.cantidad;
  document.getElementById('recaudadoMesActual').textContent = '$' + data.pagos_mes_actual.total.toLocaleString();

  renderizarGraficoBarras(data.recaudado_por_mes);
  renderizarTablaUsuarios(data.pagos_por_usuario);
}

function renderizarGraficoBarras(recaudacion) {
  const container = document.getElementById('listaRecaudacion');

  if (recaudacion.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay datos de recaudacion</p>';
    return;
  }

  const maxTotal = Math.max(...recaudacion.map(r => r.total));

  container.innerHTML = `
    <div class="bar-chart">
      ${recaudacion.map(r => `
        <div class="bar-item">
          <span class="bar-label">${r.mes.substring(0, 3)} ${r.anio}</span>
          <div class="bar-wrapper">
            <div class="bar" style="width: ${(r.total / maxTotal) * 100}%">
              $${r.total.toLocaleString()}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderizarTablaUsuarios(usuarios) {
  const tbody = document.querySelector('#tablaPagosUsuarios tbody');

  if (usuarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No hay datos</td></tr>';
    return;
  }

  tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td><strong>${u.placa}</strong></td>
      <td>${u.nombre}</td>
      <td>${u.total_pagos}</td>
      <td>$${(u.total_pagado || 0).toLocaleString()}</td>
    </tr>
  `).join('');
}
