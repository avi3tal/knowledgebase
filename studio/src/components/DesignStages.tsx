import type { DesignDoc, EstimateResult, EstimateRow } from "../api";
import { SCOPE_LISTS, addScopeItem, formatSI, nextItemId } from "../design";

/** Stage editors of the design console. Each is controlled: it gets a value and calls onChange. */

function Remove({ onClick, what }: { onClick: () => void; what: string }) {
  return (
    <button
      className="icon-x"
      onClick={onClick}
      title={`Remove ${what}`}
      aria-label={`remove ${what}`}
    >
      ×
    </button>
  );
}

// ---------------------------------------------------------------- scope

export function ScopeEditor({
  scope,
  onChange,
}: {
  scope: DesignDoc["scope"];
  onChange: (s: DesignDoc["scope"]) => void;
}) {
  return (
    <div className="scope-grid">
      {SCOPE_LISTS.map(({ key, prefix, title, hint }, li) => {
        const items = scope[key] ?? [];
        const set = (next: typeof items) => onChange({ ...scope, [key]: next });
        return (
          <section key={key} className={`scope-col sc-${key}`} style={{ ["--i" as string]: li }}>
            <header>
              <b>{title}</b> <span className="muted small">{hint}</span>
            </header>
            {items.map((it, i) => (
              <div key={it.id} className="scope-item">
                <span className="id-chip">{it.id}</span>
                <textarea
                  rows={1}
                  value={it.text}
                  placeholder={`${title.toLowerCase()} item…`}
                  autoFocus={it.text === "" && i === items.length - 1}
                  onChange={(e) =>
                    set(items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      set(addScopeItem(items, prefix));
                    }
                  }}
                />
                <Remove what={it.id} onClick={() => set(items.filter((x) => x.id !== it.id))} />
              </div>
            ))}
            <button className="add-btn" onClick={() => set(addScopeItem(items, prefix))}>
              ＋ {prefix}
              {nextItemId(prefix, items).slice(1)}
            </button>
          </section>
        );
      })}
      <p className="muted small stage-foot">
        Ids are assigned for you; cite them later (“N2: 10k read QPS → cache”). Enter adds the next
        item.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- estimates

const LATENCY: [string, string][] = [
  ["Read from main memory", "≈ 100 ns"],
  ["Random read on an SSD", "≈ 0.1 ms"],
  ["Round trip inside one data centre", "≈ 0.5 ms"],
  ["Read 1 MB in a row from memory / SSD", "≈ 0.25 ms / 1 ms"],
  ["Spinning-disk seek", "≈ 10 ms"],
  ["Round trip across a continent", "≈ 50–150 ms"],
];
const POWERS: [string, string][] = [
  ["2¹⁰", "≈ 1 thousand · KB"],
  ["2²⁰", "≈ 1 million · MB"],
  ["2³⁰", "≈ 1 billion · GB"],
  ["2⁴⁰", "≈ 1 trillion · TB"],
];
const RULES = [
  "1 day ≈ 86 400 s ≈ 10⁵ s, so 1 M requests a day ≈ 12 per second",
  "peak traffic ≈ 2–3 × the average",
  "one ordinary server ≈ thousands of simple requests a second",
];

export function EstimatesEditor({
  rows,
  results,
  units,
  constants,
  onChange,
}: {
  rows: EstimateRow[];
  results: EstimateResult[];
  units: string[];
  constants: Record<string, number>;
  onChange: (rows: EstimateRow[]) => void;
}) {
  const set = (i: number, patch: Partial<EstimateRow>) =>
    onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="estimates">
      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th />
              <th>name</th>
              <th>formula</th>
              <th>unit</th>
              <th className="num">value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const res = results[i];
              const fresh = res && res.name === r.name && res.formula === r.formula;
              return (
                <tr key={i} className={res?.error ? "has-error" : ""}>
                  <td className="row-num">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="move up">
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label="move down"
                    >
                      ↓
                    </button>
                  </td>
                  <td>
                    <input
                      className="mono"
                      value={r.name}
                      placeholder="write_qps"
                      onChange={(e) => set(i, { name: e.target.value.replace(/\s/g, "_") })}
                    />
                  </td>
                  <td>
                    <input
                      className="mono wide"
                      value={r.formula}
                      placeholder="100 * million / month"
                      onChange={(e) => set(i, { formula: e.target.value })}
                    />
                  </td>
                  <td>
                    <select value={r.unit} onChange={(e) => set(i, { unit: e.target.value })}>
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u === "" ? "(count)" : u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`num value ${fresh ? "" : "stale"}`}>
                    {res?.error ? (
                      <span className="err" title={res.error}>
                        ⚠ {res.error}
                      </span>
                    ) : (
                      <b title={res?.value?.toLocaleString() ?? ""}>
                        {formatSI(res?.value)} <span className="muted">{r.unit}</span>
                      </b>
                    )}
                  </td>
                  <td>
                    <Remove
                      what={r.name || "row"}
                      onClick={() => onChange(rows.filter((_, k) => k !== i))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          className="add-btn"
          onClick={() =>
            onChange([...rows, { name: `row${rows.length + 1}`, formula: "", unit: "" }])
          }
        >
          ＋ Row
        </button>
        <p className="muted small">
          Rows are evaluated top to bottom; a formula may use earlier row names, numbers (
          <code>1e6</code>), <code>+ - * / // % ** ^ ( )</code> and the constants on the right.
          Values update after each autosave.
        </p>
      </div>
      <aside className="ref-card">
        <h4>Constants</h4>
        <dl>
          {Object.entries(constants).map(([k, v]) => (
            <div key={k}>
              <dt className="mono">{k}</dt>
              <dd>
                {formatSI(v)}
                {["day", "hour", "month"].includes(k) ? " s" : ""}
              </dd>
            </div>
          ))}
        </dl>
        <h4>Powers of two</h4>
        <dl>
          {POWERS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <h4>Latency, roughly</h4>
        <dl>
          {LATENCY.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <h4>Rules of thumb</h4>
        <ul>
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------- API & data

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function ApiDataEditor({
  doc,
  palette,
  onChange,
}: {
  doc: DesignDoc;
  palette: string[];
  onChange: (d: DesignDoc) => void;
}) {
  const api = doc.api ?? [];
  const data = doc.data ?? [];
  const setApi = (i: number, patch: Partial<DesignDoc["api"][number]>) =>
    onChange({ ...doc, api: api.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const setData = (i: number, patch: Partial<DesignDoc["data"][number]>) =>
    onChange({ ...doc, data: data.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const stores = palette.filter((k) =>
    ["sql", "nosql", "cache", "blob", "search", "queue", "stream"].includes(k),
  );
  return (
    <div className="api-data">
      <h3>🔌 Endpoints</h3>
      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th>id</th>
              <th>method</th>
              <th>path</th>
              <th>request</th>
              <th>response</th>
              <th>notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {api.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <span className="id-chip">{r.id}</span>
                </td>
                <td>
                  <select
                    className={`method m-${r.method.toLowerCase()}`}
                    value={r.method}
                    onChange={(e) => setApi(i, { method: e.target.value })}
                  >
                    {METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="mono"
                    value={r.path}
                    placeholder="/urls"
                    onChange={(e) => setApi(i, { path: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    rows={1}
                    value={r.request}
                    placeholder="{long_url}"
                    onChange={(e) => setApi(i, { request: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    rows={1}
                    value={r.response}
                    placeholder="201 {code}"
                    onChange={(e) => setApi(i, { response: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    rows={1}
                    value={r.notes}
                    placeholder="idempotency, auth…"
                    onChange={(e) => setApi(i, { notes: e.target.value })}
                  />
                </td>
                <td>
                  <Remove
                    what={r.id}
                    onClick={() => onChange({ ...doc, api: api.filter((_, k) => k !== i) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="add-btn"
          onClick={() =>
            onChange({
              ...doc,
              api: [
                ...api,
                {
                  id: nextItemId("E", api),
                  method: "GET",
                  path: "",
                  request: "",
                  response: "",
                  notes: "",
                },
              ],
            })
          }
        >
          ＋ Endpoint
        </button>
      </div>

      <h3>🗃️ Data model</h3>
      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th>id</th>
              <th>entity</th>
              <th>fields &amp; keys</th>
              <th>store</th>
              <th>why this store</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <span className="id-chip">{r.id}</span>
                </td>
                <td>
                  <input
                    value={r.name}
                    placeholder="links"
                    onChange={(e) => setData(i, { name: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    rows={1}
                    className="mono"
                    value={r.fields}
                    placeholder="code PK, long_url, created_at"
                    onChange={(e) => setData(i, { fields: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    list="kb-stores"
                    value={r.store}
                    placeholder="nosql"
                    onChange={(e) => setData(i, { store: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    rows={1}
                    value={r.why}
                    placeholder="key lookups at scale…"
                    onChange={(e) => setData(i, { why: e.target.value })}
                  />
                </td>
                <td>
                  <Remove
                    what={r.id}
                    onClick={() => onChange({ ...doc, data: data.filter((_, k) => k !== i) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="kb-stores">
          {stores.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          className="add-btn"
          onClick={() =>
            onChange({
              ...doc,
              data: [
                ...data,
                { id: nextItemId("D", data), name: "", fields: "", store: "", why: "" },
              ],
            })
          }
        >
          ＋ Entity
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- deep dives

type Dive = DesignDoc["deep_dives"][number];

export function DeepDivesEditor({
  doc,
  versions,
  onChange,
}: {
  doc: DesignDoc;
  versions: number[];
  onChange: (d: DesignDoc) => void;
}) {
  const dives = doc.deep_dives ?? [];
  const set = (i: number, patch: Partial<Dive>) =>
    onChange({ ...doc, deep_dives: dives.map((d, k) => (k === i ? { ...d, ...patch } : d)) });
  return (
    <div className="dives">
      {dives.map((d, i) => (
        <section key={d.id} className="dive-card" style={{ ["--i" as string]: i }}>
          <header>
            <span className="id-chip">{d.id}</span>
            <input
              className="dive-title"
              value={d.title}
              placeholder="What are you deciding? e.g. how to generate short codes"
              onChange={(e) => set(i, { title: e.target.value })}
            />
            <Remove
              what={d.id}
              onClick={() => onChange({ ...doc, deep_dives: dives.filter((_, k) => k !== i) })}
            />
          </header>
          <table className="sheet options">
            <thead>
              <tr>
                <th>option</th>
                <th>pros</th>
                <th>cons</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.options.map((o, k) => {
                const setOpt = (patch: Partial<typeof o>) =>
                  set(i, {
                    options: d.options.map((x, j) => (j === k ? { ...x, ...patch } : x)),
                    ...(patch.name !== undefined && d.choice === o.name
                      ? { choice: patch.name }
                      : {}),
                  });
                return (
                  <tr key={k} className={d.choice && d.choice === o.name ? "chosen" : ""}>
                    <td>
                      <input
                        value={o.name}
                        placeholder="option"
                        onChange={(e) => setOpt({ name: e.target.value })}
                      />
                    </td>
                    <td>
                      <textarea
                        rows={1}
                        value={o.pros}
                        placeholder="+"
                        onChange={(e) => setOpt({ pros: e.target.value })}
                      />
                    </td>
                    <td>
                      <textarea
                        rows={1}
                        value={o.cons}
                        placeholder="−"
                        onChange={(e) => setOpt({ cons: e.target.value })}
                      />
                    </td>
                    <td>
                      <Remove
                        what="option"
                        onClick={() => set(i, { options: d.options.filter((_, j) => j !== k) })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            className="add-btn"
            onClick={() => set(i, { options: [...d.options, { name: "", pros: "", cons: "" }] })}
          >
            ＋ Option
          </button>
          <div className="dive-decision">
            <label>
              <span className="muted small">choice</span>
              <select value={d.choice} onChange={(e) => set(i, { choice: e.target.value })}>
                <option value="">— pick one —</option>
                {d.options
                  .filter((o) => o.name.trim())
                  .map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name}
                    </option>
                  ))}
                {d.choice && !d.options.some((o) => o.name === d.choice) && (
                  <option value={d.choice}>{d.choice}</option>
                )}
              </select>
            </label>
            <label>
              <span className="muted small">adopted in</span>
              <select
                value={d.version ?? ""}
                onChange={(e) => {
                  const { version: _drop, ...rest } = d;
                  const next = e.target.value ? { ...rest, version: Number(e.target.value) } : rest;
                  onChange({ ...doc, deep_dives: dives.map((x, k) => (k === i ? next : x)) });
                }}
              >
                <option value="">— no version —</option>
                {versions.map((v) => (
                  <option key={v} value={v}>
                    v{v}
                  </option>
                ))}
              </select>
            </label>
            <label className="grow">
              <span className="muted small">why</span>
              <textarea
                rows={2}
                value={d.why}
                placeholder="Why this option wins for *these* requirements (cite F/N ids)"
                onChange={(e) => set(i, { why: e.target.value })}
              />
            </label>
          </div>
        </section>
      ))}
      <button
        className="add-btn big-add"
        onClick={() =>
          onChange({
            ...doc,
            deep_dives: [
              ...dives,
              {
                id: nextItemId("DD", dives),
                title: "",
                options: [
                  { name: "", pros: "", cons: "" },
                  { name: "", pros: "", cons: "" },
                ],
                choice: "",
                why: "",
              },
            ],
          })
        }
      >
        ＋ Deep dive
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- wrap-up

const WRAPUP_INFO: Record<string, { title: string; icon: string; prompt: string }> = {
  bottlenecks: {
    title: "Bottlenecks & single points of failure",
    icon: "🍾",
    prompt: "What breaks first as load grows? What has only one copy?",
  },
  failures: {
    title: "Failure handling",
    icon: "🧯",
    prompt: "A node, a zone, a dependency dies: what happens to reads and writes?",
  },
  monitoring: {
    title: "Monitoring & alerting",
    icon: "📟",
    prompt: "Which numbers do you watch, and what pages someone at 3 am?",
  },
  scale: {
    title: "10× growth",
    icon: "📈",
    prompt: "Traffic or data grows 10×: what changes first?",
  },
  future: {
    title: "Future work",
    icon: "🔭",
    prompt: "What would you build next, and what did you defer?",
  },
};

export function WrapUpEditor({
  keys,
  wrapup,
  onChange,
}: {
  keys: string[];
  wrapup: Record<string, string>;
  onChange: (w: Record<string, string>) => void;
}) {
  return (
    <div className="wrapup">
      {keys.map((k, i) => {
        const info = WRAPUP_INFO[k] ?? { title: k, icon: "📝", prompt: "" };
        const v = wrapup[k] ?? "";
        return (
          <label key={k} className="wrap-card" style={{ ["--i" as string]: i }}>
            <span className="wrap-title">
              {info.icon} {info.title}
              <span className={`chars ${v.trim().length >= 15 ? "ok" : ""}`}>
                {v.trim().length} chars
              </span>
            </span>
            <textarea
              rows={4}
              value={v}
              placeholder={info.prompt}
              onChange={(e) => onChange({ ...wrapup, [k]: e.target.value })}
            />
          </label>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- signatures

export function SignaturesEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="signatures">
      <p className="callout info">
        ✍️ <b>Signatures only</b>: classes, interfaces and function signatures with types, no bodies
        (use <code>...</code>). Saved as <code>signatures.py</code> in the attempt.
      </p>
      <textarea
        className="code-area"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          e.preventDefault();
          const t = e.currentTarget;
          const { selectionStart: s, selectionEnd: end } = t;
          onChange(`${value.slice(0, s)}    ${value.slice(end)}`);
          requestAnimationFrame(() => t.setSelectionRange(s + 4, s + 4));
        }}
      />
    </div>
  );
}
