import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
      <div className="page page--narrow">
        <div className="searchscreen__field">
          <Search size={17} strokeWidth={2} />
          <TextInput
            autoFocus
            aria-label="Search this project"
            placeholder="Search this project"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {text.trim() && groups.length === 0 && (
          <EmptyState
            icon={<Search size={22} strokeWidth={1.75} />}
            title="Nothing found"
            message={`No notes, boards or folders match “${text}”.`}
          />
        )}
        <div className="searchscreen__groups">
          {groups.map(([label, rs]) => (
            <section key={label} className="searchscreen__group">
              <h2 className="searchscreen__label">
                <span>{label}</span>
                <span>{rs.length}</span>
              </h2>
              <div className="searchscreen__box">
                {rs.map((r) => (
                  <ResultRow key={r.id} result={r} onSelect={() => choose(r)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
