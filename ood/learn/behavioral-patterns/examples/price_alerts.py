"""Worked example (observer): a price feed notifies whoever subscribed to a ticker.

Reference code for the lesson animation; `# note:` comments become the narration.
The classes live inside the traced function so the animation can step into every method.
"""


def run_price_alerts(actions: list[list[str]]) -> list[str]:
    class Watcher:
        def __init__(self, name: str, inbox: list[str]) -> None:
            self.name = name
            self.inbox = inbox

        def notify(self, ticker: str, price: str) -> None:
            self.inbox.append(f"{self.name}: {ticker}={price}")  # note: each observer reacts its own way

        def __repr__(self) -> str:
            return self.name

    class PriceFeed:
        def __init__(self, subscribers: dict[str, list[Watcher]]) -> None:
            self.subscribers = subscribers  # note: subject keeps ticker → list of observers

        def subscribe(self, ticker: str, watcher: Watcher) -> None:
            self.subscribers.setdefault(ticker, []).append(watcher)  # note: register the observer under its ticker

        def unsubscribe(self, ticker: str, watcher: Watcher) -> None:
            self.subscribers[ticker].remove(watcher)  # note: unsubscribe — no more news for it

        def publish(self, ticker: str, price: str) -> None:
            for watcher in list(self.subscribers.get(ticker, [])):  # note: publish — loop over a copy
                watcher.notify(ticker, price)  # note: same notify() call on each observer, whatever its concrete class

    delivered: list[str] = []
    subscribers: dict[str, list[Watcher]] = {}
    feed = PriceFeed(subscribers)
    watchers: dict[str, Watcher] = {}
    for verb, *args in actions:
        if verb == "sub":
            name, ticker = args
            watcher = watchers.setdefault(name, Watcher(name, delivered))
            feed.subscribe(ticker, watcher)
        elif verb == "unsub":
            name, ticker = args
            feed.unsubscribe(ticker, watchers[name])
        else:
            ticker, price = args
            feed.publish(ticker, price)
    return delivered
