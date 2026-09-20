import { useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNav } from "../../app/navStore";
import { useSettings } from "../../stores/settingsStore";
import { saveQueue } from "../../lib/saveQueue";
import { launchUpdate } from "../../tauri/commands";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { ConfirmDialog } from "../../components/ui/Modal";
import type { ThemePref } from "../../app/theme";
import "../dashboard/dashboard.css";

export function AppSettingsScreen() {
  const back = useNav((s) => s.back);
  const theme = useSettings((s) => s.theme);
  const setThemePref = useSettings((s) => s.setThemePref);
  const autosave = useSettings((s) => s.autosave);
  const setAutosave = useSettings((s) => s.setAutosave);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const runUpdate = async () => {
    setConfirmUpdate(false);
    setUpdateError(null);
    try {
      await saveQueue.flush();
      await launchUpdate(); // spawns the updater and exits the app
    } catch (e) {
      setUpdateError(String(e));
    }
  };

  return (
    <main className="shell__main" style={{ height: "100%" }}>
      <div className="dash__main" style={{ maxWidth: 560 }}>
        <div>
          <Button variant="ghost" onClick={back}>
            <ArrowLeft size={15} /> Back
          </Button>
        </div>
        <h1 className="dash__boardtitle">App Settings</h1>

        <Field label="Appearance">
          {(id) => (
            <div id={id} style={{ display: "flex", gap: "var(--sp-4)" }}>
              {(["light", "dark", "system"] as ThemePref[]).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? "primary" : "secondary"}
                  onClick={() => setThemePref(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          )}
        </Field>

        <Field
          label="Automatically save while editing"
          hint="When off, boards and notes show a Save action and prompt before closing unsaved work."
        >
          {(id) => (
            <label
              htmlFor={id}
              style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}
            >
              <input
                id={id}
                type="checkbox"
                checked={autosave}
                onChange={(e) => setAutosave(e.target.checked)}
              />
              <span style={{ fontSize: "var(--fs-ui)" }}>
                {autosave ? "Autosave is on" : "Autosave is off"}
              </span>
            </label>
          )}
        </Field>

        <Field
          label="Updates"
          hint="Pulls the latest changes from the project's git repository, rebuilds, and reinstalls. Plotr closes while the update runs and reopens when it finishes."
        >
          {() => (
            <div>
              <Button variant="secondary" onClick={() => setConfirmUpdate(true)}>
                <RefreshCw size={14} /> Update Plotr
              </Button>
              {updateError && (
                <p className="meta" style={{ color: "var(--danger)", marginTop: "var(--sp-3)" }}>
                  {updateError}
                </p>
              )}
            </div>
          )}
        </Field>
      </div>

      {confirmUpdate && (
        <ConfirmDialog
          title="Update Plotr?"
          message="Your work is saved first, then Plotr closes while the update pulls the latest changes, rebuilds, and reinstalls. This can take a few minutes — the app reopens when it's done."
          confirmLabel="Update & Restart"
          onConfirm={() => void runUpdate()}
          onCancel={() => setConfirmUpdate(false)}
        />
      )}
    </main>
  );
}
