import { getState, setState, subscribe } from '../store.js';
import { registerRoute } from '../router.js';

let severityFilter = 'all'; // 'all', 'critical', 'error', 'warning', 'info'
let serviceFilter = 'all';
let ackFilter = 'all'; // 'all', 'active', 'acknowledged'

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
        <div class="card" id="alerts-table-container">
            <!-- Table will be rendered here -->
        </div>
    `;
    out.innerHTML = '';
    out.appendChild(container);

    // Initial render of the table
    rerenderTable();

    // Add event listeners
    container.querySelector('#severity-filter')?.addEventListener('change', (e) => {
        severityFilter = e.target.value;
        rerenderTable();
    });
    
    container.querySelector('#service-filter')?.addEventListener('change', (e) => {
        serviceFilter = e.target.value;
        rerenderTable();
    });
    
    container.querySelector('#ack-filter')?.addEventListener('change', (e) => {
        ackFilter = e.target.value;
        rerenderTable();
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

    // Add event listeners for ack buttons using event delegation
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
    });
}

function filterAlerts(alerts) {
    const { acks } = getState();
    return alerts.filter(alert => {
        if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
        if (serviceFilter !== 'all' && alert.serviceId !== serviceFilter) return false;
        if (ackFilter === 'active' && acks.has(alert.id)) return false;
        if (ackFilter === 'acknowledged' && !acks.has(alert.id)) return false;
        return true;
    });
}

function createAlertsTable(alerts) {
    const { acks } = getState();
    const filtered = filterAlerts(alerts);
    
    if (!filtered || filtered.length === 0) {
        return '<p>No alerts match your filters.</p>';
    }
    return `
        <table class="table">
            <caption>System Alerts</caption>
            <thead>
                <tr>
                    <th scope="col">Severity</th>
                    <th scope="col">Service</th>
                    <th scope="col">Title</th>
                    <th scope="col">Time</th>
                    <th scope="col">Status</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(alert => `
                    <tr class="alert-row ${acks.has(alert.id) ? 'acked' : ''}">
                        <td><span class="pill status-${alert.severity.toLowerCase()}">${alert.severity}</span></td>
                        <td><a href="#/services/${alert.serviceId}">${alert.serviceId}</a></td>
                        <td>${escapeHtml(alert.title)}</td>
                        <td>${new Date(alert.createdAt).toLocaleString()}</td>
                        <td><button class="ack-toggle" data-id="${alert.id}">${acks.has(alert.id) ? 'Un-ack' : 'Ack'}</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function rerenderTable() {
    const container = document.getElementById('alerts-table-container');
    if (container) {
        const s = getState();
        container.innerHTML = createAlertsTable(s.data.alerts);
    }
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function rerenderOnChange() {
    if (location.hash === '#/alerts') {
        rerenderTable();
    }
}

export function registerAlertsRoute() {
    registerRoute('/alerts', renderAlertsPage);
    subscribe(rerenderOnChange);
}
