import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button, IconButton } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/Field";
import type { PlotLineBoard } from "../../lib/schema";
import { plotline } from "./plotActions";
import "./plotline.css";

/* Sections are completely user-defined — names and ranges, nothing more.
   Positions are percentages of the story (0–100). */

export function SectionManagerModal({
  board,
  onClose,
}: {
  board: PlotLineBoard;
  onClose: () => void;
}) {
  const sections = [...board.sections].sort((a, b) => a.start - b.start);

  const addSection = () => {
    const last = sections[sections.length - 1];
    const start = last ? Math.min(last.end, 0.9) : 0;
    const end = Math.min(start + 0.25, 1);
    plotline.addSection(board.id, `Section ${sections.length + 1}`, start, end);
  };

  return (
    <Modal
      title="Sections"
      onClose={onClose}
      width={480}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <p className="meta">
        Sections label parts of the story — acts, journeys, anything. Drag their
        boundaries on the timeline, or set positions here as percentages.
      </p>
      {sections.map((sec) => (
        <div key={sec.id} className="secmgr__row">
          <TextInput
            defaultValue={sec.name}
            onBlur={(e) => {
              const name = e.target.value.trim();
              if (name && name !== sec.name) plotline.updateSection(board.id, sec.id, { name });
            }}
          />
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={Math.round(sec.start * 100)}
            onChange={(e) =>
              plotline.updateSection(board.id, sec.id, {
                start: Math.min(1, Math.max(0, Number(e.target.value) / 100)),
              })
            }
            style={{ width: 72 }}
          />
          <span className="meta">to</span>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={Math.round(sec.end * 100)}
            onChange={(e) =>
              plotline.updateSection(board.id, sec.id, {
                end: Math.min(1, Math.max(0, Number(e.target.value) / 100)),
              })
            }
            style={{ width: 72 }}
          />
          <IconButton
            label={`Delete ${sec.name}`}
            onClick={() => plotline.deleteSection(board.id, sec.id)}
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      ))}
      <div>
        <Button variant="secondary" onClick={addSection}>
          <Plus size={14} /> Add section
        </Button>
      </div>
    </Modal>
  );
}
