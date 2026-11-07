"""`kb studio`: local backend for the React studio (stdlib only, 127.0.0.1).

GET  /api/subjects                       catalogs + lesson availability
GET  /api/lesson/<subject>/<topic>       resolved lesson (quiz answers withheld)
GET  /api/problem/<subject>/<slug>       problem card (README, attempts, last runs)
GET  /api/problems/<subject>             all problems with topics + status (problem browser)
GET  /api/topic/<subject>/<topic>        topic page: prereqs/related, problems, resources, neighbourhood
GET  /api/graph/<subject>                full knowledge graph (nodes + edges)
GET  /api/feedback/<subject>             deterministic progress feedback
POST /api/quiz  {subject, topic, item, choice}  -> graded, appended to progress/quiz.jsonl
Everything else is served from studio/dist (SPA fallback to index.html).
"""

from __future__ import annotations

import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from kb import feedback, history, learn, scaffold
from kb.paths import ROOT, problems_dir
from kb.schema import ProblemError

DIST = ROOT / "studio" / "dist"
MAX_BODY = 4096
LOCAL_HOSTS = {"127.0.0.1", "localhost", "[::1]"}


def local_request(headers: Any) -> bool:
    """Writes must come from the studio itself: a local Host (blocks DNS rebinding), a local or absent
    Origin (blocks other sites posting to 127.0.0.1), and a JSON content type (forces a CORS preflight,
    which this server never grants)."""
    host = (headers.get("Host") or "").rsplit(":", 1)[0]
    origin = headers.get("Origin")
    origin_host = urlparse(origin).hostname if origin else None
    json_body = (headers.get("Content-Type") or "").split(";")[0].strip() == "application/json"
    return host in LOCAL_HOSTS and (origin is None or origin_host in {"127.0.0.1", "localhost", "::1"}) and json_body


def subjects_payload() -> dict[str, Any]:
    out = []
    for s in learn.subjects():
        cat = learn.catalog(s)
        topics = [{**t, "has_lesson": learn.has_lesson(s, t["id"])} for t in cat["topics"]]
        out.append(
            {
                "id": s,
                "title": cat.get("title", s),
                "status": cat.get("status", "open"),
                "source": cat.get("source"),
                "topics": topics,
            }
        )
    return {"root": str(ROOT), "subjects": out}


def problems_payload(subject: str) -> list[dict[str, Any]]:
    """Every problem of a subject with its catalog topics and practice status (for the browser)."""
    aliases = learn.alias_map(learn.catalog(subject))
    runs = history.runs()
    out = []
    for p in scaffold.all_problems(problems_for(subject)):
        st = feedback.problem_status(p, runs)
        tags = p.meta.get("patterns", [])
        out.append(
            {
                "slug": p.slug,
                "title": p.meta.get("title", p.slug),
                "difficulty": p.meta.get("difficulty"),
                "patterns": tags,
                "topics": sorted({aliases[t] for t in tags if t in aliases}),
                "sources": [s.get("name") for s in p.meta.get("sources", [])],
                "attempts": len(p.attempts()),
                "status": st["status"],
                "legacy_failing": st["legacy_failing"],
                "complexity_miss": st["complexity_miss"],
            }
        )
    return out


def problems_for(subject: str) -> Path:
    return problems_dir(subject)


class Handler(BaseHTTPRequestHandler):
    server_version = "kb-studio"

    def log_message(self, fmt: str, *args: Any) -> None:  # quieter console
        pass

    def _json(self, data: Any, status: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status: int, msg: str) -> None:
        self._json({"error": msg}, status)

    def do_GET(self) -> None:  # noqa: N802 - http.server API
        parts = [p for p in urlparse(self.path).path.split("/") if p]
        try:
            if parts[:2] == ["api", "subjects"] and len(parts) == 2:
                return self._json(subjects_payload())
            if parts[:2] == ["api", "lesson"] and len(parts) == 4:
                return self._json(learn.resolve(parts[2], parts[3], history.runs()))
            if parts[:2] == ["api", "problem"] and len(parts) == 4:
                learn.catalog(parts[2])  # validates the subject id
                return self._json(learn.problem_card(parts[2], parts[3], history.runs()))
            if parts[:2] == ["api", "topic"] and len(parts) == 4:
                return self._json(learn.topic_page(parts[2], parts[3], history.runs()))
            if parts[:2] == ["api", "graph"] and len(parts) == 3:
                from kb import refs

                learn.catalog(parts[2])  # validates the subject id
                return self._json(refs.graph(parts[2]))
            if parts[:2] == ["api", "problems"] and len(parts) == 3:
                return self._json(problems_payload(parts[2]))
            if parts[:2] == ["api", "feedback"] and len(parts) == 3:
                learn.catalog(parts[2])  # validates the subject id
                return self._json(feedback.compute(parts[2], problems_for(parts[2])))
            if parts and parts[0] == "api":
                return self._error(HTTPStatus.NOT_FOUND, "unknown endpoint")
        except ProblemError as e:
            return self._error(HTTPStatus.NOT_FOUND, str(e))
        self._static(parts)

    def do_POST(self) -> None:  # noqa: N802 - http.server API
        if urlparse(self.path).path != "/api/quiz":
            return self._error(HTTPStatus.NOT_FOUND, "unknown endpoint")
        if not local_request(self.headers):
            return self._error(HTTPStatus.FORBIDDEN, "writes are only accepted from the local studio")
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self._error(HTTPStatus.BAD_REQUEST, "bad body")
        try:
            body = json.loads(self.rfile.read(length))
            subject, topic, item, choice = (str(body[k]) for k in ("subject", "topic", "item", "choice"))
            result = learn.grade_quiz(subject, topic, item, choice)
        except (KeyError, ValueError, TypeError):
            return self._error(HTTPStatus.BAD_REQUEST, "expected {subject, topic, item, choice}")
        except ProblemError as e:
            return self._error(HTTPStatus.NOT_FOUND, str(e))
        history.record_quiz(
            {"subject": subject, "topic": topic, "item": item, "choice": choice, "correct": result["correct"]}
        )
        self._json(result)

    def _static(self, parts: list[str]) -> None:
        if not DIST.is_dir():
            return self._error(HTTPStatus.SERVICE_UNAVAILABLE, "studio not built — run: cd studio && yarn build")
        target = (DIST / "/".join(parts)).resolve() if parts else DIST / "index.html"
        if not target.is_relative_to(DIST.resolve()) or not target.is_file():
            target = DIST / "index.html"  # SPA fallback (also blocks path traversal)
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def make_server(port: int) -> ThreadingHTTPServer:
    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def serve(port: int) -> None:
    httpd = make_server(port)
    if not DIST.is_dir():
        print("note: studio/dist is missing — API only. Build the UI: cd studio && yarn install && yarn build")
        print("      (or run `yarn dev` in studio/, which proxies /api to this server)")
    print(f"kb studio on http://127.0.0.1:{port}  (Ctrl+C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
