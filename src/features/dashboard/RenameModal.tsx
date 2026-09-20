import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Field, TextInput } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { useProject } from "../../stores/projectStore";
import type { TreeItem } from "../../lib/schema";

interface Props {
  /** Item to rename, or null when used as a generic name prompt. */
  item: TreeItem | null;
  title?: string;
  confirmLabel?: string;
  initialValue?: string;
  placeholder?: string;
  onSubmit?: (name: string) => void;
  onClose: () => void;
}

export function RenameModal({
  item,
  title = "Rename",
  confirmLabel = "Rename",
  initialValue,
  placeholder,
  onSubmit,
  onClose,
}: Props) {
  const renameTreeItem = useProject((s) => s.renameTreeItem);
  const [name, setName] = useState(initialValue ?? item?.name ?? "");
  const canSubmit = name.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    if (item) renameTreeItem(item.id, name.trim());
    onSubmit?.(name.trim());
    onClose();
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      width={400}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSubmit} onClick={submit}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Field label="Name">
        {(id) => (
          <TextInput
            id={id}
            autoFocus
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={(e) => e.target.select()}
          />
        )}
      </Field>
    </Modal>
  );
}
