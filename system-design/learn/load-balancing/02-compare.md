## What the traces show

Round robin ignores how busy a server is, so every slow request lands on server 0, which ends up
holding three at once (`peak = 3`) while the others sit idle. Least connections looks at
`active` and routes around the busy server, so the worst pile-up is 2.

```
round robin         least connections
s0: ████████        s0: ████████
s0:    ████████     s1:    ████████
s0:       ████████  s2:       ████████
```

## Production details worth mentioning
- **Health checks:** active (the LB polls `/healthz`) or passive (it watches for errors and
  timeouts). Use a short interval and require several failures before ejecting a server, so it
  doesn't flap.
- **Sticky sessions** pin a client to one server via a cookie. They're handy for in-memory
  state, but they fight even balancing and lose sessions when that server dies. Prefer making
  the server stateless.
- **The LB itself must not be a single point of failure:** run an active-passive pair with a
  floating IP, or many LB nodes behind DNS / anycast.
- **Global load balancing:** DNS-based or anycast routing sends users to the nearest healthy
  region, and regional LBs then spread load inside it.
- **Connection draining:** on deploy, stop new requests to a server but let open ones finish.
