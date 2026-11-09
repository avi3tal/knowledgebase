# Reference walkthrough: shopping cart with promotions

*Spoiler: one good answer, not the only one. Section 8 compares the common alternatives.*

## What makes it distinctive
It looks like a CRUD exercise, but it tests three things at once:
- **Pricing rules that vary.** This is a textbook Strategy.
- **Exact money.** Integer cents and one rounding rule.
- **Where the work happens.** Reads are constant time, so the total is maintained when the cart changes,
  not recomputed on every read.

Getting the edges of "buy 2, get 1 free" right is what separates a correct answer from a plausible one.

## 1. Scope and assumptions
| id | requirement |
|---|---|
| F1 | `add_item(product, quantity=1)`: adding a SKU that's already there increases its quantity |
| F2 | `delete_item(sku, quantity=None)`: remove the line, or some units; more than held empties it; unknown SKU raises |
| F3 | `get_total_price()` after promotions, plus `get_breakdown()` |
| F4 | **Buy X, get Y free** on a SKU: in every group of X + Y units, Y are free (2 + 1, and BOGO = 1 + 1) |
| F5 | **Percentage off** a SKU or a category; optional cart-level percentage coupon |
| N1 | Reading the total is **O(1)** |
| N2 | A new promotion type is a new class; the cart isn't edited |
| N3 | Lines and totals are internal; callers get read-only values |

**Assumptions.** Say these out loud, because they change the code:
- Money is **integer cents**.
- Percentages round **half up**: once per line, and once for the coupon.
- **At most one item promotion per line**: the best one for the current quantity. Then one cart coupon.
- The unit price is snapshotted on the first add.
- One shopper edits a cart at a time.

**Out of scope:** tax, shipping, stock, payment, multi-currency. Designed for but not built:
fixed-amount coupons and buy-A-get-B bundles.

## 2. The objects and their visibility
UML visibility: `+` public, `-` private (internal), `#` protected. In Python, a leading underscore
marks internal state, and frozen dataclasses make values safe to hand out.

| class | role | public (+) | internal (−) |
|---|---|---|---|
| `Product` | immutable value: sku, name, unit price, category | all fields (read-only, frozen) | — |
| `Promotion` (interface) | item-level pricing rule | `targets()`, `discount_cents(unit_price, qty)` | — |
| `BuyXGetYPromotion` | buy X get Y free; `bogo(sku)` builds the 1 + 1 case | the interface, `bogo()` | `_sku`, `_buy`, `_free` |
| `PercentOffPromotion` | percent off one SKU or a category | the interface | `_percent`, `_target` |
| `PromotionCatalog` | shared index: which rules target a product | `for_product(product)` | `_by_target` |
| `CartPromotion` / `PercentOffCoupon` | cart-level rule on the discounted subtotal | `discount_cents(subtotal)` | `_percent` |
| `_CartLine` | one SKU in one cart with its **cached** price | used only by the cart | `quantity`, `subtotal_cents`, `discount_cents`, `_promotions` |
| `ShoppingCart` | the aggregate root | `add_item`, `delete_item`, `get_total_price`, `get_breakdown`, `apply_coupon`, `lines()` | `_lines`, `_subtotal_cents`, `_item_discount_cents`, `_coupon`, `_reprice()` |
| `LineView`, `PriceBreakdown` | snapshots for callers (frozen) | all fields (read-only) | — |

Why it matters: the running totals are only correct if **nothing but the cart** changes a line.
`lines()` returns a tuple of `LineView` snapshots, never the live `_CartLine` objects.

> [!NOTE] On names
> `BOGOPromotion` is a fine name only if the rule is always buy one, get one. The requirement here is
> the general *buy X get Y* (2 + 1 in the prompt), so the class is `BuyXGetYPromotion`, and BOGO is
> the named case `BuyXGetYPromotion.bogo(sku)`. Ending every rule in `…Promotion` keeps the family
> easy to scan.

## 3. Class diagram
**v1** gets ownership right (cart → items → products). But it keeps a `DiscountType` on each item,
loops with an `if/elif` per type inside `get_total_price`, and recomputes everything on every read.

```diagram
v1
```

**v2** applies **Strategy**:
- `Promotion` is the contract, and `BuyXGetYPromotion` and `PercentOffPromotion` implement it.
- `PromotionCatalog` says which promotions apply to a product.
- Each line asks its promotions for a discount.

A third promotion is a new class; nothing else changes.

```diagram
v2
```

**v3** makes reads O(1) and adds the cart-level coupon as a second strategy (`CartPromotion`). Reads
return an immutable `PriceBreakdown`.

```diagram
v3
```

## 4. Design patterns, and why each one is here
| pattern | where | why |
|---|---|---|
| Strategy | `Promotion` → `BuyXGetYPromotion`, `PercentOffPromotion`; `CartPromotion` → `PercentOffCoupon` | Pricing rules vary independently of the cart (open/closed: a new rule is a new class) |
| Factory method | `BuyXGetYPromotion.bogo(sku)` | A named, intention-revealing constructor for a common configuration |
| Index (lookup table) | `PromotionCatalog._by_target` | Resolves the rules for a product in O(k) instead of scanning every promotion |
| Aggregate root / Facade | `ShoppingCart` | The only entry point that changes lines, so the cached totals can't drift |
| Value object | `Product`, `LineView`, `PriceBreakdown` (frozen) | Safe to share and hand out; equality by value |
| Cache + single writer | `_CartLine` cached price, `ShoppingCart._reprice` | Maintains derived state incrementally; one method owns every update |

## 5. The rules, precisely
**Buy X, get Y free**, for quantity q:

```text
group      = X + Y
free_units = (q // group) * Y + max(0, q % group - X)
discount   = free_units * unit_price
```

The second term matters when Y > 1. With *buy 3, get 2*, 4 units give 1 free (the 4th) and 5 give 2.
BOGO is X = Y = 1, so q units give q // 2 free.

| 2 + 1 at 1.00 | q=1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| free units | 0 | 0 | 1 | 1 | 1 | 2 | 2 |
| you pay | 1.00 | 2.00 | 2.00 | 3.00 | 4.00 | 4.00 | 5.00 |

**Percentage off:** `discount = (subtotal * percent + 50) // 100` (half up, integers only).
10% of 3.33 → 33¢; 10% of 3.35 → 34¢ (33.5 rounds up).

**Order of application:** each line takes its single best item promotion, then the coupon applies
once to the sum. The total never goes below zero.

## 6. Data structures and the hot path
| data | structure | operation it makes cheap |
|---|---|---|
| cart lines | `dict[sku → _CartLine]` (insertion-ordered) | find/merge a SKU on add/delete in O(1); stable display order |
| promotion lookup | `dict[target key → list[Promotion]]` in the catalog, keys `sku:…` / `category:…` | rules for a product in O(k), k = matching rules |
| line price | cached `subtotal_cents`, `discount_cents` on each line | re-price one line, not the cart |
| cart totals | two running sums, `_subtotal_cents` and `_item_discount_cents` | `get_total_price()` in O(1) |

Every change goes through one private method that moves only the delta of the line that changed:

```python
def _reprice(self, line: _CartLine, quantity: int) -> None:
    """The only place the running sums change: take the line's old price out, re-price, add it back."""
    self._subtotal_cents -= line.subtotal_cents
    self._item_discount_cents -= line.discount_cents
    line.set_quantity(quantity)  # best of this line's k promotions at the new quantity
    self._subtotal_cents += line.subtotal_cents
    self._item_discount_cents += line.discount_cents
```

| operation | cost | why |
|---|---|---|
| `add_item` / `delete_item` | O(k) | dict lookup by SKU is O(1); re-pricing one line asks its k promotions (usually 0–2) |
| first add of a SKU | O(k) | one catalog index lookup, cached on the line |
| `get_total_price` / `get_breakdown` | **O(1)** | two running sums and one coupon calculation |
| `lines()` | O(n) | builds read-only snapshots; only the cart page needs it |

**Alternatives for the read path:**

| approach | write | read | when to pick it |
|---|---|---|---|
| Recompute on every read | O(1) | O(n · k) | tiny carts, rules that depend on the whole cart, simplest to get right |
| **Incremental running sums (chosen)** | O(k) | O(1) | the total is read on every page, the cart changes a few times |
| Lazy dirty flag (recompute on the next read after a change) | O(1) | O(n · k) once, then O(1) | bursts of edits between reads, e.g. a bulk import |

The risk of caching is **drift**. The property test in section 9 rules it out by comparing the running
total with a full recompute after thousands of random edits.

## 7. The code
This is the reference implementation, in three parts, all checked by the tests in section 9.

**Money and the item promotions (Strategy).**

```python title="cart.py — promotions"
from __future__ import annotations

from abc import ABC, abstractmethod
from collections import defaultdict
from dataclasses import dataclass

Cents = int  # all money is integer cents: no float rounding drift


def percent_of(amount: Cents, percent: int) -> Cents:
    """percent% of amount, rounded half up to the cent (integer arithmetic only)."""
    return (amount * percent + 50) // 100


@dataclass(frozen=True)
class Product:
    sku: str
    name: str
    unit_price_cents: Cents
    category: str = ""


class Promotion(ABC):
    """An item-level pricing rule: a pure function of (unit price, quantity) for the products it targets."""

    @abstractmethod
    def targets(self) -> tuple[str, ...]:
        """Index keys this rule applies to: "sku:<sku>" and/or "category:<name>"."""

    @abstractmethod
    def discount_cents(self, unit_price_cents: Cents, quantity: int) -> Cents: ...


class BuyXGetYPromotion(Promotion):
    """Buy `buy`, get `free` of the same SKU free, repeating: 2 + 1 is buy=2, free=1."""

    def __init__(self, sku: str, buy: int, free: int) -> None:
        if buy < 1 or free < 1:
            raise ValueError("buy and free must be at least 1")
        self._sku, self._buy, self._free = sku, buy, free

    @classmethod
    def bogo(cls, sku: str) -> BuyXGetYPromotion:
        """Buy one, get one free: the 1 + 1 special case."""
        return cls(sku, buy=1, free=1)

    def targets(self) -> tuple[str, ...]:
        return (f"sku:{self._sku}",)

    def discount_cents(self, unit_price_cents: Cents, quantity: int) -> Cents:
        group = self._buy + self._free
        full_groups, rest = divmod(quantity, group)
        # leftovers past `buy` in an unfinished group are free too (buy 3 get 2: the 4th unit)
        free_units = full_groups * self._free + max(0, rest - self._buy)
        return free_units * unit_price_cents


class PercentOffPromotion(Promotion):
    """percent% off every unit of one SKU or of a whole category."""

    def __init__(self, percent: int, *, sku: str | None = None, category: str | None = None) -> None:
        if not 0 < percent <= 100:
            raise ValueError("percent must be in (0, 100]")
        if (sku is None) == (category is None):
            raise ValueError("give exactly one of sku or category")
        self._percent = percent
        self._target = f"sku:{sku}" if sku is not None else f"category:{category}"

    def targets(self) -> tuple[str, ...]:
        return (self._target,)

    def discount_cents(self, unit_price_cents: Cents, quantity: int) -> Cents:
        return percent_of(unit_price_cents * quantity, self._percent)


class PromotionCatalog:
    """Shared, read-only index: target key → promotions, so a lookup costs O(k), not O(all promotions)."""

    def __init__(self, promotions: list[Promotion]) -> None:
        self._by_target: dict[str, list[Promotion]] = defaultdict(list)
        for promo in promotions:
            for key in promo.targets():
                self._by_target[key].append(promo)

    def for_product(self, product: Product) -> tuple[Promotion, ...]:
        keys = [f"sku:{product.sku}"] + ([f"category:{product.category}"] if product.category else [])
        return tuple(p for key in keys for p in self._by_target.get(key, ()))
```

**The catalog index, the cart-level coupon and the read-only values.**

```python title="cart.py — catalog, coupon, values"
class CartPromotion(ABC):
    @abstractmethod
    def discount_cents(self, subtotal_after_items_cents: Cents) -> Cents: ...


class PercentOffCoupon(CartPromotion):
    def __init__(self, percent: int) -> None:
        if not 0 < percent <= 100:
            raise ValueError("percent must be in (0, 100]")
        self._percent = percent

    def discount_cents(self, subtotal_after_items_cents: Cents) -> Cents:
        return percent_of(subtotal_after_items_cents, self._percent)


# ---------------------------------------------------------------- read-only values handed to callers


@dataclass(frozen=True)
class LineView:
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
```

**The aggregate.** Every change funnels through `_reprice`, and reads never iterate.

```python title="cart.py — cart"
class _CartLine:
    """Internal: one SKU in one cart, with its price cached at the current quantity."""

    def __init__(self, product: Product, promotions: tuple[Promotion, ...]) -> None:
        self.product = product
        self._promotions = promotions  # resolved once, when the SKU enters the cart
        self.quantity = 0
        self.subtotal_cents: Cents = 0
        self.discount_cents: Cents = 0

    def set_quantity(self, quantity: int) -> None:
        unit = self.product.unit_price_cents
        self.quantity = quantity
        self.subtotal_cents = unit * quantity
        # best single promotion for this quantity (the stacking rule); O(k), k = matching promotions
        self.discount_cents = max((p.discount_cents(unit, quantity) for p in self._promotions), default=0)

    def view(self) -> LineView:
        p = self.product
        return LineView(p.sku, p.name, self.quantity, self.subtotal_cents, self.discount_cents)


class ItemNotInCartError(KeyError):
    pass


class ShoppingCart:
    def __init__(self, catalog: PromotionCatalog) -> None:
        self._catalog = catalog
        self._lines: dict[str, _CartLine] = {}  # sku → line; insertion order = display order
        self._subtotal_cents: Cents = 0  # running sums, kept equal to the sum over _lines
        self._item_discount_cents: Cents = 0
        self._coupon: CartPromotion | None = None

    def add_item(self, product: Product, quantity: int = 1) -> None:
        if quantity < 1:
            raise ValueError("quantity must be at least 1")
        line = self._lines.get(product.sku)
        if line is None:
            line = self._lines[product.sku] = _CartLine(product, self._catalog.for_product(product))
        self._reprice(line, line.quantity + quantity)

    def delete_item(self, sku: str, quantity: int | None = None) -> None:
        """Remove the line (quantity=None) or some units; removing more than held empties the line."""
        line = self._lines.get(sku)
        if line is None:
            raise ItemNotInCartError(sku)
        if quantity is not None and quantity < 1:
            raise ValueError("quantity must be at least 1")
        left = 0 if quantity is None else max(0, line.quantity - quantity)
        self._reprice(line, left)
        if left == 0:
            del self._lines[sku]

    def apply_coupon(self, coupon: CartPromotion | None) -> None:
        self._coupon = coupon

    def get_total_price(self) -> Cents:
        """O(1): two running sums and one coupon calculation."""
        return self.get_breakdown().total_cents

    def get_breakdown(self) -> PriceBreakdown:
        after_items = self._subtotal_cents - self._item_discount_cents
        coupon = self._coupon.discount_cents(after_items) if self._coupon else 0
        total = max(0, after_items - coupon)
        return PriceBreakdown(self._subtotal_cents, self._item_discount_cents, coupon, total)

    def lines(self) -> tuple[LineView, ...]:
        return tuple(line.view() for line in self._lines.values())

    def _reprice(self, line: _CartLine, quantity: int) -> None:
        """The only place the running sums change: take the line's old price out, re-price, add it back."""
        self._subtotal_cents -= line.subtotal_cents
        self._item_discount_cents -= line.discount_cents
        line.set_quantity(quantity)
        self._subtotal_cents += line.subtotal_cents
        self._item_discount_cents += line.discount_cents
```

## 8. Alternatives for modelling promotions
The chosen design (Strategy + a catalog index + best single promotion per line) is the usual
interview answer. These are the alternatives worth naming, and when each one wins.

| approach | sketch | strengths | weaknesses |
|---|---|---|---|
| Enum + `if/elif` (v1) | `DiscountType.BUY_X_GET_Y` on the item, a branch per type in the total | Smallest code; fine for a script | Every new rule edits the cart (breaks open/closed); hard to test rules alone |
| **Strategy, looked up by a catalog** (chosen) | `Promotion` classes; the catalog maps targets → rules | New rule = new class; rules are pure and unit-testable; several rules per product, best one wins | One more object (the catalog) to explain |
| Strategy bound to the product + Null Object | `product.promotion: ItemPromotion = NoPromotion()` | O(1) lookup with no catalog; `NoPromotion` removes `None` checks | One rule per product; a marketing change edits product data; category-wide deals need copying to every product |
| Condition + Benefit (Specification + Strategy) | `Rule(when=Category("dairy") & MinQty(2), then=PercentOff(10))` | Mix-and-match targeting; rules can live in config and be built by a factory | More types; overkill for two rules |
| Data-driven rules (a tiny rule engine) | JSON `{"type": "buy_x_get_y", "sku": "apple", "buy": 2, "free": 1}` → factory → Strategy objects | Marketing can add deals without a deploy; easy A/B tests | Validation, versioning and debugging move into the data |
| Decorator chain | `PercentOff(BuyXGetY(BasePrice()))` wraps a price function | Natural when deals **stack** in a fixed order | Order-sensitive; "best of" is awkward to express |
| Pipeline / Chain of Responsibility at cart level | `[BundleRule, LineRules, Coupon]`, each adjusting the breakdown | Rules that see several lines (buy A get B, cheapest-item-free) | Reads become O(n) unless each rule keeps its own incremental state |

The **Strategy bound to the product** variant is a perfectly good first answer in an interview, and
the Null Object keeps it clean:

```python
class NoPromotion(Promotion):
    """Null Object: a product without a deal still has a promotion, so callers never check for None."""

    def targets(self) -> tuple[str, ...]:
        return ()

    def discount_cents(self, unit_price_cents: Cents, quantity: int) -> Cents:
        return 0
```

Move to the catalog as soon as a product can have more than one deal, or deals target categories.

**Stacking policies.** Decide one and write it in the assumptions:

| policy | rule | trade-off |
|---|---|---|
| **Best single promotion per line** (chosen) | `max(discounts)` | Predictable for shoppers, never over-discounts; ignores combinable deals |
| Stack all, in a fixed order | apply each rule to the price left by the previous one | Generous; order changes the result, so the order is policy |
| Exclusive groups with priority | at most one rule per group, groups stack | What real shops do; needs a `group`/`priority` on each rule (a `StackingPolicy` object) |

**Money.** Floats (`0.10 * price`) accumulate binary rounding error, e.g. `3 * 0.1 != 0.3`. Use
integer cents (as here), or `Decimal` with an explicit rounding mode. Store percentages as integers
(`10` for 10%) and round once per line.

## 9. Testing
**Fixtures:**
- apple at 1.00 with **2 + 1**;
- milk at 2.50, in *dairy*, with **10% off dairy**;
- bread at 3.00, with no promotion.

| # | case | steps | expected total |
|---|---|---|---|
| 1 | empty cart | — | 0.00 |
| 2 | no promotion | add bread | 3.00 |
| 3 | below the threshold | add 2 apples | 2.00 |
| 4 | exactly X + Y | add 3 apples | 2.00 |
| 5 | one past a group | add 4 apples | 3.00 |
| 6 | two groups | add 6 apples | 4.00 |
| 7 | added one at a time | add apple ×3 separately | 2.00 (same as #4) |
| 8 | percentage | add 3 milk (7.50) | 6.75 |
| 9 | rounding down | 10% off a 3.33 item | 3.00 |
| 10 | rounding half up | 10% off a 3.35 item | 3.01 |
| 11 | partial delete | 6 apples, delete 2 | 3.00 |
| 12 | delete the line | 3 apples + bread, delete apple | 3.00 |
| 13 | delete more than held | 2 apples, delete 5 | 0.00 (line gone) |
| 14 | unknown SKU | delete "nope" | raises `ItemNotInCartError` |
| 15 | invalid quantity | add apple ×0 | raises `ValueError` |
| 16 | cart coupon | bread + 3 milk, 10% coupon | 8.77 (10.50 − 0.75 − 0.98) |
| 17 | best promotion wins | apple with 20% off **and** 2 + 1: 2 apples / 3 apples | 1.60 / 2.00 |
| 18 | Y > 1 | *buy 3 get 2*: 4 / 5 / 10 units | 3.00 / 3.00 / 6.00 |
| 19 | BOGO | `bogo("apple")`: 1 / 2 / 3 / 4 units | 1.00 / 1.00 / 2.00 / 2.00 |
| 20 | catalog index | milk matches the dairy rule; bread matches none | 1 rule / no rules |
| 21 | ambiguous target | `PercentOffPromotion(10)` with no target, or with both | raises `ValueError` |
| 22 | property test | 2 000 random adds/deletes | after each step, running total == full recompute |

Also unit-test each promotion **alone**: it's a pure function of price and quantity. And test that
`lines()` can't be used to change the cart, because its values are frozen.

## 10. Pitfalls and extensions
- **Floats for money.** Use integer cents (or `Decimal`) and one rounding rule (section 8).
- **Applying the deal per `add_item` call** instead of to the line's total quantity. Adding apples
  one at a time must give the same total as adding three at once (test #7).
- **Stacking by accident.** Decide the rule (best single item promotion, then the coupon) and write
  it in the assumptions.
- **Leaking internals.** Returning the live line dict lets callers change quantities without
  updating the totals.
- **Scanning every promotion for every add.** Index the catalog by target (section 6).
- **Extending:**
  - A fixed-amount coupon is another `CartPromotion`.
  - *Buy A, get B* needs a rule that sees two lines, so it becomes a cart-level rule in a pipeline.
  - Combinable deals become a `StackingPolicy` object, not more `if`s in the cart.

## Transferable pattern
**Pricing rules as strategies, plus incremental aggregates.**
- Each rule is a pure function behind one interface.
- An index finds the rules that apply to an item.
- The aggregate keeps running totals, updated by the delta of the one item that changed, so reads
  are O(1).

The same shape fits fee calculators, tax rules, shipping rates, loyalty points and scoring engines.

## Learn more
- [Behavioral patterns: Strategy, State, Observer](#/learn/ood/behavioral-patterns)
- [SOLID: the open/closed principle](#/learn/ood/solid)
- [OOP basics: encapsulation and visibility](#/learn/ood/oop-basics)
- [UML class diagrams: visibility and relationships](#/learn/ood/uml-basics)
- [Creational patterns: factories for rules built from configuration](#/learn/ood/creational-patterns)
- [The OOD interview flow](#/learn/ood/ood-framework)
