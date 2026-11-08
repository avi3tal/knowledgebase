"""Worked example: a multipart upload — fixed-size parts sent out of order, then completed.

The client splits `data` into parts of `part_size` characters, numbered from 1. Parts arrive in
`arrivals` order (a number may repeat: a retried part). Complete stitches the parts by part number.
Returns [number of parts, the assembled object] or [number of parts, "missing:<n>"].
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def multipart_upload(data: str, part_size: int, arrivals: list[int]) -> list:
    parts: list[str] = []
    for start in range(0, len(data), part_size):
        piece = data[start : start + part_size]
        parts.append(piece)  # note: the client cuts the file into fixed-size parts, numbered 1..n
    received: dict[int, str] = {}
    for i in range(len(arrivals)):
        number = arrivals[i]
        received[number] = parts[number - 1]  # note: each part is its own PUT; a retry just overwrites the same number
    assembled = ""
    for number in range(1, len(parts) + 1):
        if number not in received:
            return [len(parts), "missing:" + str(number)]  # note: complete fails until every part is in
        assembled += received[number]  # note: complete orders parts by number, not by arrival time
    return [len(parts), assembled]
