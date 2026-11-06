import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))


import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _isolated_progress(tmp_path_factory: pytest.TempPathFactory, monkeypatch: pytest.MonkeyPatch) -> None:
    """Never write test runs / quiz answers into the real progress/ history."""
    monkeypatch.setenv("KB_PROGRESS_DIR", str(tmp_path_factory.mktemp("progress")))
