// Service dependency graph visualization

export function createDependencyGraph(services, options = {}) {
    const {
        width = 800,
        height = 600,
        nodeRadius = 40
    } = options;
    
    if (!services || services.length === 0) {
        return '<p class="small">No services available</p>';
    }
    
    // Calculate positions in a circular layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - nodeRadius - 20;
    
    const positions = services.map((service, i) => {
        const angle = (i / services.length) * 2 * Math.PI - Math.PI / 2;
        return {
            id: service.id,
            name: service.name,
            status: service.status,
            dependencies: service.dependencies || [],
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });
    
    // Generate edges
    const edges = [];
    positions.forEach(node => {
        node.dependencies.forEach(depId => {
            const target = positions.find(p => p.id === depId);
            if (target) {
                edges.push({
                    source: node,
                    target: target
                });
            }
        });
    });
    
    const graphId = `dep-graph-${Math.random().toString(36).substring(7)}`;
    
    return `
        <div class="dependency-graph-container" id="${graphId}">
            <svg viewBox="0 0 ${width} ${height}" class="dependency-graph">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="rgba(0,0,0,0.3)" />
                    </marker>
                </defs>
                
                <!-- Edges (dependencies) -->
                <g class="edges">
                    ${edges.map(edge => `
                        <line x1="${edge.source.x}" y1="${edge.source.y}" 
                              x2="${edge.target.x}" y2="${edge.target.y}" 
                              stroke="rgba(0,0,0,0.2)" stroke-width="2" 
                              marker-end="url(#arrowhead)"
                              class="dependency-edge" />
                    `).join('')}
                </g>
                
                <!-- Nodes (services) -->
                <g class="nodes">
                    ${positions.map(node => {
                        const statusColor = getStatusColor(node.status);
                        return `
                            <g class="service-node" data-id="${node.id}" style="cursor:pointer">
                                <circle cx="${node.x}" cy="${node.y}" r="${nodeRadius}" 
                                        fill="${statusColor}" opacity="0.9" 
                                        stroke="white" stroke-width="3" />
                                <text x="${node.x}" y="${node.y}" 
                                      text-anchor="middle" dominant-baseline="middle" 
                                      fill="white" font-size="12" font-weight="600"
                                      pointer-events="none">
                                    ${node.name.length > 12 ? node.name.substring(0, 10) + '...' : node.name}
                                </text>
                                ${node.dependencies.length > 0 ? `
                                    <text x="${node.x}" y="${node.y + nodeRadius + 15}" 
                                          text-anchor="middle" font-size="10" fill="var(--muted)"
                                          pointer-events="none">
                                        ${node.dependencies.length} dep${node.dependencies.length > 1 ? 's' : ''}
                                    </text>
                                ` : ''}
                            </g>
                        `;
                    }).join('')}
                </g>
            </svg>
            <div class="graph-legend">
                <strong>Legend:</strong>
                <div style="display:flex;gap:16px;margin-top:8px">
                    <div style="display:flex;align-items:center;gap:6px">
                        <div style="width:12px;height:12px;border-radius:50%;background:var(--c-ok)"></div>
                        <span class="small">Healthy</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                        <div style="width:12px;height:12px;border-radius:50%;background:var(--c-warn)"></div>
                        <span class="small">Degraded/Warning</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                        <div style="width:12px;height:12px;border-radius:50%;background:var(--c-err)"></div>
                        <span class="small">Error/Critical</span>
                    </div>
                </div>
                <p class="small" style="margin-top:12px"><strong>Tip:</strong> Click on a service node to view details. Arrows show dependencies.</p>
            </div>
        </div>
    `;
}

function getStatusColor(status) {
    if (!status) return '#94a3b8';
    if (status === 'healthy' || status === 'running') return 'var(--c-ok)';
    if (status === 'warning' || status === 'degraded') return 'var(--c-warn)';
    if (status === 'error' || status === 'critical') return 'var(--c-err)';
    return 'var(--muted)';
}

// Initialize click handlers for nodes
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
}
