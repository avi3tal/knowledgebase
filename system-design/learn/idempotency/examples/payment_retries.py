"""Worked example: a payment API whose clients retry, with and without an idempotency-key table.

requests are "<idempotency key>:<amount>"; a retry resends the same key and amount. With use_key,
the server stores {key: [amount, response]} in the same step as the charge, so a repeat returns
the stored response and a reused key with a different amount is rejected.
Returns [charges, replayed, rejected].
Reference code for the lesson animation; `# note:` comments become the narration.
"""


def payment_retries(requests: list[str], use_key: bool) -> list[int]:
    keys: dict[str, list] = {}
    ledger: list[str] = []
    replayed = 0
    rejected = 0
    for i in range(len(requests)):
        key, amount = requests[i].split(":")
        if use_key and key in keys:
            if keys[key][0] != amount:
                rejected += 1  # note: same key, different body — a client bug, answer 422 instead of guessing
                continue
            replayed += 1  # note: duplicate — return the stored response; the card is not charged again
            response = keys[key][1]
            continue
        ledger.append(f"{key}:{amount}")  # note: the side effect — money actually moves
        response = f"ch_{len(ledger)}"
        if use_key:
            keys[key] = [amount, response]  # note: save key + response in the same transaction as the charge
    charges = len(ledger)  # note: without keys every retry is another charge; with them, one per key
    return [charges, replayed, rejected]
