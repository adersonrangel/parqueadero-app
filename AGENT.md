# AGENT.md - Guia del Proyecto ParqueaderoApp

## Descripcion del Proyecto
Aplicacion web full-stack para gestionar mensualidades de un parqueadero. Permite registrar vehiculos/propietarios, registrar pagos mensuales y ver un dashboard financiero con estadisticas.

## Stack Tecnologico
- **Frontend**: TypeScript 6 + Vite 8 (MPA - Multi Page Application)
- **Backend**: Express 4 + TypeScript 6
- **Base de datos**: SQLite via sql.js (almacenada en archivo `parqueadero.db`)
- **Runtime**: Node.js con ESM (`"type": "module"`)

## Estructura del Proyecto
```
parqueadero/
├── src/                    # Frontend TypeScript
│   ├── types.ts            # Interfaces compartidas (Usuario, Mensualidad, DashboardData)
│   ├── main.ts             # Entry: Pagina de Registro de Usuarios
│   ├── mensualidades.ts    # Entry: Pagina de Mensualidades
│   ├── dashboard.ts        # Entry: Pagina Dashboard Financiero
│   └── styles.css          # Estilos globales
├── server/                 # Backend TypeScript
│   ├── server.ts           # Servidor Express con rutas API
│   └── db.ts               # Configuracion y conexion SQLite
├── index.html              # HTML Registro (entry point Vite)
├── mensualidades.html      # HTML Mensualidades (entry point Vite)
├── dashboard.html          # HTML Dashboard (entry point Vite)
├── vite.config.ts          # Configuracion Vite (MPA + proxy)
├── tsconfig.json           # Config TS frontend
├── tsconfig.server.json    # Config TS backend
├── eslint.config.js        # Configuracion ESLint (flat config)
├── .prettierrc             # Configuracion Prettier
└── package.json
```

## Comandos Disponibles
```bash
pnpm dev          # Iniciar servidor de desarrollo (Express + Vite en paralelo)
pnpm build        # Compilar TS backend + build Vite frontend
pnpm start        # Ejecutar produccion (servidor compilado)
pnpm lint         # Verificar codigo con ESLint
pnpm lint:fix     # Corregir automaticamente con ESLint
pnpm format       # Formatear codigo con Prettier
```

## Arquitectura de Desarrollo
- **Vite Dev Server** corre en `http://localhost:5173`
- **Express API** corre en `http://localhost:3000`
- Vite proxyea las rutas `/api/*` a Express automaticamente
- El frontend usa ES Modules nativos via `<script type="module">`

## API Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/usuarios | Registrar usuario |
| GET | /api/usuarios | Listar usuarios |
| GET | /api/usuarios/:placa | Buscar usuario por placa |
| DELETE | /api/usuarios/:placa | Eliminar usuario |
| POST | /api/mensualidades | Registrar mensualidad |
| GET | /api/mensualidades | Listar mensualidades |
| DELETE | /api/mensualidades/:id | Eliminar mensualidad |
| GET | /api/dashboard | Obtener estadisticas |

## Convenciones de Codigo
- TypeScript strict mode habilitado
- Usar `type` para imports de tipos: `import type { X } from "./types.ts"`
- Funciones explicitamente tipadas con tipo de retorno
- Variables globales expuestas via `(window as unknown as Record<string, unknown>).funcion = funcion`
- Formateo con Prettier: 2 espacios, doble comilla, punto y coma

## Base de Datos
- SQLite almacenada en `parqueadero.db` en la raiz del proyecto
- Dos tablas: `usuarios` (placa, nombre, fecha_registro) y `mensualidades` (placa, valor_pagado, fecha_pago, mes, anio)
- La placa es la clave foranea entre tablas
- El archivo se crea automaticamente al iniciar el servidor
