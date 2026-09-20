import { useState } from "react";
import { Archive, FileDown, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { useProject } from "../../stores/projectStore";
import { importAttachment, assetUrl } from "../../tauri/commands";
import { exportProjectBackup, exportProjectMarkdown } from "./exportProject";
import { Dock } from "../../components/shell/Dock";
import { Field, TextInput, TextArea } from "../../components/ui/Field";
import { Button, IconButton } from "../../components/ui/Button";
import { ColorPicker } from "../../components/ui/ColorPicker";
import { CategoryDot } from "../../components/ui/CategoryChip";
import { CATEGORY_PRESETS } from "../../lib/schema";
import "../dashboard/dashboard.css";
import "../../components/ui/categories.css";

export function ProjectSettingsScreen() {
  const meta = useProject((s) => s.meta);
  const updateMeta = useProject((s) => s.updateMeta);
  const [name, setName] = useState(meta?.name ?? "");

  if (!meta) return null;

  return (
    <main className="shell__main" style={{ height: "100%" }}>
      <div className="dash__main" style={{ maxWidth: 560 }}>
        <h1 className="dash__boardtitle">Project Settings</h1>

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
        <AppearanceSection />
        <CategoryManager />
        <ExportSection />
      </div>
      <Dock />
    </main>
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
    <div className="field">
      <div className="field__label">Export</div>
      <div className="field__hint">
        A backup keeps everything and can be imported again. Markdown export gives you plain,
        readable files — your work is never locked in.
      </div>
      <div style={{ display: "flex", gap: "var(--sp-4)" }}>
        <Button variant="secondary" onClick={() => void backup()}>
          <Archive size={14} /> Export Backup (.zip)
        </Button>
        <Button variant="secondary" onClick={() => void markdown()}>
          <FileDown size={14} /> Export as Markdown
        </Button>
      </div>
      {status && <p className="meta">{status}</p>}
    </div>
  );
}

function AppearanceSection() {
  const meta = useProject((s) => s.meta);
  const projectPath = useProject((s) => s.projectPath);
  const updateMeta = useProject((s) => s.updateMeta);
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
    <div className="field">
      <div className="field__label">Cover & colour</div>
      <div className="field__hint">
        Shown on this project's card on the Start screen. The image is copied into the
        project, so it travels with your backups.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
        {meta.coverImage ? (
          <img
            src={assetUrl(projectPath, meta.coverImage)}
            alt="Project cover"
            style={{
              width: 96,
              height: 144,
              objectFit: "cover",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--hairline)",
            }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 144,
              borderRadius: "var(--r-card)",
              border: "1px dashed var(--hairline-strong)",
              display: "grid",
              placeItems: "center",
              color: "var(--text-muted)",
              background: meta.color ?? "transparent",
            }}
          >
            {!meta.color && <ImagePlus size={20} strokeWidth={1.5} />}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)", alignItems: "flex-start" }}>
          <Button variant="secondary" onClick={() => void pickCover()}>
            <ImagePlus size={14} /> {meta.coverImage ? "Change Image…" : "Choose Image…"}
          </Button>
          {meta.coverImage && (
            <Button variant="ghost" onClick={() => updateMeta({ coverImage: null })}>
              <X size={14} /> Remove image
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
        <ColorPicker
          value={meta.color ?? ""}
          onChange={(color) => updateMeta({ color })}
        />
        {meta.color && (
          <Button variant="ghost" onClick={() => updateMeta({ color: null })}>
            <X size={14} /> Default colour
          </Button>
        )}
      </div>
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
    <div className="field">
      <div className="field__label">Categories</div>
      <div className="field__hint">
        Categories belong to the whole project. Changing a colour updates every note using it.
      </div>
      <div>
        {categories.map((c) => (
          <div key={c.id} className="catmanager__row">
            <button
              className="swatch swatch--active"
              style={{ background: c.color, borderColor: "var(--hairline-strong)" }}
              title="Change colour"
              onClick={() => setEditingColorId(editingColorId === c.id ? null : c.id)}
            />
            <TextInput
              defaultValue={c.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== c.name) updateCategory(c.id, { name });
              }}
            />
            <IconButton label={`Delete ${c.name}`} onClick={() => deleteCategory(c.id)}>
              <Trash2 size={14} />
            </IconButton>
            {editingColorId === c.id && (
              <ColorPicker
                value={c.color}
                onChange={(color) => updateCategory(c.id, { color })}
              />
            )}
          </div>
        ))}
      </div>
      <div>
        <Button
          variant="secondary"
          onClick={() => {
            const used = new Set(categories.map((c) => c.color));
            const preset = CATEGORY_PRESETS.find((p) => !used.has(p.color));
            addCategory("New category", preset?.color ?? "#7c5cbf");
          }}
        >
          <Plus size={14} /> Add category
        </Button>
      </div>
      {categories.length > 0 && (
        <div className="swatches" style={{ marginTop: "var(--sp-3)" }}>
          {categories.map((c) => (
            <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CategoryDot color={c.color} />
              <span className="meta">{c.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
