import { useState } from "react";
import { X } from "lucide-react";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { useProject } from "../../stores/projectStore";
import { useConnectors } from "../connectors/connectorStore";
import { PinterestPicker } from "../connectors/PinterestPicker";
import { importAttachment, assetUrl } from "../../tauri/commands";
import { readableTextOn } from "../../lib/color";
import { exportProjectBackup, exportProjectMarkdown } from "./exportProject";
import { AppShell } from "../../components/shell/TopBar";
import { Field, TextInput, TextArea } from "../../components/ui/Field";
import { Button, IconButton } from "../../components/ui/Button";
import { ColorPicker } from "../../components/ui/ColorPicker";
import { CATEGORY_PRESETS } from "../../lib/schema";
import "../../components/ui/categories.css";
import "./projectSettings.css";

const COVER_PRESETS = [
  { name: "Black", color: "#06070E" },
  { name: "Pine", color: "#29524A" },
  { name: "White", color: "#FFFFFF" },
];
const DEFAULT_COVER = "#29524A";

export function ProjectSettingsScreen() {
  const meta = useProject((s) => s.meta);
  const updateMeta = useProject((s) => s.updateMeta);
  const [name, setName] = useState(meta?.name ?? "");

  if (!meta) return null;

  return (
    <AppShell saveStatus="always">
      <div className="page page--wide">
        <h1 className="page__title page__title--settings">Project settings</h1>
        <div className="settings__grid">
          <div className="settings__col">
            <Field label="Name">
              {(id) => (
                <TextInput
                  id={id}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name.trim() && updateMeta({ name: name.trim() })}
                />
              )}
            </Field>
            <Field label="Description">
              {(id) => (
                <TextArea
                  id={id}
                  defaultValue={meta.description}
                  onBlur={(e) => updateMeta({ description: e.target.value })}
                />
              )}
            </Field>
            <div className="settings__pair">
              <Field label="Genre">
                {(id) => (
                  <TextInput
                    id={id}
                    defaultValue={meta.genre}
                    placeholder="Fantasy"
                    onBlur={(e) => updateMeta({ genre: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Status">
                {(id) => (
                  <TextInput
                    id={id}
                    defaultValue={meta.status}
                    placeholder="Drafting"
                    onBlur={(e) => updateMeta({ status: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <ExportSection />
          </div>
          <div className="settings__col settings__col--right">
            <AppearanceSection />
            <CategoryManager />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ExportSection() {
  const meta = useProject((s) => s.meta);
  const [status, setStatus] = useState<string | null>(null);

  const backup = async () => {
    const dest = await saveDialog({
      title: "Export project backup",
      defaultPath: `${meta?.name ?? "project"}.plotr.zip`,
      filters: [{ name: "Plotr backup", extensions: ["zip"] }],
    });
    if (!dest) return;
    setStatus("Exporting…");
    try {
      await exportProjectBackup(dest);
      setStatus(`Backup saved to ${dest}`);
    } catch (e) {
      setStatus(String(e));
    }
  };

  const markdown = async () => {
    const dir = await openDialog({ directory: true, title: "Export Markdown into folder" });
    if (typeof dir !== "string") return;
    setStatus("Exporting…");
    try {
      const count = await exportProjectMarkdown(dir);
      setStatus(`Exported ${count} Markdown files to ${dir}`);
    } catch (e) {
      setStatus(String(e));
    }
  };

  return (
    <div className="settings__section settings__export">
      <div className="field__label">Export</div>
      <p className="field__hint">
        A backup keeps everything and can be imported again. Markdown export gives you plain,
        readable files — your work is never locked in.
      </p>
      <div className="settings__buttons">
        <Button onClick={() => void backup()}>Export backup (.zip)</Button>
        <Button onClick={() => void markdown()}>Export as Markdown</Button>
      </div>
      {status && <p className="field__hint">{status}</p>}
    </div>
  );
}

function AppearanceSection() {
  const meta = useProject((s) => s.meta);
  const projectPath = useProject((s) => s.projectPath);
  const updateMeta = useProject((s) => s.updateMeta);
  const pinterestConnected = useConnectors((s) => s.pinterest.connected);
  const [pickerOpen, setPickerOpen] = useState(false);
  if (!meta || !projectPath) return null;

  const pickCover = async () => {
    const picked = await openDialog({
      title: "Choose a cover image",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }],
    });
    if (typeof picked !== "string") return;
    const imported = await importAttachment(projectPath, picked);
    updateMeta({ coverImage: imported.rel_path });
  };

  const color = meta.color ?? DEFAULT_COVER;

  return (
    <div className="settings__section">
      <div className="field__label">Cover &amp; colour</div>
      <div className="cover">
        <div
          className="cover__preview"
          style={{ background: color }}
          data-tone={readableTextOn(color)}
        >
          {meta.coverImage ? (
            <img src={assetUrl(projectPath, meta.coverImage)} alt="Project cover" />
          ) : (
            <span className="cover__rule" />
          )}
        </div>
        <div className="cover__controls">
          <p className="field__hint">
            Shown on this project's card on the Start screen. Images are copied into the project,
            so they travel with your backups.
          </p>
          <ColorPicker
            value={color}
            presets={COVER_PRESETS}
            onChange={(c) => updateMeta({ color: c })}
          />
          <div className="settings__buttons">
            <Button onClick={() => void pickCover()}>
              {meta.coverImage ? "Change image…" : "Choose image…"}
            </Button>
            {pinterestConnected && <Button onClick={() => setPickerOpen(true)}>From Pinterest</Button>}
            {meta.coverImage && (
              <Button variant="ghost" onClick={() => updateMeta({ coverImage: null })}>
                Remove image
              </Button>
            )}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <PinterestPicker
          multiple={false}
          onImported={(metas) => {
            if (metas[0]) updateMeta({ coverImage: metas[0].rel_path });
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function CategoryManager() {
  const categories = useProject((s) => s.meta?.categories ?? []);
  const addCategory = useProject((s) => s.addCategory);
  const updateCategory = useProject((s) => s.updateCategory);
  const deleteCategory = useProject((s) => s.deleteCategory);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  return (
    <div className="settings__section">
      <div className="field__label">Categories</div>
      <p className="field__hint">
        Categories belong to the whole project. Changing a colour updates every note using it.
      </p>
      <div className="catlist">
        {categories.map((c) => (
          <div key={c.id} className="catlist__row">
            <button
              className="catlist__swatch"
              style={{ background: c.color }}
              title="Change colour"
              aria-label={`Change colour of ${c.name}`}
              onClick={() => setEditingColorId(editingColorId === c.id ? null : c.id)}
            />
            <TextInput
              className="catlist__input"
              defaultValue={c.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== c.name) updateCategory(c.id, { name });
              }}
            />
            <IconButton label={`Delete ${c.name}`} onClick={() => deleteCategory(c.id)}>
              <X size={15} strokeWidth={1.75} />
            </IconButton>
            {editingColorId === c.id && (
              <div className="catlist__picker">
                <ColorPicker
                  value={c.color}
                  presets={CATEGORY_PRESETS}
                  onChange={(color) => updateCategory(c.id, { color })}
                />
              </div>
            )}
          </div>
        ))}
        <button
          className="textbtn textbtn--accent catlist__add"
          onClick={() => {
            const used = new Set(categories.map((c) => c.color));
            const preset = CATEGORY_PRESETS.find((p) => !used.has(p.color));
            addCategory("New category", preset?.color ?? "#7c5cbf");
          }}
        >
          + Add category
        </button>
      </div>
    </div>
  );
}
