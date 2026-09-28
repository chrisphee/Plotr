# Connectors

Connectors link outside services to Plotr. Imports are always copied into the
project's `assets/` folder, so projects keep working fully offline.

Pinterest is the first connector. The design leaves room for more (Unsplash,
etc.): add a card to the Connectors screen and a matching Rust module.

## Where things live

| Piece | Path |
|---|---|
| Rust: OAuth, API calls, image import | `src-tauri/src/commands/pinterest.rs` |
| Credentials + tokens (app-level, not per project) | `<app config dir>/pinterest.json` |
| UI: Connectors screen | `src/features/connectors/ConnectorsScreen.tsx` |
| UI: board/pin picker modal | `src/features/connectors/PinterestPicker.tsx` |
| Status store | `src/features/connectors/connectorStore.ts` |
| TS command wrappers | `src/tauri/commands.ts` (`pinterest*`) |

## Setup (one time)

1. Convert your Pinterest account to a business account.
2. Create an app at developers.pinterest.com with Trial access.
   - Redirect URI, exactly: `http://localhost:8585/callback`
   - Scopes: `boards:read`, `pins:read`
3. In Plotr: Start screen → Connectors (or App Settings → Open Connectors).
4. Paste the App ID and App secret key. Save.
5. Click Connect. The browser opens Pinterest. Approve access.

## How the OAuth flow works

1. `pinterest_connect` binds a listener on `127.0.0.1:8585`.
2. It opens the Pinterest consent URL in the default browser.
3. Pinterest redirects to `localhost:8585/callback?code=…&state=…`.
4. Rust validates the `state`, exchanges the code for tokens, and stores them.
5. Tokens refresh automatically when they are near expiry.
6. The flow times out after 3 minutes if the browser never comes back.

The app secret and tokens never reach the frontend. The UI only sees
`{ configured, connected, username }`.

## Import points

"From Pinterest" appears in three places, only while connected:

- **Info Map** → Image tool → "From Pinterest…" (multi-select)
- **Note popup** → attachments → "From Pinterest" (multi-select)
- **Project Settings** → Cover & colour → "From Pinterest" (single)

The picker lists boards, then pin thumbnails, with "Load more" paging.
`pinterest_import_pin` downloads the largest image variant and stores it
through the same content-hashed path as every other attachment.

## Commands

| Command | Purpose |
|---|---|
| `pinterest_configure(app_id, app_secret)` | Save credentials |
| `pinterest_status()` | `{ configured, connected, username }` |
| `pinterest_connect()` | Run the OAuth flow |
| `pinterest_disconnect()` | Drop tokens |
| `pinterest_list_boards()` | The user's boards |
| `pinterest_list_pins(board_id, bookmark?)` | One page of pins |
| `pinterest_import_pin(project_path, image_url, pin_id)` | Download into `assets/` |

## Limits and notes

- Trial access allows 1,000 requests per day. One import session uses tens.
- Port 8585 must be free during Connect.
- Disconnect only removes local tokens. Full revocation: Pinterest settings →
  Security → Apps.
- Privacy policy for the Pinterest app review: `PRIVACY.md` in the repo root.
