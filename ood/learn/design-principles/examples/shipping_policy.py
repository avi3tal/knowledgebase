"""Worked example (composition over inheritance): swap a shipping policy at runtime.

`Shipper` HAS-A policy instead of being a `WeightShipper` / `FlatShipper` subclass, so the rule
can change between two quotes without creating a new Shipper.
"""


def shipping_quotes(events: list[list]) -> list[str]:
    class Policy:
        name = "?"

        def cost(self, kg: int) -> int:
            raise NotImplementedError

        def __repr__(self) -> str:
            return self.name

    class ByWeight(Policy):
        name = "by-weight"

        def cost(self, kg: int) -> int:
            return 4 + 2 * kg  # note: by-weight rule: base fee plus 2 per kg

    class Flat(Policy):
        name = "flat"

        def cost(self, kg: int) -> int:
            return 10  # note: flat rule ignores the weight

    class FreeOverFive(Policy):
        name = "free-over-5"

        def cost(self, kg: int) -> int:
            return 0 if kg >= 5 else 7  # note: promo rule: free from 5 kg, otherwise 7

    class Shipper:
        def __init__(self, policy: Policy) -> None:
            self.policy = policy  # note: composition — the shipper holds a policy object

        def quote(self, kg: int) -> int:
            return self.policy.cost(kg)  # note: delegate; Shipper never checks which policy it holds

    policies = {"by-weight": ByWeight(), "flat": Flat(), "free-over-5": FreeOverFive()}
    shipper = Shipper(policies["by-weight"])
    policy = shipper.policy.name
    quotes: list[str] = []
    for verb, arg in events:
        if verb == "use":
            shipper.policy = policies[arg]  # note: swap the strategy at runtime — no new Shipper, no subclass
            policy = arg
        else:
            kg = arg
            price = shipper.quote(kg)
            quotes.append(f"{kg}kg {policy} = {price}")
    return quotes
