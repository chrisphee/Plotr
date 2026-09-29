import { useState } from "react";
import { Plus, X } from "lucide-react";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { useProject } from "../../stores/projectStore";
import { useConnectors } from "../connectors/connectorStore";
import { PinterestPicker } from "../connectors/PinterestPicker";
import { importAttachment } from "../../tauri/commands";
import { exportProjectBackup, exportProjectMarkdown } from "./exportProject";
import { AppShell } from "../../components/shell/TopBar";
import { ProjectCover } from "../../components/shell/ProjectCover";
import { TextInput, TextArea } from "../../components/ui/Field";
import { Button, IconButton } from "../../components/ui/Button";
import { ColorPicker } from "../../components/ui/ColorPicker";
import { CATEGORY_PRESETS } from "../../lib/schema";
import "../../components/ui/categories.css";
import "./projectSettings.css";

const COVER_PRESETS = [
  { name: "Pine", color: "#227A66" },
  { name: "Blue", color: "#0066D6" },
  { name: "Violet", color: "#6A4BD8" },
  { name: "Rose", color: "#C8365E" },
  { name: "Orange", color: "#B4570F" },
  { name: "Graphite", color: "#3A3A40" },
  { name: "White", color: "#FFFFFF" },
];

export function ProjectSettingsScreen() {
  const meta = useProject((s) => s.meta);
  const updateMeta = useProject((s) => s.updateMeta);
  const [name, setName] = useState(meta?.name ?? "");

  if (!meta) return null;

  return (
    <AppShell saveStatus="always" grouped largeTitle>
      <div className="settings">
        <h1 className="page__title">Project settings</h1>

        <section className="fgroup">
          <h2 className="fgroup__title">General</h2>
          <div className="fgroup__box">
            <div className="frow">
              <label className="frow__label" htmlFor="ps-name">
                Name
              </label>
              <div className="frow__control">
                <TextInput
                  id="ps-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name.trim() && updateMeta({ name: name.trim() })}
                />
              </div>
            </div>
            <div className="frow">
              <label className="frow__label" htmlFor="ps-genre">
                Genre
              </label>
              <div className="frow__control">
                <TextInput
                  id="ps-genre"
                  defaultValue={meta.genre}
                  placeholder="Fantasy"
                  onBlur={(e) => updateMeta({ genre: e.target.value })}
                />
              </div>
            </div>
            <div className="frow">
              <label className="frow__label" htmlFor="ps-status">
                Status
              </label>
              <div className="frow__control">
                <TextInput
                  id="ps-status"
                  defaultValue={meta.status}
                  placeholder="Drafting"
                  onBlur={(e) => updateMeta({ status: e.target.value })}
                />
              </div>
            </div>
            <div className="frow frow--stack">
              <label className="frow__label" htmlFor="ps-desc">
                Description
              </label>
              <TextArea
                id="ps-desc"
                defaultValue={meta.description}
                placeholder="A sentence or two about this story."
                onBlur={(e) => updateMeta({ description: e.target.value })}
              />
            </div>
          </div>
        </section>

        <AppearanceSection />
        <CategoryManager />
        <ExportSection />
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
    <section className="fgroup">
      <h2 className="fgroup__title">Export</h2>
      <div className="fgroup__box">
        <div className="frow">
          <span className="frow__text">
            <span className="frow__label">Backup</span>
            <span className="frow__hint">A .zip with everything. You can import it again from the Start screen.</span>
          </span>
          <Button onClick={() => void backup()}>Export backup</Button>
        </div>
        <div className="frow">
          <span className="frow__text">
            <span className="frow__label">Markdown</span>
            <span className="frow__hint">Plain, readable files. Your work is never locked in.</span>
          </span>
          <Button onClick={() => void markdown()}>Export Markdown</Button>
        </div>
      </div>
      {status && (
        <p className="fgroup__note" role="status">
          {status}
        </p>
      )}
    </section>
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

  return (
    <section className="fgroup">
      <h2 className="fgroup__title">Icon</h2>
      <div className="fgroup__box">
        <div className="frow cover">
          <ProjectCover
            path={projectPath}
            name={meta.name}
            coverImage={meta.coverImage}
            color={meta.color}
            size={72}
          />
          <div className="cover__controls">
            <p className="frow__hint">
              Shown in the sidebar, on Home and on the Start screen. Images are copied into the project, so they travel
              with your backups.
            </p>
            <ColorPicker
              value={meta.color ?? ""}
              presets={COVER_PRESETS}
              onChange={(c) => updateMeta({ color: c })}
            />
            <div className="settings__buttons">
              <Button size="sm" onClick={() => void pickCover()}>
                {meta.coverImage ? "Change image…" : "Choose image…"}
              </Button>
              {pinterestConnected && (
                <Button size="sm" onClick={() => setPickerOpen(true)}>
                  From Pinterest
                </Button>
              )}
              {meta.coverImage && (
                <Button size="sm" variant="ghost" onClick={() => updateMeta({ coverImage: null })}>
                  Remove image
                </Button>
              )}
            </div>
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
    </section>
  );
}

function CategoryManager() {
  const categories = useProject((s) => s.meta?.categories ?? []);
  const addCategory = useProject((s) => s.addCategory);
  const updateCategory = useProject((s) => s.updateCategory);
  const deleteCategory = useProject((s) => s.deleteCategory);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  return (
    <section className="fgroup">
      <h2 className="fgroup__title">Categories</h2>
      <p className="fgroup__note">
        Categories belong to the whole project. Changing a colour updates every note that uses it.
      </p>
      <div className="fgroup__box">
        {categories.map((c) => (
          <div key={c.id} className="frow catrow">
            <button
              className="catrow__swatch"
              style={{ background: c.color }}
              title="Change colour"
              aria-label={`Change colour of ${c.name}`}
              aria-expanded={editingColorId === c.id}
              onClick={() => setEditingColorId(editingColorId === c.id ? null : c.id)}
            />
            <TextInput
              className="catrow__input"
              aria-label="Category name"
              defaultValue={c.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== c.name) updateCategory(c.id, { name });
              }}
            />
            <IconButton label={`Delete ${c.name}`} onClick={() => deleteCategory(c.id)}>
              <X size={15} strokeWidth={2} />
            </IconButton>
            {editingColorId === c.id && (
              <div className="catrow__picker">
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
          className="frow catrow__add"
          onClick={() => {
            const used = new Set(categories.map((c) => c.color));
            const preset = CATEGORY_PRESETS.find((p) => !used.has(p.color));
            addCategory("New category", preset?.color ?? "#7c5cbf");
          }}
        >
          <Plus size={15} strokeWidth={2} />
          Add category
        </button>
      </div>
    </section>
  );
}
