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
RUN apk add --no-cache ffmpeg

# Copy NodeLink from its official image
COPY --from=performanc/nodelink:latest /app /app/nodelink

# Copy Nuxt app output
COPY --from=build /app/.output/ ./
COPY --from=build /app/sqlite.db ./

# NodeLink & Server Defaults (Internal)
ENV NODELINK_SERVER_HOST=127.0.0.1 \
    NODELINK_SERVER_PORT=2333 \
    NODELINK_SERVER_PASSWORD=youshallnotpass \
    NODELINK_ENABLELOADSTREAMENDPOINT=true \
    NODELINK_SOURCES_YOUTUBE_ENABLED=true \
    NODELINK_SOURCES_SOUNDCLOUD_ENABLED=true \
    NODELINK_SOURCES_BANDCAMP_ENABLED=true \
    NODELINK_HOST=127.0.0.1 \
    NODELINK_PORT=2333 \
    NODELINK_PASSWORD=youshallnotpass \
    PORT=80 \
    HOST=0.0.0.0 \
    NODE_ENV=production

# Create entrypoint script
RUN printf "#!/bin/sh\n\
cd /app/nodelink && npm start & \n\
cd /app && exec node server/index.mjs\n" > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

EXPOSE 80

CMD ["/app/entrypoint.sh"]
