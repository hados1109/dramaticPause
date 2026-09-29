const DEFAULTS = { enabled: true, preset: 'cinematic' };
const enabledEl = document.getElementById('enabled');
const presetsEl = document.getElementById('presets');
try { document.getElementById('version').textContent = 'v' + chrome.runtime.getManifest().version; } catch (e) {}
const options = [...document.querySelectorAll('[data-preset]')];
let state = { ...DEFAULTS };

function render(){
  enabledEl.setAttribute('aria-checked', String(state.enabled));
  presetsEl.setAttribute('aria-disabled', String(!state.enabled));
  options.forEach(o => {
    const on = o.dataset.preset === state.preset;
    o.setAttribute('aria-checked', String(on));
    o.tabIndex = on ? 0 : -1;
  });
  presetsEl.querySelectorAll('button').forEach(b => { b.disabled = !state.enabled; });
  if (window.dpRefresh) requestAnimationFrame(() => window.dpRefresh());
}
function save(patch){ state = { ...state, ...patch }; render(); chrome.storage.sync.set(patch); }

chrome.storage.sync.get(DEFAULTS, s => { state = { ...DEFAULTS, ...s }; render(); });
enabledEl.addEventListener('click', () => save({ enabled: !state.enabled }));
options.forEach(o => o.addEventListener('click', () => save({ preset: o.dataset.preset })));
presetsEl.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const i = options.findIndex(o => o.dataset.preset === state.preset);
  const next = options[(i + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length];
  e.preventDefault(); save({ preset: next.dataset.preset }); next.focus();
});
document.querySelectorAll('[data-preview]').forEach(b => b.addEventListener('click', () => window.dpPreview && window.dpPreview(b.dataset.preview, b)));
render();
