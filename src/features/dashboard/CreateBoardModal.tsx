import { useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Field, TextInput, TextArea } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { useProject } from "../../stores/projectStore";
import { useNav } from "../../app/navStore";
import type { BoardType } from "../../lib/schema";
import { BOARD_TYPES } from "./boardTypes";
import "./dashboard.css";

interface Props {
  parentId: string | null;
  initialType?: BoardType;
  onClose: () => void;
}

export function CreateBoardModal({ parentId, initialType = "notes", onClose }: Props) {
  const createBoard = useProject((s) => s.createBoard);
  const navigate = useNav((s) => s.navigate);
  const [type, setType] = useState<BoardType>(initialType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const canCreate = name.trim().length > 0 && !busy;

  const create = async () => {
    if (!canCreate) return;
    setBusy(true);
    const id = await createBoard(parentId, type, name.trim(), description.trim());
    onClose();
    navigate({ name: "board", boardId: id });
  };

  return (
    <Modal
      title="New board"
      onClose={onClose}
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canCreate} onClick={() => void create()}>
            {busy ? "Creating…" : "Create board"}
          </Button>
        </>
      }
    >
      <div className="typegrid" role="radiogroup" aria-label="Board type">
        {BOARD_TYPES.map((t) => (
          <button
            key={t.type}
            role="radio"
            aria-checked={type === t.type}
            className={clsx("typecard", type === t.type && "typecard--on")}
            onClick={() => setType(t.type)}
          >
            <span className="typecard__icon">{t.icon(20)}</span>
            <span className="typecard__name">{t.name}</span>
            <span className="typecard__desc">{t.description}</span>
            {type === t.type && (
              <span className="typecard__check" aria-hidden>
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>
      <Field label="Name">
        {(id) => (
          <TextInput
            id={id}
            autoFocus
            placeholder={type === "plotline" ? "Main Plot" : type === "infomap" ? "Character Web" : "Research"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void create()}
          />
        )}
      </Field>
      <Field label="Description (optional)">
        {(id) => <TextArea id={id} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
    </Modal>
  );
}
