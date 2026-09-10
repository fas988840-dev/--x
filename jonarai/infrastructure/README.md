# JONARAI Infrastructure

**Development-only right now.** Production hosting is a Phase Z decision.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Postgres 16 + TimescaleDB 2.16 locally |
| `Dockerfile.backend` | Multi-stage image for the FastAPI backend |

## Local dev

```bash
# Bring the DB up
docker compose -f jonarai/infrastructure/docker-compose.dev.yml up -d

# Bring the DB down (keeps volume)
docker compose -f jonarai/infrastructure/docker-compose.dev.yml down

# Bring it down and delete the volume
docker compose -f jonarai/infrastructure/docker-compose.dev.yml down -v
```

Connection string for local backend:

```
JONARAI_DATABASE_URL=postgresql+asyncpg://jonarai:jonarai_dev_only@localhost:5432/jonarai
```

**The `jonarai_dev_only` password is committed intentionally.** It only
grants access to a container running on localhost; treat any deployment
that reuses it as a mistake.

## Backend image

```bash
docker build -f jonarai/infrastructure/Dockerfile.backend -t jonarai-backend:dev jonarai
docker run --rm -p 8000:8000 jonarai-backend:dev
# curl http://localhost:8000/health
```
