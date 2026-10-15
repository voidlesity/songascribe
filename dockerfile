# Stage 1: Build the Nuxt app
FROM node:26-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the entire project
COPY . ./

# Build the project
RUN npm run build

# Stage 2: Final Image
FROM node:26-alpine
WORKDIR /app

# Install runtime dependencies for NodeLink
RUN apk add --no-cache ffmpeg tini

# Copy NodeLink from its official image
COPY --from=performanc/nodelink:3.9.0 /app /app/nodelink

# Copy Nuxt app output
COPY --from=build /app/.output/ ./
COPY --from=build /app/sqlite.db ./

# NodeLink & Server Defaults (Internal)
ENV NODELINK_API_ENABLELOADSTREAMENDPOINT=true \
    PORT=80 \
    HOST=0.0.0.0 \
    NODE_ENV=production

# Start NodeLink in the background, then hand PID 1 duties to the Nuxt server
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    '(cd /app/nodelink && npm start) &' \
    'cd /app' \
    'exec node server/index.mjs' \
    > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/entrypoint.sh"]
