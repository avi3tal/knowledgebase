"""Worked example (builder): assemble an email step by step, validate once in build().

The product (`Email`) is immutable and always valid; the builder is the only place that
tolerates a half-finished object.
"""


def build_email(steps: list[list[str]]) -> str:
    class Email:
        def __init__(self, to: str, subject: str, body: str, cc: list[str]) -> None:
            self.to, self.subject, self.body, self.cc = to, subject, body, tuple(cc)

        def __str__(self) -> str:
            cc = f" cc={','.join(self.cc)}" if self.cc else ""
            return f"to={self.to}{cc} subject={self.subject!r} body={self.body!r}"

    class EmailBuilder:
        def __init__(self, parts: dict[str, object]) -> None:
            self.parts = parts  # note: the builder collects parts; no Email exists yet

        def to(self, addr: str) -> "EmailBuilder":
            self.parts["to"] = addr
            return self  # note: returning self is what makes the fluent .to(...).subject(...) chain work

        def subject(self, text: str) -> "EmailBuilder":
            self.parts["subject"] = text
            return self

        def cc(self, addr: str) -> "EmailBuilder":
            self.parts.setdefault("cc", []).append(addr)  # note: optional, repeatable part
            return self

        def body(self, text: str) -> "EmailBuilder":
            self.parts["body"] = text
            return self

        def build(self) -> Email:
            missing = [k for k in ("to", "subject") if k not in self.parts]
            if missing:
                raise ValueError(f"missing {', '.join(missing)}")  # note: validate once, here
            return Email(self.parts["to"], self.parts["subject"], self.parts.get("body", ""), self.parts.get("cc", []))

    parts: dict[str, object] = {}
    builder = EmailBuilder(parts)
    for method, arg in steps:
        getattr(builder, method)(arg)  # note: in real code this is a fluent chain; the lesson replays it from a list
    try:
        email = builder.build()
    except ValueError as err:
        return f"error: {err}"
    result = str(email)  # note: the finished product is immutable and valid
    return result
