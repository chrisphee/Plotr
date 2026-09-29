import { useEffect, useState } from "react";
import { useConnectors } from "./connectorStore";
import {
  pinterestConfigure,
  pinterestConnect,
  pinterestDisconnect,
} from "../../tauri/commands";
import { AppShell } from "../../components/shell/TopBar";
import { Button } from "../../components/ui/Button";
import { Field, TextInput } from "../../components/ui/Field";
import "./connectors.css";

export function ConnectorsScreen() {
  const status = useConnectors((s) => s.pinterest);
  const refresh = useConnectors((s) => s.refresh);
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"save" | "connect" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const showCredentials = editing || !status.configured;

  const saveCredentials = async () => {
    setBusy("save");
    setError(null);
    try {
      await pinterestConfigure(appId, appSecret);
      setAppId("");
      setAppSecret("");
      setEditing(false);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const connect = async () => {
    setBusy("connect");
    setError(null);
    try {
      await pinterestConnect();
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    setError(null);
    await pinterestDisconnect();
    await refresh();
  };

  return (
    <AppShell>
      <div className="page page--settings">
        <div className="connectors__head">
          <h1 className="page__title page__title--settings">Connectors</h1>
          <p className="field__hint">
            Connect outside services to import content. Imports are copied into your project, so
            everything keeps working offline.
          </p>
        </div>

        <div className="connector-card">
          <div className="connector-card__head">
            <span className="connector-card__name">Pinterest</span>
            <span
              className={
                "connector-card__status" +
                (status.connected ? " connector-card__status--on" : "")
              }
            >
              {status.connected
                ? `Connected${status.username ? ` as ${status.username}` : ""}`
                : status.configured
                  ? "Not connected"
                  : "Needs setup"}
            </span>
          </div>

          {showCredentials ? (
            <>
              <p className="meta">
                Create an app at developers.pinterest.com. Add the redirect URI
                http://localhost:8585/callback. Then paste its credentials here.
              </p>
              <Field label="App ID">
                {(id) => (
                  <TextInput
                    id={id}
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1234567"
                  />
                )}
              </Field>
              <Field label="App secret key">
                {(id) => (
                  <TextInput
                    id={id}
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                  />
                )}
              </Field>
              <div style={{ display: "flex", gap: "var(--sp-4)" }}>
                <Button
                  variant="primary"
                  disabled={!appId.trim() || !appSecret.trim() || busy !== null}
                  onClick={() => void saveCredentials()}
                >
                  {busy === "save" ? "Saving…" : "Save"}
                </Button>
                {status.configured && (
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
              {status.connected ? (
                <Button onClick={() => void disconnect()}>Disconnect</Button>
              ) : (
                <Button variant="primary" disabled={busy !== null} onClick={() => void connect()}>
                  {busy === "connect" ? "Waiting for browser…" : "Connect"}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Edit credentials
              </Button>
            </div>
          )}

          {busy === "connect" && (
            <p className="meta">
              Your browser opened a Pinterest sign-in page. Approve access there.
            </p>
          )}
          {error && (
            <p className="meta" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
