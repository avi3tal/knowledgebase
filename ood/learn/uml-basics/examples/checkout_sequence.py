"""Worked example: the sequence diagram of a checkout, produced by running the objects.

Each method appends the message it receives to `messages` (one arrow per line), so the list
reads like a sequence diagram. The call stack plays the role of the activation bars.
"""


def checkout(stock: dict[str, int], sku: str, card_ok: bool) -> list[str]:
    messages: list[str] = []

    class Inventory:
        def __init__(self, levels: dict[str, int]) -> None:
            self.levels = levels

        def reserve(self, item: str) -> bool:
            messages.append(f"Checkout → Inventory: reserve({item})")
            if self.levels.get(item, 0) == 0:
                return False  # note: [out of stock] — the alt fragment's first branch returns early
            self.levels[item] -= 1
            return True

        def release(self, item: str) -> None:
            messages.append(f"Checkout → Inventory: release({item})")  # note: compensating message
            self.levels[item] += 1

    class PaymentGateway:
        def charge(self, item: str) -> bool:
            messages.append(f"Checkout → Payment: charge({item})")
            return card_ok

    class Mailer:
        def confirm(self, item: str) -> None:
            messages.append(f"Checkout → Mailer: confirm({item})")  # note: async in real life (open arrow)

    class Checkout:
        def __init__(self, inventory: Inventory, payment: PaymentGateway, mailer: Mailer) -> None:
            self.inventory, self.payment, self.mailer = inventory, payment, mailer

        def place(self, item: str) -> str:
            messages.append(f"User → Checkout: place({item})")  # note: the actor's message starts the sequence
            if not self.inventory.reserve(item):
                return "out of stock"
            if not self.payment.charge(item):
                self.inventory.release(item)  # note: [declined] — the second alt branch
                return "declined"
            self.mailer.confirm(item)
            return "ok"

    shop = Checkout(Inventory(dict(stock)), PaymentGateway(), Mailer())
    outcome = shop.place(sku)
    messages.append(f"Checkout ⇢ User: {outcome}")  # note: the dashed return arrow back to the actor
    return messages
