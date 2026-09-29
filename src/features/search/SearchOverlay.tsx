import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Folder, Search as SearchIcon, StickyNote, Tag } from "lucide-react";
import clsx from "clsx";
import { useSearch, type SearchResult } from "./searchStore";
import { useNav } from "../../app/navStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { useProject } from "../../stores/projectStore";
import { useSettings } from "../../stores/settingsStore";
import { boardTypeInfo } from "../dashboard/boardTypes";
import { CategoryDot } from "../../components/ui/CategoryChip";
import { Kbd } from "../../components/ui/Button";
import "./search.css";

const ICON = { size: 15, strokeWidth: 1.75 };

const GROUPS: [SearchResult["kind"], string][] = [
  ["note", "Notes"],
  ["board", "Boards"],
  ["folder", "Folders"],
  ["category", "Categories"],
];

/** Results in display order: grouped by kind, best match first within a group. */
export function groupResults(results: SearchResult[]): [string, SearchResult[]][] {
  return GROUPS.map(([kind, label]) => [label, results.filter((r) => r.kind === kind)] as [
    string,
    SearchResult[],
  ]).filter(([, rs]) => rs.length > 0);
}

export function SearchOverlayHost() {
  const open = useSearch((s) => s.overlayOpen);
  const hasProject = useProject((s) => s.projectPath !== null);
  if (!open) return null;
  return hasProject ? <SearchOverlay /> : <ProjectSearchOverlay />;
}

function SearchOverlay() {
  const setOpen = useSearch((s) => s.setOverlayOpen);
  const query = useSearch((s) => s.query);
  const navigate = useNav((s) => s.navigate);
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);

  const groups = useMemo(() => groupResults(query(text, 12)), [query, text]);
  const ordered = groups.flatMap(([, rs]) => rs);

  useEffect(() => setActive(0), [text]);

  const choose = (r: SearchResult) => {
    setOpen(false);
    if (r.kind === "note" && r.noteId) {
      useNoteModal.getState().open(r.noteId, "read");
    } else if (r.screen) {
      navigate(r.screen);
    }
  };

  const seeAll = () => {
    setOpen(false);
    navigate({ name: "search", query: text });
  };

  let index = 0;
  return (
    <OverlayFrame
      text={text}
      setText={setText}
      placeholder="Search notes, boards, folders…"
      count={ordered.length}
      setActive={setActive}
      onEnter={() => (ordered[active] ? choose(ordered[active]) : text.trim() && seeAll())}
      onClose={() => setOpen(false)}
      footer={text.trim() && ordered.length > 0 ? seeAll : undefined}
    >
      {groups.map(([label, rs]) => (
        <Fragment key={label}>
          <div className="searchoverlay__group">{label}</div>
          {rs.map((r) => {
            const i = index++;
            return (
              <ResultRow
                key={r.id}
                result={r}
                active={i === active}
                onHover={() => setActive(i)}
                onSelect={() => choose(r)}
              />
            );
          })}
        </Fragment>
      ))}
    </OverlayFrame>
  );
}

/** On the Start screen there is no project yet: search the recent projects instead. */
function ProjectSearchOverlay() {
  const setOpen = useSearch((s) => s.setOverlayOpen);
  const recents = useSettings((s) => s.recents);
  const openProject = useProject((s) => s.open);
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);

  const needle = text.trim().toLowerCase();
  const hits = recents.filter(
    (r) => r.name.toLowerCase().includes(needle) || r.path.toLowerCase().includes(needle),
  );

  useEffect(() => setActive(0), [text]);

  const choose = (path: string) => {
    setOpen(false);
    void openProject(path);
  };

  return (
    <OverlayFrame
      text={text}
      setText={setText}
      placeholder="Search recent projects…"
      count={hits.length}
      setActive={setActive}
      onEnter={() => hits[active] && choose(hits[active].path)}
      onClose={() => setOpen(false)}
    >
      {hits.length > 0 && <div className="searchoverlay__group">Projects</div>}
      {hits.map((r, i) => (
        <button
          key={r.path}
          className={clsx("result-row", i === active && "result-row--active")}
          onMouseMove={() => setActive(i)}
          onClick={() => choose(r.path)}
        >
          <span className="result-row__icon">
            <BookOpen {...ICON} />
          </span>
          <span className="result-row__text">
            <span className="result-row__title">{r.name}</span>
            <span className="result-row__loc">{r.path}</span>
          </span>
          <span className="result-row__hint">{i === active && <span className="kbd">Enter</span>}</span>
        </button>
      ))}
    </OverlayFrame>
  );
}

function OverlayFrame({
  text,
  setText,
  placeholder,
  count,
  setActive,
  onEnter,
  onClose,
  footer,
  children,
}: {
  text: string;
  setText: (t: string) => void;
  placeholder: string;
  count: number;
  setActive: (fn: (a: number) => number) => void;
  onEnter: () => void;
  onClose: () => void;
  footer?: () => void;
  children: ReactNode;
}) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, count - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      onEnter();
    }
  };

  return createPortal(
    <div
      className="searchoverlay-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="searchoverlay" role="dialog" aria-label="Search">
        <div className="searchoverlay__inputrow">
          <SearchIcon className="searchoverlay__glyph" size={16} strokeWidth={1.75} aria-hidden />
          <input
            autoFocus
            className="searchoverlay__input"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
          />
          <Kbd>Esc</Kbd>
        </div>
        {text.trim() && (
          <div className="searchoverlay__results">
            {count === 0 ? (
              <div className="searchoverlay__none">Nothing found for “{text}”.</div>
            ) : (
              children
            )}
          </div>
        )}
        {text.trim() && count > 0 && (
          <div className="searchoverlay__foot">
            {footer ? (
              <button className="textbtn textbtn--accent" onClick={footer}>
                See all results
              </button>
            ) : (
              <span />
            )}
            <span className="searchoverlay__keys">
              <span className="kbd">Up</span>
              <span className="kbd">Down</span> to move · <span className="kbd">Enter</span> to open
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function kindIcon(result: SearchResult): ReactNode {
  switch (result.kind) {
    case "note":
      return <StickyNote {...ICON} />;
    case "folder":
      return <Folder {...ICON} />;
    case "category":
      return <Tag {...ICON} />;
    case "board":
      return result.boardType ? boardTypeInfo(result.boardType).icon(15) : <Folder {...ICON} />;
  }
}

export function ResultRow({
  result,
  active,
  onHover,
  onSelect,
}: {
  result: SearchResult;
  active?: boolean;
  onHover?: () => void;
  onSelect: () => void;
}) {
  const categories = useProject((s) => s.meta?.categories ?? []);
  const cats = (result.categoryIds ?? [])
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <button
      className={clsx("result-row", active && "result-row--active")}
      onMouseMove={onHover}
      onClick={onSelect}
    >
      <span className="result-row__icon">{kindIcon(result)}</span>
      <span className="result-row__text">
        <span className="result-row__title">{result.title}</span>
        <span className="result-row__loc">{result.location}</span>
      </span>
      <span className="result-row__hint">
        {cats.map((c) => (
          <CategoryDot key={c.id} color={c.color} title={c.name} />
        ))}
        {active && <span className="kbd">Enter</span>}
      </span>
    </button>
  );
}
