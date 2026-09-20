import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Modal } from "../../components/ui/Modal";
import { Field, TextInput, TextArea } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { useProject } from "../../stores/projectStore";
import { useSettings } from "../../stores/settingsStore";

interface Props {
  onClose: () => void;
  onError: (msg: string) => void;
}

export function CreateProjectModal({ onClose, onError }: Props) {
  const createAndOpen = useProject((s) => s.createAndOpen);
  const defaultDir = useSettings((s) => s.defaultProjectDir);
  const setDefaultDir = useSettings((s) => s.setDefaultProjectDir);

  const [name, setName] = useState("");
  const [dir, setDir] = useState(defaultDir ?? "");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const browse = async () => {
    const picked = await openDialog({
      directory: true,
      title: "Where should this project live?",
    });
    if (typeof picked === "string") setDir(picked);
  };

  const canCreate = name.trim().length > 0 && dir.trim().length > 0 && !busy;

  const create = async () => {
    if (!canCreate) return;
    setBusy(true);
    try {
      await createAndOpen(dir.trim(), name.trim(), description.trim());
      setDefaultDir(dir.trim());
      onClose();
    } catch (e) {
      onError(String(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New Project"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canCreate} onClick={() => void create()}>
            {busy ? "Creating…" : "Create Project"}
          </Button>
        </>
      }
    >
      <Field label="Name">
        {(id) => (
          <TextInput
            id={id}
            autoFocus
            placeholder="The Silent Kingdom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void create()}
          />
        )}
      </Field>
      <Field
        label="Location"
        hint={
          name.trim()
            ? `The project is saved as a folder: ${name.trim()}.plotr`
            : "The project is saved as a folder you can back up or move."
        }
      >
        {(id) => (
          <div className="pathrow">
            <TextInput
              id={id}
              placeholder="Choose a folder…"
              value={dir}
              onChange={(e) => setDir(e.target.value)}
            />
            <Button variant="secondary" onClick={() => void browse()}>
              Browse…
            </Button>
          </div>
        )}
      </Field>
      <Field label="Description (optional)">
        {(id) => (
          <TextArea
            id={id}
            placeholder="A sentence or two about this story."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>
    </Modal>
  );
}
