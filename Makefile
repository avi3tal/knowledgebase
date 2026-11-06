# Repo checks. Python tooling runs through uvx (no venv needed); kb itself is stdlib-only.
# The studio (React + TS) uses yarn 4 inside studio/.
.PHONY: test test-py test-go test-studio lint fmt index studio studio-install learn

test: test-py test-go test-studio

test-py:
	uvx pytest -q

test-go:
	go vet ./...
	go test ./tools/...

studio-install:
	cd studio && yarn install --immutable

test-studio: studio-install
	cd studio && yarn typecheck && yarn test

lint: studio-install
	uvx ruff check tools
	uvx black --check tools
	@test -z "$$(gofmt -l tools)" || (gofmt -l tools; exit 1)
	cd studio && yarn format:check
	./kb learn validate

fmt: studio-install
	uvx ruff check --fix tools
	uvx black tools
	gofmt -w tools
	cd studio && yarn format

index:
	./kb index

# Build lesson traces (deterministic) after editing a lesson's examples or lesson.json.
learn:
	./kb learn build

# Build the UI and serve it with the kb backend on http://127.0.0.1:8765
studio: studio-install
	cd studio && yarn build
	./kb studio
