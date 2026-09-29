import { useMemo, useState } from "react";
import { useSearch, type SearchResult } from "./searchStore";
import { useNav } from "../../app/navStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { AppShell } from "../../components/shell/TopBar";
import { TextInput } from "../../components/ui/Field";
import { EmptyState } from "../../components/ui/EmptyState";
import { ResultRow, groupResults } from "./SearchOverlay";
import "./search.css";

export function SearchResultsScreen({ initialQuery }: { initialQuery: string }) {
  const query = useSearch((s) => s.query);
  const navigate = useNav((s) => s.navigate);
  const [text, setText] = useState(initialQuery);

  const groups = useMemo(() => groupResults(query(text, 100)), [query, text]);

  const choose = (r: SearchResult) => {
    if (r.kind === "note" && r.noteId) useNoteModal.getState().open(r.noteId, "read");
    else if (r.screen) navigate(r.screen);
  };

  return (
    <AppShell>
      <div className="page">
        <div className="page__head">
          <h1 className="page__title">Search</h1>
        </div>
        <TextInput
          autoFocus
          placeholder="Search this project…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {text.trim() && groups.length === 0 && (
          <EmptyState title="Nothing found" message={`No matches for “${text}”.`} />
        )}
        <div className="searchscreen__groups">
          {groups.map(([label, rs]) => (
            <section key={label} className="lgroup">
              <div className="lgroup__label">
                <span>{label}</span>
                <span>{rs.length}</span>
              </div>
              {rs.map((r) => (
                <ResultRow key={r.id} result={r} onSelect={() => choose(r)} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
