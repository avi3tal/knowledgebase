"""`kb studio`: local backend for the React studio (stdlib only, 127.0.0.1).

GET  /api/subjects                       catalogs + lesson availability
GET  /api/lesson/<subject>/<topic>       resolved lesson (quiz answers withheld)
GET  /api/problem/<subject>/<slug>       problem card (README, attempts, last runs)
GET  /api/problems/<subject>             all problems with topics + status (problem browser)
GET  /api/topic/<subject>/<topic>        topic page: prereqs/related, problems, resources, neighbourhood
GET  /api/graph/<subject>                full knowledge graph (nodes + edges)
GET  /api/feedback/<subject>             deterministic progress feedback
GET  /api/sessions                       study sessions with derived completion / scores
GET  /api/session/<id>                   one session (items, scores, attempt paths, materials)
POST /api/quiz  {subject, topic, item, choice}  -> graded, appended to progress/quiz.jsonl
POST /api/sessions  {subject, topics, difficulty, count, focus, goal, title, minutes}  -> new session
POST /api/session/<id>/status   {status}           -> planned/active/done/abandoned
POST /api/session/<id>/attempt  {item, lang}       -> new attempt linked to the item
GET  /api/design/<subject>/<slug>                   design problem (no spoilers) + attempts
GET  /api/design/<subject>/<slug>/<attempt>         attempt files + live check (not recorded)
GET  /api/design/<subject>/<slug>/<attempt>/reference   reference design (only after submit)
POST /api/design/<subject>/<slug>/attempt  {label?}                 -> new attempt
POST /api/design/<subject>/<slug>/tip      {check, level, attempt?}  -> {text} (recorded in tips.jsonl)
POST /api/design/<subject>/<slug>/<attempt>/save  {file, content, version?} -> live check (not recorded)
POST /api/design/<subject>/<slug>/<attempt>/delete-diagram {version}
POST /api/design/<subject>/<slug>/<attempt>/check  {}  -> check, recorded in runs.jsonl
POST /api/design/<subject>/<slug>/<attempt>/submit {}  -> check, recorded, reference unlocked
All writes go to the private workspace and only from the local studio (see local_request).
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

from kb import design, feedback, history, learn, sessions
from kb.paths import ROOT, attempts_root, problems_dir
from kb.schema import ProblemError

DIST = ROOT / "studio" / "dist"
MAX_BODY = 4096
MAX_DESIGN_BODY = 256 * 1024  # diagram/design saves only
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
    for p in learn.subject_problems(subject, problems_for(subject)):
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


def session_payload(session: dict[str, Any]) -> dict[str, Any]:
    """Evaluated session plus what the studio needs: attempt paths and material names."""
    ev = sessions.evaluate(session)
    for it in ev["items"]:
        root = attempts_root(it["subject"], it["slug"])
        it["attempt_paths"] = [str(root / a) for a in it.get("attempts", [])]
    for m in ev["materials"]:
        names = {t["id"]: t["name"] for t in learn.catalog(m["subject"])["topics"]}
        m["name"] = names.get(m["topic"], m["topic"])
        m["has_lesson"] = learn.has_lesson(m["subject"], m["topic"])
    return ev


def _str_list(v: Any) -> list[str]:
    if not isinstance(v, list) or not all(isinstance(x, str) for x in v):
        raise ValueError("expected a list of strings")
    return v


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
            if parts[:2] == ["api", "design"] and len(parts) in (4, 5, 6):
                return self._get_design(parts)
            if parts[:2] == ["api", "sessions"] and len(parts) == 2:
                return self._json([session_payload(x) for x in sessions.all_sessions()])
            if parts[:2] == ["api", "session"] and len(parts) == 3:
                return self._json(session_payload(sessions.load(parts[2])))
            if parts and parts[0] == "api":
                return self._error(HTTPStatus.NOT_FOUND, "unknown endpoint")
        except ProblemError as e:
            return self._error(HTTPStatus.NOT_FOUND, str(e))
        self._static(parts)

    def do_POST(self) -> None:  # noqa: N802 - http.server API
        parts = [p for p in urlparse(self.path).path.split("/") if p]
        routes = {
            ("api", "quiz"): self._post_quiz,
            ("api", "sessions"): self._post_session,
        }
        handler = routes.get(tuple(parts))  # type: ignore[call-overload]
        max_body = MAX_BODY
        if handler is None and parts[:2] == ["api", "design"] and len(parts) in (5, 6):
            handler, max_body = self._post_design, MAX_DESIGN_BODY
        if (
            handler is None
            and parts[:2] == ["api", "session"]
            and len(parts) == 4
            and parts[3] in ("status", "attempt")
        ):
            handler = self._post_session_action
        if handler is None:
            return self._error(HTTPStatus.NOT_FOUND, "unknown endpoint")
        if not local_request(self.headers):
            return self._error(HTTPStatus.FORBIDDEN, "writes are only accepted from the local studio")
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > max_body:
            return self._error(HTTPStatus.BAD_REQUEST, "bad body")
        try:
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise ValueError("expected an object")
            return handler(parts, body)
        except (KeyError, ValueError, TypeError) as e:
            return self._error(HTTPStatus.BAD_REQUEST, f"bad request: {e}")
        except ProblemError as e:
            return self._error(HTTPStatus.UNPROCESSABLE_ENTITY, str(e))

    def _get_design(self, parts: list[str]) -> None:
        subject, slug = parts[2], parts[3]
        problem = design.load(subject, slug)
        if len(parts) == 4:
            payload = design.public_problem(problem)
            payload["status"] = feedback.problem_status(problem, history.runs())  # type: ignore[arg-type]
            return self._json(payload)
        adir = design.attempt_dir(subject, slug, parts[4])
        if len(parts) == 5:
            return self._json(design.attempt_payload(problem, adir))
        if parts[5] == "reference":
            if not (adir / "submitted.json").exists():
                return self._error(HTTPStatus.CONFLICT, "submit your attempt first: the reference is a spoiler")
            return self._json(design.reference(problem, adir))
        return self._error(HTTPStatus.NOT_FOUND, "unknown endpoint")

    def _post_design(self, parts: list[str], body: dict[str, Any]) -> None:
        subject, slug = parts[2], parts[3]
        problem = design.load(subject, slug)
        if len(parts) == 5 and parts[4] == "attempt":
            label = body.get("label") or None
            adir = design.new_attempt(problem, str(label) if label else None)
            return self._json(design.attempt_payload(problem, adir), HTTPStatus.CREATED)
        if len(parts) == 5 and parts[4] == "tip":
            text = design.tip(problem, str(body["check"]), str(body["level"]), body.get("attempt"))
            return self._json({"check": body["check"], "level": body["level"], "text": text})
        if len(parts) != 6:
            return self._error(HTTPStatus.NOT_FOUND, "unknown endpoint")
        attempt, action = parts[4], parts[5]
        adir = design.attempt_dir(subject, slug, attempt)
        if action == "save":
            version = body.get("version")
            design.save(subject, slug, attempt, str(body["file"]), body["content"], int(version) if version else None)
            return self._json(design.run_checks(problem, adir))
        if action == "delete-diagram":
            design.delete_diagram(subject, slug, attempt, int(body["version"]))
            return self._json(design.run_checks(problem, adir))
        if action == "check":
            result = design.run_checks(problem, adir)
            design.record(result)
            return self._json(result)
        if action == "submit":
            return self._json(design.submit(problem, adir))
        return self._error(HTTPStatus.NOT_FOUND, "unknown endpoint")

    def _post_quiz(self, parts: list[str], body: dict[str, Any]) -> None:
        subject, topic, item, choice = (str(body[k]) for k in ("subject", "topic", "item", "choice"))
        try:
            result = learn.grade_quiz(subject, topic, item, choice)
        except ProblemError as e:
            return self._error(HTTPStatus.NOT_FOUND, str(e))
        history.record_quiz(
            {"subject": subject, "topic": topic, "item": item, "choice": choice, "correct": result["correct"]}
        )
        self._json(result)

    def _post_session(self, parts: list[str], body: dict[str, Any]) -> None:
        minutes = body.get("minutes")
        s = sessions.generate(
            subject=str(body.get("subject", "algo")),
            topics=_str_list(body.get("topics", [])),
            difficulty=_str_list(body.get("difficulty", [])),
            count=int(body.get("count", 5)),
            focus=str(body.get("focus", "mixed")),
            goal=(str(body["goal"]).strip() or None) if body.get("goal") else None,
            title=(str(body["title"]).strip() or None) if body.get("title") else None,
            minutes=int(minutes) if minutes else None,
        )
        sessions.save(s)
        self._json(session_payload(s), HTTPStatus.CREATED)

    def _post_session_action(self, parts: list[str], body: dict[str, Any]) -> None:
        sid, action = parts[2], parts[3]
        if action == "status":
            sessions.set_status(sid, str(body["status"]))
        else:
            sessions.start_attempt(sid, str(body["item"]), str(body["lang"]), body.get("pattern") or None)
        self._json(session_payload(sessions.load(sid)))

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
