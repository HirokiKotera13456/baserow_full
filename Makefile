.PHONY: up down logs build shell-backend shell-frontend migrate createsuperuser seed reset

up:
docker compose up -d

down:
docker compose down

logs:
docker compose logs -f

build:
docker compose build

shell-backend:
docker compose exec backend bash

shell-frontend:
docker compose exec frontend bash

migrate:
docker compose exec backend python manage.py migrate

createsuperuser:
docker compose exec backend python manage.py createsuperuser

seed:
docker compose exec backend python manage.py loaddata seed.json

reset:
docker compose down -v
