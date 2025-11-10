export function createKpiGrid(kpis) {
    if (!kpis || kpis.length === 0) {
        return '';
    }
    return `
        <div class="kpi-grid">
            ${kpis.map(kpi => `
                <div class="kpi-card">
                    <div class="kpi-label">${kpi.label}</div>
                    <div class="kpi-value">${kpi.value}</div>
                </div>
            `).join('')}
        </div>
    `;
}
