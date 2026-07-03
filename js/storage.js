// storage.js
// Persists the graph to the browser's localStorage.
//
// NOTE: this replaces the window.storage API used while prototyping this tool
// as a Claude.ai artifact — that API only exists inside Claude's artifact
// runtime and is not available on a plain deployed page. localStorage is the
// real-world equivalent for a static GitHub Pages site: it's per-browser,
// per-origin, and has no server component. If you later want the graph to
// sync across devices or be shared with teammates, this is the file to swap
// out for a real backend or a file-based (export/import) workflow.

const STORAGE_KEY = 'ptg-graph-v1';
let saveTimer = null;

export function loadState(defaultFactory) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read saved graph, starting from the default.', e);
  }
  const initial = defaultFactory();
  saveState(initial);
  return initial;
}

export function saveState(state, onStatus) {
  if (onStatus) onStatus('Saving…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (onStatus) onStatus('Saved');
    } catch (e) {
      console.error('Save failed', e);
      if (onStatus) onStatus('Save failed');
    }
  }, 300);
}

export function exportStateAsFile(state, filename = 'product-traceability-graph.json') {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importStateFromFile(file) {
  return file.text().then(text => JSON.parse(text));
}
