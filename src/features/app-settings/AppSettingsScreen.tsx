import { useState } from "react";
import { useNav } from "../../app/navStore";
import { useSettings } from "../../stores/settingsStore";
import { saveQueue } from "../../lib/saveQueue";
import { launchUpdate } from "../../tauri/commands";
import { AppShell } from "../../components/shell/TopBar";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { ConfirmDialog } from "../../components/ui/Modal";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import type { ThemePref } from "../../app/theme";

export function AppSettingsScreen() {
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
    <AppShell>
      <div className="page page--settings">
        <h1 className="page__title page__title--settings">App settings</h1>

        <Field label="Appearance">
          {(id) => (
            <div id={id}>
              <SegmentedControl<ThemePref>
                label="Theme"
                value={theme}
                onChange={setThemePref}
                segments={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ]}
              />
            </div>
          )}
        </Field>

        <Field
          label="Automatically save while editing"
          hint="When off, boards and notes show a Save action and prompt before closing unsaved work."
        >
          {(id) => (
            <label htmlFor={id} className="checkrow">
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

        <Field label="Connectors" hint="Connect Pinterest and other services to import images.">
          {() => (
            <div>
              <Button onClick={() => useNav.getState().navigate({ name: "connectors" })}>
                Open connectors
              </Button>
            </div>
          )}
        </Field>

        <Field
          label="Updates"
          hint="Pulls the latest changes from the project's git repository, rebuilds, and reinstalls. Plotr closes while the update runs and reopens when it finishes."
        >
          {() => (
            <div>
              <Button onClick={() => setConfirmUpdate(true)}>Update Plotr</Button>
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
          confirmLabel="Update and restart"
          onConfirm={() => void runUpdate()}
          onCancel={() => setConfirmUpdate(false)}
        />
      )}
    </AppShell>
  );
}
