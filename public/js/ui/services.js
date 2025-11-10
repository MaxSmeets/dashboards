import { getState, subscribe } from '../store.js';
import { registerRoute } from '../router.js';

let currentView = 'grid'; // 'grid' or 'list'
let searchQuery = '';
let selectedTags = new Set();
let sortBy = 'status'; // 'status', 'name', 'latency'

function renderServicesPage() {
    const out = document.getElementById('route-outlet');
    const s = getState();
    if (!s.data) {
        out.innerHTML = '<div class="container">Loading...</div>';
        return;
    }

    const container = document.createElement('div');
    container.className = 'container';
    
    // Header with controls
    const header = document.createElement('div');
    header.className = 'card services-header';
    header.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
                <h2>Services Directory</h2>
                <p class="small">${s.data.services.length} services total</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <input type="search" id="service-search" placeholder="Search services..." 
                       value="${escapeHtml(searchQuery)}" 
                       style="padding:8px;border:1px solid rgba(0,0,0,0.1);border-radius:6px;min-width:200px">
                <button class="btn-secondary" id="toggle-view">
                    ${currentView === 'grid' ? 'List View' : 'Grid View'}
                </button>
            </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <label style="font-weight:600;margin-right:8px">Tags:</label>
            ${getAllTags(s.data.services).map(tag => `
                <label class="tag-filter">
                    <input type="checkbox" value="${tag}" ${selectedTags.has(tag) ? 'checked' : ''}>
                    ${tag}
                </label>
            `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;align-items:center">
            <label style="font-weight:600">Sort by:</label>
            <select id="sort-select" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                <option value="status" ${sortBy === 'status' ? 'selected' : ''}>Status</option>
                <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Name</option>
                <option value="latency" ${sortBy === 'latency' ? 'selected' : ''}>Latency</option>
            </select>
        </div>
    `;
    container.appendChild(header);
    
    // Filtered and sorted services
    const filteredServices = filterAndSortServices(s.data.services);
    
    // Services grid/list
    const servicesContainer = document.createElement('div');
    servicesContainer.className = currentView === 'grid' ? 'grid-tiles' : 'services-list';
    
    if (filteredServices.length === 0) {
        servicesContainer.innerHTML = '<div class="card"><p>No services match your filters.</p></div>';
    } else {
        filteredServices.forEach(service => {
            const tile = createServiceTile(service);
            servicesContainer.appendChild(tile);
        });
    }
    
    container.appendChild(servicesContainer);
    out.innerHTML = '';
    out.appendChild(container);
    
    // Event listeners
    header.querySelector('#service-search')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderServicesPage();
    });
    
    header.querySelector('#toggle-view')?.addEventListener('click', () => {
        currentView = currentView === 'grid' ? 'list' : 'grid';
        renderServicesPage();
    });
    
    header.querySelectorAll('.tag-filter input').forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedTags.add(e.target.value);
            } else {
                selectedTags.delete(e.target.value);
            }
            renderServicesPage();
        });
    });
    
    header.querySelector('#sort-select')?.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderServicesPage();
    });
}

function getAllTags(services) {
    const tags = new Set();
    services.forEach(s => s.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
}

function filterAndSortServices(services) {
    let filtered = services;
    
    // Search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.category.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query)
        );
    }
    
    // Tag filter
    if (selectedTags.size > 0) {
        filtered = filtered.filter(s => 
            s.tags?.some(t => selectedTags.has(t))
        );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'status') {
            const statusOrder = { 'healthy': 0, 'running': 0, 'degraded': 1, 'warning': 1, 'error': 2, 'critical': 2 };
            return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
        } else if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'latency') {
            return (a.latencyMs || 999) - (b.latencyMs || 999);
        }
        return 0;
    });
    
    return sorted;
}

function createServiceTile(svc) {
    const el = document.createElement('article');
    el.className = currentView === 'grid' ? 'card service-tile' : 'card service-tile-list';
    
    const alertCount = svc.alerts?.filter(a => !getState().acks.has(a.id)).length || 0;
    const alertBadge = alertCount > 0 ? `<span class="alert-badge">${alertCount}</span>` : '';
    
    el.innerHTML = `
        <div class="service-header">
            <div style="display:flex;align-items:center;gap:8px">
                <span class="status-dot" style="background:${statusColor(svc.status)}"></span>
                <strong>${escapeHtml(svc.name)}</strong>
                ${alertBadge}
                <span class="small" style="margin-left:8px">${svc.version || ''}</span>
            </div>
            <div class="small">${svc.latencyMs ?? '-'} ms</div>
        </div>
        <div class="kpi-row">
            <div class="kpi">CPU: ${svc.cpuPct ?? '-'}%</div>
            <div class="kpi">RAM: ${svc.ramMb ?? '-'} MB</div>
            <div class="kpi">Uptime: ${svc.uptimePct24h ?? '-'}%</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;gap:8px">
            <button class="btn-secondary btn-small" onclick="location.hash='#/services/${svc.id}'">Details</button>
            ${svc.endpoint ? `<a href="${svc.endpoint}" target="_blank" class="btn-secondary btn-small">Open UI</a>` : ''}
        </div>
    `;
    
    return el;
}

function statusColor(status) {
    if (!status) return '#94a3b8';
    if (status === 'healthy' || status === 'running') return 'var(--c-ok)';
    if (status === 'warning' || status === 'degraded') return 'var(--c-warn)';
    if (status === 'error' || status === 'critical') return 'var(--c-err)';
    return 'var(--muted)';
}

function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function registerServicesRoute() {
    registerRoute('/services', renderServicesPage);
    subscribe(() => {
        if (location.hash === '#/services') {
            renderServicesPage();
        }
    });
}
