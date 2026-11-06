# Repo checks. Python tooling runs through uvx (no venv needed); kb itself is stdlib-only.
.PHONY: test test-py test-go lint fmt index

test: test-py test-go

test-py:
	uvx pytest -q

test-go:
	go vet ./...
	go test ./tools/...

lint:
	uvx ruff check tools
	uvx black --check tools
	@test -z "$$(gofmt -l tools)" || (gofmt -l tools; exit 1)

fmt:
	uvx ruff check --fix tools
	uvx black tools
	gofmt -w tools

index:
	./kb index
