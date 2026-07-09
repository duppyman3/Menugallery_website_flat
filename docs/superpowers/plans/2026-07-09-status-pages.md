# Status Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an app-facing JSON status endpoint (`/status.json`) and a human-facing status page (`/status.html`) that renders it, to the MenuGallery flat static site.

**Architecture:** Both pages are static files served by the host (Cloudflare Pages/Netlify-style, configured via `_headers`). `status.json` is the single source of truth; `status.html` fetches it client-side and renders an up/down state, degrading to neutral text if the fetch fails or JS is off. No build step, no framework.

**Tech Stack:** Plain HTML/CSS/vanilla JS. Existing site stylesheet `styles.css` (design tokens: `--paper #F4F4F2`, `--ink #2E2E2E`, `--ink-muted #8A8A8A`, `--accent #F09A4B`, `--card #FFFFFF`, fonts Fraunces + Instrument Sans). Local verification via `npx http-server`.

**Spec:** `docs/superpowers/specs/2026-07-09-status-pages-design.md`

## Global Constraints

- JSON endpoint is exactly: `{ "status": "up", "message": "All systems fine" }` — two keys, no more.
- Paths are exactly `/status.json` and `/status.html` (the app hard-codes `/status.json`).
- Any `status` value other than the exact string `"up"` renders as the single "not up" style (amber dot, headline "Service disruption"). No per-status color variations.
- Fallback text when fetch fails or JS is disabled: "Status information is temporarily unavailable".
- `status.html` gets `<meta name="robots" content="noindex">` and is NOT added to `sitemap.xml`.
- Both new files get `Cache-Control: no-store` via `_headers`.
- Match existing site conventions: same `<head>` boilerplate as `privacy.html`/`404.html`, grain overlay, `legal-header`, `legal` article, standard footer.
- This repo is a flat static site: there is no test framework. Each task's "test cycle" is the explicit verification steps given — run them and confirm the exact expected output before committing.
- Work happens on the existing `status-pages` branch.

---

### Task 1: `/status.json` endpoint + cache headers

**Files:**
- Create: `status.json`
- Modify: `_headers` (append at end of file)

**Interfaces:**
- Consumes: nothing.
- Produces: `GET /status.json` → `{ "status": "up", "message": "All systems fine" }`. Task 2's page fetches this URL and reads exactly the `status` (string) and `message` (string) keys.

- [ ] **Step 1: Create `status.json`**

Create `status.json` at the repo root with exactly this content:

```json
{ "status": "up", "message": "All systems fine" }
```

- [ ] **Step 2: Verify the JSON parses**

Run (PowerShell):

```powershell
Get-Content status.json -Raw | ConvertFrom-Json
```

Expected output:

```
status message
------ -------
up     All systems fine
```

If `ConvertFrom-Json` throws, the file is malformed — fix before continuing.

- [ ] **Step 3: Add no-store cache rules to `_headers`**

`_headers` currently ends with the `/screenshots/*` block. Append (keeping one blank line between blocks):

```
/status.json
  Cache-Control: no-store

/status.html
  Cache-Control: no-store
```

Final `_headers` content must be:

```
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/screenshots/*
  Cache-Control: public, max-age=31536000, immutable

/status.json
  Cache-Control: no-store

/status.html
  Cache-Control: no-store
```

Note: `_headers` is applied by the production host, not by local dev servers — it cannot be verified locally. Verify the file content matches the block above exactly.

- [ ] **Step 4: Commit**

```powershell
git add status.json _headers
git commit -m "feat: add /status.json app status endpoint with no-store caching"
```

---

### Task 2: `/status.html` human status page

**Files:**
- Create: `status.html`

**Interfaces:**
- Consumes: `GET /status.json` from Task 1 — reads `status` (string) and `message` (string).
- Produces: nothing consumed by later tasks (this is the last task).

- [ ] **Step 1: Create `status.html`**

Create `status.html` at the repo root with exactly this content:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Status — MenuGallery</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#F4F4F2">
<meta name="color-scheme" content="light">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
<style>
.legal .status-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--card);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  margin: 2rem 0;
}
.legal .status-dot {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var(--ink-muted);
  margin-top: 0.45rem;
  flex: none;
}
.legal .status-dot.is-up {
  background: #3F8F5F;
  animation: status-pulse 2s var(--ease-out) infinite;
}
.legal .status-dot.is-down {
  background: var(--accent);
}
@keyframes status-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(63, 143, 95, 0.35); }
  70%  { box-shadow: 0 0 0 0.6rem rgba(63, 143, 95, 0); }
  100% { box-shadow: 0 0 0 0 rgba(63, 143, 95, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .legal .status-dot.is-up { animation: none; }
}
.legal .status-headline {
  font-family: var(--font-display);
  font-size: 1.35rem;
  margin: 0;
}
.legal .status-message {
  margin: 0.35rem 0 0;
}
.legal .status-checked {
  margin: 0.35rem 0 0;
  color: var(--ink-muted);
  font-size: 0.875rem;
}
</style>
</head>
<body>
  <div class="grain" aria-hidden="true"></div>
  <header class="legal-header">
    <div class="container">
      <a href="/" class="brand">Menu<span class="wordmark-accent">Gallery</span></a>
    </div>
  </header>
  <article class="legal">
    <p class="eyebrow">MenuGallery</p>
    <h1>Status</h1>
    <div class="status-card" id="status-live" role="status">
      <span class="status-dot" id="status-dot" aria-hidden="true"></span>
      <div>
        <p class="status-headline" id="status-headline">Checking status…</p>
        <p class="status-message" id="status-message"></p>
        <p class="status-checked" id="status-checked"></p>
      </div>
    </div>
    <noscript>
      <style>#status-live { display: none; }</style>
      <div class="status-card">
        <span class="status-dot" aria-hidden="true"></span>
        <div>
          <p class="status-headline">Status information is temporarily unavailable</p>
        </div>
      </div>
    </noscript>
    <p>The MenuGallery app reads this status from <a href="/status.json">/status.json</a>.</p>
  </article>
  <footer class="site-footer">
    <div class="container footer-row">
      <span class="brand">Menu<span class="wordmark-accent">Gallery</span></span>
      <span class="footer-note">Photograph a menu, see the dishes.</span>
      <nav class="footer-nav">
        <a href="/privacy.html">Privacy Policy</a>
        <a href="/terms.html">Terms of Use</a>
      </nav>
      <span class="footer-note">© 2026 MenuGallery</span>
    </div>
  </footer>
  <script>
  (function () {
    var dot = document.getElementById('status-dot');
    var headline = document.getElementById('status-headline');
    var message = document.getElementById('status-message');
    var checked = document.getElementById('status-checked');
    function fallback() {
      dot.className = 'status-dot';
      headline.textContent = 'Status information is temporarily unavailable';
      message.textContent = '';
      checked.textContent = '';
    }
    fetch('/status.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (data) {
        var up = data.status === 'up';
        dot.className = 'status-dot ' + (up ? 'is-up' : 'is-down');
        headline.textContent = up ? 'All systems operational' : 'Service disruption';
        message.textContent = data.message || '';
        checked.textContent = 'Checked just now — ' +
          new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      })
      .catch(fallback);
  })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Start a local server**

Run from the repo root (background it or use a second terminal — it blocks):

```powershell
npx -y http-server -p 8080 -c-1
```

Expected: output includes `Available on:` and `http://127.0.0.1:8080`. (`-c-1` disables its cache so edits show immediately.)

- [ ] **Step 3: Verify the "up" state**

Load `http://127.0.0.1:8080/status.html` in a browser. If available, invoke the `playwright-cli` skill to load the page and read its visible text instead of checking by eye.

Expected, all four:
1. Headline reads "All systems operational".
2. Message below it reads "All systems fine" (from the JSON, not hard-coded — confirm by checking `status.html` contains no such string).
3. The dot is green (`#3F8F5F`) and pulsing.
4. A "Checked just now — <time>" line shows.

- [ ] **Step 4: Verify the "not up" state**

Edit `status.json` to:

```json
{ "status": "down", "message": "We are investigating an issue." }
```

Reload the page. Expected: amber dot (site accent `#F09A4B`, not pulsing), headline "Service disruption", message "We are investigating an issue."

Then restore `status.json` to exactly:

```json
{ "status": "up", "message": "All systems fine" }
```

Reload and confirm the green state is back.

- [ ] **Step 5: Verify the fetch-failure fallback**

Rename `status.json` to `status.json.bak`, reload the page. Expected: neutral gray dot, headline "Status information is temporarily unavailable", no message, no "Checked" line.

Rename `status.json.bak` back to `status.json`, reload, confirm green "up" state. Then re-run Task 1 Step 2 (`Get-Content status.json -Raw | ConvertFrom-Json`) to confirm the restored file still parses with `status = up`, `message = All systems fine`. Stop the local server.

- [ ] **Step 6: Commit**

```powershell
git add status.html
git commit -m "feat: add human-facing /status.html driven by /status.json"
```
