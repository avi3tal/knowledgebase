"""Signatures for Design a parking lot: classes, interfaces and method signatures only."""

from __future__ import annotations

import datetime as dt
import threading
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class SpotSize(Enum):
    SMALL = 1
    REGULAR = 2
    LARGE = 3


class Vehicle(ABC):
    """A vehicle knows the smallest space it needs."""

    def __init__(self, plate: str) -> None: ...

    @abstractmethod
    def size(self) -> SpotSize: ...


class Motorcycle(Vehicle):
    def size(self) -> SpotSize: ...


class Car(Vehicle):
    def size(self) -> SpotSize: ...


class Truck(Vehicle):
    def size(self) -> SpotSize: ...


class ParkingSpot:
    """One space. It alone knows whether it is free."""

    def __init__(self, spot_id: str, level: int, size: SpotSize) -> None: ...

    def can_fit(self, vehicle: Vehicle) -> bool: ...

    def assign(self, vehicle: Vehicle) -> None:
        """Raises SpotTakenError if already occupied."""
        ...

    def release(self) -> Vehicle: ...


class Level:
    """Keeps free spots per size so allocation is O(1)."""

    def __init__(self, number: int, spots: list[ParkingSpot]) -> None: ...

    def free_spots(self, size: SpotSize) -> list[ParkingSpot]: ...

    def free_count(self) -> dict[SpotSize, int]: ...


@dataclass
class Ticket:
    ticket_id: str
    vehicle: Vehicle
    spot: ParkingSpot
    entered_at: dt.datetime
    exited_at: dt.datetime | None = None
    fee_cents: int | None = None


@dataclass
class Receipt:
    ticket_id: str
    fee_cents: int
    paid_at: dt.datetime


class Payment(ABC):
    @abstractmethod
    def charge(self, amount_cents: int) -> bool: ...


class SpotAllocationStrategy(ABC):
    @abstractmethod
    def choose(self, levels: list[Level], vehicle: Vehicle) -> ParkingSpot | None: ...


class BestFitAllocation(SpotAllocationStrategy):
    """Smallest size that fits, lowest level first."""

    def choose(self, levels: list[Level], vehicle: Vehicle) -> ParkingSpot | None: ...


class PricingStrategy(ABC):
    @abstractmethod
    def fee_cents(self, ticket: Ticket, now: dt.datetime) -> int: ...


class HourlyPricing(PricingStrategy):
    def __init__(self, rate_cents_per_hour: dict[SpotSize, int]) -> None: ...

    def fee_cents(self, ticket: Ticket, now: dt.datetime) -> int: ...


class LotFullError(Exception): ...


class ParkingLot:
    """Facade used by entry and exit gates; safe to call from several gates at once."""

    def __init__(
        self,
        levels: list[Level],
        allocation: SpotAllocationStrategy,
        pricing: PricingStrategy,
    ) -> None:
        self._lock: threading.Lock
        ...

    def park(self, vehicle: Vehicle) -> Ticket:
        """Choose and claim a space atomically; raises LotFullError."""
        ...

    def unpark(self, ticket: Ticket, payment: Payment) -> Receipt: ...

    def free_spots(self) -> dict[SpotSize, int]: ...
