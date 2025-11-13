import { getState } from '../store.js';
import { registerRoute } from '../router.js';
import { createBarChart, createLineChart } from '../components/charts.js';

function renderComparisonPage() {
    const out = document.getElementById('route-outlet');
    const s = getState();
    
    if (!s.data) {
        out.innerHTML = '<div class="container">Loading...</div>';
        return;
    }
    
    // Get service IDs from URL hash
    const hash = location.hash;
    const match = hash.match(/services=([^&]+)/);
    const serviceIds = match ? match[1].split(',') : [];
    
    const container = document.createElement('div');
    container.className = 'container';
    
    if (serviceIds.length === 0) {
        container.innerHTML = `
            <div class="card">
                <h2>Service Comparison</h2>
                <p>Select services to compare:</p>
                <div style="display:grid;gap:8px;margin-top:16px">
                    ${s.data.services.map(svc => `
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                            <input type="checkbox" class="service-select" value="${svc.id}">
                            ${svc.name}
                        </label>
                    `).join('')}
                </div>
                <button id="compare-btn" class="btn-primary" style="margin-top:16px">Compare Selected</button>
            </div>
        `;
        
        container.querySelector('#compare-btn')?.addEventListener('click', () => {
            const selected = Array.from(container.querySelectorAll('.service-select:checked')).map(cb => cb.value);
            if (selected.length > 0) {
                location.hash = `#/compare?services=${selected.join(',')}`;
            }
        });
    } else {
        const services = serviceIds.map(id => s.data.services.find(svc => svc.id === id)).filter(Boolean);
        
        if (services.length === 0) {
            container.innerHTML = '<div class="card"><h2>No services found</h2></div>';
        } else {
            container.innerHTML = `
                <div class="card">
                    <a href="#/compare">&larr; Back to Selection</a>
                    <h2>Comparing ${services.length} Services</h2>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                        ${services.map(svc => `<span class="pill">${svc.name}</span>`).join('')}
                    </div>
                </div>
                
                <div class="card">
                    <h3>CPU Usage Comparison</h3>
                    ${createBarChart(
                        services.map(svc => ({ label: svc.name, value: svc.cpuPct || 0 })),
                        { label: 'CPU Usage (%)', color: 'var(--c-info)' }
                    )}
                </div>
                
                <div class="card">
                    <h3>Memory Usage Comparison</h3>
                    ${createBarChart(
                        services.map(svc => ({ label: svc.name, value: svc.ramMb || 0 })),
                        { label: 'Memory (MB)', color: 'var(--c-ok)', valueFormatter: v => `${v.toFixed(0)} MB` }
                    )}
                </div>
                
                <div class="card">
                    <h3>Latency Comparison</h3>
                    ${createBarChart(
                        services.map(svc => ({ label: svc.name, value: svc.latencyMs || 0 })),
                        { label: 'Latency (ms)', color: 'var(--c-warn)', valueFormatter: v => `${v.toFixed(0)} ms` }
                    )}
                </div>
                
                <div class="card">
                    <h3>Uptime Comparison</h3>
                    ${createBarChart(
                        services.map(svc => ({ label: svc.name, value: svc.uptimePct24h || 0 })),
                        { label: 'Uptime (24h %)', color: 'var(--c-ok)', valueFormatter: v => `${v.toFixed(2)}%` }
                    )}
                </div>
                
                ${services.every(svc => svc.metrics?.timeseries?.cpuPct) ? `
                <div class="card">
                    <h3>CPU Trends Overlay</h3>
                    <div style="position:relative">
                        ${services.map((svc, i) => {
                            const colors = ['var(--c-info)', 'var(--c-ok)', 'var(--c-warn)', 'var(--c-err)'];
                            return createLineChart(svc.metrics.timeseries.cpuPct, { 
                                label: `${svc.name} CPU`, 
                                color: colors[i % colors.length] 
                            });
                        }).join('')}
                    </div>
                </div>
                ` : ''}
            `;
        }
    }
    
    out.innerHTML = '';
    out.appendChild(container);
}

export function registerComparisonRoute() {
    registerRoute('/compare', renderComparisonPage);
}
