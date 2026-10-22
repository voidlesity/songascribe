# Songascribe

Ascribe songs to things: organize tracks into categories and items, and note
why each song belongs there.

Built with Nuxt 4, SQLite (drizzle + better-sqlite3) and
[NodeLink](https://github.com/PerformanC/NodeLink) for search and audio
streaming.

## Development

With Nix, `nix develop` installs everything and opens a tmux session running
the dev server next to NodeLink.

Without Nix you need Node.js 26 and Docker:

```sh
npm install
docker run --rm -p 2333:3000 -e NODELINK_API_ENABLELOADSTREAMENDPOINT=true performanc/nodelink:3.9.0
npm run dev
```

| Script                                | Purpose                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `npm run check`                       | Format check, lint and typecheck (what CI runs)        |
| `npm run format` / `npm run lint:fix` | Fix formatting / lint issues                           |
| `npm run db:generate`                 | Create a migration after editing `server/db/schema.ts` |
| `npm run db:migrate` / `db:studio`    | Apply migrations manually / browse the database        |

Migrations in `server/db/migrations` are applied automatically on startup.
Don't use `drizzle-kit push`; a database changed that way no longer matches the
migrations.

If your local database was created with the old `db:up` (push) script, it
already has the avatar columns, and the `0003_avatar_storage` migration will
fail with `duplicate column name`. Mark it as applied once and restart:

```sh
sqlite3 sqlite.db "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('0003_avatar_storage', 1792683738618)"
```

## Configuration

| Variable              | Default           | Notes                                 |
| --------------------- | ----------------- | ------------------------------------- |
| `DATABASE_PATH`       | `./sqlite.db`     | `/data/sqlite.db` in the Docker image |
| `NODELINK_HOST`       | `localhost`       |                                       |
| `NODELINK_PORT`       | `2333`            |                                       |
| `NODELINK_PASSWORD`   | `youshallnotpass` |                                       |
| `NODELINK_TIMEOUT_MS` | `15000`           | Timeout for NodeLink requests         |

The `NODELINK_*` values are read when the app is built (or in dev). To change
them on an already built server, use `NUXT_NODELINK_HOST`,
`NUXT_NODELINK_PORT`, `NUXT_NODELINK_PASSWORD` and `NUXT_NODELINK_TIMEOUT_MS`.

## Docker

The image bundles NodeLink, so a single container is enough. Keep the database
in a volume:

```sh
docker run -d -p 80:80 -v songascribe-data:/data <dockerhub-user>/songascribe:latest
```

`GET /api/health` reports whether the database and NodeLink are reachable, and
is used as the container health check. The API reference lives at `/api/`.

## CI/CD

Every branch, merge request and tag runs format check, lint, typecheck and a
build. Tags additionally build the image and push it to Docker Hub as
`<tag>` and `latest`.

This needs the CI/CD variables `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`. If
they are marked _Protected_, the tags must be protected too (Settings >
Repository > Protected tags), otherwise the job can't see them.
