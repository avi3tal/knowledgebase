# Reference walkthrough: library management system

*Spoiler: shown only after you submit. One good answer, not the only one.*

## 1. Requirements
Members **search**, **borrow**, **return** and **reserve**; librarians add books and members. The
rules: at most **5 items**, **14-day** loans renewable once if nobody waits, a **fine per day**
late (rules that will change), and a **FIFO reservation line** per title with a notification when
a copy comes back. Implicit: a copy is never lent twice, even when two desks act at once.

## 2. Core objects
The key insight is that "book" means two things. A **`Book`** is a catalogue title (ISBN, title,
authors); a **`BookCopy`** is the physical thing with a barcode and a status. Lending acts on
copies, searching acts on titles. Every borrowing is a **`Loan`** (its own object, so history
survives the copy coming back), and every wait is a **`Reservation`**. `Member` owns the limit
check; `Library` is the service the desks call; `Catalog` answers searches.

## 3. Class diagram
- **v1**: `Library` → `Catalog` → `Book` 1→* `BookCopy` (with `CopyStatus`); `Member` 1→*
  `Loan` → `BookCopy`. Ownership is right, but fines are computed inside `Library` and there is no
  way to wait for a title.
- **v2** adds `ReservationQueue` + `Reservation`, a `FinePolicy` interface (`PerDayFine`, capped or
  no-fine variants), and a `Notifier` interface (`EmailNotifier`, later SMS). `return_copy` raises a
  "copy available" event; the queue listens, puts the copy on hold, and notifies the first member.

## 4. Key patterns and why
- **Description vs instance** (`Book` / `BookCopy`): the most common mistake is a single `Book`
  with a `quantity`, which cannot track which copy is late or lost.
- **Strategy** for fines: the penalty rule is the volatile part; `Loan` only knows dates.
- **Observer** for reservations: lending code does not know who is waiting or which channel to
  use, so adding SMS is a new `Notifier`, not an edit to `return_copy`.
- **Single responsibility**: `Member` decides "may I borrow?", `Catalog` searches, `Library`
  orchestrates.

## 5. Concurrency and extensibility
Two desks scanning the last copy: claim it with a **compare-and-set on the copy's status**
(`AVAILABLE → ON_LOAN`), or a row lock if it lives in a database, and check the member's limit in
the same transaction. A held copy (`ON_HOLD`) can only be checked out by the member it is held for.
New media (DVDs, magazines) become a common `LibraryItem` base with subclasses; multiple branches
become a location on each copy; search scales with an inverted index on title/author/subject.

## Transferable pattern
**Catalogue vs inventory:** separate the description of a thing from its physical instances, make
each event (loan, reservation) an object, and keep rules and notifications behind interfaces. The
same shape fits car rental, hotel booking, equipment check-out and ticketed events.
