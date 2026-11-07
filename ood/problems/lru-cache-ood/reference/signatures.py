"""Signatures for Design an LRU cache (object-oriented): classes, interfaces and method signatures only."""

from __future__ import annotations

import threading
from abc import ABC, abstractmethod
from collections.abc import Hashable
from dataclasses import dataclass
from typing import Generic, TypeVar

K = TypeVar("K", bound=Hashable)
V = TypeVar("V")


class Cache(ABC, Generic[K, V]):
    """What callers depend on. Implementations: LRUCache, SegmentedCache, StatsCache."""

    @abstractmethod
    def get(self, key: K) -> V | None: ...

    @abstractmethod
    def put(self, key: K, value: V) -> None: ...

    @abstractmethod
    def delete(self, key: K) -> bool: ...

    @abstractmethod
    def size(self) -> int: ...


class Node(Generic[K]):
    """Doubly linked list node; keeps the key so eviction can remove it from the index."""

    key: K
    prev: Node[K] | None
    next: Node[K] | None

    def __init__(self, key: K) -> None: ...


class DoublyLinkedList(Generic[K]):
    """Sentinel head/tail; head side = most recent."""

    def push_front(self, node: Node[K]) -> None: ...

    def unlink(self, node: Node[K]) -> None: ...

    def move_to_front(self, node: Node[K]) -> None: ...

    def pop_back(self) -> Node[K] | None: ...


class EvictionPolicy(ABC, Generic[K]):
    """Decides who leaves. Not thread-safe on its own: called under the owner's lock."""

    @abstractmethod
    def on_access(self, key: K) -> None: ...

    @abstractmethod
    def on_insert(self, key: K) -> None: ...

    @abstractmethod
    def on_remove(self, key: K) -> None: ...

    @abstractmethod
    def victim(self) -> K:
        """The key to evict next."""
        ...


class LRUPolicy(EvictionPolicy[K]):
    """dict[K, Node] + DoublyLinkedList: every hook is O(1)."""

    def __init__(self) -> None:
        self._index: dict[K, Node[K]]
        self._order: DoublyLinkedList[K]
        ...

    def on_access(self, key: K) -> None: ...

    def on_insert(self, key: K) -> None: ...

    def on_remove(self, key: K) -> None: ...

    def victim(self) -> K: ...


class LFUPolicy(EvictionPolicy[K]):
    """Frequency buckets of linked lists; O(1) with a min-frequency pointer."""

    def on_access(self, key: K) -> None: ...

    def on_insert(self, key: K) -> None: ...

    def on_remove(self, key: K) -> None: ...

    def victim(self) -> K: ...


class EvictionListener(ABC, Generic[K, V]):
    @abstractmethod
    def on_evict(self, key: K, value: V) -> None: ...


class LRUCache(Cache[K, V]):
    """Bounded cache; LRUPolicy by default. Single-threaded core (wrap it for concurrency)."""

    def __init__(
        self,
        capacity: int,
        policy: EvictionPolicy[K] | None = None,
        listener: EvictionListener[K, V] | None = None,
    ) -> None:
        self._values: dict[K, V]
        ...

    def get(self, key: K) -> V | None: ...

    def put(self, key: K, value: V) -> None: ...

    def delete(self, key: K) -> bool: ...

    def size(self) -> int: ...


class ThreadSafeCache(Cache[K, V]):
    """Decorator: one mutex around any Cache. Fine for small or low-contention caches."""

    def __init__(self, inner: Cache[K, V]) -> None:
        self._lock: threading.Lock
        ...

    def get(self, key: K) -> V | None: ...

    def put(self, key: K, value: V) -> None: ...

    def delete(self, key: K) -> bool: ...

    def size(self) -> int: ...


class SegmentedCache(Cache[K, V]):
    """N independently locked LRUCache segments chosen by hash(key) % N (lock striping)."""

    def __init__(self, capacity: int, segments: int = 16) -> None:
        self._segments: list[LRUCache[K, V]]
        self._locks: list[threading.Lock]
        ...

    def _segment(self, key: K) -> int: ...

    def get(self, key: K) -> V | None: ...

    def put(self, key: K, value: V) -> None: ...

    def delete(self, key: K) -> bool: ...

    def size(self) -> int: ...


@dataclass
class CacheStats:
    hits: int
    misses: int
    evictions: int


class StatsCache(Cache[K, V]):
    """Decorator that counts hits and misses around any Cache."""

    def __init__(self, inner: Cache[K, V]) -> None: ...

    def get(self, key: K) -> V | None: ...

    def put(self, key: K, value: V) -> None: ...

    def delete(self, key: K) -> bool: ...

    def size(self) -> int: ...

    def stats(self) -> CacheStats: ...
