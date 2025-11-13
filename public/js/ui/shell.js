import { getState, subscribe } from '../store.js';
export function renderShell(){
  const header = document.getElementById('app-header');
  header.innerHTML = `<div class="container" style="display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div style="display:flex;align-items:center;gap:16px">
      <button id="sidebar-toggle" class="btn-secondary" style="padding:6px 12px" aria-label="Toggle sidebar">☰</button>
      <div class="h1">Homelab (vanilla)</div>
    </div>
    <div style="flex:1;max-width:400px">
      <input type="search" id="global-search" placeholder="Search services, alerts... (Ctrl+K for command palette)" 
             style="width:100%;padding:8px 12px;border:1px solid rgba(0,0,0,0.1);border-radius:6px;background:var(--card-bg);color:var(--fg)">
    </div>
    <div class="small">Prototype v1.0</div>
  </div>`;
  
  // Sidebar toggle
  const sidebarToggle = header.querySelector('#sidebar-toggle');
  const nav = document.getElementById('app-nav');
  const appContainer = document.querySelector('.app');
  let sidebarCollapsed = false;
  
  sidebarToggle.addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
      nav.classList.add('collapsed');
      appContainer.classList.add('sidebar-collapsed');
      sidebarToggle.innerHTML = '☰';
    } else {
      nav.classList.remove('collapsed');
      appContainer.classList.remove('sidebar-collapsed');
      sidebarToggle.innerHTML = '✕';
    }
    
    sidebarToggle.setAttribute('aria-expanded', !sidebarCollapsed);
  });
  
  // Global search
  const searchInput = header.querySelector('#global-search');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) return;
    
    const s = getState();
    if (!s.data) return;
    
    const results = [];
    s.data.services.forEach(svc => {
      if (svc.name.toLowerCase().includes(query) || svc.id.toLowerCase().includes(query)) {
        results.push({ type: 'service', name: svc.name, href: `#/services/${svc.id}` });
      }
    });
    s.data.alerts.forEach(alert => {
      if (alert.title.toLowerCase().includes(query)) {
        results.push({ type: 'alert', name: alert.title, href: '#/alerts' });
      }
    });
    
    // For demo purposes, just console.log - in real app would show dropdown
    if (results.length > 0) {
      console.log('Search results:', results);
    }
  });
  
  nav.innerHTML = `<div class="container nav-list">
    <div class="nav-link" data-href="#/">Overview</div>
    <div class="nav-link" data-href="#/services">Services</div>
    <div class="nav-link" data-href="#/alerts">Alerts</div>
    <div class="nav-link" data-href="#/logs">Logs</div>
    <div class="nav-link" data-href="#/compare">Compare</div>
    <div class="nav-link" data-href="#/settings">Settings</div>
    <div class="nav-link" data-href="#/about">About</div>
  </div>`;
  nav.querySelectorAll('.nav-link').forEach(el=>el.addEventListener('click',e=>{ const h = el.getAttribute('data-href'); if(h) location.hash = h }));
  
  // right rail: system metrics & activity feed
  const rail = document.getElementById('right-rail');
  
  function renderRightRail() { 
    const s = getState(); 
    if(!s.data) { 
      rail.innerHTML = '<div class="container card small">Loading...</div>'; 
      return;
    }
    
    // Calculate aggregate metrics
    const services = s.data.services || [];
    const totalCpu = services.reduce((sum, svc) => sum + (svc.cpuPct || 0), 0);
    const avgCpu = services.length > 0 ? (totalCpu / services.length).toFixed(1) : 0;
    const totalRam = services.reduce((sum, svc) => sum + (svc.ramMb || 0), 0);
    const avgUptime = services.length > 0 ? (services.reduce((sum, svc) => sum + (svc.uptimePct24h || 0), 0) / services.length).toFixed(1) : 0;
    const servicesUp = services.filter(svc => svc.status === 'healthy').length;
    const servicesTotal = services.length;
    
    // Build activity feed from alerts and recent service events
    const activities = [];
    
    // Add alerts as activities
    (s.data.alerts || []).forEach(alert => {
      activities.push({
        type: 'alert',
        severity: alert.severity,
        title: alert.title,
        service: alert.serviceId,
        timestamp: new Date(alert.createdAt),
        icon: alert.severity === 'error' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️'
      });
    });
    
    // Add service status changes (simulated from current status)
    services.forEach(svc => {
      if (svc.status === 'degraded' || svc.status === 'down') {
        activities.push({
          type: 'status',
          severity: svc.status === 'down' ? 'error' : 'warning',
          title: `${svc.name} is ${svc.status}`,
          service: svc.id,
          timestamp: new Date(Date.now() - Math.random() * 3600000), // Random within last hour
          icon: svc.status === 'down' ? '❌' : '⚠️'
        });
      }
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivities = activities.slice(0, 8);
    
    // Helper to format relative time
    function timeAgo(date) {
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
    
    rail.innerHTML = `
      <div class="container" style="display:flex;flex-direction:column;gap:12px">
        <!-- System Metrics -->
        <div class="card" style="padding:12px">
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:12px;color:var(--muted)">SYSTEM METRICS</div>
          <div class="metrics-grid">
            <div class="metric-tile">
              <div class="metric-icon" style="background:#e3f2fd">💻</div>
              <div class="metric-content">
                <div class="metric-value">${avgCpu}%</div>
                <div class="metric-label">Avg CPU</div>
              </div>
            </div>
            
            <div class="metric-tile">
              <div class="metric-icon" style="background:#f3e5f5">🧠</div>
              <div class="metric-content">
                <div class="metric-value">${(totalRam / 1024).toFixed(1)}GB</div>
                <div class="metric-label">Total RAM</div>
              </div>
            </div>
            
            <div class="metric-tile">
              <div class="metric-icon" style="background:#e8f5e9">✅</div>
              <div class="metric-content">
                <div class="metric-value">${servicesUp}/${servicesTotal}</div>
                <div class="metric-label">Services Up</div>
              </div>
            </div>
            
            <div class="metric-tile">
              <div class="metric-icon" style="background:#fff3e0">⏱️</div>
              <div class="metric-content">
                <div class="metric-value">${avgUptime}%</div>
                <div class="metric-label">Avg Uptime</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Activity Feed -->
        <div class="card" style="padding:12px">
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:12px;color:var(--muted)">ACTIVITY FEED</div>
          <div class="activity-feed">
            ${recentActivities.length === 0 ? '<div class="small" style="color:var(--muted);padding:8px">No recent activity</div>' : ''}
            ${recentActivities.map(activity => `
              <div class="activity-item" data-service="${activity.service}">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                  <div class="activity-title">${activity.title}</div>
                  <div class="activity-meta">
                    <span class="activity-service">${activity.service}</span>
                    <span class="activity-time">${timeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Add click handlers for activity items
    rail.querySelectorAll('.activity-item').forEach(item => {
      item.addEventListener('click', () => {
        const serviceId = item.getAttribute('data-service');
        if (serviceId) {
          location.hash = `#/services/${serviceId}`;
        }
      });
    });
  }
  
  renderRightRail(); 
  subscribe(renderRightRail);
}
