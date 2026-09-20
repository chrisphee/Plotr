import { create } from "zustand";
import { writeProjectFile } from "../tauri/commands";

/* Debounced, per-file persistence. Callers schedule a rel-path with a
   serializer; the queue writes the *current* state when the debounce fires,
   so rapid edits collapse into one atomic write per file.

   With autosave off, writes wait for an explicit flush (Ctrl+S / Save);
   `useSaveState` exposes the dirty count for the UI. */

const DEBOUNCE_MS = 800;

type Serializer = () => string;

interface Pending {
  serialize: Serializer;
  timer: ReturnType<typeof setTimeout> | null;
}

const pending = new Map<string, Pending>();
let autosave = true;
let onErrorHandler: ((relPath: string, err: unknown) => void) | null = null;

interface SaveState {
  pendingCount: number;
  saving: boolean;
}

export const useSaveState = create<SaveState>(() => ({ pendingCount: 0, saving: false }));

function publish() {
  useSaveState.setState({ pendingCount: pending.size });
}

function key(projectPath: string, relPath: string) {
  return `${projectPath}::${relPath}`;
}

async function writeNow(projectPath: string, relPath: string, serialize: Serializer) {
  try {
    await writeProjectFile(projectPath, relPath, serialize());
  } catch (err) {
    console.error(`save failed for ${relPath}`, err);
    onErrorHandler?.(relPath, err);
  }
}

export const saveQueue = {
  setAutosave(enabled: boolean) {
    autosave = enabled;
    if (enabled && pending.size > 0) void this.flush();
  },

  /** Schedule (or reschedule) a save of one project file. */
  schedule(projectPath: string, relPath: string, serialize: Serializer) {
    const k = key(projectPath, relPath);
    const existing = pending.get(k);
    if (existing?.timer) clearTimeout(existing.timer);
    const timer = autosave
      ? setTimeout(() => {
          pending.delete(k);
          publish();
          void writeNow(projectPath, relPath, serialize);
        }, DEBOUNCE_MS)
      : null;
    pending.set(k, { serialize, timer });
    publish();
  },

  /** Write everything still pending, immediately. Await before closing. */
  async flush() {
    const entries = [...pending.entries()];
    pending.clear();
    publish();
    useSaveState.setState({ saving: true });
    try {
      await Promise.all(
        entries.map(([k, p]) => {
          if (p.timer) clearTimeout(p.timer);
          const sep = k.indexOf("::");
          return writeNow(k.slice(0, sep), k.slice(sep + 2), p.serialize);
        }),
      );
    } finally {
      useSaveState.setState({ saving: false });
    }
  },

  hasPending(): boolean {
    return pending.size > 0;
  },

  onError(handler: (relPath: string, err: unknown) => void) {
    onErrorHandler = handler;
  },
};
