import { getState, setState } from '../store.js';
import { registerRoute } from '../router.js';
import { createKpiGrid } from '../components/kpiGrid.js';
import { createLineChart, createAreaChart, createGaugeChart } from '../components/charts.js';
import { triggerAction } from '../lib/mockApi.js';
import { showConfirmDialog } from '../components/confirmDialog.js';

function renderServiceDetail(id) {
  const out = document.getElementById('route-outlet');
  const s = getState();
  if (!s.data) {
    out.innerHTML = '<div class="container">Loading...</div>';
    return;
  }
  const service = s.data.services.find(svc => svc.id === id);
  if (!service) {
    out.innerHTML = '<div class="container card"><h2>Service not found</h2></div>';
    return;
  }

  const html = document.createElement('div');
  html.className = 'container';
  html.innerHTML = `
    <div class="service-detail-header card">
      <a href="#/">&larr; Back to Overview</a>
      <h1>${service.name}</h1>
      <p class="small">${service.category}</p>
    </div>
    <div class="tabs" role="tablist" aria-label="Service details">
      <div class="tab active" data-tab="overview" role="tab" aria-selected="true" aria-controls="tab-content" tabindex="0">Overview</div>
      <div class="tab" data-tab="metrics" role="tab" aria-selected="false" aria-controls="tab-content" tabindex="-1">Metrics</div>
      <div class="tab" data-tab="alerts" role="tab" aria-selected="false" aria-controls="tab-content" tabindex="-1">Alerts</div>
      <div class="tab" data-tab="actions" role="tab" aria-selected="false" aria-controls="tab-content" tabindex="-1">Actions</div>
      <div class="tab" data-tab="config" role="tab" aria-selected="false" aria-controls="tab-content" tabindex="-1">Config</div>
      <div class="tab" data-tab="logs" role="tab" aria-selected="false" aria-controls="tab-content" tabindex="-1">Logs</div>
    </div>
    <div id="tab-content" class="card" role="tabpanel" aria-live="polite"></div>
  `;

  out.innerHTML = '';
  out.appendChild(html);

  const tabs = out.querySelectorAll('.tab');
  const tabContent = out.querySelector('#tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      tab.focus();
      renderTabContent(tab.dataset.tab, service, tabContent);
    });
    
    // Keyboard navigation
    tab.addEventListener('keydown', (e) => {
      let targetTab = null;
      if (e.key === 'ArrowRight') {
        targetTab = tab.nextElementSibling || tabs[0];
      } else if (e.key === 'ArrowLeft') {
        targetTab = tab.previousElementSibling || tabs[tabs.length - 1];
      } else if (e.key === 'Home') {
        targetTab = tabs[0];
      } else if (e.key === 'End') {
        targetTab = tabs[tabs.length - 1];
      }
      
      if (targetTab) {
        e.preventDefault();
        targetTab.click();
      }
    });
  });

  // Initial render
  renderTabContent('overview', service, tabContent);
}

function renderTabContent(tabId, service, container) {
  const { acks } = getState();
  switch (tabId) {
    case 'overview':
      container.innerHTML = `<h2>Overview</h2><p>Status: ${service.status}</p>${createKpiGrid(service.kpis)}`;
      break;
    case 'metrics':
      if (!service.metrics?.timeseries) {
        container.innerHTML = '<h2>Metrics</h2><p>No metrics data available.</p>';
        break;
      }
      const charts = Object.entries(service.metrics.timeseries).map(([key, data]) => {
        // Use different chart types based on metric
        if (key.toLowerCase().includes('pct') || key.toLowerCase().includes('percent') || key.toLowerCase().includes('usage')) {
          // For percentage metrics, use area chart
          return createAreaChart(data, { label: formatMetricName(key), color: 'var(--c-info)' });
        } else {
          // Default to line chart
          return createLineChart(data, { label: formatMetricName(key), color: 'var(--c-ok)' });
        }
      }).join('');
      
      // Add gauge charts for current percentage values
      const gauges = service.kpis
        .filter(kpi => typeof kpi.value === 'number' && (kpi.key.toLowerCase().includes('pct') || kpi.key.toLowerCase().includes('percent')))
        .map(kpi => createGaugeChart(kpi.value, { label: kpi.label }))
        .join('');
      
      container.innerHTML = `<h2>Metrics</h2>
        ${gauges ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">${gauges}</div>` : ''}
        <div class="metrics-grid">${charts}</div>`;
      break;

    case 'alerts':
      if (!service.alerts || service.alerts.length === 0) {
        container.innerHTML = '<h2>Alerts</h2><p>No alerts for this service.</p>';
        break;
      }
      container.innerHTML = `<h2>Alerts</h2>
        <table class="table">
          <caption>Service alerts for ${service.name}</caption>
          <thead><tr><th scope="col">Severity</th><th scope="col">Title</th><th scope="col">Time</th><th scope="col">Status</th></tr></thead>
          <tbody>
            ${service.alerts.map(alert => `
              <tr class="alert-row ${acks.has(alert.id) ? 'acked' : ''}">
                <td><span class="pill status-${alert.severity.toLowerCase()}">${alert.severity}</span></td>
                <td>${escapeHtml(alert.title)}</td>
                <td>${new Date(alert.createdAt).toLocaleString()}</td>
                <td>${acks.has(alert.id) ? 'Acknowledged' : 'Active'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
    case 'actions':
      if (!service.actions || service.actions.length === 0) {
        container.innerHTML = '<h2>Actions</h2><p>No actions available.</p>';
        break;
      }
      container.innerHTML = `<h2>Actions</h2>
        <p class="small">Trigger service actions (mock only - no real effects)</p>
        <div class="actions-grid">
          ${service.actions.map(action => `
            <button class="btn-action ${action.danger ? 'btn-danger' : 'btn-primary'}" 
                    data-service="${service.id}" 
                    data-action="${action.key}">
              ${escapeHtml(action.label)}
            </button>
          `).join('')}
        </div>
      `;
      
      // Add click handlers for actions
      container.querySelectorAll('.btn-action').forEach(btn => {
        btn.addEventListener('click', async () => {
          const serviceId = btn.dataset.service;
          const actionKey = btn.dataset.action;
          const actionLabel = btn.textContent;
          const action = service.actions.find(a => a.key === actionKey);
          
          const confirmed = await showConfirmDialog({
            title: 'Confirm Action',
            message: `Execute action: ${actionLabel}?`,
            confirmText: 'Execute',
            danger: action?.danger || false
          });
          
          if (!confirmed) return;
          
          btn.disabled = true;
          btn.textContent = 'Executing...';
          
          try {
            const result = await triggerAction(serviceId, actionKey);
            showToast(result.message, result.ok ? 'success' : 'error');
          } catch (e) {
            showToast('Action failed', 'error');
          } finally {
            btn.disabled = false;
            btn.textContent = actionLabel;
          }
        });
      });
      break;
    case 'config':
      container.innerHTML = `<h2>Configuration</h2>
        <p class="small">Read-only view of service configuration</p>
        <div class="config-viewer">
          <pre><code>${JSON.stringify(service.config || {}, null, 2)}</code></pre>
          <button id="copy-config" class="btn-secondary">Copy to Clipboard</button>
        </div>
      `;
      
      container.querySelector('#copy-config')?.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(service.config, null, 2));
        showToast('Configuration copied to clipboard', 'success');
      });
      break;
    case 'logs':
      if (!service.logs || service.logs.length === 0) {
        container.innerHTML = '<h2>Logs</h2><p>No logs available.</p>';
        break;
      }
      
      // Render logs with enhanced viewer
      renderEnhancedLogs(service.logs, container);
      break;
    default:
      container.innerHTML = '<p>Select a tab</p>';
  }
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function formatMetricName(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Enhanced logs viewer with filtering, search, and export
function renderEnhancedLogs(logs, container) {
  let logFilter = 'all'; // all, error, warn, info, debug
  let searchQuery = '';
  let wrapLines = false;
  
  function renderLogs() {
    const filteredLogs = logs.filter(log => {
      // Level filter
      if (logFilter !== 'all' && log.level !== logFilter) return false;
      
      // Search filter
      if (searchQuery && !log.msg.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    });
    
    const logHtml = filteredLogs.map(log => {
      const levelClass = `log-level-${log.level || 'info'}`;
      const levelBadge = log.level ? `<span class="log-level-badge ${levelClass}">${log.level.toUpperCase()}</span>` : '';
      return `
        <div class="log-line ${wrapLines ? 'wrap' : 'nowrap'}">
          <span class="log-timestamp">${new Date(log.ts).toLocaleString()}</span>
          ${levelBadge}
          <span class="log-message">${escapeHtml(log.msg)}</span>
        </div>
      `;
    }).join('');
    
    const logsContainer = container.querySelector('#logs-container');
    if (logsContainer) {
      logsContainer.innerHTML = logHtml || '<p class="small" style="padding:12px">No logs match your filters.</p>';
    }
  }
  
  container.innerHTML = `
    <h2>Logs</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <div>
        <label style="font-weight:600;margin-right:8px">Level:</label>
        <select id="log-level-filter" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
          <option value="all">All Levels</option>
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </div>
      
      <input type="search" id="log-search" placeholder="Search logs..." 
             style="padding:6px 12px;border:1px solid rgba(0,0,0,0.1);border-radius:6px;min-width:200px;flex:1;max-width:400px">
      
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" id="log-wrap-toggle">
        Wrap lines
      </label>
      
      <button id="export-logs" class="btn-secondary" style="margin-left:auto">Export Logs</button>
    </div>
    
    <div class="logs-viewer" id="logs-container">
      <!-- Logs will be rendered here -->
    </div>
  `;
  
  // Initial render
  renderLogs();
  
  // Event listeners
  container.querySelector('#log-level-filter')?.addEventListener('change', (e) => {
    logFilter = e.target.value;
    renderLogs();
  });
  
  container.querySelector('#log-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderLogs();
  });
  
  container.querySelector('#log-wrap-toggle')?.addEventListener('change', (e) => {
    wrapLines = e.target.checked;
    renderLogs();
  });
  
  container.querySelector('#export-logs')?.addEventListener('click', () => {
    const logText = logs.map(log => 
      `[${new Date(log.ts).toISOString()}] [${(log.level || 'INFO').toUpperCase()}] ${log.msg}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Logs exported successfully', 'success');
  });
}

function showToast(message, type = 'info') {
  const toasts = document.getElementById('toasts');
  if (!toasts) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toasts.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function registerServiceDetailRoute() {
  registerRoute('/services/:id', renderServiceDetail);
}
