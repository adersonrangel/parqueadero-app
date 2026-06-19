import type { Usuario } from "./types.ts";
import "./styles.css";

let usuarios: Usuario[] = [];

document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fechaRegistro") as HTMLInputElement;
  if (fechaInput) {
    fechaInput.valueAsDate = new Date();
  }
  cargarUsuarios();

  const form = document.getElementById("formUsuario") as HTMLFormElement;
  if (form) {
    form.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      await registrarUsuario();
    });
  }
});

function showSection(sectionId: string, event: Event): void {
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));

  document.getElementById(sectionId)?.classList.add("active");
  (event.target as HTMLElement).classList.add("active");

  if (sectionId === "lista") {
    cargarUsuarios();
  }
}

// Exponer globalmente para los onclick en HTML
(window as unknown as Record<string, unknown>).showSection = showSection;

async function registrarUsuario(): Promise<void> {
  const placa = (document.getElementById("placa") as HTMLInputElement).value.trim();
  const nombre = (document.getElementById("nombre") as HTMLInputElement).value.trim();
  const fecha_registro = (document.getElementById("fechaRegistro") as HTMLInputElement).value;
  const msgDiv = document.getElementById("mensajeUsuario") as HTMLDivElement;

  try {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placa, nombre, fecha_registro }),
    });

    const data = await res.json();

    if (!res.ok) {
      msgDiv.className = "message error";
      msgDiv.textContent = data.error;
      return;
    }

    msgDiv.className = "message success";
    msgDiv.textContent = `Usuario ${data.placa} registrado exitosamente`;
    (document.getElementById("formUsuario") as HTMLFormElement).reset();
    (document.getElementById("fechaRegistro") as HTMLInputElement).valueAsDate = new Date();
    cargarUsuarios();
  } catch {
    msgDiv.className = "message error";
    msgDiv.textContent = "Error de conexion con el servidor";
  }
}

async function cargarUsuarios(): Promise<void> {
  try {
    const res = await fetch("/api/usuarios");
    usuarios = await res.json();
    renderizarTabla(usuarios);
  } catch (err) {
    console.error("Error cargando usuarios:", err);
  }
}

function renderizarTabla(lista: Usuario[]): void {
  const tbody = document.querySelector("#tablaUsuarios tbody") as HTMLElement;
  const sinUsuarios = document.getElementById("sinUsuarios") as HTMLElement;

  if (lista.length === 0) {
    tbody.innerHTML = "";
    sinUsuarios.style.display = "block";
    return;
  }

  sinUsuarios.style.display = "none";
  tbody.innerHTML = lista
    .map(
      (u) => `
    <tr>
      <td><strong>${u.placa}</strong></td>
      <td>${u.nombre}</td>
      <td>${u.fecha_registro}</td>
      <td>
        <button class="btn btn-danger" onclick="eliminarUsuario('${u.placa}')">Eliminar</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function filtrarUsuarios(): void {
  const busqueda = (document.getElementById("buscarPlaca") as HTMLInputElement).value.toUpperCase();
  const filtrados = usuarios.filter((u) => u.placa.includes(busqueda));
  renderizarTabla(filtrados);
}

(window as unknown as Record<string, unknown>).filtrarUsuarios = filtrarUsuarios;

async function eliminarUsuario(placa: string): Promise<void> {
  if (!confirm(`Desea eliminar al usuario con placa ${placa}? Se eliminaran todos sus pagos.`)) {
    return;
  }

  try {
    await fetch(`/api/usuarios/${placa}`, { method: "DELETE" });
    cargarUsuarios();
  } catch (err) {
    console.error("Error eliminando usuario:", err);
  }
}

(window as unknown as Record<string, unknown>).eliminarUsuario = eliminarUsuario;
