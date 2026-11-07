"""Worked example (state): a document moves through draft → review → published.

Each state is an object that decides which events it accepts and what comes next. The
`Document` (the context) never branches on its own status.
"""


def run_doc_workflow(events: list[str]) -> list[str]:
    class State:
        name = "?"

        def handle(self, event: str) -> "State":
            return self  # note: default — an event this state does not understand is ignored

    class Draft(State):
        name = "draft"

        def handle(self, event: str) -> State:
            if event == "submit":
                return Review()  # note: draft accepts submit → review
            return self

    class Review(State):
        name = "review"

        def handle(self, event: str) -> State:
            if event == "approve":
                return Published()  # note: review accepts approve → published
            if event == "reject":
                return Draft()  # note: reject sends the document back to draft
            return self

    class Published(State):
        name = "published"

        def handle(self, event: str) -> State:
            if event == "archive":
                return Archived()
            return self  # note: published ignores submit/approve/reject — no if/else in Document needed

    class Archived(State):
        name = "archived"

    class Document:
        def __init__(self) -> None:
            self.state: State = Draft()

        def apply(self, event: str) -> str:
            self.state = self.state.handle(event)  # note: the context delegates to its current state object
            return self.state.name

    doc = Document()
    status = doc.state.name
    history: list[str] = [status]
    for event in events:
        status = doc.apply(event)  # note: the new status comes back from the state, not from a switch statement
        history.append(status)
    return history
