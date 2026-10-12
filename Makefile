# Pulso · панель оператора
# Обёртка над npm-скриптами. Локальная проверка повторяет шаги CI-джобы `lint`
# в .circleci/config.yml: lint -> format:check -> typecheck.

NPM ?= npm

.DEFAULT_GOAL := help
.PHONY: help install lint lint-fix format format-check typecheck check build dev mock dev-mock preview clean

help: ## Показать список целей
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Установить зависимости
	$(NPM) ci

lint: ## oxlint
	$(NPM) run lint

lint-fix: ## oxlint --fix
	$(NPM) exec -- oxlint --fix

format: ## prettier --write
	$(NPM) run format

format-check: ## prettier --check (только проверка)
	$(NPM) run format:check

typecheck: ## tsc -b
	$(NPM) run typecheck

check: lint format-check typecheck ## Полная проверка, как в CI
	@echo "OK: lint, format:check, typecheck"

build: typecheck ## Продакшен-сборка в dist/
	$(NPM) run build

dev: ## Vite dev-сервер на :5173
	$(NPM) run dev

run: ## Запустить приложение
	$(NPM) run dev

dev-mock: ## Vite dev-сервер с прокси на mock API
	$(NPM) run dev:mock

mock: ## Mock API на :8787
	$(NPM) run mock

preview: ## Превью продакшен-сборки
	$(NPM) run preview

clean: ## Удалить dist/
	rm -rf dist