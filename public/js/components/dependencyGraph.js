// Service dependency graph visualization with force-directed layout

export function createDependencyGraph(services, options = {}) {
    const {
        width = 1000,
        height = 700,
        nodeRadius = 50
    } = options;
    
    if (!services || services.length === 0) {
        return '<p class="small">No services available</p>';
    }
    
    const graphId = `dep-graph-${Math.random().toString(36).substring(7)}`;
    
    // Build nodes with force-directed layout
    const nodes = services.map((service, i) => {
        // Start with circular layout, will be adjusted by force simulation
        const angle = (i / services.length) * 2 * Math.PI;
        const radius = Math.min(width, height) / 3;
        return {
            id: service.id,
            name: service.name,
            status: service.status,
            category: service.category,
            dependencies: service.dependencies || [],
            x: width / 2 + radius * Math.cos(angle),
            y: height / 2 + radius * Math.sin(angle),
            vx: 0,
            vy: 0
        };
    });
    
    // Build edges
    const edges = [];
    nodes.forEach(node => {
        node.dependencies.forEach(depId => {
            const target = nodes.find(n => n.id === depId);
            if (target) {
                edges.push({ source: node, target });
            }
        });
    });
    
    // Simple force simulation for better layout
    for (let iter = 0; iter < 100; iter++) {
        // Repulsion between all nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = 2000 / (dist * dist);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                nodes[i].vx -= fx;
                nodes[i].vy -= fy;
                nodes[j].vx += fx;
                nodes[j].vy += fy;
            }
        }
        
        // Spring forces for connected nodes
        edges.forEach(edge => {
            const dx = edge.target.x - edge.source.x;
            const dy = edge.target.y - edge.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const ideal = 150;
            const force = (dist - ideal) * 0.02;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            edge.source.vx += fx;
            edge.source.vy += fy;
            edge.target.vx -= fx;
            edge.target.vy -= fy;
        });
        
        // Center gravity
        nodes.forEach(node => {
            const dx = width / 2 - node.x;
            const dy = height / 2 - node.y;
            node.vx += dx * 0.001;
            node.vy += dy * 0.001;
        });
        
        // Apply velocities with damping
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;
            node.vx *= 0.8;
            node.vy *= 0.8;
            
            // Boundary constraints
            node.x = Math.max(nodeRadius + 20, Math.min(width - nodeRadius - 20, node.x));
            node.y = Math.max(nodeRadius + 20, Math.min(height - nodeRadius - 20, node.y));
        });
    }
    
    return `
        <div class="dependency-graph-container" id="${graphId}">
            <svg viewBox="0 0 ${width} ${height}" class="dependency-graph" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="arrowhead-light" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto">
                        <polygon points="0 0, 12 4, 0 8" class="arrow-marker" />
                    </marker>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" class="edge-gradient-start" />
                        <stop offset="100%" class="edge-gradient-end" />
                    </linearGradient>
                </defs>
                
                <!-- Edges (dependencies) -->
                <g class="edges">
                    ${edges.map((edge, i) => {
                        // Calculate arrow position (stop before target node)
                        const dx = edge.target.x - edge.source.x;
                        const dy = edge.target.y - edge.source.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const ratio = (dist - nodeRadius - 5) / dist;
                        const endX = edge.source.x + dx * ratio;
                        const endY = edge.source.y + dy * ratio;
                        
                        return `
                        <line x1="${edge.source.x}" y1="${edge.source.y}" 
                              x2="${endX}" y2="${endY}" 
                              class="dependency-edge" 
                              marker-end="url(#arrowhead-light)"
                              data-source="${edge.source.id}"
                              data-target="${edge.target.id}" />
                    `;
                    }).join('')}
                </g>
                
                <!-- Nodes (services) -->
                <g class="nodes">
                    ${nodes.map(node => {
                        const statusClass = getStatusClass(node.status);
                        const depCount = node.dependencies.length;
                        const shortName = node.name.length > 10 ? node.name.substring(0, 9) + '…' : node.name;
                        
                        return `
                            <g class="service-node ${statusClass}" 
                               data-id="${node.id}" 
                               data-name="${escapeHtml(node.name)}"
                               data-status="${node.status}"
                               data-deps="${depCount}">
                                <!-- Outer glow circle -->
                                <circle cx="${node.x}" cy="${node.y}" r="${nodeRadius + 3}" 
                                        class="node-glow" />
                                <!-- Main node circle -->
                                <circle cx="${node.x}" cy="${node.y}" r="${nodeRadius}" 
                                        class="node-circle" />
                                <!-- Inner highlight -->
                                <circle cx="${node.x - nodeRadius/4}" cy="${node.y - nodeRadius/4}" 
                                        r="${nodeRadius/3}" 
                                        class="node-highlight" />
                                <!-- Service name -->
                                <text x="${node.x}" y="${node.y}" 
                                      class="node-label"
                                      text-anchor="middle" 
                                      dominant-baseline="middle">
                                    ${escapeHtml(shortName)}
                                </text>
                                <!-- Category badge -->
                                <text x="${node.x}" y="${node.y + nodeRadius + 18}" 
                                      class="node-category"
                                      text-anchor="middle">
                                    ${escapeHtml(node.category || '')}
                                </text>
                                ${depCount > 0 ? `
                                <!-- Dependency count badge -->
                                <g class="dep-badge">
                                    <circle cx="${node.x + nodeRadius - 10}" cy="${node.y - nodeRadius + 10}" 
                                            r="14" class="dep-badge-circle" />
                                    <text x="${node.x + nodeRadius - 10}" y="${node.y - nodeRadius + 10}" 
                                          class="dep-badge-text"
                                          text-anchor="middle" 
                                          dominant-baseline="middle">
                                        ${depCount}
                                    </text>
                                </g>
                                ` : ''}
                            </g>
                        `;
                    }).join('')}
                </g>
            </svg>
            
            <!-- Interactive tooltip -->
            <div class="graph-tooltip" id="tooltip-${graphId}"></div>
            
            <!-- Legend -->
            <div class="graph-legend">
                <div class="legend-row">
                    <strong>Status:</strong>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-dot status-healthy"></div>
                            <span>Healthy</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot status-degraded"></div>
                            <span>Degraded</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot status-error"></div>
                            <span>Error</span>
                        </div>
                    </div>
                </div>
                <p class="legend-tip"><strong>💡 Tip:</strong> Hover over nodes for details • Click to view service • Arrows show dependencies</p>
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    if (!status) return 'status-unknown';
    if (status === 'healthy' || status === 'running') return 'status-healthy';
    if (status === 'warning' || status === 'degraded') return 'status-degraded';
    if (status === 'error' || status === 'critical') return 'status-error';
    return 'status-unknown';
}

function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Initialize interactive behaviors for the graph
export function initDependencyGraphInteractions() {
    document.addEventListener('click', (e) => {
        const node = e.target.closest('.service-node');
        if (node) {
            const serviceId = node.dataset.id;
            if (serviceId) {
                location.hash = `#/services/${serviceId}`;
            }
        }
    });
    
    // Hover effects and tooltips - use delegation on container to avoid blocking clicks
    let currentTooltip = null;
    let tooltipTimeout = null;
    
    document.addEventListener('mouseover', (e) => {
        const node = e.target.closest('.service-node');
        if (node) {
            // Clear any pending hide
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            
            const container = node.closest('.dependency-graph-container');
            if (container) {
                const tooltip = container.querySelector('.graph-tooltip');
                if (tooltip) {
                    const name = node.dataset.name;
                    const status = node.dataset.status;
                    const deps = node.dataset.deps;
                    
                    tooltip.innerHTML = `
                        <div style="font-weight:600;margin-bottom:4px">${escapeHtml(name)}</div>
                        <div style="font-size:11px;color:var(--muted)">${escapeHtml(status)} • ${deps} dep${deps !== '1' ? 's' : ''}</div>
                    `;
                    tooltip.style.display = 'block';
                    setTimeout(() => tooltip.classList.add('visible'), 10);
                    
                    // Position tooltip smartly to avoid covering the node
                    const rect = container.getBoundingClientRect();
                    const tooltipRect = tooltip.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Position to the right and below, but adjust if near edges
                    let left = x + 20;
                    let top = y + 20;
                    
                    if (left + tooltipRect.width > rect.width) {
                        left = x - tooltipRect.width - 20; // Position to left instead
                    }
                    if (top + tooltipRect.height > rect.height) {
                        top = y - tooltipRect.height - 20; // Position above instead
                    }
                    
                    tooltip.style.left = left + 'px';
                    tooltip.style.top = top + 'px';
                    currentTooltip = tooltip;
                }
                
                // Highlight connected edges
                const nodeId = node.dataset.id;
                container.querySelectorAll('.dependency-edge').forEach(edge => {
                    if (edge.dataset.source === nodeId || edge.dataset.target === nodeId) {
                        edge.classList.add('edge-highlighted');
                    }
                });
            }
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const node = e.target.closest('.service-node');
        if (node) {
            const container = node.closest('.dependency-graph-container');
            if (container) {
                // Delay hiding tooltip slightly to allow moving between elements
                tooltipTimeout = setTimeout(() => {
                    const tooltip = container.querySelector('.graph-tooltip');
                    if (tooltip) {
                        tooltip.classList.remove('visible');
                        setTimeout(() => tooltip.style.display = 'none', 200);
                    }
                }, 100);
                
                // Remove edge highlights
                container.querySelectorAll('.dependency-edge').forEach(edge => {
                    edge.classList.remove('edge-highlighted');
                });
            }
        }
    });
}
