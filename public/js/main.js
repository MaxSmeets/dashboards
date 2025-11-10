import { loadMock } from './lib/mockApi.js';
import { setState } from './store.js';
import { renderShell } from './ui/shell.js';
import { registerDashboardRoute } from './ui/dashboard.js';
import { registerServiceDetailRoute } from './ui/serviceDetail.js';
import { registerAlertsRoute } from './ui/alerts.js';
import { registerServicesRoute } from './ui/services.js';
import { registerSettingsRoute, initTheme } from './ui/settings.js';
import { initCommandPalette } from './components/commandPalette.js';
import { registerRoute, initRouter } from './router.js';

async function boot(){
  try{
    const data = await loadMock();
    setState({ data });
  }catch(e){ console.error('Failed to load mock', e); document.getElementById('route-outlet').innerHTML = '<div class="container card">Failed to load mock data</div>'; }
  renderShell();
  // register routes
  registerDashboardRoute();
  registerServiceDetailRoute();
  registerAlertsRoute();
  registerServicesRoute();
  registerSettingsRoute();
  registerRoute('/about', ()=>{ document.getElementById('route-outlet').innerHTML = '<div class="container card"><h2>About</h2><p>Vanilla prototype.</p></div>' });
  initRouter();
  initTheme();
  initCommandPalette();
  initChartTooltips();
  if(!location.hash) location.hash = '#/';
}

// Initialize chart tooltip interactions
function initChartTooltips() {
  document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('chart-point')) {
      const tooltip = e.target.closest('.chart-container').querySelector('.chart-tooltip');
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = `<strong>${e.target.dataset.value}</strong><br><span style="font-size:0.75rem;color:var(--muted)">${e.target.dataset.time}</span>`;
        
        const rect = e.target.getBoundingClientRect();
        const containerRect = tooltip.parentElement.getBoundingClientRect();
        tooltip.style.left = (rect.left - containerRect.left) + 'px';
        tooltip.style.top = (rect.top - containerRect.top - 50) + 'px';
      }
    }
  });
  
  document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('chart-point')) {
      const tooltip = e.target.closest('.chart-container')?.querySelector('.chart-tooltip');
      if (tooltip) tooltip.style.display = 'none';
    }
  });
}

boot();
