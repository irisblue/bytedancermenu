# Supabase Deployment

This project is a static ByteCanteen menu picker. The safest Volcengine Supabase deployment shape is an Edge Function that serves one bundled HTML page.

## Why Edge Function

- The app currently uses `index.html`, `styles.css`, `app.js`, and embedded menu JSON.
- `app.js` already falls back to `#embedded-menu` when `data/menu.lite.json` is not available.
- A single Edge Function avoids public Storage path and cache issues for multi-file static hosting.

## Prerequisites

Install or unpack the `byted-supabase` skill, then run commands from that skill directory:

```bash
uv run ./scripts/call_volcengine_supabase.py <action> [options]
```

The skill requires one of these auth setups:

```bash
export VOLCENGINE_ACCESS_KEY=...
export VOLCENGINE_SECRET_KEY=...
export VOLCENGINE_REGION=cn-beijing
```

or a Codex/Agent session with the Volcengine Supabase MCP server enabled.

## Build Function Source

From this project root:

```bash
npm run build:supabase
```

This regenerates `data/menu.lite.json`, embeds it into `index.html`, then writes:

```text
supabase/functions/workspace-menu/index.ts
```

## Create Workspace

From the `byted-supabase` skill directory:

```bash
uv run ./scripts/call_volcengine_supabase.py create-workspace --workspace-name workspace-menu
uv run ./scripts/call_volcengine_supabase.py list-workspaces
```

Record the returned `ws-...` id.

## Deploy

From the `byted-supabase` skill directory, replace the source path with this repo path:

```bash
uv run ./scripts/call_volcengine_supabase.py deploy-edge-function \
  --workspace-id ws-xxxx \
  --function-name workspace-menu \
  --source-file /Users/bytedance/Documents/lunchmenu/supabase/functions/workspace-menu/index.ts \
  --no-verify-jwt
```

Then inspect the workspace URL:

```bash
uv run ./scripts/call_volcengine_supabase.py get-workspace-url --workspace-id ws-xxxx
uv run ./scripts/call_volcengine_supabase.py list-edge-functions --workspace-id ws-xxxx
```

The public page URL should be the workspace function endpoint for `workspace-menu`.

## Daily Refresh

Menu data still comes from the ByteCanteen API and requires the local `.session.json` session value. Until Supabase function environment variables/secrets are available through the tool, keep the 09:30 refresh local:

```bash
npm run fetch
npm run build:supabase
uv run ./scripts/call_volcengine_supabase.py deploy-edge-function \
  --workspace-id ws-xxxx \
  --function-name workspace-menu \
  --source-file /Users/bytedance/Documents/lunchmenu/supabase/functions/workspace-menu/index.ts \
  --no-verify-jwt
```

If the MCP exposes Edge Function secrets later, the fetch script can be ported into a server-side function and scheduled inside Supabase.
