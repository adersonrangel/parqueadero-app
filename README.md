# ParqueaderoApp

Aplicacion web para gestionar mensualidades de un parqueadero. Permite registrar vehiculos y propietarios, registrar pagos mensuales, y visualizar un dashboard financiero con estadisticas de recaudacion.

## Caracteristicas

- **Registro de usuarios**: Crear, listar y eliminar propietarios de vehiculos por placa
- **Gestion de mensualidades**: Registrar pagos mensuales por vehiculo con historial completo
- **Dashboard financiero**: Estadisticas de recaudacion por mes, pagos por usuario y resumen del mes actual
- **Busqueda y filtros**: Filtrar usuarios por placa y mensualidades por mes/anio

## Tecnologias

- **Frontend**: TypeScript 6 + Vite 8
- **Backend**: Node.js + Express 4 + TypeScript 6
- **Base de datos**: SQLite (via sql.js)
- ** Herramientas**: ESLint, Prettier

## Requisitos

- Node.js >= 18
- pnpm (recomendado) o npm

## Instalacion

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd parqueadero

# Instalar dependencias
pnpm install
```

## Desarrollo

```bash
# Iniciar en modo desarrollo (servidor Express + Vite dev server)
pnpm dev
```

La aplicacion estara disponible en:
- **Frontend**: http://localhost:5173
- **API Backend**: http://localhost:3000

Vite proxea automaticamente las llamadas `/api/*` al servidor Express.

## Build y Produccion

```bash
# Compilar para produccion
pnpm build

# Ejecutar en produccion
pnpm start
```

El servidor en produccion sirve los archivos estaticos compilados desde `dist/public/`.

## Scripts Disponibles

| Comando | Descripcion |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Compilar para produccion |
| `pnpm start` | Ejecutar servidor de produccion |
| `pnpm lint` | Verificar codigo con ESLint |
| `pnpm lint:fix` | Corregir errores automaticamente |
| `pnpm format` | Formatear codigo con Prettier |

## Estructura del Proyecto

```
parqueadero/
├── src/                    # Codigo fuente frontend (TypeScript)
│   ├── types.ts            # Interfaces y tipos compartidos
│   ├── main.ts             # Pagina: Registro de usuarios
│   ├── mensualidades.ts    # Pagina: Gestion de mensualidades
│   ├── dashboard.ts        # Pagina: Dashboard financiero
│   └── styles.css          # Estilos globales
├── server/                 # Codigo fuente backend (TypeScript)
│   ├── server.ts           # Servidor Express y rutas API
│   └── db.ts               # Conexion y configuracion SQLite
├── index.html              # Entry point: Registro
├── mensualidades.html      # Entry point: Mensualidades
├── dashboard.html          # Entry point: Dashboard
├── vite.config.ts          # Configuracion Vite (MPA + proxy)
├── tsconfig.json           # Configuracion TypeScript frontend
├── tsconfig.server.json    # Configuracion TypeScript backend
├── eslint.config.js        # Configuracion ESLint
└── .prettierrc             # Configuracion Prettier
```

## API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/usuarios` | Registrar nuevo usuario |
| GET | `/api/usuarios` | Listar todos los usuarios |
| GET | `/api/usuarios/:placa` | Buscar usuario por placa |
| DELETE | `/api/usuarios/:placa` | Eliminar usuario |
| POST | `/api/mensualidades` | Registrar nueva mensualidad |
| GET | `/api/mensualidades` | Listar todas las mensualidades |
| DELETE | `/api/mensualidades/:id` | Eliminar mensualidad |
| GET | `/api/dashboard` | Obtener estadisticas del dashboard |

## Base de Datos

La aplicacion utiliza SQLite almacenada en el archivo `parqueadero.db` en la raiz del proyecto. Este archivo se crea automaticamente al iniciar el servidor por primera vez.

### Tablas

- **usuarios**: id, placa (unique), nombre, fecha_registro
- **mensualidades**: id, placa (FK), valor_pagado, fecha_pago, mes, anio

## Licencia

MIT
