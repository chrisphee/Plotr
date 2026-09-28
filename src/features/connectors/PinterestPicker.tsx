import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { useProject } from "../../stores/projectStore";
import {
  pinterestImportPin,
  pinterestListBoards,
  pinterestListPins,
  type AttachmentMeta,
  type PinterestBoard,
  type PinterestPin,
} from "../../tauri/commands";
import "./connectors.css";

interface Props {
  /** false: importing one pin closes the picker at once. */
  multiple?: boolean;
  onImported: (metas: AttachmentMeta[]) => void;
  onClose: () => void;
}

export function PinterestPicker({ multiple = true, onImported, onClose }: Props) {
  const projectPath = useProject((s) => s.projectPath);
  const [boards, setBoards] = useState<PinterestBoard[] | null>(null);
  const [board, setBoard] = useState<PinterestBoard | null>(null);
  const [pins, setPins] = useState<PinterestPin[]>([]);
  const [bookmark, setBookmark] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pinterestListBoards()
      .then(setBoards)
      .catch((e) => setError(String(e)));
  }, []);

  const openBoard = async (b: PinterestBoard) => {
    setBoard(b);
    setPins([]);
    setBookmark(null);
    setSelected(new Set());
    setError(null);
    try {
      const page = await pinterestListPins(b.id);
      setPins(page.items);
      setBookmark(page.bookmark);
    } catch (e) {
      setError(String(e));
    }
  };

  const loadMore = async () => {
    if (!board || !bookmark) return;
    setBusy("more");
    try {
      const page = await pinterestListPins(board.id, bookmark);
      setPins((p) => [...p, ...page.items]);
      setBookmark(page.bookmark);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const importPins = async (ids: string[]) => {
    if (!projectPath || ids.length === 0) return;
    setBusy("import");
    setError(null);
    try {
      const metas: AttachmentMeta[] = [];
      for (const id of ids) {
        const pin = pins.find((p) => p.id === id);
        if (pin) metas.push(await pinterestImportPin(projectPath, pin.image_url, pin.id));
      }
      onImported(metas);
      onClose();
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  };

  const toggle = (pin: PinterestPin) => {
    if (!multiple) {
      void importPins([pin.id]);
      return;
    }
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(pin.id)) next.delete(pin.id);
      else next.add(pin.id);
      return next;
    });
  };

  return (
    <Modal
      title={board ? board.name : "Import from Pinterest"}
      onClose={onClose}
      width={680}
      footer={
        board && multiple ? (
          <>
            <Button variant="ghost" onClick={() => setBoard(null)}>
              <ArrowLeft size={14} /> Boards
            </Button>
            <Button
              variant="primary"
              disabled={selected.size === 0 || busy !== null}
              onClick={() => void importPins([...selected])}
            >
              {busy === "import" ? "Importing…" : `Import ${selected.size || ""}`}
            </Button>
          </>
        ) : undefined
      }
    >
      {error && (
        <p className="meta" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {!board && (
        <div>
          {boards === null && !error && <p className="meta">Loading your boards…</p>}
          {boards?.length === 0 && <p className="meta">No boards on this account.</p>}
          {boards?.map((b) => (
            <button key={b.id} className="board-row" onClick={() => void openBoard(b)}>
              {b.name}
              <span className="board-row__count">{b.pin_count} pins</span>
            </button>
          ))}
        </div>
      )}

      {board && (
        <>
          {!multiple && <p className="meta">Click an image to import it.</p>}
          <div className="pin-grid">
            {pins.map((pin) => (
              <button
                key={pin.id}
                className={
                  "pin-tile" + (selected.has(pin.id) ? " pin-tile--selected" : "")
                }
                title={pin.title}
                onClick={() => toggle(pin)}
              >
                <img src={pin.thumb_url} alt={pin.title} loading="lazy" />
                {selected.has(pin.id) && (
                  <span className="pin-tile__check">
                    <Check size={13} />
                  </span>
                )}
              </button>
            ))}
          </div>
          {bookmark && (
            <div>
              <Button variant="ghost" disabled={busy !== null} onClick={() => void loadMore()}>
                {busy === "more" ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
