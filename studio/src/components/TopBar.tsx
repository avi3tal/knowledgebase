import { useEffect, useRef, useState } from "react";
import type { Subject } from "../api";
import { SUBJECT_ICON, SUBJECT_SHORT } from "../catalog";
import type { Tab } from "../route";
import { TAB_HREF } from "../route";
import { Icon } from "./Icon";

/** Sections of a subject, in the top bar. `open` sections need practice data (hidden when locked). */
export const SECTIONS: { tab: Tab; label: string; open?: boolean }[] = [
  { tab: "learn", label: "Learn" },
  { tab: "problems", label: "Problems", open: true },
  { tab: "map", label: "Map" },
  { tab: "progress", label: "Progress", open: true },
];

/** Sections shown for a subject (locked subjects have no problems or progress yet). */
export function sectionsFor(subject: Subject | undefined): typeof SECTIONS {
  return SECTIONS.filter((s) => !(subject?.status === "locked" && s.open));
}

function SubjectSwitcher({
  subjects,
  current,
  tab,
}: {
  subjects: Subject[];
  current: Subject | undefined;
  tab: Tab;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const id = current?.id ?? "";
  return (
    <div className="tb-switch" ref={ref}>
      <button
        className={`tb-switch-btn ${tab === "sessions" ? "dim" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="tb-subject-icon">{SUBJECT_ICON[id] ?? "📘"}</span>
        <span>{SUBJECT_SHORT[id] ?? current?.title ?? "Subjects"}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="tb-menu" role="menu">
          {subjects.map((s) => (
            <a
              key={s.id}
              role="menuitem"
              href={TAB_HREF.learn(s.id)}
              className={`tb-menu-item ${s.id === id ? "on" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="tb-subject-icon">{SUBJECT_ICON[s.id] ?? "📘"}</span>
              <span className="tb-menu-text">
                <b>{SUBJECT_SHORT[s.id] ?? s.title}</b>
                <span>
                  {s.status === "locked" ? "Catalog and resources — lessons coming" : s.title}
                </span>
              </span>
              {s.status === "locked" && <Icon name="lock" size={13} />}
              {s.id === id && <Icon name="check" size={14} />}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** The app's single top bar: brand · subject · sections · search · sessions · theme. */
export function TopBar({
  subjects,
  current,
  tab,
  theme,
  onTheme,
  onSearch,
}: {
  subjects: Subject[];
  current: Subject | undefined;
  tab: Tab;
  theme: "light" | "dark";
  onTheme: () => void;
  onSearch: () => void;
}) {
  const subject = current?.id ?? "algo";
  return (
    <header className="topbar">
      <a className="brand" href="#/" aria-label="kb studio home">
        <span className="brand-mark">kb</span>
      </a>
      <SubjectSwitcher subjects={subjects} current={current} tab={tab} />
      <nav className="tb-sections" aria-label="Sections">
        {sectionsFor(current).map((s) => (
          <a
            key={s.tab}
            href={TAB_HREF[s.tab](subject)}
            className={`tb-section ${tab === s.tab ? "on" : ""}`}
            aria-current={tab === s.tab ? "page" : undefined}
          >
            {s.label}
          </a>
        ))}
      </nav>
      <span className="grow" />
      <button className="tb-search" onClick={onSearch}>
        <Icon name="search" size={15} />
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>
      <a href="#/sessions" className={`tb-link ${tab === "sessions" ? "on" : ""}`}>
        <Icon name="target" size={15} />
        Sessions
      </a>
      <button
        className="tb-icon"
        onClick={onTheme}
        title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        aria-label="Toggle theme"
      >
        <Icon name={theme === "light" ? "moon" : "sun"} size={16} />
      </button>
    </header>
  );
}
