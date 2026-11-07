"""Worked example (polymorphism): one loop pays three kinds of workers.

The loop calls `pay()` and never asks which class it is talking to; each subclass encapsulates
its own rule and data.
"""


def run_payroll(staff: list[list]) -> list[str]:
    class Worker:
        def __init__(self, name: str) -> None:
            self.name = name

        def pay(self) -> int:
            raise NotImplementedError  # note: abstract — every concrete worker must supply its own rule

        def __repr__(self) -> str:
            return self.name

    class Salaried(Worker):
        def __init__(self, name: str, monthly: int) -> None:
            super().__init__(name)
            self._monthly = monthly  # note: encapsulated data: only Salaried knows it has a monthly figure

        def pay(self) -> int:
            return self._monthly  # note: Salaried rule — same amount every month

    class Hourly(Worker):
        def __init__(self, name: str, hours: int, rate: int) -> None:
            super().__init__(name)
            self._hours, self._rate = hours, rate

        def pay(self) -> int:
            overtime = max(0, self._hours - 160)
            regular = (self._hours - overtime) * self._rate
            return regular + overtime * self._rate * 3 // 2  # note: Hourly rule — overtime past 160h pays 1.5×

    class Contractor(Worker):
        def __init__(self, name: str, invoice: int) -> None:
            super().__init__(name)
            self._invoice = invoice

        def pay(self) -> int:
            return self._invoice  # note: Contractor rule — pays the invoice as sent

    kinds = {"salaried": Salaried, "hourly": Hourly, "contractor": Contractor}
    team: list[Worker] = [kinds[kind](*args) for kind, *args in staff]
    total = 0
    payslips: list[str] = []
    for worker in team:
        amount = worker.pay()  # note: polymorphic call — the loop doesn't know (or check) the concrete class
        total += amount
        payslips.append(f"{worker}: {amount}")
    payslips.append(f"total: {total}")
    return payslips
