import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { saveQueue } from "../../lib/saveQueue";
import { noteToMarkdown } from "../../lib/markdownExport";
import { exportZip, writeExportFiles } from "../../tauri/commands";
import type { Note, NotesBoard, TreeItem } from "../../lib/schema";

/* Human-readable export: a folder of Markdown files mirroring the project
   tree. Notes boards become folders of note files; Plot Lines become a
   points list in story order; Info Maps list items and relationships. */

function sanitize(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.replace(/\.+$/, "") || "Untitled";
}

function treeDir(items: TreeItem[], parentId: string | null): string {
  const path: string[] = [];
  let cursor = parentId;
  while (cursor) {
    const item = items.find((i) => i.id === cursor);
    if (!item) break;
    path.unshift(sanitize(item.name));
    cursor = item.parentId;
  }
  return path.join("/");
}

export async function exportProjectMarkdown(destDir: string) {
  const s = useProject.getState();
  const notes = useNotes.getState().notes;
  const categories = new Map((s.meta?.categories ?? []).map((c) => [c.id, c.name]));
  const files: { rel_path: string; contents: string }[] = [];
  const catNames = (n: Note) =>
    n.categoryIds.map((id) => categories.get(id)).filter((x): x is string => Boolean(x));

  files.push({
    rel_path: "README.md",
    contents: `# ${s.meta?.name ?? "Project"}\n\n${s.meta?.description ?? ""}\n\nExported from Plotr on ${new Date().toLocaleDateString()}.\n`,
  });

  const usedNames = new Set<string>();
  const uniquePath = (base: string): string => {
    let path = base;
    let n = 2;
    while (usedNames.has(path.toLowerCase())) {
      path = base.replace(/\.md$/, ` (${n}).md`);
      n++;
    }
    usedNames.add(path.toLowerCase());
    return path;
  };

  for (const item of s.treeItems) {
    if (item.kind !== "board") continue;
    const board = s.boards[item.id];
    if (!board) continue;
    const dir = [treeDir(s.treeItems, item.parentId), sanitize(item.name)]
      .filter(Boolean)
      .join("/");

    if (board.type === "notes") {
      const nb = board as NotesBoard;
      const folderPath = (folderId: string | null): string => {
        const segs: string[] = [];
        let cursor = folderId;
        while (cursor) {
          const f = nb.folders.find((ff) => ff.id === cursor);
          if (!f) break;
          segs.unshift(sanitize(f.name));
          cursor = f.parentId;
        }
        return segs.join("/");
      };
      for (const ref of nb.noteRefs) {
        const note = notes[ref.noteId];
        if (!note) continue;
        const base = [dir, folderPath(ref.folderId), `${sanitize(note.title || "Untitled note")}.md`]
          .filter(Boolean)
          .join("/");
        files.push({
          rel_path: uniquePath(base),
          contents: noteToMarkdown(note.title, note.doc, catNames(note)),
        });
      }
    } else if (board.type === "plotline") {
      const lines: string[] = [`# ${item.name}\n`];
      const sections = [...board.sections].sort((a, b) => a.start - b.start);
      const points = [...board.points].sort((a, b) => a.x - b.x);
      for (const p of points) {
        const note = notes[p.noteId];
        if (!note) continue;
        const section = sections.find((sec) => p.x >= sec.start && p.x <= sec.end);
        const intensity = p.y > 0.66 ? "high" : p.y > 0.33 ? "medium" : "low";
        lines.push(
          `## ${note.title || "Untitled"}\n\n*Position ${(p.x * 100).toFixed(0)}%${
            section ? ` · ${section.name}` : ""
          } · intensity ${intensity}*\n\n${noteToMarkdown("", note.doc, catNames(note)).replace(/^#\s.*\n/, "")}`,
        );
      }
      files.push({ rel_path: uniquePath(`${dir}.md`), contents: lines.join("\n") });
    } else if (board.type === "infomap") {
      const lines: string[] = [`# ${item.name}\n`];
      const titleOf = (id: string): string => {
        const it = board.items.find((i) => i.id === id);
        if (!it) return "?";
        if (it.kind === "note") return notes[it.noteId]?.title || "Untitled note";
        if (it.kind === "text") return it.text;
        if (it.kind === "group") return it.title;
        return "image";
      };
      if (board.connections.length > 0) {
        lines.push("## Relationships\n");
        for (const c of board.connections) {
          const arrow = c.kind === "arrow" ? "→" : "—";
          lines.push(`- ${titleOf(c.from)} ${arrow}${c.label ? ` ${c.label} ${arrow}` : ""} ${titleOf(c.to)}`);
        }
      }
      const noteItems = board.items.filter((i) => i.kind === "note");
      if (noteItems.length > 0) {
        lines.push("\n## Notes\n");
        for (const it of noteItems) {
          const note = it.kind === "note" ? notes[it.noteId] : null;
          if (note) {
            lines.push(
              `### ${note.title || "Untitled note"}\n\n${noteToMarkdown("", note.doc, catNames(note)).replace(/^#\s.*\n/, "")}`,
            );
          }
        }
      }
      files.push({ rel_path: uniquePath(`${dir}.md`), contents: lines.join("\n") });
    }
  }

  await writeExportFiles(destDir, files);
  return files.length;
}

export async function exportProjectBackup(destZip: string) {
  const { projectPath } = useProject.getState();
  if (!projectPath) return;
  await saveQueue.flush();
  await exportZip(projectPath, destZip);
}
