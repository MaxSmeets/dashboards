// Simple SVG line chart generator
export function createLineChart(data, options = {}) {
    const {
        width = 400,
        height = 200,
        color = 'var(--c-info)',
        label = '',
        valueFormatter = (v) => v.toFixed(1)
    } = options;
    
    if (!data || data.length === 0) {
        return '<p class="small">No data available</p>';
    }
    
    // Parse data points [[timestamp, value], ...]
    const points = data.map(([ts, val]) => ({ x: new Date(ts).getTime(), y: val, timestamp: ts, value: val }));
    
    // Find min/max
    const xMin = Math.min(...points.map(p => p.x));
    const xMax = Math.max(...points.map(p => p.x));
    const yMin = Math.min(...points.map(p => p.y));
    const yMax = Math.max(...points.map(p => p.y));
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Scale functions
    const scaleX = (x) => ((x - xMin) / (xMax - xMin)) * chartWidth + padding;
    const scaleY = (y) => height - (((y - yMin) / (yMax - yMin || 1)) * chartHeight + padding);
    
    // Generate path
    const pathData = points.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`
    ).join(' ');
    
    // Generate area fill
    const areaData = `M ${scaleX(points[0].x)} ${height - padding} L ${pathData.substring(2)} L ${scaleX(points[points.length - 1].x)} ${height - padding} Z`;
    
    const chartId = `chart-${Math.random().toString(36).substring(7)}`;
    
    return `
        <div class="chart-container" id="${chartId}">
            ${label ? `<div class="chart-label">${label}</div>` : ''}
            <div style="position:relative">
                <svg viewBox="0 0 ${width} ${height}" class="line-chart">
                    <defs>
                        <linearGradient id="gradient-${chartId}" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:${color};stop-opacity:0.05" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Grid lines -->
                    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                    
                    <!-- Area fill -->
                    <path d="${areaData}" fill="url(#gradient-${chartId})" />
                    
                    <!-- Line -->
                    <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2" />
                    
                    <!-- Y-axis labels -->
                    <text x="5" y="${padding}" font-size="10" fill="var(--muted)">${valueFormatter(yMax)}</text>
                    <text x="5" y="${height - padding}" font-size="10" fill="var(--muted)">${valueFormatter(yMin)}</text>
                    
                    <!-- Points with tooltips -->
                    ${points.map(p => `
                        <circle cx="${scaleX(p.x)}" cy="${scaleY(p.y)}" r="4" fill="${color}" class="chart-point" 
                                data-value="${valueFormatter(p.value)}" 
                                data-time="${new Date(p.timestamp).toLocaleString()}" />
                    `).join('')}
                </svg>
                <div class="chart-tooltip" style="display:none;position:absolute;background:var(--card-bg);border:1px solid rgba(0,0,0,0.1);border-radius:6px;padding:8px;font-size:0.8rem;pointer-events:none;box-shadow:var(--shadow);z-index:10"></div>
            </div>
        </div>
    `;
}

export function createSparkline(data, color = 'var(--c-info)') {
    if (!data || data.length === 0) return '';
    
    const width = 60;
    const height = 20;
    const points = data.map(([, val]) => val);
    const min = Math.min(...points);
    const max = Math.max(...points);
    
    const scaleY = (y) => height - ((y - min) / (max - min || 1)) * height;
    const scaleX = (i) => (i / (points.length - 1)) * width;
    
    const pathData = points.map((val, i) => 
        `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(val)}`
    ).join(' ');
    
    return `<svg viewBox="0 0 ${width} ${height}" class="sparkline" style="width:60px;height:20px">
        <path d="${pathData}" fill="none" stroke="${color}" stroke-width="1.5" />
    </svg>`;
}
