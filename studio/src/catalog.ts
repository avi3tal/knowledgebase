import type { Topic } from "./api";

/** Presentation metadata for catalogs: groups, colours and icons (pure, tested in catalog.test.ts). */

export const SUBJECT_ICON: Record<string, string> = {
  algo: "🧮",
  "system-design": "🏗️",
  ood: "🧩",
};

export const SUBJECT_SHORT: Record<string, string> = {
  algo: "Algorithms",
  "system-design": "System Design",
  ood: "OOD",
};

const GROUP_LABEL: Record<string, string> = {
  pattern: "Coding patterns",
  fundamental: "Fundamentals",
  fundamentals: "Fundamentals",
  "building-blocks": "Building blocks",
  "case-studies": "Case studies",
  genai: "GenAI systems",
  "design-patterns": "Design patterns",
};

const GROUP_ICON: Record<string, string> = {
  pattern: "🧩",
  fundamental: "📐",
  fundamentals: "📐",
  "building-blocks": "🧱",
  "case-studies": "🏙️",
  genai: "🤖",
  "design-patterns": "🎨",
};

/** Topic-specific icons; anything missing falls back to its group icon. */
const TOPIC_ICON: Record<string, string> = {
  "sliding-window": "🪟",
  islands: "🏝️",
  "two-pointers": "👉",
  "fast-slow-pointers": "🐇",
  "merge-intervals": "📏",
  "cyclic-sort": "🔁",
  "in-place-reversal-linked-list": "↩️",
  bfs: "🌊",
  dfs: "🕳️",
  "two-heaps": "⚖️",
  subsets: "🎲",
  "modified-binary-search": "🔍",
  "bitwise-xor": "⊕",
  "top-k-elements": "🏆",
  "k-way-merge": "🔀",
  "knapsack-0-1": "🎒",
  "unbounded-knapsack": "🧺",
  "fibonacci-numbers": "🐚",
  "palindromic-subsequence": "🪞",
  "longest-common-substring": "🧬",
  "topological-sort": "🗂️",
  backtracking: "🧭",
  "multi-threaded": "🧵",
  "arrays-hashing": "#️⃣",
  stack: "🥞",
  "linked-list": "🔗",
  heaps: "⛰️",
  recursion: "🪆",
  "dynamic-programming": "🧠",
  sorting: "📊",
  math: "➗",
  greedy: "💰",
  design: "🛠️",
  strings: "🔤",
  "bit-manipulation": "💡",
  trees: "🌳",
  trie: "🌲",
  "union-find": "🤝",
  "shortest-paths": "🛣️",
  "prefix-sum": "➕",
  caching: "⚡",
  cdn: "🌍",
  "load-balancing": "⚖️",
  "message-queues": "📬",
  sharding: "🧩",
  replication: "🪞",
  "rate-limiting": "🚦",
  "url-shortener": "🔗",
  "chat-system": "💬",
  "news-feed": "📰",
  "video-streaming": "🎬",
  "payment-system": "💳",
  "rag-system": "📚",
  "llm-serving": "🤖",
  "parking-lot": "🅿️",
  "elevator-system": "🛗",
  "vending-machine": "🥤",
  "chess-game": "♟️",
  atm: "🏧",
  solid: "🧱",
};

/** A fixed, colour-blind-aware-ish palette; groups get a stable colour by order of appearance. */
export const PALETTE = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
];

export function groupOf(t: Pick<Topic, "kind" | "group">): string {
  return t.group ?? t.kind;
}

export function groupLabel(group: string): string {
  return GROUP_LABEL[group] ?? group.replace(/-/g, " ");
}

export function topicIcon(t: Pick<Topic, "id" | "kind" | "group">): string {
  return TOPIC_ICON[t.id] ?? GROUP_ICON[groupOf(t)] ?? "•";
}

const KIND_ORDER = ["pattern", "fundamentals", "fundamental", "building-blocks", "case-studies"];

/** Topics grouped (in a stable, teaching-friendly order) with a colour per group. */
export function groupTopics(topics: Topic[]): { group: string; color: string; topics: Topic[] }[] {
  const groups = new Map<string, Topic[]>();
  for (const t of topics) groups.set(groupOf(t), [...(groups.get(groupOf(t)) ?? []), t]);
  const rank = (g: string) => (KIND_ORDER.includes(g) ? KIND_ORDER.indexOf(g) : KIND_ORDER.length);
  return [...groups]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([group, ts], i) => ({
      group,
      color: PALETTE[i % PALETTE.length] ?? "#6366f1",
      topics: [...ts].sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    }));
}
