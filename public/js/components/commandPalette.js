import { getState } from '../store.js';

let isOpen = false;
let searchQuery = '';
let selectedIndex = 0;
let results = [];

export function initCommandPalette() {
    // Listen for Ctrl/Cmd+K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            togglePalette();
        }
        
        if (isOpen && e.key === 'Escape') {
            closePalette();
        }
        
        if (isOpen && e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
            renderResults();
        }
        
        if (isOpen && e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            renderResults();
        }
        
        if (isOpen && e.key === 'Enter' && results.length > 0) {
            e.preventDefault();
            executeResult(results[selectedIndex]);
        }
    });
}

function togglePalette() {
    if (isOpen) {
        closePalette();
    } else {
        openPalette();
    }
}

function openPalette() {
    isOpen = true;
    searchQuery = '';
    selectedIndex = 0;
    
    const overlay = document.createElement('div');
    overlay.id = 'command-palette-overlay';
    overlay.className = 'command-palette-overlay';
    overlay.innerHTML = `
        <div class="command-palette">
            <input type="text" id="command-search" placeholder="Search services and actions..." autofocus>
            <div id="command-results"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePalette();
    });
    
    const input = overlay.querySelector('#command-search');
    input?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        selectedIndex = 0;
        updateResults();
    });
    
    updateResults();
    input?.focus();
}

function closePalette() {
    isOpen = false;
    const overlay = document.getElementById('command-palette-overlay');
    overlay?.remove();
}

function updateResults() {
    const s = getState();
    if (!s.data) {
        results = [];
        renderResults();
        return;
    }
    
    const query = searchQuery.toLowerCase();
    results = [];
    
    // Add services
    s.data.services.forEach(service => {
        const score = fuzzyMatch(query, service.name.toLowerCase());
        if (score > 0 || !query) {
            results.push({
                type: 'service',
                title: service.name,
                subtitle: service.category,
                icon: '🔧',
                score,
                action: () => location.hash = `#/services/${service.id}`
            });
        }
    });
    
    // Add quick navigation
    if (fuzzyMatch(query, 'dashboard') > 0 || fuzzyMatch(query, 'home') > 0 || !query) {
        results.push({ type: 'nav', title: 'Dashboard', subtitle: 'Home', icon: '🏠', score: 100, action: () => location.hash = '#/' });
    }
    if (fuzzyMatch(query, 'alerts') > 0 || !query) {
        results.push({ type: 'nav', title: 'Alerts Center', subtitle: 'View all alerts', icon: '⚠️', score: 90, action: () => location.hash = '#/alerts' });
    }
    if (fuzzyMatch(query, 'settings') > 0 || !query) {
        results.push({ type: 'nav', title: 'Settings', subtitle: 'Configure app', icon: '⚙️', score: 80, action: () => location.hash = '#/settings' });
    }
    
    // Add actions from all services
    s.data.services.forEach(service => {
        service.actions?.forEach(action => {
            const actionQuery = `${service.name} ${action.label}`.toLowerCase();
            const score = fuzzyMatch(query, actionQuery);
            if (score > 0 || (!query && results.length < 20)) {
                results.push({
                    type: 'action',
                    title: action.label,
                    subtitle: `${service.name}`,
                    icon: action.danger ? '⚠️' : '▶️',
                    score,
                    action: () => {
                        location.hash = `#/services/${service.id}`;
                        closePalette();
                    }
                });
            }
        });
    });
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, 10);
    
    renderResults();
}

function renderResults() {
    const container = document.getElementById('command-results');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = '<div class="command-empty">No results found. Try searching for a service name or action.</div>';
        return;
    }
    
    container.innerHTML = results.map((result, idx) => `
        <div class="command-result ${idx === selectedIndex ? 'selected' : ''}" data-idx="${idx}">
            <span class="command-result-icon">${result.icon}</span>
            <div class="command-result-content">
                <div class="command-result-title">${escapeHtml(result.title)}</div>
                <div class="command-result-subtitle">${escapeHtml(result.subtitle)}</div>
            </div>
            ${result.type ? `<span class="command-result-badge">${result.type}</span>` : ''}
        </div>
    `).join('');
    
    // Click handler
    container.querySelectorAll('.command-result').forEach((el, idx) => {
        el.addEventListener('click', () => executeResult(results[idx]));
    });
    
    // Scroll selected into view
    const selected = container.querySelector('.command-result.selected');
    selected?.scrollIntoView({ block: 'nearest' });
}

function executeResult(result) {
    if (result?.action) {
        result.action();
        closePalette();
    }
}

function fuzzyMatch(query, text) {
    if (!query) return 100;
    if (text.includes(query)) return 100;
    
    let score = 0;
    let queryIdx = 0;
    
    for (let i = 0; i < text.length && queryIdx < query.length; i++) {
        if (text[i] === query[queryIdx]) {
            score += 1;
            queryIdx++;
        }
    }
    
    return queryIdx === query.length ? score * 10 : 0;
}

function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
