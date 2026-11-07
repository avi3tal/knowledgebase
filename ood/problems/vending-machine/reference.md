# Reference walkthrough: vending machine

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Requirements
The customer does three things: **insert money**, **select a product**, **cancel**. The operator
**restocks** and services the coin box in a **maintenance** mode. The rules that make it
interesting: money can arrive before the choice, sold-out slots must not take money, and the sale
is refused when **exact change is impossible**. The invariant to protect: money is never lost:
every path ends in product + change, or a full refund.

## 2. Core objects
`VendingMachine` (what the customer touches), `Inventory` → `Slot` (code, product, quantity) →
`Product` (name, price), `CoinBox` (count per denomination) and the closed set `Coin`. Operations:
`insert_money(coin)`, `select_product(code) -> Sale`, `cancel() -> refund`, plus operator
`restock` and `enter/exit_maintenance`.

## 3. Class diagram
- **v1** has the right ownership, but the machine keeps a `mode` field and every method starts
  with "if idle … elif has money … elif dispensing …". Adding maintenance means editing all of
  them, and illegal transitions (select while dispensing) are easy to miss.
- **v2** applies the **State pattern**: `MachineState` declares every event; `IdleState`,
  `HasMoneyState`, `DispensingState`, `MaintenanceState` implement it, and the machine just calls
  `self.state.select_product(self, code)`. Change making moves into `ChangeMaker`.

## 4. Key patterns and why
- **State**: the same input means different things in different modes. One class per mode puts
  each mode's rules in one place, makes transitions explicit (a state sets `machine.state`), and
  makes "what does cancel do while dispensing?" a question you must answer for every state.
- **Single responsibility**: change making is an algorithm, not a mode; keeping it in
  `ChangeMaker` lets you test it alone. Greedy works for unlimited standard coins but fails with a
  limited box (owe 30 with one quarter and three dimes), so fall back to a bounded search and
  refuse *before* dispensing when nothing works.
- **Open for extension**: card payment is a `PaymentMethod` abstraction plus a
  `CardAuthorisingState`, not a rewrite of the cash path.

## 5. Concurrency and extensibility
A single customer at a time means no locking inside a sale; the operator entering maintenance is
just another transition, refused while dispensing. For physical failures, the dispensing state
refunds and marks the slot faulty if the motor jams; persisting the balance lets a power cut resume
in `HasMoney`.

## Transferable pattern
**Event-driven object with modes:** list states × events, one class per state behind one
interface, the context delegates. The same shape fits ATMs, traffic lights, order lifecycles, TCP
connections and document workflows.
