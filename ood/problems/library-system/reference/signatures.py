"""Signatures for Design a library management system: classes, interfaces and method signatures only."""

from __future__ import annotations

import datetime as dt
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum


class CopyStatus(Enum):
    AVAILABLE = "available"
    ON_LOAN = "on_loan"
    ON_HOLD = "on_hold"
    LOST = "lost"


class SearchField(Enum):
    TITLE = "title"
    AUTHOR = "author"
    SUBJECT = "subject"


@dataclass
class Book:
    """A title in the catalogue (not something you can hold)."""

    isbn: str
    title: str
    authors: list[str]
    subjects: list[str]


@dataclass
class BookCopy:
    """A physical item on a shelf, identified by barcode."""

    barcode: str
    book: Book
    status: CopyStatus = CopyStatus.AVAILABLE

    def try_claim(self, expected: CopyStatus, new: CopyStatus) -> bool:
        """Compare-and-set on status; False if someone else changed it first."""
        ...


@dataclass
class Member:
    member_id: str
    name: str
    active_loans: list[Loan] = field(default_factory=list)
    fines_owed_cents: int = 0

    def can_borrow(self, limit: int) -> bool: ...


@dataclass
class Loan:
    loan_id: str
    member: Member
    copy: BookCopy
    borrowed_at: dt.date
    due_at: dt.date
    returned_at: dt.date | None = None
    renewals: int = 0

    def days_overdue(self, today: dt.date) -> int: ...


@dataclass
class Reservation:
    member: Member
    book: Book
    created_at: dt.datetime
    ready_until: dt.date | None = None


class FinePolicy(ABC):
    @abstractmethod
    def fine_cents(self, loan: Loan, returned_on: dt.date) -> int: ...


class PerDayFine(FinePolicy):
    def __init__(self, cents_per_day: int, cap_cents: int | None = None) -> None: ...

    def fine_cents(self, loan: Loan, returned_on: dt.date) -> int: ...


class Notifier(ABC):
    @abstractmethod
    def notify(self, member: Member, message: str) -> None: ...


class EmailNotifier(Notifier):
    def notify(self, member: Member, message: str) -> None: ...


class ReservationQueue:
    """Observer of CopyAvailable events; FIFO per title."""

    def __init__(self, notifier: Notifier) -> None: ...

    def reserve(self, member: Member, book: Book) -> Reservation: ...

    def has_waiting(self, book: Book) -> bool: ...

    def on_copy_available(self, copy: BookCopy) -> None:
        """Put the copy ON_HOLD for the first member and notify them."""
        ...


class Catalog:
    def add(self, book: Book, copies: list[BookCopy]) -> None: ...

    def search(self, query: str, by: SearchField) -> list[Book]: ...

    def available_copies(self, book: Book) -> list[BookCopy]: ...


class Library:
    """Lending service used by desks and the returns slot."""

    max_active_loans: int = 5
    loan_days: int = 14

    def __init__(self, catalog: Catalog, reservations: ReservationQueue, fine_policy: FinePolicy) -> None: ...

    def checkout(self, member_id: str, barcode: str) -> Loan: ...

    def return_copy(self, barcode: str) -> int:
        """Returns the fine in cents (0 if on time)."""
        ...

    def renew(self, loan_id: str) -> Loan: ...

    def reserve(self, member_id: str, isbn: str) -> Reservation: ...

    def add_member(self, name: str) -> Member: ...
