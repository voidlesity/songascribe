# Stage 1: Build the Nuxt app
FROM node:24.16-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json package-lock.json ./

# Install dependencies
RUN npm i

# Copy the entire project
COPY . ./

# Build the project
RUN npm run build

# Stage 2: Final Image
FROM node:24.16-alpine
WORKDIR /app

# Copy NodeLink from its official image
# It resides in /app in the original image
COPY --from=performanc/nodelink:latest /app /app/nodelink

# Copy Nuxt app output
COPY --from=build /app/.output/ ./
COPY --from=build /app/sqlite.db ./

# Environment configuration
ENV PORT=80
ENV HOST=0.0.0.0

# NodeLink default environment variables
ENV NODELINK_SERVER_HOST=127.0.0.1
ENV NODELINK_SERVER_PORT=2333
ENV NODELINK_SERVER_PASSWORD=youshallnotpass
ENV NODELINK_ENABLELOADSTREAMENDPOINT=true
ENV NODELINK_SOURCES_YOUTUBE_ENABLED=true
ENV NODELINK_SOURCES_SOUNDCLOUD_ENABLED=true
ENV NODELINK_SOURCES_BANDCAMP_ENABLED=true

# Songascribe runtime config to point to local NodeLink
ENV NODELINK_HOST=127.0.0.1
ENV NODELINK_PORT=2333
ENV NODELINK_PASSWORD=youshallnotpass

# Create entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'cd /app/nodelink && npm start &' >> /app/entrypoint.sh && \
    echo 'cd /app && exec node server/index.mjs' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

EXPOSE 80

CMD ["/app/entrypoint.sh"]
