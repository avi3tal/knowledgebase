# Reference walkthrough: parking lot

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Requirements
Two use cases carry the model: **park** (find a fitting space, hand out a ticket) and **leave**
(compute the fee, take payment, free the space). The constraints that shape the classes are the
**size rules** (motorcycle → any, car → regular/large, truck → large), the **display of free
spaces**, and the fact that **several gates run at once**. Out of scope: reservations, valet, the
real payment provider.

## 2. Core objects
Read the prompt for nouns that own state: `ParkingLot` (the facade the gates talk to), `Level`,
`ParkingSpot` (free or taken: the unit of occupancy), `Vehicle`, `Ticket` (a stay: vehicle, spot,
start time), and the closed set `SpotSize`. Verbs become operations: `park(vehicle) -> Ticket`,
`unpark(ticket, payment) -> Receipt`, `free_spots()`.

## 3. Class diagram
- **v1** gets ownership right: lot → levels → spots → 0..1 vehicle; the lot issues tickets. But the
  vehicle has a `type` field, and choosing a space and pricing are buried in `ParkingLot`, so every
  new vehicle kind or tariff means editing (and re-testing) the facade.
- **v2** makes `Vehicle` abstract (`Car`, `Motorcycle`, `Truck` each answer `size()`), and moves
  the two volatile rules behind interfaces: `SpotAllocationStrategy` (default `BestFitAllocation`)
  and `PricingStrategy` (default `HourlyPricing`). `ParkingLot` depends on the interfaces only.

## 4. Key patterns and why
- **Strategy** for allocation and pricing: these are the rules the business changes. New policies
  are new classes (open/closed), each testable on its own (single responsibility).
- **Polymorphism over type switches** for vehicles: `spot.can_fit(vehicle)` compares sizes instead
  of branching on `"car"`/`"truck"` strings.
- **Facade**: gates and displays only see `ParkingLot`; levels and spots stay internal.
- Best fit (smallest size that fits) keeps large spaces free for trucks.

## 5. Concurrency and extensibility
Two entrances can race for the last large space. Make "choose + claim" atomic: either a lock per
size (or per level) around the free list, or a compare-and-set on `spot.vehicle` with a retry on
failure. Keeping free lists per size per level makes the choice O(1) and the display a count, not a
scan. Extensions slot in cleanly: an EV space is a new `SpotSize` (or a feature on the spot), a
weekend tariff is a new `PricingStrategy`, a reservation is a new object that holds a spot for a
time window.

## Transferable pattern
**Resource allocation model:** facade → container hierarchy → resources that track their own
occupancy; the "which resource" and "how much does it cost" rules sit behind strategies. The same
shape fits hotel rooms, meeting-room booking, cinema seats and cloud VM placement.
