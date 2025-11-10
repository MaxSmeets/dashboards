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
    <div class="nav-link" data-href="#/settings">Settings</div>
    <div class="nav-link" data-href="#/about">About</div>
  </div>`;
  nav.querySelectorAll('.nav-link').forEach(el=>el.addEventListener('click',e=>{ const h = el.getAttribute('data-href'); if(h) location.hash = h }));
  // right rail: recent alerts
  const rail = document.getElementById('right-rail');
  function renderAlerts(){ const s = getState(); if(!s.data) { rail.innerHTML = '<div class="container card small">Loading...</div>'; return }
    const list = (s.data.alerts||[]).slice(0,6).map(a=>`<div class="p small">${a.title} <span style="color:var(--muted)">(${a.serviceId})</span></div>`).join('');
    rail.innerHTML = `<div class="container card"><div class="h1">Recent alerts</div>${list}</div>`;
  }
  renderAlerts(); subscribe(renderAlerts);
}
