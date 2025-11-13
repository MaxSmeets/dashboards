const routes = new Map();
export function registerRoute(path, handler){ routes.set(path, handler); }
function resolveRoute(hash){ const p = hash.replace(/^#/, '') || '/'; return p }
export function initRouter(){ window.addEventListener('hashchange', () => render(location.hash)); render(location.hash); }
function render(hash){ 
  const fullPath = resolveRoute(hash);
  const path = fullPath.split('?')[0]; // Remove query params for routing
  
  // simple matching
  if(path === '/' || path === ''){ const h = routes.get('/'); if(h) h(); return }
  if(path.startsWith('/services/')){ const id = path.split('/')[2]; const h = routes.get('/services/:id'); if(h) h(id); return }
  if(path === '/compare') { const h = routes.get('/compare'); if(h) h(); return }
  const r = routes.get(path); if(r) r(); else {
    const out = document.getElementById('route-outlet'); out.innerHTML = '<div class="container"><h2>404</h2><p>Page not found</p></div>';
  }
}
