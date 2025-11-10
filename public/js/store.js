const listeners = new Set();
const state = { data: null, acks: new Set(JSON.parse(localStorage.getItem('hl.acks')||'[]')), theme: localStorage.getItem('hl.theme')||'system', settings: { endpoints: JSON.parse(localStorage.getItem('hl.settings.endpoints')||'{}') } };
export function getState(){ return state }
export function setState(patch){ Object.assign(state, patch); persist(); listeners.forEach(l=>l(state)); }
export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
function persist(){ localStorage.setItem('hl.theme', state.theme); localStorage.setItem('hl.acks', JSON.stringify([...state.acks])); localStorage.setItem('hl.settings.endpoints', JSON.stringify(state.settings.endpoints||{})); }
