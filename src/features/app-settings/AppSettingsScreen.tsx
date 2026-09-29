import { useState } from "react";
import clsx from "clsx";
import { Check, ChevronRight } from "lucide-react";
import { useNav } from "../../app/navStore";
import { useSettings } from "../../stores/settingsStore";
import { saveQueue } from "../../lib/saveQueue";
import { launchUpdate } from "../../tauri/commands";
import { AppShell } from "../../components/shell/TopBar";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Switch } from "../../components/ui/Switch";
import { ACCENTS, type ThemePref } from "../../app/theme";
import "./appSettings.css";

export function AppSettingsScreen() {
  const theme = useSettings((s) => s.theme);
  const setThemePref = useSettings((s) => s.setThemePref);
  const accent = useSettings((s) => s.accent);
  const setAccentPref = useSettings((s) => s.setAccentPref);
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
    <AppShell grouped largeTitle>
      <div className="settings">
        <h1 className="page__title">App settings</h1>

        <section className="fgroup">
          <h2 className="fgroup__title">Appearance</h2>
          <div className="fgroup__box">
            <div className="frow">
              <span className="frow__label">Theme</span>
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
            <div className="frow">
              <span className="frow__text">
                <span className="frow__label">Accent colour</span>
                <span className="frow__hint">Buttons, selection and the plot curve use it.</span>
              </span>
              <div className="accents" role="radiogroup" aria-label="Accent colour">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    role="radio"
                    aria-checked={accent === a.value}
                    aria-label={a.label}
                    title={a.label}
                    className={clsx("accent", accent === a.value && "accent--on")}
                    style={{ background: a.swatch }}
                    onClick={() => setAccentPref(a.value)}
                  >
                    {accent === a.value && <Check size={12} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="fgroup">
          <h2 className="fgroup__title">Editing</h2>
          <div className="fgroup__box">
            <div className="frow">
              <span className="frow__text">
                <label className="frow__label" htmlFor="autosave">
                  Save automatically
                </label>
                <span className="frow__hint">
                  When off, boards and notes show a Save action and ask before closing unsaved work.
                </span>
              </span>
              <Switch id="autosave" checked={autosave} onChange={setAutosave} />
            </div>
          </div>
        </section>

        <section className="fgroup">
          <h2 className="fgroup__title">Connections</h2>
          <div className="fgroup__box">
            <button className="frow frow--link" onClick={() => useNav.getState().navigate({ name: "connectors" })}>
              <span className="frow__text">
                <span className="frow__label">Connectors</span>
                <span className="frow__hint">Connect Pinterest and other services to import images.</span>
              </span>
              <ChevronRight size={16} strokeWidth={2} className="frow__chev" />
            </button>
          </div>
        </section>

        <section className="fgroup">
          <h2 className="fgroup__title">Updates</h2>
          <div className="fgroup__box">
            <div className="frow">
              <span className="frow__text">
                <span className="frow__label">Update Plotr</span>
                <span className="frow__hint">
                  Pulls the latest changes, rebuilds and reinstalls. Plotr closes while the update runs and reopens
                  when it finishes.
                </span>
                {updateError && <span className="frow__error">{updateError}</span>}
              </span>
              <Button onClick={() => setConfirmUpdate(true)}>Update</Button>
            </div>
          </div>
        </section>
      </div>

      {confirmUpdate && (
        <ConfirmDialog
          title="Update Plotr?"
          message="Your work is saved first. Then Plotr closes while the update pulls the latest changes, rebuilds and reinstalls. This can take a few minutes. The app reopens when it is done."
          confirmLabel="Update and restart"
          onConfirm={() => void runUpdate()}
          onCancel={() => setConfirmUpdate(false)}
        />
      )}
    </AppShell>
  );
}
