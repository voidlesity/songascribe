FROM node:23.11.1-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json package-lock.json ./

# Install dependencies
RUN npm i

# Copy the entire project
COPY . ./

# Build the project
RUN npm run build

# Run the application
FROM node:23.11.1-alpine
WORKDIR /app

COPY --from=build /app/.output/ ./
COPY --from=build /app/sqlite.db ./

# Change the port and host
ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
