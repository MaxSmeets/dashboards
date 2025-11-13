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

// Bar chart for comparing metrics across services
export function createBarChart(data, options = {}) {
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
    
    // Data format: [{label: 'Service1', value: 50}, {label: 'Service2', value: 75}]
    const maxValue = Math.max(...data.map(d => d.value));
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / data.length * 0.8;
    const barGap = chartWidth / data.length * 0.2;
    
    const chartId = `bar-chart-${Math.random().toString(36).substring(7)}`;
    
    return `
        <div class="chart-container" id="${chartId}">
            ${label ? `<div class="chart-label">${label}</div>` : ''}
            <svg viewBox="0 0 ${width} ${height}" class="bar-chart">
                <!-- Y-axis -->
                <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
                <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
                
                <!-- Bars -->
                ${data.map((d, i) => {
                    const barHeight = (d.value / maxValue) * chartHeight;
                    const x = padding.left + i * (barWidth + barGap) + barGap / 2;
                    const y = height - padding.bottom - barHeight;
                    return `
                        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                              fill="${color}" opacity="0.8" class="chart-bar"
                              data-label="${d.label}" data-value="${valueFormatter(d.value)}">
                        </rect>
                        <text x="${x + barWidth / 2}" y="${height - padding.bottom + 15}" 
                              text-anchor="middle" font-size="10" fill="var(--muted)">${d.label}</text>
                        <text x="${x + barWidth / 2}" y="${y - 5}" 
                              text-anchor="middle" font-size="10" fill="var(--fg)" font-weight="600">${valueFormatter(d.value)}</text>
                    `;
                }).join('')}
                
                <!-- Y-axis labels -->
                <text x="${padding.left - 10}" y="${padding.top}" text-anchor="end" font-size="10" fill="var(--muted)">${valueFormatter(maxValue)}</text>
                <text x="${padding.left - 10}" y="${height - padding.bottom}" text-anchor="end" font-size="10" fill="var(--muted)">0</text>
            </svg>
        </div>
    `;
}

// Gauge chart for percentage-based KPIs
export function createGaugeChart(value, options = {}) {
    const {
        width = 200,
        height = 150,
        label = '',
        min = 0,
        max = 100,
        thresholds = { warning: 70, critical: 90 }
    } = options;
    
    const percentage = ((value - min) / (max - min)) * 100;
    const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees
    const radius = 60;
    const centerX = width / 2;
    const centerY = height - 20;
    
    // Determine color based on thresholds
    let color = 'var(--c-ok)';
    if (percentage >= thresholds.critical) color = 'var(--c-err)';
    else if (percentage >= thresholds.warning) color = 'var(--c-warn)';
    
    // Calculate needle end point
    const needleLength = radius - 10;
    const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
    const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);
    
    return `
        <div class="chart-container gauge-chart">
            ${label ? `<div class="chart-label">${label}</div>` : ''}
            <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto">
                <!-- Arc background -->
                <path d="M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}" 
                      stroke="rgba(0,0,0,0.1)" stroke-width="12" fill="none" stroke-linecap="round"/>
                
                <!-- Arc fill -->
                <path d="M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${needleX} ${needleY}" 
                      stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/>
                
                <!-- Center circle -->
                <circle cx="${centerX}" cy="${centerY}" r="8" fill="${color}"/>
                
                <!-- Needle -->
                <line x1="${centerX}" y1="${centerY}" x2="${needleX}" y2="${needleY}" 
                      stroke="${color}" stroke-width="3" stroke-linecap="round"/>
                
                <!-- Value text -->
                <text x="${centerX}" y="${centerY + 30}" text-anchor="middle" font-size="24" font-weight="bold" fill="var(--fg)">
                    ${value.toFixed(1)}%
                </text>
            </svg>
        </div>
    `;
}

// Area chart for stacked or filled metrics
export function createAreaChart(data, options = {}) {
    const {
        width = 400,
        height = 200,
        color = 'var(--c-info)',
        label = '',
        valueFormatter = (v) => v.toFixed(1),
        fillOpacity = 0.3
    } = options;
    
    if (!data || data.length === 0) {
        return '<p class="small">No data available</p>';
    }
    
    // Parse data points [[timestamp, value], ...]
    const points = data.map(([ts, val]) => ({ x: new Date(ts).getTime(), y: val, timestamp: ts, value: val }));
    
    // Find min/max
    const xMin = Math.min(...points.map(p => p.x));
    const xMax = Math.max(...points.map(p => p.x));
    const yMin = 0; // Area charts typically start at 0
    const yMax = Math.max(...points.map(p => p.y));
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Scale functions
    const scaleX = (x) => ((x - xMin) / (xMax - xMin)) * chartWidth + padding;
    const scaleY = (y) => height - (((y - yMin) / (yMax - yMin || 1)) * chartHeight + padding);
    
    // Generate line path
    const linePath = points.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`
    ).join(' ');
    
    // Generate area path (close to bottom)
    const areaPath = `M ${scaleX(points[0].x)} ${height - padding} L ${linePath.substring(2)} L ${scaleX(points[points.length - 1].x)} ${height - padding} Z`;
    
    const chartId = `area-chart-${Math.random().toString(36).substring(7)}`;
    
    return `
        <div class="chart-container" id="${chartId}">
            ${label ? `<div class="chart-label">${label}</div>` : ''}
            <div style="position:relative">
                <svg viewBox="0 0 ${width} ${height}" class="area-chart">
                    <!-- Grid lines -->
                    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                    
                    <!-- Area fill -->
                    <path d="${areaPath}" fill="${color}" opacity="${fillOpacity}" />
                    
                    <!-- Line -->
                    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" />
                    
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
