import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSearch, type SearchResult } from "./searchStore";
import { useNav } from "../../app/navStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { Dock } from "../../components/shell/Dock";
import { TextInput } from "../../components/ui/Field";
import { EmptyState } from "../../components/ui/EmptyState";
import { ResultRow } from "./SearchOverlay";
import "../dashboard/dashboard.css";
import "./search.css";

export function SearchResultsScreen({ initialQuery }: { initialQuery: string }) {
  const query = useSearch((s) => s.query);
  const navigate = useNav((s) => s.navigate);
  const [text, setText] = useState(initialQuery);

  const results = useMemo(() => query(text, 100), [query, text]);
  const groups: [string, SearchResult[]][] = useMemo(() => {
    const by: Record<string, SearchResult[]> = {};
    for (const r of results) (by[r.kind] ??= []).push(r);
    const order: [string, string][] = [
      ["note", "Notes"],
      ["board", "Boards"],
      ["folder", "Folders"],
      ["category", "Categories"],
    ];
    return order.filter(([k]) => by[k]?.length).map(([k, label]) => [label, by[k]]);
  }, [results]);

  const choose = (r: SearchResult) => {
    if (r.kind === "note" && r.noteId) useNoteModal.getState().open(r.noteId, "read");
    else if (r.screen) navigate(r.screen);
  };

  return (
    <main className="shell__main" style={{ height: "100%" }}>
      <div className="dash__main searchscreen">
        <h1 className="dash__boardtitle">Search</h1>
        <TextInput
          autoFocus
          placeholder="Search this project…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {text.trim() && results.length === 0 && (
          <EmptyState
            icon={<Search size={24} strokeWidth={1.5} />}
            title="Nothing found"
            message={`No matches for “${text}”.`}
          />
        )}
        {groups.map(([label, rs]) => (
          <section key={label}>
            <div className="eyebrow" style={{ marginBottom: "var(--sp-3)" }}>
              {label} · {rs.length}
            </div>
            {rs.map((r, i) => (
              <ResultRow key={r.id} result={r} index={i} onSelect={() => choose(r)} />
            ))}
          </section>
        ))}
      </div>
      <Dock />
    </main>
  );
}
