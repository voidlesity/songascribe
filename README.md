# Songascribe

Songascribe is a Nuxt application for organizing songs into categories and items, sharing collections, and playing audio through [NodeLink](https://github.com/PerformanC/NodeLink).

## Requirements

- Node.js 26+
- npm 11+
- Docker with Compose, for NodeLink and containerized deployment

## Local development

1. Install dependencies and create local configuration:

   ```sh
   npm ci
   cp .env.example .env
   ```

2. Set both blank secret values in `.env`. `NUXT_SESSION_PASSWORD` must be a random string of at least 32 characters.

3. Start the pinned NodeLink service:

   ```sh
   docker compose up -d nodelink
   ```

4. Prepare the local database and start Nuxt:

   ```sh
   mkdir -p data
   DATABASE_PATH=./data/sqlite.db npm run db:up
   npm run dev
   ```

The application is available at <http://localhost:3000>. NodeLink is bound to <http://127.0.0.1:2333> for local development only.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_PATH` | Yes | SQLite file path. Use `./data/sqlite.db` locally and `/data/sqlite.db` in the container. |
| `NUXT_SESSION_PASSWORD` | Yes | Random session-signing secret of at least 32 characters. Never commit it. |
| `NODELINK_HOST` | Yes | NodeLink hostname: `localhost` locally or `nodelink` in Compose. |
| `NODELINK_PORT` | Yes | NodeLink port: `2333` locally or `3000` on the Compose network. |
| `NODELINK_PASSWORD` | Yes | Shared secret configured identically in Songascribe and NodeLink. |
| `NODELINK_TIMEOUT_MS` | No | Upstream request timeout in milliseconds; defaults to `8000`. |

`.env.example` intentionally leaves secrets blank. Compose refuses to start until they are set, and the Docker image does not include a NodeLink password fallback.

## Database lifecycle

Songascribe stores SQLite data in the directory containing `DATABASE_PATH`. Keep the database and its `-wal`/`-shm` sidecars together when backing up or restoring it.

- `npm run db:generate` creates a migration after an intentional schema change.
- `npm run db:up` applies the schema to the configured development database.
- `npm run db:studio` opens Drizzle Studio for local inspection.
- For Drizzle CLI commands, export `DATABASE_PATH` or prefix the command as shown above.
- The application applies committed migrations during startup.

Do not commit database files. Before upgrading a deployed instance, stop writes and back up the complete data directory.

## Tests and quality checks

CI installs with `npm ci`, then runs lint, type checking, tests, and a production build before publishing an image. Quality jobs use `--if-present`, so they begin enforcing each check as its package script is added.

Run the same checks locally:

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

Generated coverage and Playwright output are ignored by Git and Docker.

## API documentation

With the application running:

- Interactive API reference: <http://localhost:3000/api/>
- OpenAPI document: <http://localhost:3000/api/_openapi.json>
- Health/readiness check: <http://localhost:3000/api/health>

The API includes authentication, users, categories, items, sharing, statistics, public catalog, and audio routes. Authenticated endpoints use the Songascribe session cookie; consult the interactive reference for request and response schemas.

## Docker deployment

Compose runs Songascribe and NodeLink as separate services. The Songascribe image runs only the Nuxt server, as a non-root user. NodeLink is pinned to `performanc/nodelink:3.8.0`; update that value deliberately in `compose.yml` when upgrading.

```sh
cp .env.example .env
# Set the blank secrets in .env before continuing.
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

Songascribe is exposed on port `3000`. The named volume `songascribe-data` persists `/data`, including the database and SQLite sidecars, across container replacement.

Stop containers without deleting data:

```sh
docker compose down
```

To permanently delete the database volume as well, use `docker compose down --volumes`. This is destructive.

The app image can also run with an external NodeLink service, provided `/data` is persisted and all required environment variables are supplied.

## GitLab image publishing

After install, quality, and application-build jobs pass, GitLab uses Kaniko to publish to `$DOCKERHUB_USERNAME/songascribe`. Authentication continues to use the protected `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` CI variables. Default-branch images receive commit-SHA and `latest` tags; Git tags receive the release tag and `latest`.
