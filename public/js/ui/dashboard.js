import { getState, subscribe, setState } from '../store.js';
import { createServiceTile } from '../components/serviceTile.js';
import { registerRoute } from '../router.js';
import { showConfirmDialog } from '../components/confirmDialog.js';

function createHealthSummary() {
    const s = getState();
    const servicesUp = s.data.services.filter(svc => svc.status === 'healthy').length;
    const servicesDown = s.data.services.filter(svc => svc.status !== 'healthy').length;
    const alertsOpen = s.data.alerts.filter(a => !s.acks.has(a.id)).length;
    const totalServices = s.data.services.length;
    const healthPct = Math.round((servicesUp / totalServices) * 100);
    
    const statusColor = healthPct === 100 ? '#10b981' : healthPct >= 75 ? '#f59e0b' : '#ef4444';
    const statusText = healthPct === 100 ? 'All Systems Operational' : healthPct >= 75 ? 'Minor Issues' : 'Critical Issues';
    
    const div = document.createElement('div');
    div.className = 'card';
    div.style.marginBottom = '24px';
    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
            <div>
                <h2 style="margin:0;font-size:1.5rem">System Health</h2>
                <p style="margin:8px 0 0;font-size:1.125rem;font-weight:600;color:${statusColor}">${statusText}</p>
            </div>
            <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
                <div style="text-align:center">
                    <div style="font-size:2rem;font-weight:700;color:#10b981">${servicesUp}</div>
                    <div style="font-size:0.875rem;color:var(--text-secondary)">Up</div>
                </div>
                <div style="text-align:center">
                    <div style="font-size:2rem;font-weight:700;color:#ef4444">${servicesDown}</div>
                    <div style="font-size:0.875rem;color:var(--text-secondary)">Down</div>
                </div>
                <div style="text-align:center">
                    <div style="font-size:2rem;font-weight:700;color:#f59e0b">${alertsOpen}</div>
                    <div style="font-size:0.875rem;color:var(--text-secondary)">Alerts</div>
                </div>
                <div style="text-align:center">
                    <div style="font-size:0.875rem;color:var(--text-secondary)">Last Sync</div>
                    <div style="font-size:0.875rem;font-weight:600">${new Date(s.data.lastSync).toLocaleTimeString()}</div>
                </div>
            </div>
        </div>
    `;
    return div;
}

export function renderDashboard(){
  const out = document.getElementById('route-outlet');
  const s = getState();
  if(!s.data){ out.innerHTML = '<div class="container">Loading mock data...</div>'; return }
  const html = document.createElement('div'); html.className='container';
  
  // Add health summary
  html.appendChild(createHealthSummary());
  
  const header = document.createElement('div'); header.className='card'; header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><div><div class="h1">Overview</div><div class="small">Global status & summary</div></div><div style="display:flex;gap:8px"><button id="silence-alerts" class="btn-secondary">Silence All Alerts</button><button id="reload-mock">Reload Mock</button></div></div>`;
  html.appendChild(header);
  const grid = document.createElement('div'); grid.className='grid-tiles';
  s.data.services.forEach(svc=>{ grid.appendChild(createServiceTile(svc)); });
  html.appendChild(grid);
  out.innerHTML = '';
  out.appendChild(html);
  
  document.getElementById('reload-mock')?.addEventListener('click',()=>location.reload());
  
  document.getElementById('silence-alerts')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'Silence All Alerts',
      message: 'This will acknowledge all active alerts. Continue?',
      confirmText: 'Silence All',
      danger: false
    });
    
    if (!confirmed) return;
    
    const { acks } = getState();
    s.data.alerts.forEach(alert => acks.add(alert.id));
    setState({ acks: new Set(acks) });
    
    // Show toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'All alerts silenced';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  });
}

export function registerDashboardRoute(){ registerRoute('/', renderDashboard); }
