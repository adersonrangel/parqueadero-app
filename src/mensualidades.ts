import type { Usuario, Mensualidad } from "./types.ts";
import "./styles.css";

let mensualidades: Mensualidad[] = [];
let usuarios: Usuario[] = [];

document.addEventListener("DOMContentLoaded", () => {
  const anioInput = document.getElementById("anio") as HTMLInputElement;
  if (anioInput) {
    anioInput.value = String(new Date().getFullYear());
  }

  cargarDatos();

  const form = document.getElementById("formMensualidad") as HTMLFormElement;
  if (form) {
    form.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      await registrarPago();
    });
  }

  const placaInput = document.getElementById("placaPago") as HTMLInputElement;
  if (placaInput) {
    placaInput.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      const placa = target.value.toUpperCase();
      const usuario = usuarios.find((u) => u.placa === placa);
      (document.getElementById("propietario") as HTMLInputElement).value = usuario
        ? usuario.nombre
        : "";
    });
  }
});

function showSection(sectionId: string, event: Event): void {
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));

  document.getElementById(sectionId)?.classList.add("active");
  (event.target as HTMLElement).classList.add("active");

  if (sectionId === "historial") {
    cargarMensualidades();
  }
}

(window as unknown as Record<string, unknown>).showSection = showSection;

async function cargarDatos(): Promise<void> {
  await Promise.all([cargarUsuarios(), cargarMensualidades()]);
}

async function cargarUsuarios(): Promise<void> {
  try {
    const res = await fetch("/api/usuarios");
    usuarios = await res.json();
    const datalist = document.getElementById("placasDisponibles") as HTMLDataListElement;
    datalist.innerHTML = usuarios
      .map((u) => `<option value="${u.placa}">${u.nombre}</option>`)
      .join("");
  } catch (err) {
    console.error("Error cargando usuarios:", err);
  }
}

async function cargarMensualidades(): Promise<void> {
  try {
    const res = await fetch("/api/mensualidades");
    mensualidades = await res.json();
    renderizarHistorial(mensualidades);
    actualizarFiltros();
  } catch (err) {
    console.error("Error cargando mensualidades:", err);
  }
}

function renderizarHistorial(lista: Mensualidad[]): void {
  const tbody = document.querySelector("#tablaMensualidades tbody") as HTMLElement;
  const sinPagos = document.getElementById("sinPagos") as HTMLElement;

  if (lista.length === 0) {
    tbody.innerHTML = "";
    sinPagos.style.display = "block";
    return;
  }

  sinPagos.style.display = "none";
  tbody.innerHTML = lista
    .map(
      (m) => `
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
  `,
    )
    .join("");
}

function actualizarFiltros(): void {
  const anios = [...new Set(mensualidades.map((m) => m.anio))].sort((a, b) => b - a);
  const selectAnio = document.getElementById("filtroAnio") as HTMLSelectElement;
  const anioActual = selectAnio.value;

  selectAnio.innerHTML =
    '<option value="">Todos los anios</option>' +
    anios
      .map(
        (a) =>
          `<option value="${a}" ${String(a) === anioActual ? "selected" : ""}>${a}</option>`,
      )
      .join("");
}

function filtrarHistorial(): void {
  const mes = (document.getElementById("filtroMes") as HTMLSelectElement).value;
  const anio = (document.getElementById("filtroAnio") as HTMLSelectElement).value;

  let filtrados = mensualidades;
  if (mes) filtrados = filtrados.filter((m) => m.mes === mes);
  if (anio) filtrados = filtrados.filter((m) => String(m.anio) === anio);

  renderizarTabla(filtrados);
}

(window as unknown as Record<string, unknown>).filtrarHistorial = filtrarHistorial;

function renderizarTabla(lista: Mensualidad[]): void {
  const tbody = document.querySelector("#tablaMensualidades tbody") as HTMLElement;
  const sinPagos = document.getElementById("sinPagos") as HTMLElement;

  if (lista.length === 0) {
    tbody.innerHTML = "";
    sinPagos.style.display = "block";
    return;
  }

  sinPagos.style.display = "none";
  tbody.innerHTML = lista
    .map(
      (m) => `
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
  `,
    )
    .join("");
}

async function registrarPago(): Promise<void> {
  const placa = (document.getElementById("placaPago") as HTMLInputElement).value
    .trim()
    .toUpperCase();
  const mes = (document.getElementById("mes") as HTMLSelectElement).value;
  const anio = (document.getElementById("anio") as HTMLInputElement).value;
  const valor_pagado = (document.getElementById("valorPagado") as HTMLInputElement).value;
  const msgDiv = document.getElementById("mensajePago") as HTMLDivElement;

  try {
    const res = await fetch("/api/mensualidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placa, valor_pagado, mes, anio }),
    });

    const data = await res.json();

    if (!res.ok) {
      msgDiv.className = "message error";
      msgDiv.textContent = data.error;
      return;
    }

    msgDiv.className = "message success";
    msgDiv.textContent = "Mensualidad registrada exitosamente";
    (document.getElementById("formMensualidad") as HTMLFormElement).reset();
    (document.getElementById("anio") as HTMLInputElement).value = String(new Date().getFullYear());
    cargarMensualidades();
  } catch {
    msgDiv.className = "message error";
    msgDiv.textContent = "Error de conexion con el servidor";
  }
}

async function eliminarMensualidad(id: number): Promise<void> {
  if (!confirm("Desea eliminar este registro de mensualidad?")) return;

  try {
    await fetch(`/api/mensualidades/${id}`, { method: "DELETE" });
    cargarMensualidades();
  } catch (err) {
    console.error("Error eliminando mensualidad:", err);
  }
}

(window as unknown as Record<string, unknown>).eliminarMensualidad = eliminarMensualidad;
