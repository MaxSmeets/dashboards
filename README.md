# Homelab Frontend — Vanilla JS Prototype

A unified, browser-based dashboard to monitor and manage core homelab services. Built with vanilla JavaScript, CSS, and HTML - **no frameworks or build tools required**.

## ✨ Features

### 📊 Dashboard
- **Health Summary** - Real-time overview showing services up/down, active alerts, and system status
- **Service Tiles** - Grid view with health status, KPIs, and sparkline charts
- **Quick Actions** - "Silence All Alerts" button with confirmation dialog
- **Responsive Layout** - Adaptive grid that works on mobile, tablet, and desktop

### 🔍 Services Directory
- **Grid/List Toggle** - Switch between card grid and list view
- **Search & Filter** - Real-time search by service name
- **Tag Filtering** - Filter services by tags (networking, security, automation, etc.)
- **Sort Options** - Sort by status, name, or latency
- **Alert Badges** - Visual indicators showing active alerts per service
- **Native UI Links** - Direct links to each service's native interface

### 🔔 Alerts Center
- **Advanced Filtering** - Filter by severity (critical/error/warning/info), service, or acknowledgment status
- **Bulk Operations** - Acknowledge or un-acknowledge multiple alerts at once
- **Real-time Updates** - Alerts update dynamically as you acknowledge them
- **Service Links** - Click service name to jump to service detail page

### 📈 Service Details
Six-tab interface for each service:
- **Overview** - Status, KPIs, quick metrics
- **Metrics** - Timeseries line charts with SVG rendering
- **Alerts** - Service-specific alerts with acknowledgment
- **Actions** - Trigger service actions (restart, reload, backup, etc.) with confirmation dialogs
- **Config** - View configuration as JSON with copy-to-clipboard
- **Logs** - Recent logs with color-coded levels and timestamps

### ⚙️ Settings
- **Theme Toggle** - Light/dark/system theme with localStorage persistence
- **Endpoint Editor** - Configure API endpoints for each service
- **Import/Export** - Backup and restore settings as JSON
- **Reload Mock Data** - Quick refresh of mock data

### ⌨️ Command Palette
- **Keyboard Access** - Press `Ctrl+K` (or `Cmd+K` on Mac) to open
- **Fuzzy Search** - Intelligent search across services and actions
- **Keyboard Navigation** - Use arrow keys to navigate, Enter to select, Escape to close
- **Quick Actions** - Jump to any service or execute actions instantly

### ♿ Accessibility
- **ARIA Roles** - Proper `role="tablist"`, `aria-selected`, `aria-controls` attributes
- **Keyboard Navigation** - Full keyboard support on tabs (Arrow Left/Right, Home, End)
- **Table Semantics** - Table captions and `scope` attributes for screen readers
- **Focus Management** - Clear `:focus-visible` outlines
- **Reduced Motion** - Respects `prefers-reduced-motion` for animations

### 🎨 User Experience
- **Chart Tooltips** - Hover over data points to see values and timestamps
- **Reusable Dialogs** - Consistent confirmation dialogs throughout the app
- **Toast Notifications** - Success/error messages for user actions
- **Collapsible Sidebar** - Toggle navigation sidebar to maximize content space
- **Global Search** - Search bar in header for quick service/alert lookup
- **Theme Persistence** - Your theme choice is remembered across sessions

## 🚀 How to Run

The app requires a static web server (fetch won't work on `file://` protocol).

### Option 1: Python (Recommended)

```powershell
cd public
python -m http.server 8080
```

Then open: http://localhost:8080

### Option 2: Node.js (http-server)

```powershell
cd public
npx http-server . -p 8080
```

Then open: http://localhost:8080

### Option 3: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `public/index.html`
3. Select "Open with Live Server"

## 📁 Project Structure

```
public/
  index.html              # Main HTML file
  css/
    base.css             # Variables, normalize, typography, a11y
    layout.css           # Grid layout, responsive design
    components.css       # Component styles (cards, tables, dialogs, etc.)
    themes.css           # Light/dark theme support
  js/
    main.js              # Bootstrap, route registration, chart tooltips
    router.js            # Hash-based routing
    store.js             # State management with pub/sub & localStorage
    lib/
      mockApi.js         # Mock data loader & action simulator
    ui/
      shell.js           # Header, nav, sidebar, global search
      dashboard.js       # Overview page with health summary
      services.js        # Services directory with grid/list view
      alerts.js          # Alerts center with filtering
      serviceDetail.js   # Service detail with 6 tabs
      settings.js        # Settings page (theme, endpoints, import/export)
    components/
      serviceTile.js     # Service card component
      kpiGrid.js         # KPI grid component
      charts.js          # SVG line charts & sparklines
      commandPalette.js  # Ctrl+K command palette
      confirmDialog.js   # Reusable confirmation dialog
  mock/
    homelab.json         # Sample mock data (8 services)
```

## 📊 Data Model

All data is loaded from `public/mock/homelab.json`. The mock includes:

- **8 services**: Pi-hole, VPN, Home Assistant, n8n, Vaultwarden, Network Monitoring, Media Server, Storage
- **Service metadata**: name, id, category, status, endpoint, tags
- **KPIs**: queries blocked, bandwidth, devices connected, etc.
- **Timeseries metrics**: CPU, memory, bandwidth over time
- **Alerts**: Per-service and global alerts with severity levels
- **Actions**: Restart, reload, backup, clear cache (simulated)
- **Configuration**: JSON config objects per service
- **Logs**: Recent log entries with timestamps and levels

## 🗺️ Navigation

- `#/` - Overview Dashboard
- `#/services` - Services Directory (grid/list view)
- `#/services/:id` - Service Detail (e.g., `#/services/pihole`)
- `#/alerts` - Alerts Center
- `#/settings` - Settings
- `#/about` - About

## 💾 localStorage Keys

- `hl.acks` - Acknowledged alert IDs (Set)
- `hl.theme` - Selected theme (`light` / `dark` / `system`)
- `hl.settings.endpoints` - Custom endpoint URLs (JSON)

## ⌨️ Keyboard Shortcuts

- `Ctrl+K` / `Cmd+K` - Open command palette
- `Escape` - Close command palette or dialogs
- `Arrow Up/Down` - Navigate command palette results
- `Arrow Left/Right` - Navigate tabs in service detail
- `Home` / `End` - Jump to first/last tab
- `Enter` - Select/activate item
- `Tab` - Standard focus navigation

## 🔌 Connecting to Real APIs

To connect to real APIs instead of mock data:

1. Edit `js/lib/mockApi.js`:
   - Replace `fetch('./mock/homelab.json')` with your API endpoint
   - Update `triggerAction()` to call real action endpoints
2. Update service URLs in Settings page
3. Implement authentication if needed (add bearer tokens, etc.)
4. Adjust data transformation if your API schema differs

## 🛠️ Development

No build step required! Edit files and reload the browser.

- **JS**: ES6 modules, no transpilation, runs natively in browser
- **CSS**: Plain CSS with custom properties (CSS variables)
- **State**: Simple store with pub/sub pattern, localStorage sync
- **Routing**: Hash-based (`#/path`), no dependencies
- **Charts**: Custom SVG generation, zero dependencies
- **Icons**: Unicode emoji and symbols (no icon library needed)

### Adding a New Page

1. Create `public/js/ui/newPage.js` with `renderNewPage()` function
2. Export `registerNewPageRoute()` that calls `registerRoute('/path', renderNewPage)`
3. Import and call `registerNewPageRoute()` in `main.js`
4. Add navigation link in `shell.js`

### Adding a New Component

1. Create `public/js/components/newComponent.js`
2. Export a function that returns HTML string or DOM element
3. Import and use in any page/component

## 🌐 Browser Support

Modern browsers with ES6 module support:
- Chrome/Edge 61+
- Firefox 60+
- Safari 11+

## 📋 Technical Highlights

- **Zero Dependencies** - No npm packages, no bundler, no framework
- **Vanilla ES6** - Native modules, arrow functions, destructuring, template literals
- **Custom Routing** - Hash-based SPA routing in ~30 lines of code
- **State Management** - Pub/sub pattern with localStorage sync
- **SVG Charts** - Hand-crafted line charts and sparklines
- **Responsive** - CSS Grid and Flexbox for adaptive layouts
- **Accessible** - ARIA roles, keyboard navigation, semantic HTML
- **Theme Support** - CSS custom properties for light/dark themes
- **Mock Backend** - Simulated API responses with configurable delays

## 📝 License

MIT
