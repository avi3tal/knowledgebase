"""Signatures for Design a shopping cart with promotions: classes and method signatures only.

Visibility: public names are the API; a leading underscore marks internal state and helpers that
only the class itself may touch (Python's convention for private/protected). Value objects are
frozen dataclasses, so callers can hold them without being able to change the cart.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

Cents = int  # all money is integer cents


def percent_of(amount: Cents, percent: int) -> Cents:
    """percent% of amount, rounded half up to the cent."""
    ...


@dataclass(frozen=True)
class Product:
    sku: str
    name: str
    unit_price_cents: Cents
    category: str = ""


class Promotion(ABC):
    """An item-level pricing rule (Strategy): a pure function of unit price and quantity."""

    @abstractmethod
    def applies_to(self, product: Product) -> bool: ...

    @abstractmethod
    def discount_cents(self, unit_price_cents: Cents, quantity: int) -> Cents: ...


class BuyNGetMFree(Promotion):
    """In every group of buy + free units of one SKU, `free` units cost nothing (2 + 1: buy=2, free=1)."""

    def __init__(self, sku: str, buy: int, free: int) -> None: ...

    def applies_to(self, product: Product) -> bool: ...

    def discount_cents(self, unit_price_cents: Cents, quantity: int) -> Cents: ...


class PercentOff(Promotion):
    """percent% off one SKU or every product in a category."""

    def __init__(self, percent: int, *, sku: str | None = None, category: str | None = None) -> None: ...

    def applies_to(self, product: Product) -> bool: ...

    def discount_cents(self, unit_price_cents: Cents, quantity: int) -> Cents: ...


class CartPromotion(ABC):
    """A cart-level rule applied once to the subtotal after item promotions."""

    @abstractmethod
    def discount_cents(self, subtotal_after_items_cents: Cents) -> Cents: ...


class PercentOffCoupon(CartPromotion):
    def __init__(self, percent: int) -> None: ...

    def discount_cents(self, subtotal_after_items_cents: Cents) -> Cents: ...


class PromotionCatalog:
    """Read-only, shared between carts: which promotions could apply to a product."""

    def __init__(self, promotions: list[Promotion]) -> None: ...

    def for_product(self, product: Product) -> tuple[Promotion, ...]: ...


@dataclass(frozen=True)
class LineView:
    """What callers may see of a line: a snapshot, not the live object."""

    sku: str
    name: str
    quantity: int
    subtotal_cents: Cents
    discount_cents: Cents


@dataclass(frozen=True)
class PriceBreakdown:
    subtotal_cents: Cents
    item_discount_cents: Cents
    coupon_discount_cents: Cents
    total_cents: Cents


class CartLine:
    """Internal to ShoppingCart: one SKU, its quantity and its cached price."""

    def __init__(self, product: Product, promotions: tuple[Promotion, ...]) -> None: ...

    def set_quantity(self, quantity: int) -> None:
        """Re-price this line: subtotal and the best matching promotion's discount."""
        ...

    def view(self) -> LineView: ...


class ItemNotInCartError(KeyError): ...


class ShoppingCart:
    def __init__(self, catalog: PromotionCatalog) -> None: ...

    def add_item(self, product: Product, quantity: int = 1) -> None: ...

    def delete_item(self, sku: str, quantity: int | None = None) -> None: ...

    def get_total_price(self) -> Cents:
        """O(1): running totals minus the coupon."""
        ...

    def get_breakdown(self) -> PriceBreakdown: ...

    def apply_coupon(self, coupon: CartPromotion | None) -> None: ...

    def lines(self) -> tuple[LineView, ...]: ...

    def _reprice(self, line: CartLine, quantity: int) -> None:
        """The only place running totals change: subtract the line's old values, re-price, add the new."""
        ...
