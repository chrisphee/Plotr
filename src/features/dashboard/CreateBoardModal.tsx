import { useState } from "react";
import clsx from "clsx";
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
  onClose: () => void;
}

export function CreateBoardModal({ parentId, onClose }: Props) {
  const createBoard = useProject((s) => s.createBoard);
  const navigate = useNav((s) => s.navigate);
  const [type, setType] = useState<BoardType>("notes");
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
      title="New Board"
      onClose={onClose}
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canCreate} onClick={() => void create()}>
            {busy ? "Creating…" : "Create Board"}
          </Button>
        </>
      }
    >
      <div className="typegrid">
        {BOARD_TYPES.map((t) => (
          <button
            key={t.type}
            className={clsx("typecard", type === t.type && "typecard--active")}
            onClick={() => setType(t.type)}
          >
            {t.icon(20)}
            <span className="typecard__name">{t.name}</span>
            <span className="typecard__desc">{t.description}</span>
          </button>
        ))}
      </div>
      <Field label="Name">
        {(id) => (
          <TextInput
            id={id}
            autoFocus
            placeholder={
              type === "plotline" ? "Main Plot" : type === "infomap" ? "Character Web" : "Research"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void create()}
          />
        )}
      </Field>
      <Field label="Description (optional)">
        {(id) => (
          <TextArea
            id={id}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>
    </Modal>
  );
}
