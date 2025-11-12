# Generic DB UI Monorepo

A Baserow/Airtable inspired workspace built with **Django REST Framework** and **Next.js (pages router, TypeScript)**. The stack ships as a local-only Docker Compose environment with PostgreSQL, automatic OpenAPI documentation, simple RBAC, and a spreadsheet-like frontend for managing records, schema, and saved views.

## Repository Layout

```
./backend/   # Django REST Framework project (config, workspaces, datastores apps)
./frontend/  # Next.js (TypeScript) frontend with MUI and React Query
./seed/      # Split fixture sources for reference (merged into backend/fixtures/seed.json)
```

## Prerequisites

- Docker & Docker Compose
- (Optional) GNU Make for helper targets

## Environment configuration

Prepare `.env` files for the root, backend, and frontend:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Key variables (default values shown in the templates):

- **Root `.env`**
  ```dotenv
  POSTGRES_DB=generic_db
  POSTGRES_USER=generic_user
  POSTGRES_PASSWORD=generic_password
  DJANGO_SECRET_KEY=changeme-in-production
  DJANGO_DEBUG=1
  CORS_ALLOWED_ORIGINS=http://localhost:3000
  ```
  Adjust the credentials if you need different Postgres values; keep them in sync with `backend/.env`.
- **backend/.env**
  ```dotenv
  DJANGO_SETTINGS_MODULE=config.settings
  POSTGRES_DB=generic_db
  POSTGRES_USER=generic_user
  POSTGRES_PASSWORD=generic_password
  POSTGRES_HOST=db
  POSTGRES_PORT=5432
  ```
  Add any extra Django environment overrides here (e.g. email backend) if required.
- **frontend/.env.local**
  ```dotenv
  NEXT_PUBLIC_API_BASE=http://localhost:8000/api
  ```
  Point this at a different host/port when running the API elsewhere.
Key variables:

- **Root `.env`**
  - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` – database credentials (shared by backend service)
  - `DJANGO_SECRET_KEY` – Django secret
  - `DJANGO_DEBUG` – set to `1` for development
  - `CORS_ALLOWED_ORIGINS` – default `http://localhost:3000`
- **backend/.env**
  - `DJANGO_SETTINGS_MODULE=config.settings`
  - `POSTGRES_HOST=db`
  - `POSTGRES_PORT=5432`
  - Plus the same Postgres credentials as root
- **frontend/.env.local**
  - `NEXT_PUBLIC_API_BASE=http://localhost:8000/api`

## Build & run

```bash
# build containers
make build

# start services (db, backend, frontend)
make up

# follow combined logs
make logs
```

Initialisation (run after services are up):

```bash
# apply migrations
docker compose exec backend python manage.py migrate

# create your own superuser
docker compose exec backend python manage.py createsuperuser

# load sample workspace/datastore (creates demo/demo1234 user)
docker compose exec backend python manage.py loaddata seed.json
```

Services:

- Backend API: http://localhost:8000/api/
- API documentation (Swagger UI): http://localhost:8000/api/docs/
- Django admin: http://localhost:8000/admin/ (use `createsuperuser` credentials or `demo/demo1234` from seed)
- Frontend UI: http://localhost:3000/

To stop containers:

```bash
make down          # stop services, keep volumes
make reset         # stop services and remove volumes (wipes Postgres data)
```

## Seed data

The fixture located at `backend/fixtures/seed.json` imports:

- Demo user: **demo / demo1234**
- `Sample Workspace` with a `Product Database` and `Products` table
- Example fields (text, select, decimal) and sample records
- A saved view (`All Products`)

The raw JSON sources are also available under `seed/` for inspection.

## Backend highlights

- Django apps: `workspaces` (RBAC, membership), `datastores` (database/table/field/record/view), `core` (auth utilities)
- Authentication: JWT (SimpleJWT) with endpoints:
  - `POST /api/auth/jwt/create`
  - `POST /api/auth/jwt/refresh`
  - `POST /api/auth/jwt/verify`
  - `GET  /api/auth/me` (current user profile)
- API discovery: `GET /api/schema/` (OpenAPI JSON), `GET /api/docs/` (Swagger UI)
- RBAC: Admin & Member can mutate workspaces within their role scope; Viewer is read-only. Enforcement happens server-side (`WorkspaceRolePermission`) and is mirrored on the frontend (`RoleGuard`).
- Records stored in PostgreSQL using `JSONB`, enabling schema agility. Field-level metadata drives validation (required/unique/type constraints) at the application layer rather than the database level.
- Attachments are stored inline as Base64 strings inside `Record.data`. Future storage engines (S3, MinIO, etc.) can replace this by swapping the serializer logic marked with extension comments.

### Record querying cheatsheet

| Query param | Example | Description |
|-------------|---------|-------------|
| `search`    | `?search=foo` | Case-insensitive search across text/long_text fields |
| `sort`      | `?sort=Name:asc,Price:desc` | Comma separated field + direction (asc / desc) |
| `filter`    | `?filter=Status:eq:Open,Price:gt:10` | Supports `eq`, `ne`, `contains`, `gt`, `lt`, `between` (value1\|value2), `in` (value1\|value2) |

Saved views persist the current sort/filter selections. Applying a view reuses the above query syntax automatically.

### Future extension hooks

- Replace inline Base64 attachments with an external object store
- Harden RBAC with row-level permissions and audit logging (see comments in `common/permissions.py`)
- Add real migrations for field type evolution instead of blocking type changes
- Stream updates via websockets for collaborative editing

## Frontend highlights

- Next.js pages router (TypeScript) with Material UI, React Query, React Hook Form, and Zod
- Authentication flow stores JWTs in `localStorage`, refreshes automatically, and surfaces login/logout within the global layout
- Pages:
  - `/login` – authenticate and store JWT
  - `/workspaces` – workspace list & creation
  - `/workspaces/[wsId]` – database overview per workspace
  - `/databases/[dbId]` – table overview, soft delete support
  - `/tables/[tableId]` – data grid with record CRUD, sorting/filtering/search
  - `/tables/[tableId]/schema` – field management (create/delete, required/unique toggles)
  - `/tables/[tableId]/views` – saved view management
  - `/import` & `/export` – CSV/JSON import (client-side validation) and filtered JSON export
- Shared UI building blocks: `DataGridView`, `RecordForm`, `SchemaEditor`, `ViewToolbar`, `RoleGuard`, `SnackbarProvider`
- API client (`src/lib/api.ts`) handles JWT injection & refresh automatically

## Known limitations

- Designed for local development only (no TLS, no production hardening)
- Record validation is optimistic and runs in-process; concurrent schema edits from multiple users may race
- Multi-user editing lacks real-time conflict resolution
- File attachments are inline Base64 strings; large binaries should move to a dedicated object store
- Importer handles CSV/JSON with simple parsing (no large-file streaming)

## Make targets quick reference

| Command | Description |
|---------|-------------|
| `make build` | Build all Docker images |
| `make up` | Start containers in detached mode |
| `make down` | Stop containers (keep volumes) |
| `make reset` | Stop containers and remove volumes (danger: wipes DB) |
| `make logs` | Tail combined logs |
| `make migrate` | Run Django migrations |
| `make createsuperuser` | Create a Django admin user |
| `make seed` | Load `backend/fixtures/seed.json` |

Enjoy exploring the generic database UI! Contributions can extend the field types, add granular permissions, or hook in richer automations.
