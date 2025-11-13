import { getState } from '../store.js';
import { registerRoute } from '../router.js';

let serviceFilter = 'all';
let levelFilter = 'all'; // 'all', 'error', 'warn', 'info', 'debug'
let searchQuery = '';
let sortOrder = 'desc'; // 'desc' (newest first), 'asc' (oldest first)
let maxLogs = 100; // Default to show 100 most recent logs
let searchTimeout = null;

function renderLogsPage() {
    const out = document.getElementById('route-outlet');
    const s = getState();
    
    if (!s.data) {
        out.innerHTML = '<div class="container">Loading...</div>';
        return;
    }

    const container = document.createElement('div');
    container.className = 'container';
    
    // Aggregate all logs from all services
    const allLogs = [];
    s.data.services.forEach(service => {
        if (service.logs && Array.isArray(service.logs)) {
            service.logs.forEach(log => {
                allLogs.push({
                    ...log,
                    serviceId: service.id,
                    serviceName: service.name,
                    serviceCategory: service.category
                });
            });
        }
    });
    
    // Sort logs by timestamp
    allLogs.sort((a, b) => {
        const timeA = new Date(a.ts).getTime();
        const timeB = new Date(b.ts).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    
    // Apply filters
    const filtered = allLogs.filter(log => {
        // Service filter
        if (serviceFilter !== 'all' && log.serviceId !== serviceFilter) return false;
        
        // Level filter
        if (levelFilter !== 'all' && log.level !== levelFilter) return false;
        
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchMsg = log.msg.toLowerCase().includes(query);
            const matchService = log.serviceName.toLowerCase().includes(query);
            if (!matchMsg && !matchService) return false;
        }
        
        return true;
    });
    
    // Limit results
    const displayLogs = filtered.slice(0, maxLogs);
    
    // Count by level
    const levelCounts = {
        error: filtered.filter(l => l.level === 'error').length,
        warn: filtered.filter(l => l.level === 'warn').length,
        info: filtered.filter(l => l.level === 'info').length,
        debug: filtered.filter(l => l.level === 'debug').length
    };
    
    container.innerHTML = `
        <div class="card">
            <h2>Logs Center</h2>
            <p>Aggregated logs from all services. Total: <strong>${allLogs.length}</strong> logs | Showing: <strong>${displayLogs.length}</strong> of <strong>${filtered.length}</strong> filtered</p>
            
            <!-- Stats Bar -->
            <div class="logs-stats">
                <div class="stat-badge error">${levelCounts.error} Errors</div>
                <div class="stat-badge warn">${levelCounts.warn} Warnings</div>
                <div class="stat-badge info">${levelCounts.info} Info</div>
                <div class="stat-badge debug">${levelCounts.debug} Debug</div>
            </div>
            
            <!-- Filters -->
            <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;align-items:center">
                <div>
                    <label style="font-weight:600;margin-right:8px">Service:</label>
                    <select id="service-filter" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="all" ${serviceFilter === 'all' ? 'selected' : ''}>All Services</option>
                        ${s.data.services.map(svc => `
                            <option value="${svc.id}" ${serviceFilter === svc.id ? 'selected' : ''}>${svc.name}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="font-weight:600;margin-right:8px">Level:</label>
                    <select id="level-filter" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="all" ${levelFilter === 'all' ? 'selected' : ''}>All Levels</option>
                        <option value="error" ${levelFilter === 'error' ? 'selected' : ''}>Error</option>
                        <option value="warn" ${levelFilter === 'warn' ? 'selected' : ''}>Warning</option>
                        <option value="info" ${levelFilter === 'info' ? 'selected' : ''}>Info</option>
                        <option value="debug" ${levelFilter === 'debug' ? 'selected' : ''}>Debug</option>
                    </select>
                </div>
                
                <div>
                    <label style="font-weight:600;margin-right:8px">Sort:</label>
                    <select id="sort-order" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>Newest First</option>
                        <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>Oldest First</option>
                    </select>
                </div>
                
                <div>
                    <label style="font-weight:600;margin-right:8px">Limit:</label>
                    <select id="max-logs" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="50" ${maxLogs === 50 ? 'selected' : ''}>50 logs</option>
                        <option value="100" ${maxLogs === 100 ? 'selected' : ''}>100 logs</option>
                        <option value="250" ${maxLogs === 250 ? 'selected' : ''}>250 logs</option>
                        <option value="500" ${maxLogs === 500 ? 'selected' : ''}>500 logs</option>
                        <option value="1000" ${maxLogs === 1000 ? 'selected' : ''}>1000 logs</option>
                    </select>
                </div>
                
                <div style="flex:1;min-width:200px">
                    <input 
                        type="text" 
                        id="search-logs" 
                        placeholder="Search logs..." 
                        value="${searchQuery}"
                        style="width:100%;padding:6px 12px;border:1px solid rgba(0,0,0,0.1);border-radius:6px"
                    />
                </div>
                
                <button id="clear-filters" class="btn-secondary">Clear Filters</button>
                <button id="export-logs" class="btn-primary">Export Logs</button>
            </div>
        </div>
        
        <div class="card" id="logs-content">
            <!-- Logs table will be rendered here -->
        </div>
    `;
    
    out.innerHTML = '';
    out.appendChild(container);
    
    // Render the logs table
    renderLogsTable(displayLogs, filtered.length, maxLogs);
    
    // Add event listeners
    container.querySelector('#service-filter')?.addEventListener('change', (e) => {
        serviceFilter = e.target.value;
        renderLogsPage();
    });
    
    container.querySelector('#level-filter')?.addEventListener('change', (e) => {
        levelFilter = e.target.value;
        renderLogsPage();
    });
    
    container.querySelector('#sort-order')?.addEventListener('change', (e) => {
        sortOrder = e.target.value;
        renderLogsPage();
    });
    
    container.querySelector('#max-logs')?.addEventListener('change', (e) => {
        maxLogs = parseInt(e.target.value);
        renderLogsPage();
    });
    
    const searchInput = container.querySelector('#search-logs');
    searchInput?.addEventListener('input', (e) => {
        const newQuery = e.target.value;
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Update search query immediately for UI responsiveness
        searchQuery = newQuery;
        
        // Debounce the actual filtering/rendering
        searchTimeout = setTimeout(() => {
            updateLogsTable();
        }, 300);
    });
    
    container.querySelector('#clear-filters')?.addEventListener('click', () => {
        serviceFilter = 'all';
        levelFilter = 'all';
        searchQuery = '';
        sortOrder = 'desc';
        maxLogs = 100;
        renderLogsPage();
    });
    
    container.querySelector('#export-logs')?.addEventListener('click', () => {
        const s = getState();
        const allLogs = [];
        s.data.services.forEach(service => {
            if (service.logs && Array.isArray(service.logs)) {
                service.logs.forEach(log => {
                    allLogs.push({
                        ...log,
                        serviceId: service.id,
                        serviceName: service.name,
                        serviceCategory: service.category
                    });
                });
            }
        });
        
        allLogs.sort((a, b) => {
            const timeA = new Date(a.ts).getTime();
            const timeB = new Date(b.ts).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
        
        const filtered = allLogs.filter(log => {
            if (serviceFilter !== 'all' && log.serviceId !== serviceFilter) return false;
            if (levelFilter !== 'all' && log.level !== levelFilter) return false;
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchMsg = log.msg.toLowerCase().includes(query);
                const matchService = log.serviceName.toLowerCase().includes(query);
                if (!matchMsg && !matchService) return false;
            }
            return true;
        });
        
        exportLogs(filtered);
    });
}

function updateLogsTable() {
    const s = getState();
    if (!s.data) return;
    
    // Aggregate and filter logs
    const allLogs = [];
    s.data.services.forEach(service => {
        if (service.logs && Array.isArray(service.logs)) {
            service.logs.forEach(log => {
                allLogs.push({
                    ...log,
                    serviceId: service.id,
                    serviceName: service.name,
                    serviceCategory: service.category
                });
            });
        }
    });
    
    allLogs.sort((a, b) => {
        const timeA = new Date(a.ts).getTime();
        const timeB = new Date(b.ts).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    
    const filtered = allLogs.filter(log => {
        if (serviceFilter !== 'all' && log.serviceId !== serviceFilter) return false;
        if (levelFilter !== 'all' && log.level !== levelFilter) return false;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchMsg = log.msg.toLowerCase().includes(query);
            const matchService = log.serviceName.toLowerCase().includes(query);
            if (!matchMsg && !matchService) return false;
        }
        return true;
    });
    
    const displayLogs = filtered.slice(0, maxLogs);
    renderLogsTable(displayLogs, filtered.length, maxLogs);
}

function renderLogsTable(displayLogs, totalFiltered, limit) {
    const container = document.getElementById('logs-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="logs-table-container">
            ${displayLogs.length === 0 ? '<p>No logs match your filters.</p>' : `
                <table class="logs-table">
                    <thead>
                        <tr>
                            <th style="width:180px">Timestamp</th>
                            <th style="width:80px">Level</th>
                            <th style="width:150px">Service</th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${displayLogs.map(log => `
                            <tr class="log-row log-level-${log.level}">
                                <td class="log-timestamp">${new Date(log.ts).toLocaleString()}</td>
                                <td>
                                    <span class="log-level-badge level-${log.level}">${log.level.toUpperCase()}</span>
                                </td>
                                <td>
                                    <a href="#/services/${log.serviceId}" class="log-service-link">${log.serviceName}</a>
                                </td>
                                <td class="log-message">${escapeHtml(log.msg)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
        ${totalFiltered > limit ? `
            <div style="margin-top:16px;padding:12px;background:rgba(255,152,0,0.1);border-left:4px solid #ff9800;border-radius:4px">
                <strong>Note:</strong> Showing ${limit} of ${totalFiltered} matching logs. Increase the limit or refine your filters to see more.
            </div>
        ` : ''}
    `;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function exportLogs(logs) {
    // Export as CSV
    const headers = ['Timestamp', 'Level', 'Service', 'Message'];
    const rows = logs.map(log => [
        new Date(log.ts).toISOString(),
        log.level,
        log.serviceName,
        log.msg.replace(/"/g, '""') // Escape quotes in CSV
    ]);
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function initLogsPage() {
    registerRoute('/logs', renderLogsPage);
}
