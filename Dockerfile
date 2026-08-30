# FactLedger API - multi-stage build.
# Works as-is on Railway, Render, Fly.io, or any Docker host: they all
# build this image from the repo root and run it, no extra config needed
# beyond the environment variables in .env.example.

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
