# Bots Duel ML API Makefile

.PHONY: help install run test lint clean

help:
	@echo "🤖 Bots Duel ML API Commands:"
	@echo ""
	@echo "  make install   - Install dependencies with Poetry"
	@echo "  make run       - Start development server"
	@echo "  make test      - Run tests with pytest"
	@echo "  make lint      - Run linting (flake8, mypy)"
	@echo "  make clean     - Clean cache files"
	@echo ""

# Install dependencies
install:
	@echo "📚 Installing dependencies with Poetry..."
	poetry install

# Start development server
run:
	@echo "🚀 Starting development server..."
	@echo "📖 API documentation: http://localhost:8000/docs"
	@echo "🛑 Press Ctrl+C to stop"
	poetry run python -m src.ml.supervisor

# Run tests
test:
	@echo "🧪 Running tests..."
	poetry run pytest

# Run linting
lint:
	@echo "🔍 Running linting..."
	poetry run flake8 . --max-line-length=88 --extend-ignore=E203,W503 || echo "Flake8 not installed"
	poetry run mypy . || echo "MyPy not installed"

# Clean cache files
clean:
	@echo "🧹 Cleaning up..."
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	@echo "✅ Cleanup complete!"


# Infra: Redis + RedisInsight
infra:
	@echo "🐳 Starting Redis infrastructure..."
	docker compose -f docker-compose.yaml up -d

infra-down:
	@echo "🛑 Stopping Redis infrastructure..."
	docker compose -f docker-compose.yaml down
