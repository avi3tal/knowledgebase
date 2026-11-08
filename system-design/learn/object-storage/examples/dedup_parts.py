"""Worked example: content-addressed storage — identical parts are stored once.

Each file is cut into parts of `part_size` characters; a part is keyed by a short hash of its
bytes. A file is then just a manifest (list of part hashes). Returns [parts referenced, parts stored].
Reference code for the lesson animation; `# note:` comments become the narration.
"""

import hashlib


def dedup_parts(files: dict[str, str], part_size: int) -> list[int]:
    store: dict[str, str] = {}
    manifests: dict[str, list[str]] = {}
    referenced = 0
    for name in files:
        data = files[name]
        manifests[name] = []
        for start in range(0, len(data), part_size):
            part = data[start : start + part_size]
            key = hashlib.sha256(part.encode()).hexdigest()[:8]  # note: the key is derived from the content itself
            referenced += 1
            if key not in store:
                store[key] = part  # note: new content — upload and store these bytes once
            manifests[name].append(key)  # note: the file only records which part it needs, in order
    return [referenced, len(store)]
