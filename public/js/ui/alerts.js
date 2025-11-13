import { getState, setState, subscribe } from '../store.js';
import { registerRoute } from '../router.js';

let severityFilter = 'all'; // 'all', 'critical', 'error', 'warning', 'info'
let serviceFilter = 'all';
let ackFilter = 'all'; // 'all', 'active', 'acknowledged'
let viewMode = 'table'; // 'table', 'timeline', 'grouped'
let groupBy = 'severity'; // 'severity', 'service', 'time'

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderAlertsPage() {
    const out = document.getElementById('route-outlet');
    const s = getState();
    if (!s.data) {
        out.innerHTML = '<div class="container">Loading...</div>';
        return;
    }

    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
        <div class="card">
            <h2>Alerts Center</h2>
            <p>Filter and manage all system alerts.</p>
            
            <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;align-items:center">
                <div>
                    <label style="font-weight:600;margin-right:8px">View:</label>
                    <select id="view-mode" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="table" ${viewMode === 'table' ? 'selected' : ''}>Table</option>
                        <option value="timeline" ${viewMode === 'timeline' ? 'selected' : ''}>Timeline</option>
                        <option value="grouped" ${viewMode === 'grouped' ? 'selected' : ''}>Grouped</option>
                    </select>
                </div>
                
                ${viewMode === 'grouped' ? `
                <div>
                    <label style="font-weight:600;margin-right:8px">Group By:</label>
                    <select id="group-by" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="severity" ${groupBy === 'severity' ? 'selected' : ''}>Severity</option>
                        <option value="service" ${groupBy === 'service' ? 'selected' : ''}>Service</option>
                        <option value="time" ${groupBy === 'time' ? 'selected' : ''}>Time Period</option>
                    </select>
                </div>
                ` : ''}
                
                <div>
                    <label style="font-weight:600;margin-right:8px">Severity:</label>
                    <select id="severity-filter" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="all" ${severityFilter === 'all' ? 'selected' : ''}>All</option>
                        <option value="critical" ${severityFilter === 'critical' ? 'selected' : ''}>Critical</option>
                        <option value="error" ${severityFilter === 'error' ? 'selected' : ''}>Error</option>
                        <option value="warning" ${severityFilter === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="info" ${severityFilter === 'info' ? 'selected' : ''}>Info</option>
                    </select>
                </div>
                
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
                    <label style="font-weight:600;margin-right:8px">Status:</label>
                    <select id="ack-filter" style="padding:6px;border:1px solid rgba(0,0,0,0.1);border-radius:6px">
                        <option value="all" ${ackFilter === 'all' ? 'selected' : ''}>All</option>
                        <option value="active" ${ackFilter === 'active' ? 'selected' : ''}>Active Only</option>
                        <option value="acknowledged" ${ackFilter === 'acknowledged' ? 'selected' : ''}>Acknowledged Only</option>
                    </select>
                </div>
                
                <button id="bulk-ack" class="btn-secondary" style="margin-left:auto">Bulk Acknowledge</button>
                <button id="bulk-unack" class="btn-secondary">Bulk Un-acknowledge</button>
            </div>
        </div>
        <div class="card" id="alerts-content-container">
            <!-- Content will be rendered here based on view mode -->
        </div>
    `;
    out.innerHTML = '';
    out.appendChild(container);

    // Initial render
    rerenderContent();

    // Add event listeners
    container.querySelector('#view-mode')?.addEventListener('change', (e) => {
        viewMode = e.target.value;
        renderAlertsPage(); // Re-render entire page to show/hide group-by
    });
    
    container.querySelector('#group-by')?.addEventListener('change', (e) => {
        groupBy = e.target.value;
        rerenderContent();
    });
    
    container.querySelector('#severity-filter')?.addEventListener('change', (e) => {
        severityFilter = e.target.value;
        rerenderContent();
    });
    
    container.querySelector('#service-filter')?.addEventListener('change', (e) => {
        serviceFilter = e.target.value;
        rerenderContent();
    });
    
    container.querySelector('#ack-filter')?.addEventListener('change', (e) => {
        ackFilter = e.target.value;
        rerenderContent();
    });
    
    container.querySelector('#bulk-ack')?.addEventListener('click', () => {
        const filtered = filterAlerts(s.data.alerts);
        const { acks } = getState();
        filtered.forEach(alert => acks.add(alert.id));
        setState({ acks: new Set(acks) });
    });
    
    container.querySelector('#bulk-unack')?.addEventListener('click', () => {
        const filtered = filterAlerts(s.data.alerts);
        const { acks } = getState();
        filtered.forEach(alert => acks.delete(alert.id));
        setState({ acks: new Set(acks) });
    });

    // Event delegation for alert actions
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('ack-toggle')) {
            const alertId = e.target.dataset.id;
            const { acks } = getState();
            if (acks.has(alertId)) {
                acks.delete(alertId);
            } else {
                acks.add(alertId);
            }
            setState({ acks: new Set(acks) });
        }
        
        if (e.target.classList.contains('snooze-btn')) {
            const alertId = e.target.dataset.id;
            snoozeAlert(alertId, 60); // Snooze for 60 minutes
        }
        
        if (e.target.classList.contains('add-note-btn')) {
            const alertId = e.target.dataset.id;
            addAlertNote(alertId);
        }
    });
}

function filterAlerts(alerts) {
    const { acks, alertSnooze } = getState();
    const now = Date.now();
    
    return alerts.filter(alert => {
        // Check if snoozed
        if (alertSnooze[alert.id] && alertSnooze[alert.id] > now) return false;
        
        if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
        if (serviceFilter !== 'all' && alert.serviceId !== serviceFilter) return false;
        if (ackFilter === 'active' && acks.has(alert.id)) return false;
        if (ackFilter === 'acknowledged' && !acks.has(alert.id)) return false;
        return true;
    });
}

function rerenderContent() {
    const container = document.getElementById('alerts-content-container');
    if (!container) return;
    
    if (viewMode === 'table') {
        renderAlertsTable(container);
    } else if (viewMode === 'timeline') {
        renderAlertsTimeline(container);
    } else if (viewMode === 'grouped') {
        renderAlertsGrouped(container);
    }
}

function renderAlertsTable(container) {
    const s = getState();
    const acks = s.acks || new Set();
    const alertNotes = s.alertNotes || {};
    const filtered = filterAlerts(s.data.alerts);
    
    if (!filtered || filtered.length === 0) {
        container.innerHTML = '<p>No alerts match your filters.</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <caption>System Alerts</caption>
            <thead>
                <tr>
                    <th scope="col">Severity</th>
                    <th scope="col">Service</th>
                    <th scope="col">Title</th>
                    <th scope="col">Time</th>
                    <th scope="col">Notes</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(alert => `
                    <tr class="alert-row ${acks.has(alert.id) ? 'acked' : ''}">
                        <td><span class="pill status-${alert.severity.toLowerCase()}">${alert.severity}</span></td>
                        <td><a href="#/services/${alert.serviceId}">${alert.serviceId}</a></td>
                        <td>${escapeHtml(alert.title)}</td>
                        <td>${new Date(alert.createdAt).toLocaleString()}</td>
                        <td>
                            ${alertNotes[alert.id] ? `<div class="alert-note">${escapeHtml(alertNotes[alert.id])}</div>` : ''}
                            <button class="add-note-btn btn-small" data-id="${alert.id}">
                                ${alertNotes[alert.id] ? 'Edit Note' : 'Add Note'}
                            </button>
                        </td>
                        <td style="display:flex;gap:4px">
                            <button class="ack-toggle btn-small" data-id="${alert.id}">${acks.has(alert.id) ? 'Un-ack' : 'Ack'}</button>
                            <button class="snooze-btn btn-small" data-id="${alert.id}">Snooze</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderAlertsTimeline(container) {
    const s = getState();
    const filtered = filterAlerts(s.data.alerts);
    const acks = s.acks || new Set();
    const snoozed = s.alertSnooze || {};
    const notes = s.alertNotes || {};
    
    if (!filtered || filtered.length === 0) {
        container.innerHTML = '<p>No alerts match your filters.</p>';
        return;
    }
    
    // Sort by time
    const sorted = [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Find time range
    const times = sorted.map(a => new Date(a.createdAt).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const range = maxTime - minTime || 1;
    
    // Create time labels
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
               ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };
    
    const timeLabels = [
        { time: minTime, label: formatDate(new Date(minTime)) },
        { time: minTime + range / 2, label: formatDate(new Date(minTime + range / 2)) },
        { time: maxTime, label: formatDate(new Date(maxTime)) }
    ];
    
    container.innerHTML = `
        <h3>Alert Timeline</h3>
        <div class="timeline-description">
            📊 <strong>Timeline View:</strong> Alerts shown chronologically from left (oldest) to right (newest). Hover over markers for details.
        </div>
        <div class="alert-timeline">
            <div class="timeline-axis"></div>
            ${timeLabels.map(({ time, label }) => {
                const position = ((time - minTime) / range) * 100;
                return `
                    <div class="timeline-label" style="left:${position}%">
                        <div class="timeline-tick"></div>
                        ${label}
                    </div>
                `;
            }).join('')}
            ${sorted.map((alert, idx) => {
                const alertTime = new Date(alert.createdAt).getTime();
                const position = ((alertTime - minTime) / range) * 100;
                const isAcked = acks.has(alert.id);
                const isSnoozed = snoozed[alert.id] && Date.now() < snoozed[alert.id];
                const hasNotes = notes[alert.id] && notes[alert.id].trim && notes[alert.id].trim().length > 0;
                
                // Build tooltip
                let tooltipContent = `
                    <div class="timeline-tooltip-header">
                        <span class="severity-badge severity-${alert.severity}">${alert.severity}</span>
                        <strong>${escapeHtml(alert.title)}</strong>
                    </div>
                    <div class="timeline-tooltip-body">
                        <div><strong>Service:</strong> ${escapeHtml(alert.serviceId)}</div>
                        <div><strong>Time:</strong> ${formatDate(new Date(alert.createdAt))}</div>
                        <div><strong>Status:</strong> ${isAcked ? '✅ Acknowledged' : '⭕ Active'}${isSnoozed ? ' (Snoozed)' : ''}</div>
                `;
                
                if (hasNotes) {
                    tooltipContent += `
                        <div class="timeline-tooltip-notes">
                            <strong>📝 Note:</strong>
                            <div class="timeline-note">${escapeHtml(notes[alert.id])}</div>
                        </div>
                    `;
                }
                
                tooltipContent += `</div>`;
                
                return `
                    <div class="timeline-item" style="left:${position}%">
                        <div class="timeline-marker severity-${alert.severity} ${isAcked ? 'acked' : ''} ${hasNotes ? 'has-notes' : ''}"></div>
                        <div class="timeline-tooltip">${tooltipContent}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderAlertsGrouped(container) {
    const s = getState();
    const filtered = filterAlerts(s.data.alerts);
    
    if (!filtered || filtered.length === 0) {
        container.innerHTML = '<p>No alerts match your filters.</p>';
        return;
    }
    
    const groups = {};
    
    filtered.forEach(alert => {
        let key;
        if (groupBy === 'severity') {
            key = alert.severity;
        } else if (groupBy === 'service') {
            key = alert.serviceId;
        } else if (groupBy === 'time') {
            const alertDate = new Date(alert.createdAt);
            const now = new Date();
            const hoursDiff = (now - alertDate) / (1000 * 60 * 60);
            
            if (hoursDiff < 1) key = 'Last Hour';
            else if (hoursDiff < 24) key = 'Today';
            else if (hoursDiff < 168) key = 'This Week';
            else key = 'Older';
        }
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(alert);
    });
    
    const groupOrder = groupBy === 'severity' 
        ? ['critical', 'error', 'warning', 'info']
        : groupBy === 'time'
        ? ['Last Hour', 'Today', 'This Week', 'Older']
        : Object.keys(groups).sort();
    
    container.innerHTML = `
        <h3>Alerts Grouped by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</h3>
        ${groupOrder.filter(key => groups[key]).map(key => `
            <div class="alert-group" style="margin-bottom:24px">
                <h4 style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                    ${groupBy === 'severity' ? `<span class="pill status-${key.toLowerCase()}">${key}</span>` : key}
                    <span class="small" style="color:var(--muted)">(${groups[key].length} alert${groups[key].length > 1 ? 's' : ''})</span>
                </h4>
                <div style="display:grid;gap:8px">
                    ${groups[key].map(alert => createAlertCard(alert)).join('')}
                </div>
            </div>
        `).join('')}
    `;
}

function createAlertCard(alert) {
    const s = getState();
    const acks = s.acks || new Set();
    const alertNotes = s.alertNotes || {};
    const isAcked = acks.has(alert.id);
    
    return `
        <div class="alert-card ${isAcked ? 'acked' : ''}" style="padding:12px;background:rgba(0,0,0,0.02);border-radius:8px">
            <div style="display:flex;justify-content:space-between;align-items:start">
                <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <span class="pill status-${alert.severity.toLowerCase()}">${alert.severity}</span>
                        <strong>${escapeHtml(alert.title)}</strong>
                    </div>
                    <div class="small" style="color:var(--muted)">
                        <a href="#/services/${alert.serviceId}">${alert.serviceId}</a> • 
                        ${new Date(alert.createdAt).toLocaleString()}
                    </div>
                    ${alertNotes[alert.id] ? `<div class="alert-note" style="margin-top:8px;font-style:italic">${escapeHtml(alertNotes[alert.id])}</div>` : ''}
                </div>
                <div style="display:flex;gap:4px">
                    <button class="ack-toggle btn-small" data-id="${alert.id}">${isAcked ? 'Un-ack' : 'Ack'}</button>
                    <button class="snooze-btn btn-small" data-id="${alert.id}">💤</button>
                    <button class="add-note-btn btn-small" data-id="${alert.id}">📝</button>
                </div>
            </div>
        </div>
    `;
}

function snoozeAlert(alertId, minutes) {
    const { alertSnooze } = getState();
    const snoozeUntil = Date.now() + (minutes * 60 * 1000);
    alertSnooze[alertId] = snoozeUntil;
    setState({ alertSnooze: { ...alertSnooze } });
    
    showToast(`Alert snoozed for ${minutes} minutes`, 'info');
    rerenderContent();
}

function addAlertNote(alertId) {
    const { alertNotes } = getState();
    const currentNote = alertNotes[alertId] || '';
    const note = prompt('Add a note to this alert:', currentNote);
    
    if (note !== null) {
        if (note.trim()) {
            alertNotes[alertId] = note.trim();
        } else {
            delete alertNotes[alertId];
        }
        setState({ alertNotes: { ...alertNotes } });
        rerenderContent();
    }
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

function rerenderTable() {
    // Backward compatibility - redirect to rerenderContent
    rerenderContent();
}

function rerenderOnChange() {
    if (location.hash === '#/alerts') {
        rerenderContent();
    }
}

export function registerAlertsRoute() {
    registerRoute('/alerts', renderAlertsPage);
    subscribe(rerenderOnChange);
}
