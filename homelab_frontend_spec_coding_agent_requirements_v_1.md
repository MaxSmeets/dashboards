# Homelab Frontend — Coding Agent Requirements (v1.0)

**Owner:** Max Smeets  
**Scope:** Frontend only (browser-based). Backend implementation is out of scope; we will use mock data and stubbed actions.  
**Goal Date for First Clickable Prototype:** 2 weeks from start (frontend only).  

---

## 1) Purpose & Vision
A unified, browser-based dashboard to **monitor and manage** core homelab services from one place. Day‑1 services:
- Pi-hole (DNS-wide ad blocker)
- Mesh VPN (e.g., Tailscale/WireGuard/ZeroTier)
- Home Assistant (smart home automations)
- n8n (workflow automations)
- Vaultwarden (password manager)
- Network monitoring tools (e.g., Prometheus/Node Exporter/Smokeping or SNMP surface)
- Media servers (Plex/Jellyfin/Emby) & music (Navidrome/Koel)
- Personal storage (Nextcloud/Immich/TrueNAS/Samba share)

The dashboard should present a **single pane of glass** with health/uptime, current load, alerts, and quick actions. Initial build relies on **mock JSON**; later we will connect a backend/API.

**Out-of-scope (for this task):** Auth backends, API gateways, service-side integrations, SSH orchestration, secrets management, persistent storage, role-based access, real service control. We only create **UI and mock data flows**.

---

## 2) Success Criteria (Acceptance)
- Load dashboard using **local mock JSON**; no network calls beyond local static files.
- Global status view: each service tile shows **name, status, latency, version, CPU/RAM**, last refresh time, and alert badge.
- Detail page per service with:
  - Health timeline (mocked), key metrics, recent events/logs, common actions (stubbed), configuration snapshot (read-only), link out to native UI.
- A **unified Alerts center** with filtering (by service, severity) and acknowledgment (client-only state).
- **Responsive UI** (mobile, tablet, desktop).  
- **Light/Dark theme** toggle persisted locally.
- **Settings** page to manage endpoint placeholders and feature flags (mock only).
- **Unit tests** for at least 10 core components; **e2e** smoke test for main flows using mock data.
- Lighthouse (local) performance score ≥ 90 (desktop) on mock build; CLS < 0.1, LCP < 2.5s.
- Accessibility: keyboard navigable, ARIA roles on key widgets; color contrast AA.

---

## 3) User Roles & Flows
For frontend:
- **Owner/Admin (single-user)** — full visibility of all modules; can trigger stubbed actions (restart, purge cache, enable/disable, etc.)
- Future: **Viewer** — read-only (feature flagged, mock only)

**Core flows**
1) Open dashboard → see global health, alerts, and service tiles.  
2) Click a tile → service detail view: tabs for Overview, Metrics, Alerts, Actions, Config, Logs.  
3) From Alerts center → filter, ack/un-ack (local state).  
4) Settings → edit endpoint placeholders (mock), choose theme, toggle experimental modules.

---

## 4) Information Architecture & Routing
- `/` — **Overview Dashboard** (summary cards, charts, alerts snippet)
- `/alerts` — **Alerts Center** (table + filter + ack)
- `/services` — **All Services** (grid/list, search, tags)
- `/services/:id` — **Service Detail** with tabs:
  - Overview (status, versions, quick KPIs + sparkline)
  - Metrics (charts: CPU, RAM, network I/O, service-specific KPIs)
  - Alerts (service-scoped feed)
  - Actions (stubbed controls: restart, clear cache, enable maintenance, etc.)
  - Config (read-only JSON view)
  - Logs (virtualized list; mock samples)
- `/settings` — **Settings** (theme, feature flags, mock endpoints)
- `/about` — Versions, changelog

**Navigation**: top app bar with global search; left sidebar collapsible; user menu (theme, settings, about).

---

## 5) Visual & UX Guidelines
- **Design System:** Minimal, modern. Cards with soft shadows, 2xl rounded corners, grid layout.  
- **Themes:** Light/Dark; follow system preference by default; toggle persists in `localStorage`.
- **Status colors:** success, warning, error, info; avoid color-only signals (add icons and labels).  
- **Charts:** Simple, legible lines/bars; downsample mock data; hover tooltips; 1 chart per panel.  
- **Tables:** Sticky header, column sorting, text truncation with tooltips, virtualized rows for logs.  
- **Empty/Error states:** Friendly copy, action to retry (re-read mock), skeleton loaders.  
- **Performance:** Code-split tabs; memoize heavy widgets; virtualize long lists.

---

## 6) Tech Stack (Frontend Only)
- **Framework:** React + TypeScript + Vite (or Next.js if SSR desired later; prefer Vite for mock stage)
- **State:** React Query (for future APIs) + Zustand or Redux Toolkit for UI state; for mock, load JSON via fetch to `/mock/homelab.json`
- **Component lib:** shadcn/ui (Radix under the hood) with Tailwind CSS; lucide-react icons
- **Charts:** Recharts
- **Routing:** React Router (Vite) or Next.js App Router (if Next)
- **Testing:** Vitest + Testing Library; Playwright for e2e
- **Lint/Format:** ESLint, Prettier
- **i18n:** react-i18next (basic en scaffold)

**Folder structure (proposal)**
```
src/
  app/
    routes.tsx
  components/
    charts/  tables/  forms/  layout/  status/
  features/
    dashboard/  alerts/  services/  settings/
  services/ (service-specific UI)
    pihole/  vpn/  homeassistant/  n8n/  vaultwarden/  network/  media/  storage/
  lib/
    api/  hooks/  utils/
  styles/
  test/
public/
  mock/homelab.json
```

---

## 7) Data Model (Mock JSON)
Single file `public/mock/homelab.json` loaded at app start and refreshable via a "Reload Mock Data" button in Settings.

**Top-level:**
```json
{
  "meta": { "generatedAt": "2025-11-10T10:00:00Z", "dashboardVersion": "1.0.0" },
  "summary": { "status": "degraded", "servicesUp": 7, "servicesDown": 1, "alertsOpen": 5, "lastSyncMs": 162 },
  "services": [ /* see service schema below */ ],
  "alerts": [ /* global alert schema */ ],
  "settings": {
    "theme": "system",
    "featureFlags": { "viewerRole": false, "enableLogsTab": true, "experimentalCharts": false },
    "endpoints": {
      "pihole": "http://pi.hole",
      "vpn": "http://tailscale.lan",
      "homeassistant": "http://ha.local:8123",
      "n8n": "http://n8n.local:5678",
      "vaultwarden": "http://vault.lan",
      "network": "http://monitor.lan",
      "media": "http://jellyfin.lan",
      "storage": "http://nextcloud.lan"
    }
  }
}
```

**Service base schema (per item in `services`)**
```json
{
  "id": "pihole",
  "name": "Pi-hole",
  "category": "dns",
  "icon": "shield",
  "status": "healthy",
  "uptimePct24h": 99.98,
  "latencyMs": 12,
  "cpuPct": 7,
  "ramMb": 256,
  "diskGbUsed": 1.2,
  "version": "v5.18.3",
  "endpoint": "http://pi.hole",
  "tags": ["core", "security"],
  "kpis": [
    { "key": "dnsQueriesBlockedToday", "label": "Blocked Today", "value": 18234 },
    { "key": "blocklistDomains", "label": "Blocklist Domains", "value": 2200000 },
    { "key": "percentBlocked", "label": "% Blocked", "value": 13.7 }
  ],
  "metrics": {
    "timeseries": {
      "cpuPct": [["2025-11-10T09:00:00Z", 3],["2025-11-10T09:05:00Z", 5]],
      "queriesPerMin": [["2025-11-10T09:00:00Z", 120],["2025-11-10T09:05:00Z", 98]]
    }
  },
  "alerts": [
    { "id": "al-pihole-1", "severity": "info", "title": "Gravity updated", "createdAt": "2025-11-10T07:12:00Z", "ack": false }
  ],
  "actions": [
    { "key": "restart", "label": "Restart DNS", "danger": true },
    { "key": "updateGravity", "label": "Update Blocklists" }
  ],
  "config": {
    "interface": "eth0",
    "upstreams": ["1.1.1.1","8.8.8.8"],
    "dhcp": false
  },
  "logs": [
    { "ts": "2025-11-10T08:55:00Z", "msg": "FTL started, listening on port 53" },
    { "ts": "2025-11-10T08:57:00Z", "msg": "Gravity updated (1.2M domains)" }
  ]
}
```

**Service variants**
- **Mesh VPN** (`id: vpn`) — KPIs: peersOnline, devices, relays, exitNode. Actions: authorizeDevice, revokeDevice, rotateKeys.
- **Home Assistant** (`id: homeassistant`) — KPIs: automationsActive, entities, integrations, lastBackup. Actions: reloadAutomations, restartCore, triggerScene.
- **n8n** (`id: n8n`) — KPIs: workflows, runsToday, failedJobs. Actions: pauseAll, resumeAll, retryFailed.
- **Vaultwarden** (`id: vaultwarden`) — KPIs: users, orgs, failedLogins24h. Actions: lockAll, forceLogOut, toggleReadOnly.
- **Network Monitoring** (`id: network`) — KPIs: nodes, exporters, alertsOpen. Actions: silenceAll(1h), rescan.
- **Media** (`id: media`) — KPIs: libraries, transcodesActive, streams. Actions: restartServer, rescanLibrary, optimizeDB.
- **Storage** (`id: storage`) — KPIs: usedTb, freeTb, activeUsers, photosIndexed. Actions: startMaintenance, stopMaintenance, createSnapshot.

**Global alert schema**
```json
{ "id": "al-001", "serviceId": "storage", "severity": "warning", "title": "Pool scrub overdue", "createdAt": "2025-11-09T21:10:00Z", "ack": false }
```

> The mock file should include **8 services**, ~**20–40 alerts**, and **sparse timeseries** (5–20 points per metric) to keep bundle size small.

---

## 8) TypeScript Interfaces (Frontend)
```ts
export type Severity = "info" | "warning" | "critical" | "error";

export interface Meta { generatedAt: string; dashboardVersion: string }
export interface Summary { status: string; servicesUp: number; servicesDown: number; alertsOpen: number; lastSyncMs: number }

export interface KPI { key: string; label: string; value: number | string }
export interface TimePoint { 0: string; 1: number }

export interface ServiceAction { key: string; label: string; danger?: boolean }
export interface ServiceAlert { id: string; severity: Severity; title: string; createdAt: string; ack: boolean }

export interface ServiceItem {
  id: string; name: string; category: string; icon?: string; status: string;
  uptimePct24h?: number; latencyMs?: number; cpuPct?: number; ramMb?: number; diskGbUsed?: number;
  version?: string; endpoint?: string; tags?: string[];
  kpis: KPI[];
  metrics?: { timeseries?: Record<string, TimePoint[]> };
  alerts?: ServiceAlert[];
  actions?: ServiceAction[];
  config?: Record<string, unknown>;
  logs?: { ts: string; msg: string }[];
}

export interface GlobalAlert extends ServiceAlert { serviceId: string }

export interface Settings {
  theme: "light" | "dark" | "system";
  featureFlags: Record<string, boolean>;
  endpoints: Record<string, string>;
}

export interface HomelabData {
  meta: Meta;
  summary: Summary;
  services: ServiceItem[];
  alerts: GlobalAlert[];
  settings: Settings;
}
```

---

## 9) Component Inventory

**Layout**
- `AppShell`: top bar (search, theme), collapsible sidebar, content area
- `Breadcrumbs`, `PageTitle`, `SectionHeader`

**Overview**
- `ServiceTile` (status dot, KPIs, sparkline)
- `HealthSummary` (cards for Up/Down, Alerts, Latency)
- `MiniAlertFeed` (top 5 recent)
- `QuickActions` (stubbed)

**Service Detail**
- `ServiceHeader` (name, status, endpoint link, version)
- `KpiGrid` (auto-fit), `MetricChart` (Recharts), `TimeseriesSelector`
- `AlertTable` (filter by severity), `ActionPanel` (buttons)
- `ConfigViewer` (read-only JSON with copy), `LogViewer` (virtualized)

**Global**
- `SearchCommand` (cmd-k palette) over services and actions (client-side)
- `ThemeToggle`, `FeatureFlagToggle`
- `Toast`/`Snackbar` system
- `ConfirmDialog` for dangerous actions (still stubbed)
- `Tag` chip, `StatusPill`

---

## 10) Pages & Behaviors

### Dashboard (`/`)
- Grid of `ServiceTile` components (sortable by status/name/latency)
- HealthSummary with overall status and uptime
- MiniAlertFeed with link to `/alerts`
- QuickActions (e.g., "Reload Mock Data", "Silence All Alerts" – client-only)

### Alerts (`/alerts`)
- Table view grouped by severity → sortable by time, service
- Filters: severity, service, ack state; bulk ack/un-ack (local-only)
- Empty state if none

### Services (`/services`)
- Grid or list toggle, search box, tag filters (`core`, `security`, `storage`, etc.)

### Service Detail (`/services/:id`)
- Tabs: Overview | Metrics | Alerts | Actions | Config | Logs
- Overview: KPIs, small metric preview (sparkline), recent alerts
- Metrics: selectable metrics w/ line charts (Recharts); range presets (1h, 24h, 7d); mock only
- Alerts: scoped list with ack
- Actions: buttons (show confirm dialog; show success toast; no real calls)
- Config: read-only JSON with Copy button
- Logs: virtualized list with search (client-side)

### Settings (`/settings`)
- Theme toggle (persist), feature flags, endpoints editor (text inputs), “Reload Mock Data”

---

## 11) State & Data Loading
- On app mount, fetch `/mock/homelab.json` once into React Query cache.
- Provide a `useHomelab()` hook that returns parsed data + helper selectors.
- Keep ack state in-memory (Zustand) with optional `localStorage` persistence (separate key, e.g., `homelab.acks`).
- Timeseries are small; compute derived stats on client (min/max/avg) on demand.

---

## 12) Accessibility & i18n
- Components keyboard navigable (focus ring, ESC to close dialogs, tab order)
- ARIA attributes on alerts, toasts, tabs
- Copy uses intl resources via `react-i18next` (English only scaffold) with translation keys placed in `/locales/en/common.json`.

---

## 13) Performance Budget
- Initial JS bundle (gzipped) target: < 250KB for app code (excluding mock JSON)
- Render dashboard TTI within 2s on mid‑range laptop (mock data)
- Virtualize lists with >100 rows (logs)

---

## 14) Security (Frontend-Only Considerations)
- No secrets in the repo; do not embed tokens in mock
- Clearly label all destructive actions as **stubbed**
- CSP meta tags scaffold in `index.html` (document only)
- Later: prepare for OAuth/OIDC by keeping auth UI separate (feature flag)

---

## 15) Testing Strategy
- **Unit:** Rendering of tiles, charts with mock, reducer logic for ack, settings persistence
- **Integration:** Route navigation, service detail tab switching, alert filtering
- **E2E (Playwright):** Load mock, navigate main routes, ack an alert, toggle theme, reload mock
- **Accessibility checks:** axe on key pages (dev only)

---

## 16) Developer Experience
- `npm run dev` (Vite) / `npm run build` / `npm run preview`
- `npm run test` (vitest) / `npm run e2e` (playwright)
- `npm run lint` / `npm run typecheck`

**Env-free** for mock stage (no `.env` required). Keep mock JSON in `public/mock`.

---

## 17) Sample Mock JSON (abridged)
> Save to `public/mock/homelab.json` — **trim as needed** in real repo.

```json
{
  "meta": { "generatedAt": "2025-11-10T10:00:00Z", "dashboardVersion": "1.0.0" },
  "summary": { "status": "degraded", "servicesUp": 7, "servicesDown": 1, "alertsOpen": 5, "lastSyncMs": 162 },
  "services": [
    {
      "id": "pihole", "name": "Pi-hole", "category": "dns", "icon": "shield", "status": "healthy",
      "uptimePct24h": 99.98, "latencyMs": 12, "cpuPct": 7, "ramMb": 256, "diskGbUsed": 1.2, "version": "v5.18.3",
      "endpoint": "http://pi.hole", "tags": ["core","security"],
      "kpis": [
        {"key": "dnsQueriesBlockedToday","label": "Blocked Today","value": 18234},
        {"key": "blocklistDomains","label": "Blocklist Domains","value": 2200000},
        {"key": "percentBlocked","label": "% Blocked","value": 13.7}
      ],
      "metrics": {"timeseries": {"cpuPct": [["2025-11-10T09:00:00Z",3],["2025-11-10T09:05:00Z",5],["2025-11-10T09:10:00Z",7]],
                                 "queriesPerMin": [["2025-11-10T09:00:00Z",120],["2025-11-10T09:05:00Z",98],["2025-11-10T09:10:00Z",150]]}},
      "alerts": [{"id":"al-pihole-1","severity":"info","title":"Gravity updated","createdAt":"2025-11-10T07:12:00Z","ack":false}],
      "actions": [{"key":"restart","label":"Restart DNS","danger":true},{"key":"updateGravity","label":"Update Blocklists"}],
      "config": {"interface":"eth0","upstreams":["1.1.1.1","8.8.8.8"],"dhcp":false},
      "logs": [{"ts":"2025-11-10T08:55:00Z","msg":"FTL started, listening on port 53"}]
    },
    {
      "id": "vpn", "name": "Mesh VPN", "category": "network", "icon": "globe", "status": "healthy",
      "uptimePct24h": 100, "latencyMs": 22, "cpuPct": 2, "ramMb": 128, "version": "1.44.0",
      "endpoint": "http://tailscale.lan", "tags": ["core","remote"],
      "kpis": [
        {"key":"peersOnline","label":"Peers Online","value": 8},
        {"key":"devices","label":"Devices","value": 12},
        {"key":"exitNode","label":"Exit Node","value": "raspi-1"}
      ],
      "metrics": {"timeseries": {"cpuPct": [["2025-11-10T09:00:00Z",1],["2025-11-10T09:10:00Z",3]]}},
      "alerts": [],
      "actions": [{"key":"authorizeDevice","label":"Authorize Device"},{"key":"rotateKeys","label":"Rotate Keys","danger":true}],
      "config": {"subnetRoutes":["192.168.1.0/24"],"acl":"default"}
    },
    {
      "id": "homeassistant", "name": "Home Assistant", "category": "home", "icon": "home", "status": "healthy",
      "uptimePct24h": 99.9, "latencyMs": 28, "cpuPct": 12, "ramMb": 1024, "version":"2025.10",
      "endpoint":"http://ha.local:8123", "tags":["automations"],
      "kpis":[{"key":"automationsActive","label":"Automations","value":64},{"key":"entities","label":"Entities","value":612},{"key":"lastBackup","label":"Last Backup","value":"2025-11-08"}],
      "alerts":[{"id":"al-ha-1","severity":"warning","title":"Automation failed: Nightlights","createdAt":"2025-11-09T23:10:00Z","ack":false}],
      "actions":[{"key":"reloadAutomations","label":"Reload Automations"},{"key":"restartCore","label":"Restart Core","danger":true},{"key":"triggerScene","label":"Trigger 'Evening'"}]
    },
    {
      "id": "n8n", "name": "n8n", "category": "automations", "icon": "workflow", "status": "healthy",
      "uptimePct24h": 100, "latencyMs": 17, "cpuPct": 9, "ramMb": 512, "version":"1.63.0",
      "endpoint":"http://n8n.local:5678", "tags":["automations"],
      "kpis":[{"key":"workflows","label":"Workflows","value":32},{"key":"runsToday","label":"Runs Today","value":440},{"key":"failedJobs","label":"Failed Jobs","value":3}],
      "alerts":[{"id":"al-n8n-1","severity":"error","title":"Workflow #21 failed","createdAt":"2025-11-10T06:04:00Z","ack":false}],
      "actions":[{"key":"pauseAll","label":"Pause All","danger":true},{"key":"resumeAll","label":"Resume All"},{"key":"retryFailed","label":"Retry Failed"}]
    },
    {
      "id": "vaultwarden", "name": "Vaultwarden", "category": "security", "icon": "lock", "status": "healthy",
      "uptimePct24h": 100, "latencyMs": 11, "cpuPct": 3, "ramMb": 256, "version":"1.30.7",
      "endpoint":"http://vault.lan", "tags":["security"],
      "kpis":[{"key":"users","label":"Users","value":2},{"key":"orgs","label":"Organizations","value":1},{"key":"failedLogins24h","label":"Failed Logins (24h)","value":0}],
      "alerts":[],
      "actions":[{"key":"lockAll","label":"Lock All","danger":true},{"key":"forceLogOut","label":"Force Log Out","danger":true},{"key":"toggleReadOnly","label":"Toggle Read-Only"}]
    },
    {
      "id": "network", "name": "Network Monitoring", "category": "monitoring", "icon": "activity", "status": "degraded",
      "uptimePct24h": 97.2, "latencyMs": 45, "cpuPct": 22, "ramMb": 768, "version":"0.37",
      "endpoint":"http://monitor.lan", "tags":["core","observability"],
      "kpis":[{"key":"nodes","label":"Nodes","value":11},{"key":"exporters","label":"Exporters","value":14},{"key":"alertsOpen","label":"Alerts Open","value":4}],
      "alerts":[{"id":"al-net-1","severity":"warning","title":"Packet loss > 2% on wan0","createdAt":"2025-11-10T08:12:00Z","ack":false}],
      "actions":[{"key":"silenceAll","label":"Silence All (1h)","danger":true},{"key":"rescan","label":"Rescan"}]
    },
    {
      "id": "media", "name": "Media Server", "category": "media", "icon": "film", "status": "healthy",
      "uptimePct24h": 99.6, "latencyMs": 14, "cpuPct": 34, "ramMb": 2048, "version":"10.9",
      "endpoint":"http://jellyfin.lan", "tags":["media"],
      "kpis":[{"key":"libraries","label":"Libraries","value":6},{"key":"transcodesActive","label":"Transcodes","value":1},{"key":"streams","label":"Streams","value":2}],
      "alerts":[],
      "actions":[{"key":"restartServer","label":"Restart Server","danger":true},{"key":"rescanLibrary","label":"Rescan Library"},{"key":"optimizeDB","label":"Optimize DB"}]
    },
    {
      "id": "storage", "name": "Storage", "category": "storage", "icon": "database", "status": "warning",
      "uptimePct24h": 99.9, "latencyMs": 19, "cpuPct": 15, "ramMb": 1536, "version":"27.1",
      "endpoint":"http://nextcloud.lan", "tags":["storage","backup"],
      "kpis":[{"key":"usedTb","label":"Used (TB)","value":7.3},{"key":"freeTb","label":"Free (TB)","value":2.1},{"key":"activeUsers","label":"Active Users","value":2},{"key":"photosIndexed","label":"Photos Indexed","value":58210}],
      "alerts":[{"id":"al-storage-1","severity":"warning","title":"Pool scrub overdue","createdAt":"2025-11-09T21:10:00Z","ack":false},{"id":"al-storage-2","severity":"critical","title":"Disk SMART warning on sda","createdAt":"2025-11-10T05:40:00Z","ack":false}],
      "actions":[{"key":"startMaintenance","label":"Start Maintenance","danger":true},{"key":"stopMaintenance","label":"Stop Maintenance"},{"key":"createSnapshot","label":"Create Snapshot"}]
    }
  ],
  "alerts": [
    {"id":"al-001","serviceId":"storage","severity":"warning","title":"Pool scrub overdue","createdAt":"2025-11-09T21:10:00Z","ack":false},
    {"id":"al-002","serviceId":"n8n","severity":"error","title":"Workflow #21 failed","createdAt":"2025-11-10T06:04:00Z","ack":false},
    {"id":"al-003","serviceId":"network","severity":"warning","title":"Packet loss > 2% on wan0","createdAt":"2025-11-10T08:12:00Z","ack":false},
    {"id":"al-004","serviceId":"homeassistant","severity":"warning","title":"Automation failed: Nightlights","createdAt":"2025-11-09T23:10:00Z","ack":false},
    {"id":"al-005","serviceId":"storage","severity":"critical","title":"Disk SMART warning on sda","createdAt":"2025-11-10T05:40:00Z","ack":false}
  ],
  "settings": {
    "theme": "system",
    "featureFlags": {"viewerRole": false, "enableLogsTab": true, "experimentalCharts": false},
    "endpoints": {
      "pihole":"http://pi.hole","vpn":"http://tailscale.lan","homeassistant":"http://ha.local:8123","n8n":"http://n8n.local:5678","vaultwarden":"http://vault.lan","network":"http://monitor.lan","media":"http://jellyfin.lan","storage":"http://nextcloud.lan"
    }
  }
}
```

---

## 18) API Layer (Mock Only)
- `lib/api/mockClient.ts` exposes async functions that **read from the JSON** and simulate latency/errors:
```ts
export async function fetchHomelab(): Promise<HomelabData> { await sleep(150); return cachedJson }
export async function ackAlert(id: string): Promise<void> { await sleep(80); /* update local store */ }
export async function triggerAction(serviceId: string, actionKey: string): Promise<{ ok: boolean; message: string }> {
  await sleep(300);
  // pseudo-random success/failure for demo; always client-side
  return Math.random() > 0.1 ? { ok: true, message: "Action completed (mock)" } : { ok: false, message: "Mock failure" };
}
```

---

## 19) Example UI Tasks for the Coding Agent
1) Scaffold Vite + React + TS + Tailwind + shadcn/ui; add Recharts, Zustand, React Router, React Query.  
2) Implement `AppShell` with sidebar + top bar + theme toggle.  
3) Build Dashboard with `ServiceTile`, `HealthSummary`, and `MiniAlertFeed`.  
4) Implement `/services` list with search, sort, filters.  
5) Implement `Service Detail` tabs; wire to mock JSON.  
6) Implement `Alerts Center` with ack state stored in Zustand + persistence.  
7) Implement `Settings` (theme, feature flags, endpoints editor, reload mock).  
8) Add `SearchCommand` (cmd-k) across services/actions.  
9) Add tests (unit/integration) + Playwright smoke e2e.  
10) Add accessibility pass (focus, ARIA, color contrast).  

---

## 20) Future Hooks (Non-Blocking for Mock Stage)
- Real auth (OIDC), per-service API tokens via backend
- WebSockets/SSE for live metrics & logs
- Per-service charts with proper rollups (Prometheus-style queries)
- Maintenance windows & silencing rules synced to backend
- User roles (Owner/Admin/Viewer) + audit log
- Widgets: uptime calendar heatmap, topology map, bandwidth graph
- Mobile PWA (install, offline read‑only cache)

---

## 21) Definition of Done (Prototype v1)
- Runs locally with `npm run dev`, loads `homelab.json`, provides full navigation & stubbed actions
- All main pages complete with mock data; no dead links
- Theming works; settings persist; alerts ack/unack persist across reloads
- Tests included and passing; basic docs in `README.md`

---

## 22) Quick Wireframe Notes (text-only)
- **Dashboard:** 3-column grid (xl), `ServiceTile` cards; right rail shows recent alerts.  
- **Detail:** Header → KPI grid (auto-fit) → chart row → tabs below.  
- **Alerts:** Table with severity pill, service, title, time, ack toggle; filters above.  
- **Settings:** 2-column form; theme switch, feature flags, endpoints editable, reload mock button.

---

*End of v1.0 requirements.*

