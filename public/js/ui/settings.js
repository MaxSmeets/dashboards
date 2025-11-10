import { getState, setState } from '../store.js';
import { registerRoute } from '../router.js';
import { reloadMock } from '../lib/mockApi.js';

function renderSettingsPage() {
    const out = document.getElementById('route-outlet');
    const s = getState();
    
    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
        <div class="card">
            <h2>Settings</h2>
            <p>Manage application settings and preferences.</p>
        </div>
        
        <div class="card">
            <h3>Theme</h3>
            <div class="setting-row">
                <label>
                    <input type="radio" name="theme" value="light" ${s.theme === 'light' ? 'checked' : ''}>
                    Light
                </label>
                <label>
                    <input type="radio" name="theme" value="dark" ${s.theme === 'dark' ? 'checked' : ''}>
                    Dark
                </label>
                <label>
                    <input type="radio" name="theme" value="system" ${s.theme === 'system' ? 'checked' : ''}>
                    System
                </label>
            </div>
        </div>

        <div class="card">
            <h3>Feature Flags</h3>
            ${s.data ? renderFeatureFlags(s.data.settings.featureFlags) : '<p>Loading...</p>'}
        </div>

        <div class="card">
            <h3>Service Endpoints</h3>
            ${s.data ? renderEndpoints(s.data.settings.endpoints) : '<p>Loading...</p>'}
        </div>

        <div class="card">
            <h3>Data Management</h3>
            <button id="reload-mock-btn" class="btn-primary">Reload Mock Data</button>
            <button id="export-settings-btn" class="btn-secondary">Export Settings</button>
            <button id="import-settings-btn" class="btn-secondary">Import Settings</button>
            <input type="file" id="import-file-input" accept=".json" style="display:none">
        </div>
    `;
    
    out.innerHTML = '';
    out.appendChild(container);
    
    // Theme change listener
    container.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const theme = e.target.value;
            setState({ theme });
            applyTheme(theme);
        });
    });
    
    // Reload mock data
    const reloadBtn = container.querySelector('#reload-mock-btn');
    reloadBtn?.addEventListener('click', async () => {
        reloadBtn.disabled = true;
        reloadBtn.textContent = 'Reloading...';
        try {
            const data = await reloadMock();
            setState({ data });
            showToast('Mock data reloaded successfully', 'success');
            setTimeout(() => renderSettingsPage(), 100);
        } catch (e) {
            showToast('Failed to reload mock data', 'error');
        } finally {
            reloadBtn.disabled = false;
            reloadBtn.textContent = 'Reload Mock Data';
        }
    });
    
    // Export settings
    container.querySelector('#export-settings-btn')?.addEventListener('click', () => {
        const settings = {
            theme: s.theme,
            acks: Array.from(s.acks),
            endpoints: s.settings.endpoints
        };
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'homelab-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Settings exported', 'success');
    });
    
    // Import settings
    const importBtn = container.querySelector('#import-settings-btn');
    const fileInput = container.querySelector('#import-file-input');
    importBtn?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const settings = JSON.parse(text);
            if (settings.theme) setState({ theme: settings.theme });
            if (settings.acks) setState({ acks: new Set(settings.acks) });
            if (settings.endpoints) setState({ settings: { endpoints: settings.endpoints } });
            showToast('Settings imported successfully', 'success');
            applyTheme(settings.theme || s.theme);
        } catch (e) {
            showToast('Failed to import settings', 'error');
        }
    });
}

function renderFeatureFlags(flags) {
    return Object.entries(flags).map(([key, value]) => `
        <div class="setting-row">
            <label>
                <input type="checkbox" data-flag="${key}" ${value ? 'checked' : ''}>
                ${formatFlagName(key)}
            </label>
        </div>
    `).join('');
}

function renderEndpoints(endpoints) {
    return `
        <div class="endpoints-grid">
            ${Object.entries(endpoints).map(([key, url]) => `
                <div class="endpoint-row">
                    <label>${key}</label>
                    <input type="text" data-endpoint="${key}" value="${url}" placeholder="http://...">
                </div>
            `).join('')}
        </div>
    `;
}

function formatFlagName(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        html.setAttribute('data-theme', theme);
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

export function registerSettingsRoute() {
    registerRoute('/settings', renderSettingsPage);
}

// Initialize theme on load
export function initTheme() {
    const { theme } = getState();
    applyTheme(theme);
    
    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const { theme } = getState();
        if (theme === 'system') applyTheme('system');
    });
}
