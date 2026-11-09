import { useEffect, useRef, useState } from "react";
import type { Subject } from "../api";
import { SUBJECT_ICON, SUBJECT_SHORT } from "../catalog";
import type { Tab } from "../route";
import { TAB_HREF } from "../route";
import { Grow, Kbd } from "../theme/primitives";
import { Icon } from "./Icon";
import * as S from "./TopBar.style";

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
    <S.Switch ref={ref}>
      <S.SwitchButton
        $dim={tab === "sessions"}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <S.SubjectIcon>{SUBJECT_ICON[id] ?? "📘"}</S.SubjectIcon>
        <span>{SUBJECT_SHORT[id] ?? current?.title ?? "Subjects"}</span>
        <Icon name="chevronDown" size={14} />
      </S.SwitchButton>
      {open && (
        <S.Menu role="menu">
          {subjects.map((s) => (
            <S.MenuItem
              key={s.id}
              role="menuitem"
              href={TAB_HREF.learn(s.id)}
              $on={s.id === id}
              onClick={() => setOpen(false)}
            >
              <S.SubjectIcon>{SUBJECT_ICON[s.id] ?? "📘"}</S.SubjectIcon>
              <S.MenuText>
                <b>{SUBJECT_SHORT[s.id] ?? s.title}</b>
                <span>
                  {s.status === "locked" ? "Catalog and resources — lessons coming" : s.title}
                </span>
              </S.MenuText>
              {s.status === "locked" && <Icon name="lock" size={13} />}
              {s.id === id && <Icon name="check" size={14} />}
            </S.MenuItem>
          ))}
        </S.Menu>
      )}
    </S.Switch>
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
    <S.Bar>
      <S.Brand href="#/" aria-label="kb studio home">
        <S.BrandMark>kb</S.BrandMark>
      </S.Brand>
      <SubjectSwitcher subjects={subjects} current={current} tab={tab} />
      <S.Sections aria-label="Sections">
        {sectionsFor(current).map((s) => (
          <S.Section
            key={s.tab}
            href={TAB_HREF[s.tab](subject)}
            $on={tab === s.tab}
            aria-current={tab === s.tab ? "page" : undefined}
          >
            {s.label}
          </S.Section>
        ))}
      </S.Sections>
      <Grow />
      <S.Search onClick={onSearch}>
        <Icon name="search" size={15} />
        <span>Search</span>
        <Kbd>⌘K</Kbd>
      </S.Search>
      <S.BarLink href="#/sessions" $on={tab === "sessions"}>
        <Icon name="target" size={15} />
        Sessions
      </S.BarLink>
      <S.IconButton
        onClick={onTheme}
        title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        aria-label="Toggle theme"
      >
        <Icon name={theme === "light" ? "moon" : "sun"} size={16} />
      </S.IconButton>
    </S.Bar>
  );
}
