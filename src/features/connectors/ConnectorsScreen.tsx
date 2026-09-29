import { useEffect, useState } from "react";
import { useConnectors } from "./connectorStore";
import { pinterestConfigure, pinterestConnect, pinterestDisconnect } from "../../tauri/commands";
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
    <AppShell grouped largeTitle>
      <div className="settings">
        <div className="page__head">
          <h1 className="page__title">Connectors</h1>
          <p className="page__sub">
            Connect outside services to import content. Imports are copied into your project, so everything keeps
            working offline.
          </p>
        </div>

        <section className="fgroup">
          <div className="fgroup__box">
            <div className="frow">
              <span className="frow__text">
                <span className="frow__label">Pinterest</span>
                <span className="frow__hint">Import pins as images for Info Maps, notes and project icons.</span>
              </span>
              <span className={status.connected ? "connstatus connstatus--on" : "connstatus"}>
                <span className="connstatus__dot" />
                {status.connected
                  ? `Connected${status.username ? ` as ${status.username}` : ""}`
                  : status.configured
                    ? "Not connected"
                    : "Needs setup"}
              </span>
            </div>

            {showCredentials ? (
              <div className="frow frow--stack">
                <p className="frow__hint">
                  Create an app at developers.pinterest.com. Add the redirect URI http://localhost:8585/callback.
                  Then paste its credentials here.
                </p>
                <Field label="App ID">
                  {(id) => (
                    <TextInput id={id} value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="1234567" />
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
                <div className="connectors__actions">
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
              </div>
            ) : (
              <div className="frow">
                <div className="connectors__actions">
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
              </div>
            )}
          </div>
          {busy === "connect" && (
            <p className="fgroup__note">Your browser opened a Pinterest sign-in page. Approve access there.</p>
          )}
          {error && (
            <p className="fgroup__note connectors__error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
