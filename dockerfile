# Stage 1: build the Nuxt app
FROM node:26-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# better-sqlite3 ships prebuilt binaries (incl. musl), but npm would still run
# an implicit `node-gyp rebuild` that needs Python. Skip install scripts and
# run Nuxt's postinstall step explicitly instead.
RUN npm ci --ignore-scripts

COPY . ./
RUN npx nuxt prepare && npm run build

# Stage 2: runtime image with NodeLink bundled
FROM node:26-alpine
WORKDIR /app

# Runtime dependencies for NodeLink
RUN apk add --no-cache ffmpeg tini

COPY --from=performanc/nodelink:3.9.0 /app /app/nodelink

COPY --from=build /app/.output/ ./
# Migrations are applied on startup by server/plugins/migrate.ts
COPY --from=build /app/server/db/migrations ./server/db/migrations

ENV NODELINK_API_ENABLELOADSTREAMENDPOINT=true \
    PORT=80 \
    HOST=0.0.0.0 \
    NODE_ENV=production \
    DATABASE_PATH=/data/sqlite.db

RUN mkdir -p /data && printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    '(cd /app/nodelink && npm start) &' \
    'cd /app' \
    'exec node server/index.mjs' \
    > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

VOLUME /data
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/entrypoint.sh"]
