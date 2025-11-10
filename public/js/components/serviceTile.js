import { createSparkline } from './charts.js';

export function createServiceTile(svc){
  const el = document.createElement('article'); el.className='card service-tile';
  const header = document.createElement('div'); header.className='service-header';
  const left = document.createElement('div'); left.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><span class="status-dot" style="background:${statusColor(svc.status)}"></span><strong>${escapeHtml(svc.name)}</strong><div class="small" style="margin-left:8px">${svc.version||''}</div></div>`;
  const right = document.createElement('div'); right.innerHTML = `<div class="small">${svc.latencyMs ?? '-'} ms</div>`;
  header.appendChild(left); header.appendChild(right);
  el.appendChild(header);
  const kpiRow = document.createElement('div'); kpiRow.className='kpi-row';
  kpiRow.innerHTML = `<div class="kpi">CPU: ${svc.cpuPct ?? '-'}%</div><div class="kpi">RAM: ${svc.ramMb ?? '-'} MB</div><div class="kpi">Uptime: ${svc.uptimePct24h ?? '-'}%</div>`;
  el.appendChild(kpiRow);
  
  // Add sparkline if metrics exist
  if (svc.metrics?.timeseries?.cpuPct) {
    const sparklineContainer = document.createElement('div');
    sparklineContainer.innerHTML = createSparkline(svc.metrics.timeseries.cpuPct, statusColor(svc.status));
    sparklineContainer.style.marginTop = '8px';
    el.appendChild(sparklineContainer);
  }
  
  const footer = document.createElement('div'); footer.style.display='flex'; footer.style.justifyContent='space-between'; footer.style.marginTop='8px';
  const actions = document.createElement('div'); actions.innerHTML = `<button class="small" data-id="${svc.id}">Details</button>`;
  footer.appendChild(actions);
  el.appendChild(footer);
  el.querySelector('button')?.addEventListener('click',()=>{ location.hash = '#/services/'+svc.id });
  return el;
}
function statusColor(status){ if(!status) return '#94a3b8'; if(status==='healthy' || status==='running') return 'var(--c-ok)'; if(status==='warning' || status==='degraded') return 'var(--c-warn)'; if(status==='error' || status==='critical') return 'var(--c-err)'; return 'var(--muted)'; }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
