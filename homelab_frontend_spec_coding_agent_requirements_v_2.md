# Homelab Frontend — Vanilla HTML/CSS/JS Requirements (v2.0)

**Owner:** Max Smeets  
**Scope:** Frontend only, no framework (vanilla HTML, CSS, JS with ES Modules). Backend is out of scope. All data comes from a local mock JSON file.

---

## 1) Purpose & Vision
A single‑page, browser‑based dashboard, built without frameworks, to monitor and (stub) manage:
Pi‑hole, Mesh VPN, Home Assistant, n8n, Vaultwarden, Network Monitoring, Media Server, Storage/Photos. Day‑1 uses only local mock data; actions are simulated in the client.

Out of scope: Authentication, real service integrations, APIs, secrets, persistence beyond localStorage.

---

## 2) Success Criteria
- Loads only static assets (HTML/CSS/JS) plus `/mock/homelab.json`.
- Overview dashboard with service tiles showing name, status, latency, CPU/RAM, version, last refresh, alert badge.
- Dedicated service detail views with Overview, Metrics, Alerts, Actions, Config, Logs, all powered by mock data.
- Global Alerts Center with filter (service, severity) and client‑side acknowledge.
- Responsive layout, light/dark theme toggle with localStorage persistence.
- Settings page to edit mock endpoints (client‑side only) and reload mock JSON.
- Lighthouse desktop ≥ 90, keyboard navigable, color contrast AA.

---

## 3) IA & Routing (Hash‑Routing)
- `#/` Overview Dashboard  
- `#/alerts` Alerts Center  
- `#/services` Service Directory  
- `#/services/:id` Service Detail (tabs: Overview, Metrics, Alerts, Actions, Config, Logs)  
- `#/settings` Settings  
- `#/about` About/Changelog

Routing uses `location.hash` + a minimal router module. All navigation updates content without page reloads.

---

## 4) Folder Structure
```
public/
  index.html
  assets/
    icons/ (SVGs)
    fonts/
  css/
    base.css      (normalize + variables)
    layout.css    (grid, header, sidebar)
    components.css (cards, tables, pills, toasts)
    themes.css    (light/dark, high‑contrast)
  js/
    main.js           (bootstrap, initial load)
    router.js         (hash router)
    store.js          (app state, selectors, persistence)
    ui/
      shell.js        (header, sidebar, toasts)
      dashboard.js    (overview page)
      alerts.js       (alerts page)
      services.js     (services directory)
      serviceDetail.js (detail tabs, charts)
      settings.js     (settings page)
      components/
        serviceTile.js
        kpiGrid.js
        charts.js      (lightweight charting)
        table.js
        logViewer.js
        jsonViewer.js
        dialogs.js
        commandPalette.js
    lib/
      dom.js          (qs/qsa helpers, templating)
      events.js       (pub/sub event bus)
      time.js         (formatters)
      mockApi.js      (fetch mock JSON, simulate latency)
      metrics.js      (down‑sampling, stats)
  mock/
    homelab.json
```

---

## 5) Data Model (Mock JSON)
Same schema as v1 with 8 services, 20–40 alerts, and sparse timeseries. File: `public/mock/homelab.json`.

Top‑level keys: `meta`, `summary`, `services`, `alerts`, `settings`.

Service base fields: `id, name, category, status, uptimePct24h, latencyMs, cpuPct, ramMb, diskGbUsed, version, endpoint, tags, kpis[], metrics.timeseries{...}, alerts[], actions[], config{}, logs[]`.

> Reuse the abridged example from v1; keep values realistic and compact. Timestamps are ISO 8601 strings.

---

## 6) Type Hints (JSDoc typedefs)
Use JSDoc for developer ergonomics in plain JS files (enables IntelliSense):
```js
/** @typedef {"info"|"warning"|"critical"|"error"} Severity */
/** @typedef {{key:string,label:string,value:number|string}} KPI */
/** @typedef {[string, number]} TimePoint */
/** @typedef {{key:string,label:string,danger?:boolean}} ServiceAction */
/** @typedef {{id:string,severity:Severity,title:string,createdAt:string,ack:boolean}} ServiceAlert */
/** @typedef {{ts:string,msg:string}} LogLine */
/** @typedef {{
 *  id:string,name:string,category:string,icon?:string,status:string,
 *  uptimePct24h?:number,latencyMs?:number,cpuPct?:number,ramMb?:number,diskGbUsed?:number,
 *  version?:string,endpoint?:string,tags?:string[],kpis:KPI[],
 *  metrics?:{timeseries?:Record<string,TimePoint[]>},alerts?:ServiceAlert[],
 *  actions?:ServiceAction[],config?:Record<string,any>,logs?:LogLine[]
 * }} ServiceItem */
/** @typedef {ServiceAlert & {serviceId:string}} GlobalAlert */
/** @typedef {{theme:"light"|"dark"|"system",featureFlags:Record<string,boolean>,endpoints:Record<string,string>}} Settings */
/** @typedef {{meta:any,summary:any,services:ServiceItem[],alerts:GlobalAlert[],settings:Settings}} HomelabData */
```

---

## 7) Rendering Strategy
- **No framework.** Use small, focused render functions that return DOM nodes or HTML strings, then `replaceChildren` into regions.
- **Templates:** Build with template literals, attach event listeners after insertion.
- **State:** A simple store module with immutable updates, `subscribe(selector, listener)` pattern, and localStorage persistence for: theme, acknowledged alerts, endpoint edits.
- **Events:** Minimal pub/sub (`events.js`) with topics like `alerts/ack`, `theme/change`, `data/reloaded`, `service/action`.

---

## 8) Components (Vanilla)
- **App Shell** (`shell.js`): header (logo, search, theme toggle), collapsible sidebar (nav), content outlet, toast area.
- **Service Tile** (`serviceTile.js`): status pill, KPIs, tiny sparkline (SVG).
- **KPI Grid** (`kpiGrid.js`): auto‑fit CSS grid.
- **Charts** (`charts.js`): tiny zero‑dependency SVG charts (line/bar). Tooltip via `pointermove`.
- **Tables** (`table.js`): sortable headers, aria roles.
- **Log Viewer** (`logViewer.js`): virtualized list (overscan), filter input.
- **JSON Viewer** (`jsonViewer.js`): pretty print + copy‑to‑clipboard.
- **Dialogs** (`dialogs.js`): confirm modal, focus trap.
- **Command Palette** (`commandPalette.js`): `Ctrl/Cmd+K` overlay with fuzzy search over services/actions (client‑side only).

---

## 9) Pages & Behaviors
- **Dashboard (`#/`)**: Grid of service tiles (sort by status/name/latency), Health summary, recent 5 alerts, Quick actions: Reload Mock, Silence All (client only).
- **Alerts (`#/alerts`)**: Table view, filters (severity/service/ack), bulk ack/unack (store only).
- **Services (`#/services`)**: Grid or list toggle, search, tag filters.
- **Service Detail (`#/services/:id`)**: Tabs (Overview, Metrics, Alerts, Actions, Config, Logs). Actions trigger confirm; show toast result; no real calls.
- **Settings (`#/settings`)**: Theme toggle, feature flags, endpoint editor, Reload Mock Data.
- **About (`#/about`)**: App version, mock data timestamp, changelog.

---

## 10) Styling (Pure CSS)
- **Methodology:** CSS custom properties + utility classes + BEM‑ish components.
- **Files:** `base.css` (reset/normalize, variables, typography), `layout.css` (grid areas, responsive), `components.css` (cards, pills, buttons, tables, forms), `themes.css` (light/dark via `data-theme` on `<html>`).
- **Responsive:** CSS Grid for main layout; fluid type; cards wrap to 1/2/3 columns on xs/md/lg.
- **Status Colors:** Define tokens `--c-ok`, `--c-warn`, `--c-err`, `--c-info` with sufficient contrast. Never rely on color alone; include icons and text labels.

---

## 11) Accessibility
- Keyboard: Skip link, focus states, `:focus-visible`, ESC closes dialogs/palette.
- ARIA: `role="tablist"/"tab"`, `aria-selected`, `aria-live="polite"` for toasts, `aria-busy` while loading.
- Tables: `<caption>`, `<th scope>`; ensure headers associate.
- Reduced motion: respect `prefers-reduced-motion`.

---

## 12) Performance
- No bundler required. Target TTI < 2s on mid‑range laptop.
- Lazy render off‑screen tabs; virtualize logs; throttle resize/scroll.
- Downsample timeseries to ≤ 200 points before charting.
- Defer non‑critical JS (`type="module"` + `defer`), inline critical CSS ≤ 8KB into `index.html`.

---

## 13) Persistence (Client‑Side Only)
- `localStorage` keys: `hl.theme`, `hl.acks`, `hl.settings.endpoints`.
- Provide import/export of settings as JSON from Settings page.

---

## 14) Mock API (`lib/mockApi.js`)
```js
import { sleep } from './time.js';

let cache = null;
export async function loadMock() {
  if (!cache) cache = fetch('./mock/homelab.json').then(r => r.json());
  return structuredClone(await cache);
}
export async function reloadMock() {
  cache = null; return loadMock();
}
export async function triggerAction(serviceId, actionKey) {
  await sleep(250);
  return Math.random() > 0.1 ? { ok: true, message: 'Action completed (mock)' } : { ok: false, message: 'Mock failure' };
}
```

---

## 15) Minimal Router (`router.js`)
- Parses `location.hash` into `{ path, params }`.
- Registers routes: `/`, `/alerts`, `/services`, `/services/:id`, `/settings`, `/about`.
- On `hashchange`, calls the appropriate render function. Unknown routes → 404 view.

---

## 16) State Store (`store.js`)
```js
const listeners = new Set();
const state = { data: null, acks: new Set(JSON.parse(localStorage.getItem('hl.acks')||'[]')), theme: localStorage.getItem('hl.theme')||'system', settings: { endpoints: {} } };
export const getState = () => state;
export function setState(patch) { Object.assign(state, patch); persist(); listeners.forEach(l => l(state)); }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function persist(){ localStorage.setItem('hl.theme', state.theme); localStorage.setItem('hl.acks', JSON.stringify([...state.acks])); localStorage.setItem('hl.settings.endpoints', JSON.stringify(state.settings.endpoints||{})); }
```

---

## 17) Entry (`index.html` & `main.js`)
- `index.html`: semantic layout regions (`header`, `nav`, `main`, `aside` for alerts), root containers for content, minimal critical CSS, module script tags.
- `main.js`: boot sequence → load mock → hydrate store → render shell → navigate to current hash.

---

## 18) Testing (Framework‑Light)
- **E2E:** Playwright with static `npx http-server public` (CI matrix for Chrome/Firefox/WebKit).  
- **Unit:** Web Test Runner (or bare Jest‑free assertions) for pure functions (router parsing, metrics downsampling).  
- **Accessibility:** `@axe-core/playwright` check on main views (dev only).

---

## 19) Developer Tasks
1) Scaffold `public/` tree, create `index.html`, CSS files, and empty JS modules listed above.  
2) Implement shell, router, store, and mockApi; load and display summary numbers on dashboard.  
3) Build `ServiceTile` and services grid with sorting and status filtering.  
4) Implement Service Detail tabs with lazy rendering and SVG charts.  
5) Build Alerts Center with filters and ack state.  
6) Build Settings page with theme toggle, endpoints editor, reload mock.  
7) Add command palette (Ctrl/Cmd+K) for services and actions.  
8) Add toasts and confirm dialogs.  
9) Add e2e smoke tests and basic accessibility checks.  

---

## 20) Definition of Done (Prototype v1)
- Runs from any static server, no build step required.
- All routes functional; mock data loads; alerts can be acknowledged; theme persists.
- Charts render from timeseries; logs list virtualized; config is viewable & copyable.
- Performance and a11y targets met on desktop; mobile layout usable.

---

## 21) Sample `index.html` (skeleton)
```html
<!doctype html>
<html lang="en" data-theme="system">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Homelab</title>
    <link rel="stylesheet" href="./css/base.css" />
    <link rel="stylesheet" href="./css/layout.css" />
    <link rel="stylesheet" href="./css/components.css" />
    <link rel="stylesheet" href="./css/themes.css" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <header id="app-header"></header>
    <div class="app">
      <nav id="app-nav" aria-label="Main"></nav>
      <main id="main" tabindex="-1">
        <div id="route-outlet"></div>
      </main>
      <aside id="right-rail" aria-label="Recent alerts"></aside>
    </div>
    <div id="toasts" aria-live="polite" aria-atomic="true"></div>
    <script type="module" src="./js/main.js" defer></script>
  </body>
</html>
```

---

## 22) Notes for Future (Optional)
- Import Maps to alias long paths.
- PWA manifest & offline read‑only cache of last mock.
- Web Workers for chart down‑sampling on large datasets.

*End of vanilla v2.0 requirements.*

