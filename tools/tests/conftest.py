import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))


import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _isolated_workspace(tmp_path_factory: pytest.TempPathFactory, monkeypatch: pytest.MonkeyPatch) -> None:
    """Never read or write the learner's private workspace (attempts, progress, sessions): every test
    starts from an empty one, exactly like a fresh clone."""
    monkeypatch.setenv("KB_WORKSPACE", str(tmp_path_factory.mktemp("workspace")))
    monkeypatch.setenv("KB_PROGRESS_DIR", str(tmp_path_factory.mktemp("progress")))
