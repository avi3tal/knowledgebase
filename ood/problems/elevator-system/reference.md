# Reference walkthrough: elevator system

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Requirements
Two kinds of input: **hall calls** (floor + up/down, any car may answer) and **car calls** (a
destination pressed inside one specific car). A **bank of 4 cars** shares the hall calls, the
**dispatching policy must be swappable**, and safety rules (capacity, doors, emergency stop)
override everything. Implicit but important: **no starvation**, and requests arrive
**concurrently** while cars move.

## 2. Core objects
`ElevatorController` (receives hall calls, knows all cars), `ElevatorCar` (position, direction,
state, load, its own stops), `Request` (floor, direction, source), plus the closed sets
`Direction` and `CarState`. Operations: `request_elevator(floor, direction)`,
`select_floor(floor)`, door and emergency controls, `set_strategy`.

## 3. Class diagram
- **v1** separates the coordinator from the cars, which is the important split. But "nearest idle
  car" is hard-coded in the controller and each car serves stops in FIFO order, so it zig-zags and
  a far floor can wait a long time.
- **v2** puts dispatching behind `DispatchStrategy` (`NearestCarStrategy`, `RushHourStrategy`) and
  gives each car a `StopList` that orders stops with the LOOK sweep.

## 4. Key patterns and why
- **Strategy** for dispatch: the policy is exactly what the building wants to experiment with.
  The controller depends on the interface (dependency inversion) and a new policy is a new class.
  A good default scores each car by distance, prefers cars already heading toward the caller in
  the right direction, and skips full or out-of-service cars.
- **LOOK (elevator algorithm)** inside a car: keep going in the current direction while stops
  remain ahead (up-stops in a min-heap, down-stops in a max-heap), then reverse. Fewer reversals
  than FIFO, and every stop is reached within one sweep, so nobody starves.
- **State as an enum** is enough here: cars have few states and the transitions are guarded by
  safety checks in `step()`. If per-state behaviour grows (maintenance, fire service), promote it
  to the State pattern.

## 5. Concurrency and extensibility
Give each car a thread (or a tick on an event loop) that **owns its movement**; nobody else
changes its floor or direction. The only shared mutable thing is the stop list: `add_stop` and
`select_floor` take the car's lock (or push onto a thread-safe queue that the car loop drains).
The controller reads **immutable snapshots** to score cars, so scoring never sees a half-updated
car; a slightly stale snapshot just means a slightly worse choice, never a wrong state. When a car
goes into emergency or maintenance it hands its hall calls back for reassignment. Scaling up is
more cars (more workers); zoning or destination dispatch is another strategy and request source.

## Transferable pattern
**Dispatcher + workers with a pluggable policy:** a coordinator assigns work via a strategy; each
worker owns its queue and state and is the only writer of its state. The same shape fits ride
hailing, task schedulers, load balancers and printer pools.
