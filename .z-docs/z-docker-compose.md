# Docker Compose Cheat Sheet

docker compose -f srcs/docker-compose.yml

| Command                                                                   | What it does                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `docker compose -f docker-compose.yml build`                              | Build/rebuild images without starting containers                            |
| `docker compose -f docker-compose.yml up -d`                              | Start all services (add `--build` to rebuild images first)                  |
| `docker compose -f docker-compose.yml stop`                               | Stop containers                                                             |
| `docker compose -f docker-compose.yml down`                               | Stop and remove containers (add `-v` to also delete volumes)                |
| `docker compose -f docker-compose.yml down -v --rmi all --remove-orphans` | Stop and remove containers + volumes + images                               |
| `docker compose -f docker-compose.yml logs <service>`                     | Show output logs (add `-f` to follow live)                                  |
| `docker compose -f docker-compose.yml ps`                                 | List running containers and their status/ports                              |
| `docker compose -f docker-compose.yml exec <service> <cmd>`               | Run a command inside a running container e.g. `exec postgres psql -U admin` |
| `docker compose -f docker-compose.yml restart <service>`                  | Restart a specific service without rebuilding                               |
| `docker system prune -a --volumes`                                        | Remove build cache + wipe everything Docker-wide,                           |
