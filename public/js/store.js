const listeners = new Set();
const state = { 
  data: null, 
  acks: new Set(JSON.parse(localStorage.getItem('hl.acks')||'[]')), 
  theme: localStorage.getItem('hl.theme')||'system', 
  settings: { endpoints: JSON.parse(localStorage.getItem('hl.settings.endpoints')||'{}') },
  alertNotes: JSON.parse(localStorage.getItem('hl.alertNotes')||'{}'),
  alertSnooze: JSON.parse(localStorage.getItem('hl.alertSnooze')||'{}'),
  dashboardLayout: JSON.parse(localStorage.getItem('hl.dashboardLayout')||'null')
};
export function getState(){ return state }
export function setState(patch){ Object.assign(state, patch); persist(); listeners.forEach(l=>l(state)); }
export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
function persist(){ 
  localStorage.setItem('hl.theme', state.theme); 
  localStorage.setItem('hl.acks', JSON.stringify([...state.acks])); 
  localStorage.setItem('hl.settings.endpoints', JSON.stringify(state.settings.endpoints||{}));
  localStorage.setItem('hl.alertNotes', JSON.stringify(state.alertNotes||{}));
  localStorage.setItem('hl.alertSnooze', JSON.stringify(state.alertSnooze||{}));
  if(state.dashboardLayout) localStorage.setItem('hl.dashboardLayout', JSON.stringify(state.dashboardLayout));
}
