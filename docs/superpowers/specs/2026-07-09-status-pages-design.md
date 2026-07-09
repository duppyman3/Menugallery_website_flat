# Status Pages — Design

**Date:** 2026-07-09
**Project:** MenuGallery flat website
**Status:** Approved

## Goal

Two status pages for the MenuGallery site:

1. An app-facing JSON endpoint the MenuGallery app can poll.
2. A human-facing status page matching the existing site design.

## Decisions

- **JSON endpoint path:** `/status.json` (app will be hard-coded to this URL).
- **Human page path:** `/status.html` (matches `privacy.html` / `terms.html` convention).
- **Single source of truth:** the human page fetches `/status.json` and renders it, so during an incident only `status.json` is edited and both surfaces update.
- **No sitemap entry;** `noindex` meta on the human page (utility page, same treatment as `404.html`).

## Components

### 1. `/status.json` (new)

Exactly two values:

```json
{ "status": "up", "message": "All systems fine" }
```

- `status`: `"up"` in normal operation. Any other value (e.g. `"down"`, `"degraded"`) is set by hand-editing this file during an incident.
- `message`: human-readable detail, displayed verbatim on the human page.

### 2. `/status.html` (new)

Follows existing site conventions: same `<head>` pattern as `privacy.html` (charset, viewport, favicons, font preloads, `styles.css`), grain overlay, `legal-header`, `legal` article layout, standard footer, `noindex`.

Behavior (small inline script):

- Fetches `/status.json` (cache: no-store).
- `status === "up"` → green pulsing dot + "All systems operational" headline.
- Any other status → one single "not up" style: amber dot (no per-status color variations) + "Service disruption" headline.
- Renders `message` verbatim below the headline, plus a "Checked just now" note.
- Fetch failure or JS disabled → neutral static fallback text ("Status information is temporarily unavailable"), never a broken-looking page.

### 3. `_headers` (edit)

Add no-cache rules so the app and browsers never act on a stale "up":

```
/status.json
  Cache-Control: no-store

/status.html
  Cache-Control: no-store

/status
  Cache-Control: no-store
```

The `/status` rule covers the extensionless pretty URL the host actually serves `status.html` at; `_headers` rules match the request path, not the file name.

## Error handling

- Human page degrades gracefully when the fetch fails (see above).
- Unknown `status` values are treated as "not up" — safer to over-warn than to show green on a typo.

## Testing

1. Serve the site locally; verify `/status.json` parses as valid JSON.
2. Load `/status.html`; confirm the green "up" state renders with the message from the JSON.
3. Hand-edit `status.json` to `"status": "down"`; reload and confirm the page shows the disruption state. Restore to `"up"`.
4. Verify fallback: temporarily rename `status.json`, reload, confirm the neutral fallback shows. Restore.

## Known limitation (accepted)

This is a flat static site: `/status.json` proves the static host is serving and always reports "up" unless manually edited. It is not an automated health check.
