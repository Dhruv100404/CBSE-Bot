up:
	docker compose up --build

down:
	docker compose down

reset:
	docker compose down -v

logs:
	docker compose logs -f

migrate:
	docker compose exec api uv run alembic upgrade head

makemigration:
	docker compose exec api uv run alembic revision --autogenerate -m "$(name)"
