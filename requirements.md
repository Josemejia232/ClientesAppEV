# Seguimiento de Clientes — Requirements

## Descripción General

Aplicación web para gestionar clientes, notas de seguimiento y programaciones. Consta de un frontend en React + Vite + TypeScript y un backend en Express + TypeScript con base de datos SQL. Desplegada en Vercel usando `experimentalServices`.

---

## Arquitectura

```
clientes-app/
├── frontend/          # React SPA (Vite)
│   ├── src/
│   │   ├── api/       # Cliente HTTP (fetch hacia /api)
│   │   ├── components/# Componentes reutilizables (Layout, Pagination, SearchBar, ClientForm)
│   │   ├── pages/     # Páginas (Dashboard, Clients, ClientDetail, EditClient, NewClient, Cronograma)
│   │   ├── types/     # Interfaces TypeScript (Client, Nota, Programacion, DashboardStats)
│   │   ├── utils/     # Utilidades
│   │   ├── App.tsx    # Enrutador (react-router-dom)
│   │   ├── main.tsx   # Punto de entrada
│   │   └── index.css  # Estilos globales + Tailwind
│   ├── vite.config.ts
│   └── package.json
│
├── backend/           # API REST (Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── clients.ts         # CRUD clientes + stats
│   │   │   ├── notes.ts           # CRUD notas
│   │   │   └── programaciones.ts  # CRUD programaciones
│   │   ├── database.ts            # Fachada: elige memory-db (Vercel) o sqlite-db (local)
│   │   ├── memory-db.ts           # Evaluador SQL en memoria puro JS (para Vercel)
│   │   ├── sqlite-db.ts           # Implementación con sql.js (solo local)
│   │   ├── app.ts                 # Configuración Express (middleware, rutas)
│   │   ├── index.ts               # Servidor HTTP local (puerto 3004)
│   │   ├── vercel.ts              # Entrypoint serverless para Vercel
│   │   └── seed.ts                # Poblador de datos de prueba
│   ├── dist/                      # Compilación TypeScript
│   ├── data/                      # Archivos de base de datos local
│   └── package.json
│
├── vercel.json        # Configuración despliegue Vercel (experimentalServices)
└── start.bat          # Script para iniciar frontend + backend localmente (Windows)
```

---

## Frontend

### Stack
- React 19
- React Router DOM 7
- Recharts (gráficas del Dashboard)
- Tailwind CSS 3
- Vite 6

### Rutas
| Ruta               | Página         | Descripción                        |
|--------------------|----------------|------------------------------------|
| `/`                | Dashboard      | Estadísticas, gráficas, contactos  |
| `/clientes`        | Clients        | Lista con búsqueda, filtros, paginación |
| `/clientes/nuevo`  | NewClient      | Formulario de creación             |
| `/clientes/:id`    | ClientDetail   | Detalle, notas, programaciones     |
| `/clientes/:id/editar` | EditClient  | Formulario de edición              |
| `/cronograma`      | Cronograma     | Calendario de programaciones       |

### API Client (`src/api/client.ts`)
- `fetchClients(params)` → GET `/api/clients?search=&estado=&categoria=&vendedor=&ciudad=&page=&limit=&sortBy=&sortOrder=`
- `fetchClient(id)` → GET `/api/clients/:id`
- `createClient(data)` → POST `/api/clients`
- `updateClient(id, data)` → PUT `/api/clients/:id`
- `deleteClient(id)` → DELETE `/api/clients/:id`
- `fetchStats()` → GET `/api/clients/stats`
- `fetchVendedores()` → GET `/api/clients/vendedores`
- `fetchCategorias()` → GET `/api/clients/categorias`
- `fetchNotas(clientId)` → GET `/api/notes/client/:clientId`
- `createNota(data)` → POST `/api/notes`
- `deleteNota(id)` → DELETE `/api/notes/:id`
- `fetchProgramaciones(params)` → GET `/api/programaciones?estado=&tipo=&prioridad=&client_id=&desde=&hasta=&page=&limit=`
- `fetchProximasProgramaciones()` → GET `/api/programaciones/proximas`
- `createProgramacion(data)` → POST `/api/programaciones`
- `updateProgramacion(id, data)` → PUT `/api/programaciones/:id`
- `deleteProgramacion(id)` → DELETE `/api/programaciones/:id`

---

## Backend

### Stack
- Node.js + Express 4
- TypeScript 5
- sql.js (local) / memory-db (Vercel)
- alasql (local, consultas ad-hoc)
- tsx (ejecución en desarrollo)

### Base de Datos

#### Tabla: `clients`
| Columna               | Tipo    | Notas                          |
|-----------------------|---------|--------------------------------|
| id                    | INTEGER | PK, autoincrement              |
| identificacion        | TEXT    | NIT o CC                       |
| tipo_identificacion   | TEXT    | NIT / CC                       |
| nombre                | TEXT    |                                |
| nombre_comercial      | TEXT    |                                |
| nombre_contacto       | TEXT    |                                |
| direccion             | TEXT    |                                |
| ciudad                | TEXT    |                                |
| departamento          | TEXT    |                                |
| pais                  | TEXT    |                                |
| telefono1             | TEXT    |                                |
| telefono2             | TEXT    |                                |
| email                 | TEXT    |                                |
| contacto_facturacion  | TEXT    |                                |
| email_facturacion     | TEXT    |                                |
| anio_apertura         | INTEGER |                                |
| tipo_persona          | TEXT    | Natural / Jurídica             |
| estado                | TEXT    | Activo / Inactivo              |
| vendedor              | TEXT    |                                |
| categoria             | TEXT    | A / B / C                      |
| cupo_credito          | REAL    |                                |
| observaciones         | TEXT    |                                |
| fecha_registro        | TEXT    | ISO date                       |
| ultimo_contacto       | TEXT    | ISO datetime                   |
| proximo_contacto      | TEXT    | ISO date                       |
| created_at            | TEXT    | ISO datetime                   |
| updated_at            | TEXT    | ISO datetime                   |

#### Tabla: `notas`
| Columna   | Tipo    |
|-----------|---------|
| id        | INTEGER | PK, autoincrement
| client_id | INTEGER | FK → clients.id
| contenido | TEXT    |
| tipo      | TEXT    | Llamada, Email, Visita, Reunión, Otro
| fecha     | TEXT    | ISO datetime
| created_by| TEXT    |
| created_at| TEXT    |

#### Tabla: `programaciones`
| Columna           | Tipo    |
|-------------------|---------|
| id                | INTEGER | PK, autoincrement
| client_id         | INTEGER | FK → clients.id
| titulo            | TEXT    |
| descripcion       | TEXT    |
| tipo              | TEXT    |
| fecha_programada  | TEXT    | ISO date
| hora_programada   | TEXT    | HH:MM
| duracion_estimada | INTEGER | minutos
| estado            | TEXT    | Pendiente, Completada, Cancelada
| prioridad         | TEXT    | Alta, Media, Baja
| created_by        | TEXT    |
| created_at        | TEXT    |
| updated_at        | TEXT    |

### API Endpoints

#### Clientes
| Método | Ruta                    | Descripción                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/api/clients`          | Lista paginada con filtros           |
| GET    | `/api/clients/stats`    | Estadísticas para el Dashboard       |
| GET    | `/api/clients/vendedores`| Lista distinct de vendedores        |
| GET    | `/api/clients/categorias`| Lista distinct de categorías        |
| GET    | `/api/clients/:id`      | Detalle de un cliente                |
| POST   | `/api/clients`          | Crear cliente                        |
| PUT    | `/api/clients/:id`      | Actualizar cliente                   |
| DELETE | `/api/clients/:id`      | Eliminar cliente                     |

#### Notas
| Método | Ruta                      | Descripción            |
|--------|---------------------------|------------------------|
| GET    | `/api/notes/client/:clientId` | Notas de un cliente |
| POST   | `/api/notes`              | Crear nota             |
| DELETE | `/api/notes/:id`          | Eliminar nota          |

#### Programaciones
| Método | Ruta                             | Descripción                     |
|--------|----------------------------------|---------------------------------|
| GET    | `/api/programaciones`            | Lista paginada con filtros      |
| GET    | `/api/programaciones/proximas`   | Próximas 10 programaciones      |
| GET    | `/api/programaciones/:id`        | Detalle con datos del cliente   |
| POST   | `/api/programaciones`            | Crear programación              |
| PUT    | `/api/programaciones/:id`        | Actualizar programación         |
| DELETE | `/api/programaciones/:id`        | Eliminar programación           |

#### Salud
| Método | Ruta           | Descripción      |
|--------|----------------|------------------|
| GET    | `/api/health`  | Health check     |

---

## Despliegue

### Vercel (`vercel.json`)
- Frontend: `frontend/` con framework Vite, ruta base `/`
- Backend: `backend/` con entrypoint `src/vercel.ts`, ruta base `/api`
- Usa `experimentalServices` para desplegar ambos en un solo proyecto

### Local
- Backend: `cd backend && npm run dev` (puerto 3004)
- Frontend: `cd frontend && npm run dev` (puerto 5173)
- O usar `start.bat` que inicia ambos

### Base de datos en desarrollo local
- `npm run seed` puebla datos de prueba usando sql.js (persiste en `data/database.sqlite`)
- La base de datos es efímera en Vercel (memory-db se reinicia en cada cold start)
- No hay migraciones; las tablas se crean en el primer request vía `CREATE TABLE IF NOT EXISTS`

---

## Memory-DB (Vercel)

En Vercel no se puede usar sql.js porque requiere WASM. Se implementó `memory-db.ts`, un evaluador SQL mínimo en JS puro que soporta:

- `SELECT` con `WHERE`, `ORDER BY`, `GROUP BY`, `LIMIT/OFFSET`, `DISTINCT`, `LEFT JOIN`, `COUNT(*)`
- `INSERT`, `UPDATE`, `DELETE`
- Parámetros posicionales (`?`)
- Funciones: `datetime()`, `date()`, `julianday()`
- Operadores: `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IS NULL`, `IS NOT NULL`
- Álías de tabla en columnas (`p.id` → `id`)

La fachada `database.ts` selecciona automáticamente memory-db cuando `process.env.VERCEL` está presente.
