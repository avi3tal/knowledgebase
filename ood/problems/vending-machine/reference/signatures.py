"""Signatures for Design a vending machine: classes, interfaces and method signatures only."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class Coin(Enum):
    NICKEL = 5
    DIME = 10
    QUARTER = 25
    DOLLAR = 100
    FIVE_DOLLARS = 500


@dataclass(frozen=True)
class Product:
    name: str
    price_cents: int


@dataclass
class Slot:
    code: str
    product: Product
    quantity: int


@dataclass
class Sale:
    product: Product
    change: list[Coin]


class Inventory:
    def slot(self, code: str) -> Slot: ...

    def in_stock(self, code: str) -> bool: ...

    def take_one(self, code: str) -> Product: ...

    def restock(self, code: str, quantity: int) -> None: ...


class CoinBox:
    def add(self, coins: list[Coin]) -> None: ...

    def remove(self, coins: list[Coin]) -> None: ...

    def counts(self) -> dict[Coin, int]: ...


class ChangeMaker:
    """Greedy first, bounded search over the coin box as a fallback."""

    def make_change(self, amount_cents: int, available: dict[Coin, int]) -> list[Coin] | None:
        """None when exact change is impossible."""
        ...


class MachineState(ABC):
    """One implementation per mode; each event may set machine.state to the next state."""

    @abstractmethod
    def insert_money(self, machine: VendingMachine, coin: Coin) -> int: ...

    @abstractmethod
    def select_product(self, machine: VendingMachine, code: str) -> Sale: ...

    @abstractmethod
    def cancel(self, machine: VendingMachine) -> list[Coin]: ...


class IdleState(MachineState):
    def insert_money(self, machine: VendingMachine, coin: Coin) -> int: ...

    def select_product(self, machine: VendingMachine, code: str) -> Sale: ...

    def cancel(self, machine: VendingMachine) -> list[Coin]: ...


class HasMoneyState(MachineState):
    def insert_money(self, machine: VendingMachine, coin: Coin) -> int: ...

    def select_product(self, machine: VendingMachine, code: str) -> Sale: ...

    def cancel(self, machine: VendingMachine) -> list[Coin]: ...


class DispensingState(MachineState):
    def insert_money(self, machine: VendingMachine, coin: Coin) -> int: ...

    def select_product(self, machine: VendingMachine, code: str) -> Sale: ...

    def cancel(self, machine: VendingMachine) -> list[Coin]: ...


class MaintenanceState(MachineState):
    def insert_money(self, machine: VendingMachine, coin: Coin) -> int: ...

    def select_product(self, machine: VendingMachine, code: str) -> Sale: ...

    def cancel(self, machine: VendingMachine) -> list[Coin]: ...


class SoldOutError(Exception): ...


class InsufficientFundsError(Exception): ...


class NoExactChangeError(Exception): ...


class VendingMachine:
    """The context: holds the current state and delegates every customer event to it."""

    state: MachineState
    balance_cents: int

    def __init__(self, inventory: Inventory, coin_box: CoinBox, change_maker: ChangeMaker) -> None: ...

    def insert_money(self, coin: Coin) -> int: ...

    def select_product(self, code: str) -> Sale: ...

    def cancel(self) -> list[Coin]: ...

    def enter_maintenance(self) -> None: ...

    def exit_maintenance(self) -> None: ...

    def restock(self, code: str, quantity: int) -> None: ...
