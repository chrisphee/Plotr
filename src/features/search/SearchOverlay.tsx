import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Folder, Search, StickyNote, Tag, LayoutGrid } from "lucide-react";
import clsx from "clsx";
import { useSearch, type SearchResult } from "./searchStore";
import { useNav } from "../../app/navStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { useProject } from "../../stores/projectStore";
import { CategoryDot } from "../../components/ui/CategoryChip";
import "./search.css";

const KIND_ICON = {
  note: <StickyNote size={15} />,
  board: <LayoutGrid size={15} />,
  folder: <Folder size={15} />,
  category: <Tag size={15} />,
} as const;

export function SearchOverlayHost() {
  const open = useSearch((s) => s.overlayOpen);
  if (!open) return null;
  return <SearchOverlay />;
}

function SearchOverlay() {
  const setOpen = useSearch((s) => s.setOverlayOpen);
  const query = useSearch((s) => s.query);
  const navigate = useNav((s) => s.navigate);
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => query(text, 12), [query, text]);

  useEffect(() => setActive(0), [text]);

  const choose = (r: SearchResult) => {
    setOpen(false);
    if (r.kind === "note" && r.noteId) {
      useNoteModal.getState().open(r.noteId, "read");
    } else if (r.screen) {
      navigate(r.screen);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (results[active]) choose(results[active]);
      else if (text.trim()) {
        setOpen(false);
        navigate({ name: "search", query: text });
      }
    }
  };

  return createPortal(
    <div
      className="searchoverlay-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="searchoverlay">
        <div className="searchoverlay__inputrow">
          <Search size={16} />
          <input
            ref={inputRef}
            autoFocus
            className="searchoverlay__input"
            placeholder="Search notes, boards, folders…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
          />
          <span className="meta">esc</span>
        </div>
        {text.trim() && (
          <div className="searchoverlay__results">
            {results.length === 0 && (
              <div className="empty" style={{ padding: "var(--sp-6)" }}>
                <span className="meta">Nothing found for “{text}”.</span>
              </div>
            )}
            {results.map((r, i) => (
              <ResultRow
                key={r.id}
                result={r}
                active={i === active}
                index={i}
                onSelect={() => choose(r)}
              />
            ))}
          </div>
        )}
        {text.trim() && results.length > 0 && (
          <div className="searchoverlay__foot">
            <button
              className="btn btn--ghost"
              onClick={() => {
                setOpen(false);
                navigate({ name: "search", query: text });
              }}
            >
              See all results
            </button>
            <span className="meta">↑↓ to navigate · Enter to open</span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ResultRow({
  result,
  active,
  index,
  onSelect,
}: {
  result: SearchResult;
  active?: boolean;
  index: number;
  onSelect: () => void;
}) {
  const categories = useProject((s) => s.meta?.categories ?? []);
  const cats = (result.categoryIds ?? [])
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <button
      className={clsx("result-row", active && "result-row--active")}
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      onClick={onSelect}
    >
      <span className="result-row__icon">{KIND_ICON[result.kind]}</span>
      <span className="result-row__text">
        <span className="result-row__title">{result.title}</span>
        <span className="result-row__loc">{result.location}</span>
      </span>
      {cats.map((c) => (
        <CategoryDot key={c.id} color={c.color} title={c.name} />
      ))}
    </button>
  );
}
