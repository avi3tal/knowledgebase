"""Signatures for Design an elevator system: classes, interfaces and method signatures only."""

from __future__ import annotations

import datetime as dt
import threading
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class Direction(Enum):
    UP = "up"
    DOWN = "down"
    IDLE = "idle"


class CarState(Enum):
    MOVING = "moving"
    STOPPED = "stopped"
    DOORS_OPEN = "doors_open"
    EMERGENCY = "emergency"
    MAINTENANCE = "maintenance"


class RequestSource(Enum):
    HALL = "hall"
    CAR = "car"


@dataclass(frozen=True)
class Request:
    floor: int
    direction: Direction | None
    source: RequestSource
    created_at: dt.datetime


@dataclass(frozen=True)
class CarSnapshot:
    """Immutable view the dispatcher scores, so it never reads a car mid-update."""

    car_id: int
    current_floor: int
    direction: Direction
    state: CarState
    load_kg: int
    pending_stops: int


class StopList:
    """LOOK ordering: ascending up-stops, descending down-stops."""

    def add(self, floor: int, current_floor: int) -> None: ...

    def next_stop(self, current_floor: int, direction: Direction) -> int | None: ...

    def remove(self, floor: int) -> None: ...

    def is_empty(self) -> bool: ...


class ElevatorCar:
    """Owns its movement loop (one thread per car); add_stop is thread-safe."""

    capacity_kg: int

    def __init__(self, car_id: int, min_floor: int, max_floor: int, capacity_kg: int) -> None:
        self._lock: threading.Lock
        self._stops: StopList
        ...

    def select_floor(self, floor: int) -> None:
        """Car call from the inside panel."""
        ...

    def add_stop(self, floor: int) -> None:
        """Called by the controller for an assigned hall call."""
        ...

    def snapshot(self) -> CarSnapshot: ...

    def step(self) -> None:
        """One tick of the car loop: move one floor, or stop and open the doors."""
        ...

    def open_doors(self) -> None: ...

    def close_doors(self) -> None: ...

    def emergency_stop(self) -> None: ...

    def is_overloaded(self) -> bool: ...


class DispatchStrategy(ABC):
    @abstractmethod
    def choose_car(self, request: Request, cars: list[CarSnapshot]) -> int:
        """Return the id of the car that should serve a hall call."""
        ...


class NearestCarStrategy(DispatchStrategy):
    """Distance score; cars heading toward the caller win, full or out-of-service cars are skipped."""

    def choose_car(self, request: Request, cars: list[CarSnapshot]) -> int: ...


class RushHourStrategy(DispatchStrategy):
    """Like nearest, but idle cars return to the lobby."""

    def choose_car(self, request: Request, cars: list[CarSnapshot]) -> int: ...


class ElevatorController:
    """Single entry point for hall calls; never moves a car itself."""

    def __init__(self, cars: list[ElevatorCar], strategy: DispatchStrategy) -> None: ...

    def request_elevator(self, floor: int, direction: Direction) -> int:
        """Hall call; returns the assigned car id."""
        ...

    def set_strategy(self, strategy: DispatchStrategy) -> None: ...

    def reassign(self, car_id: int) -> None:
        """Hand a failed car's hall calls to other cars."""
        ...
