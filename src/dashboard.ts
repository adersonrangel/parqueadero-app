import type { DashboardData } from "./types.ts";
import "./styles.css";

document.addEventListener("DOMContentLoaded", () => {
  cargarDashboard();
});

async function cargarDashboard(): Promise<void> {
  try {
    const res = await fetch("/api/dashboard");
    const data: DashboardData = await res.json();
    renderizarDashboard(data);
  } catch (err) {
    console.error("Error cargando dashboard:", err);
  }
}

function renderizarDashboard(data: DashboardData): void {
  const totalUsuarios = document.getElementById("totalUsuarios") as HTMLElement;
  const totalMensualidades = document.getElementById("totalMensualidades") as HTMLElement;
  const totalRecaudado = document.getElementById("totalRecaudado") as HTMLElement;
  const promedioMensual = document.getElementById("promedioMensual") as HTMLElement;
  const mesActualEl = document.getElementById("mesActual") as HTMLElement;
  const pagosMesActualEl = document.getElementById("pagosMesActual") as HTMLElement;
  const recaudadoMesActualEl = document.getElementById("recaudadoMesActual") as HTMLElement;

  totalUsuarios.textContent = String(data.total_usuarios);
  totalMensualidades.textContent = String(data.total_mensualidades);
  totalRecaudado.textContent = "$" + data.total_recaudado.toLocaleString();
  promedioMensual.textContent = "$" + Math.round(data.promedio_mensual).toLocaleString();

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const mes = meses[new Date().getMonth()];
  const anio = new Date().getFullYear();
  mesActualEl.textContent = `${mes} ${anio}`;
  pagosMesActualEl.textContent = String(data.pagos_mes_actual.cantidad);
  recaudadoMesActualEl.textContent = "$" + data.pagos_mes_actual.total.toLocaleString();

  renderizarGraficoBarras(data.recaudado_por_mes);
  renderizarTablaUsuarios(data.pagos_por_usuario);
}

function renderizarGraficoBarras(
  recaudacion: { mes: string; anio: number; total: number }[],
): void {
  const container = document.getElementById("listaRecaudacion") as HTMLElement;

  if (recaudacion.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay datos de recaudacion</p>';
    return;
  }

  const maxTotal = Math.max(...recaudacion.map((r) => r.total));

  container.innerHTML = `
    <div class="bar-chart">
      ${recaudacion
        .map(
          (r) => `
        <div class="bar-item">
          <span class="bar-label">${r.mes.substring(0, 3)} ${r.anio}</span>
          <div class="bar-wrapper">
            <div class="bar" style="width: ${(r.total / maxTotal) * 100}%">
              $${r.total.toLocaleString()}
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderizarTablaUsuarios(
  usuarios: { placa: string; nombre: string; total_pagos: number; total_pagado: number }[],
): void {
  const tbody = document.querySelector("#tablaPagosUsuarios tbody") as HTMLElement;

  if (usuarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No hay datos</td></tr>';
    return;
  }

  tbody.innerHTML = usuarios
    .map(
      (u) => `
    <tr>
      <td><strong>${u.placa}</strong></td>
      <td>${u.nombre}</td>
      <td>${u.total_pagos}</td>
      <td>$${(u.total_pagado || 0).toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");
}
