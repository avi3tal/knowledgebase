# UML class diagrams

> Fundamentals · classes, relationships, multiplicity, aggregation vs composition, sequence flows

In an OOD interview the class diagram is the **contract you and the interviewer agree on**
before any code. You don't need full UML. You need a handful of notations used *consistently*.

## A class box

A box has three compartments: the name (with a stereotype such as `«interface»`, `«abstract»` or
`«enum»`), the fields, then the methods. Only list the important ones. Every member starts with
its visibility: `-` private, `#` protected, `+` public.

```figure
class-box
```

## The six relationships (strongest last)

```figure
six-relations
```

(The diamond sits on the **whole**: `Team ◇── Player`, `Order ◆── OrderLine`.)

**Aggregation vs composition, the test:** delete the whole. Do the parts still make sense?

- `Order ◆── OrderLine`: an order line without its order is meaningless → **composition**.
  The order creates and owns the lines.
- `Team ◇── Player`: a player still exists after the team folds → **aggregation**.
- `Course ── Student` (many-to-many, both independent) → plain **association**.

In Python code they look the same (a field holding objects). The difference is **lifecycle and
ownership**: who creates the part, and who deletes it.

## Multiplicity

Write it at the far end of the line: `1`, `0..1`, `*` (many), `1..*`.

```figure
multiplicity
```

Read it as "one customer has many orders; an order has at least one line; each line refers to
exactly one product".

Multiplicity drives the code: `0..1` → `Optional[X]`, `*` → `list[X]` or `dict[id, X]`,
`1` → a required constructor argument.

## Enums and value objects

Use `«enum»` boxes for closed sets (`SpotSize: SMALL, MEDIUM, LARGE`). A value object
(`Money`, `TimeRange`) is a small class with no identity. Draw it as a class, or just as a
field type.
