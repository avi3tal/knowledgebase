"""Worked example: back-of-the-envelope numbers for a photo-sharing app, one line per step.

Reference code for the lesson animation; `# note:` comments become the narration.
"""

SECONDS_PER_DAY = 86_400  # about 1e5 when you do it in your head


def photo_app_estimate(
    dau: int, users_per_upload: int, views_per_user: int, photo_kb: int, years: int, replicas: int, peak_factor: int
) -> dict[str, int]:
    uploads_per_day = dau // users_per_upload  # note: assumption → volume: 1 in N daily users posts one photo a day
    write_qps = round(uploads_per_day / SECONDS_PER_DAY)  # note: per day → per second: divide by ~1e5 (86 400 s)
    views_per_day = (
        dau * views_per_user
    )  # note: reads come from a different assumption — photos viewed per user per day
    read_qps = round(views_per_day / SECONDS_PER_DAY)
    read_write_ratio = (
        read_qps // write_qps
    )  # note: the ratio tells you the shape: strongly read-heavy → caching and a CDN matter
    peak_read_qps = read_qps * peak_factor  # note: design for the peak, not the average (evening spike ≈ 2–3× average)
    storage_gb_per_day = (
        uploads_per_day * photo_kb // 1_000_000
    )  # note: storage per day = writes × object size (KB → GB is ÷ 1e6)
    storage_tb_total = (
        storage_gb_per_day * 365 * years * replicas // 1_000
    )  # note: × days × years × replicas — this is what the blob store must hold
    egress_gbps = round(
        read_qps * photo_kb * 8 / 1_000_000
    )  # note: bandwidth out = reads/s × size × 8 bits; tens of Gbps → serve photos from a CDN
    return {
        "write_qps": write_qps,
        "peak_read_qps": peak_read_qps,
        "read_write_ratio": read_write_ratio,
        "storage_tb_total": storage_tb_total,
        "egress_gbps": egress_gbps,
    }
