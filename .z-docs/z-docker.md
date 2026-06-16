# Docker Cheat Sheet — Postgres Container

| Command | What it does |
|---|---|
| `docker build -t my-postgres ./database` | Build the image from `database/Dockerfile` and tag it `my-postgres` |
| `docker run -d -p 5432:5432 --env-file .env --name my-postgres-container my-postgres` | Create and start the container in the background with your `.env` vars |
| `docker stop my-postgres-container` | Gracefully stop the container (data preserved, can restart) |
| `docker rm my-postgres-container` | Remove the stopped container (add `-f` to force-stop and remove in one step) |
| `docker logs -f my-postgres-container` | Follow live logs (useful to watch `init.sh` run on first boot) |
| `docker ps -a` | List all containers and their status |
| `docker exec -it my-postgres-container sh` | Open a shell inside the container (`sh` not `bash` — Alpine has no bash) |
| `docker restart my-postgres-container` | Stop then start without removing |
