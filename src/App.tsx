import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useNav } from "./app/navStore";
import { useSettings } from "./stores/settingsStore";
import { useProject } from "./stores/projectStore";
import { saveQueue, useSaveState } from "./lib/saveQueue";
import { Modal } from "./components/ui/Modal";
import { Button } from "./components/ui/Button";
import { StartScreen } from "./features/start/StartScreen";
import { DashboardScreen } from "./features/dashboard/DashboardScreen";
import { FolderScreen } from "./features/dashboard/FolderScreen";
import { BoardScreen } from "./features/boards/BoardScreen";
import { AppSettingsScreen } from "./features/app-settings/AppSettingsScreen";
import { ProjectSettingsScreen } from "./features/project-settings/ProjectSettingsScreen";
import { TrashScreen } from "./features/trash/TrashScreen";
import { NotePopupHost } from "./features/note-editor/NotePopup";
import { SearchOverlayHost } from "./features/search/SearchOverlay";
import { SearchResultsScreen } from "./features/search/SearchResultsScreen";
import { useGlobalShortcuts } from "./app/shortcuts";

export default function App() {
  const screen = useNav((s) => s.screen);
  const loaded = useSettings((s) => s.loaded);
  const init = useSettings((s) => s.init);
  const hasProject = useProject((s) => s.projectPath !== null);

  useGlobalShortcuts();

  useEffect(() => {
    void init();
  }, [init]);

  // Flush pending saves if the webview is torn down mid-debounce.
  useEffect(() => {
    const flush = () => void saveQueue.flush();
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  // Intercept window close while work is unsaved.
  const [closePrompt, setClosePrompt] = useState(false);
  useEffect(() => {
    const win = getCurrentWindow();
    const unlisten = win.onCloseRequested(async (event) => {
      if (!saveQueue.hasPending()) return;
      if (useSettings.getState().autosave) {
        event.preventDefault();
        await saveQueue.flush();
        void win.destroy();
      } else {
        event.preventDefault();
        setClosePrompt(true);
      }
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  if (!loaded) return null;

  // Screens that need an open project fall back to Start if there is none.
  const needsProject = ["dashboard", "folder", "board", "search", "trash", "projectSettings"];
  if (needsProject.includes(screen.name) && !hasProject) {
    return <StartScreen />;
  }

  return (
    <>
      <ScreenSwitch />
      <NotePopupHost />
      <SearchOverlayHost />
      <UnsavedPill />
      {closePrompt && (
        <Modal
          title="Unsaved changes"
          onClose={() => setClosePrompt(false)}
          width={440}
          footer={
            <>
              <Button variant="ghost" onClick={() => setClosePrompt(false)}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => void getCurrentWindow().destroy()}>
                Discard
              </Button>
              <Button
                variant="primary"
                autoFocus
                onClick={async () => {
                  await saveQueue.flush();
                  void getCurrentWindow().destroy();
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            You have unsaved changes. Save them before closing?
          </p>
        </Modal>
      )}
    </>
  );
}

/** Shown when autosave is off and edits are waiting to be written. */
function UnsavedPill() {
  const autosave = useSettings((s) => s.autosave);
  const pendingCount = useSaveState((s) => s.pendingCount);
  const saving = useSaveState((s) => s.saving);
  if (autosave || (pendingCount === 0 && !saving)) return null;
  return (
    <button
      onClick={() => void saveQueue.flush()}
      title="Save now (Ctrl+S)"
      style={{
        position: "fixed",
        right: "var(--sp-6)",
        bottom: "var(--sp-6)",
        zIndex: 90,
        background: "var(--ink)",
        color: "var(--ink-text)",
        borderRadius: "var(--r-dock)",
        padding: "8px 14px",
        fontSize: "var(--fs-ui)",
        fontWeight: 500,
        boxShadow: "var(--shadow-lift)",
      }}
    >
      {saving ? "Saving…" : `Save changes · Ctrl+S`}
    </button>
  );
}

function ScreenSwitch() {
  const screen = useNav((s) => s.screen);
  switch (screen.name) {
    case "start":
      return <StartScreen />;
    case "dashboard":
      return <DashboardScreen />;
    case "folder":
      return <FolderScreen folderId={screen.folderId} />;
    case "board":
      return <BoardScreen boardId={screen.boardId} />;
    case "appSettings":
      return <AppSettingsScreen />;
    case "projectSettings":
      return <ProjectSettingsScreen />;
    case "trash":
      return <TrashScreen />;
    case "search":
      return <SearchResultsScreen key={screen.query} initialQuery={screen.query} />;
  }
}
