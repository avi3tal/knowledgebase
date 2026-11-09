# Reference walkthrough: shopping cart with promotions

*Spoiler: one good answer, not the only one.*

## What makes it distinctive
It looks like a CRUD exercise, but it tests three things at once: **pricing rules that vary**
(a textbook Strategy), **exact money** (integer cents and one rounding rule) and **where the work
happens** (reads are constant, so the total is maintained when the cart changes, not recomputed).
Getting the edges of "buy 2, get 1 free" right is what separates a correct answer from a plausible one.

## 1. Scope and assumptions
| id | requirement |
|---|---|
| F1 | `add_item(product, quantity=1)`: adding a SKU that's already there increases its quantity |
| F2 | `delete_item(sku, quantity=None)`: remove the line, or some units; more than held empties it; unknown SKU raises |
| F3 | `get_total_price()` after promotions, plus `get_breakdown()` |
| F4 | **Buy N, get M free** on a SKU: in every group of N + M units, M are free |
| F5 | **Percentage off** a SKU or a category; optional cart-level percentage coupon |
| N1 | Reading the total is **O(1)** |
| N2 | A new promotion type is a new class; the cart isn't edited |
| N3 | Lines and totals are internal; callers get read-only values |

**Assumptions** (say them out loud, they change the code): money is **integer cents**; percentages
round **half up**, once per line and once for the coupon; **at most one item promotion per line** —
the best one for the current quantity — then one cart coupon; the unit price is snapshotted on the
first add; one shopper edits a cart at a time.

**Out of scope:** tax, shipping, stock, payment, multi-currency. Designed for but not built:
fixed-amount coupons and buy-A-get-B bundles.

## 2. The objects and their visibility
UML visibility: `+` public, `-` private (internal), `#` protected. In Python, a leading underscore
marks internal state; frozen dataclasses make values safe to hand out.

| class | role | public (+) | internal (−) |
|---|---|---|---|
| `Product` | immutable value: sku, name, unit price, category | all fields (read-only, frozen) | — |
| `Promotion` (interface) | item-level pricing rule | `applies_to(product)`, `discount_cents(unit_price, qty)` | — |
| `BuyNGetMFree`, `PercentOff` | the two rules | the interface | `_sku`, `_buy`, `_free`, `_percent`, `_category` |
| `CartPromotion` / `PercentOffCoupon` | cart-level rule on the discounted subtotal | `discount_cents(subtotal)` | `_percent` |
| `PromotionCatalog` | which rules could apply to a product (shared, read-only) | `for_product(product)` | `_promotions` |
| `CartLine` | one SKU in one cart with its **cached** price | used only by the cart | `quantity`, `subtotal_cents`, `discount_cents`, `_promotions` |
| `ShoppingCart` | the aggregate root | `add_item`, `delete_item`, `get_total_price`, `get_breakdown`, `apply_coupon`, `lines()` | `_lines`, `_subtotal_cents`, `_item_discount_cents`, `_coupon`, `_reprice()` |
| `LineView`, `PriceBreakdown` | snapshots for callers (frozen) | all fields (read-only) | — |

Why it matters: the running totals are only correct if **nothing but the cart** changes a line.
`lines()` returns a tuple of `LineView` snapshots, never the live `CartLine` objects.

## 3. Class diagram
- **v1** gets ownership right (cart → items → products) but keeps a `DiscountType` on each item and
  a loop with `if/elif` per type inside `get_total_price`, recomputed on every read.

```diagram
v1
```

- **v2** applies **Strategy**: `Promotion` is the contract; `BuyNGetMFree` and `PercentOff`
  implement it; `PromotionCatalog` says which apply to a product; each `CartLine` asks its
  promotions for a discount. A third promotion is a new class.

```diagram
v2
```

- **v3** makes reads O(1) and adds the cart-level coupon as a second strategy (`CartPromotion`).
  Reads return an immutable `PriceBreakdown`.

```diagram
v3
```

## 4. The rules, precisely
**Buy N, get M free** (N = buy, M = free), for quantity q:

```text
group      = N + M
free_units = (q // group) * M + max(0, q % group - N)
discount   = free_units * unit_price
```

The second term matters for M > 1: with *buy 3, get 2*, 4 units give 1 free (the 4th), 5 give 2.

| 2 + 1 at 1.00 | q=1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| free units | 0 | 0 | 1 | 1 | 1 | 2 | 2 |
| you pay | 1.00 | 2.00 | 2.00 | 3.00 | 4.00 | 4.00 | 5.00 |

**Percentage off:** `discount = (subtotal * percent + 50) // 100` (half up, integer only).
10% of 3.33 → 33¢; 10% of 3.35 → 34¢ (33.5 rounds up).

**Order of application:** each line takes its single best item promotion, then the coupon applies
once to the sum, and the total never goes below zero.

## 5. Where the work happens (efficiency)
Each `CartLine` caches `subtotal_cents` and `discount_cents`. The cart keeps two running sums. Every
change goes through one private method:

```python
def _reprice(line, new_qty):
    subtotal       -= line.subtotal;  item_discount -= line.discount
    line.set_quantity(new_qty)        # re-prices only this line: best of its k promotions
    subtotal       += line.subtotal;  item_discount += line.discount
```

| operation | cost | why |
|---|---|---|
| `add_item` / `delete_item` | O(k) | k = promotions matching that product (usually 0–2); dict lookup by SKU is O(1) |
| `get_total_price` | **O(1)** | two running sums, one coupon calculation |
| `get_breakdown` | O(1) | same numbers as a frozen value |
| `lines()` | O(n) | builds read-only snapshots; only the cart page needs it |

The alternative, recomputing on read, costs O(n · k) on every page view, where the cart changes a few
times but the total is read on every page. The risk of caching is drift, which the property test
in section 6 rules out.

## 6. Testing
Fixtures: apple 1.00 with **2 + 1**; milk 2.50 in *dairy* with **10% off dairy**; bread 3.00 with no
promotion.

| # | case | steps | expected total |
|---|---|---|---|
| 1 | empty cart | — | 0.00 |
| 2 | no promotion | add bread | 3.00 |
| 3 | below the threshold | add 2 apples | 2.00 |
| 4 | exactly N + M | add 3 apples | 2.00 |
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
| 16 | cart coupon | bread + 3 milk, 10% coupon | 8.77 (9.75 − 0.98) |
| 17 | best promotion wins | apple with 20% off **and** 2 + 1: 2 apples / 3 apples | 1.60 / 2.00 |
| 18 | M > 1 | *buy 3 get 2*: 4 / 5 / 10 units | 3.00 / 3.00 / 6.00 |
| 19 | property test | 2 000 random adds/deletes | after each step, running total == full recompute |

Also unit-test each promotion **alone** (it's a pure function of price and quantity), and test that
`lines()` can't be used to change the cart (its values are frozen).

## 7. Pitfalls and extensions
- **Floats for money.** 3 × 0.1 isn't 0.3. Use integer cents (or `Decimal`) and one rounding rule.
- **Applying the deal per add call** instead of to the line's total quantity: adding apples one at
  a time must give the same total as adding three at once (test #7).
- **Stacking by accident.** Decide the rule (best single item promotion, then the coupon) and write
  it in the assumptions.
- **Leaking internals.** Returning the live line dict lets callers change quantities without
  updating the totals.
- **Extending:** a fixed-amount coupon is another `CartPromotion`; *buy A, get B* needs a rule that
  sees two lines, so it becomes a cart-level promotion over the line views; combinable deals become a
  `StackingPolicy` object rather than more `if`s in the cart.

## Transferable pattern
**Pricing rules as strategies plus incremental aggregates:** each rule is a pure function behind one
interface, the applicable rule is picked per line, and the aggregate keeps running totals updated by
the delta of the one line that changed, so reads are O(1). The same shape fits fee calculators, tax
rules, shipping rates, loyalty points and scoring engines.

## Learn more
- [Behavioral patterns: Strategy, State, Observer](#/learn/ood/behavioral-patterns)
- [SOLID: the open/closed principle](#/learn/ood/solid)
- [OOP basics: encapsulation and visibility](#/learn/ood/oop-basics)
- [UML class diagrams: visibility and relationships](#/learn/ood/uml-basics)
- [Creational patterns: building promotions from configuration](#/learn/ood/creational-patterns)
- [The OOD interview flow](#/learn/ood/ood-framework)
