// app.js
// Entry point. Owns nothing itself — loads the persisted (or example) graph,
// hands it to ui.js by reference, and wires the buttons that touch storage
// or sample data directly (things ui.js shouldn't need to know about).

import { loadState, saveState, exportStateAsFile } from './storage.js';
import { exampleGraph } from '../data/sample-data.js';
import { initUI, render, resetUIState } from './ui.js';

const state = loadState(exampleGraph);
const statusEl = document.getElementById('saveStatus');

function persist() {
  saveState(state, (msg) => { statusEl.textContent = msg; });
}

initUI(state, persist);

document.getElementById('resetBtn').addEventListener('click', () => {
  const fresh = exampleGraph();
  // Mutate in place so ui.js keeps a valid reference to the same object.
  state.nodes = fresh.nodes;
  state.edges = fresh.edges;
  state.paths = fresh.paths;
  resetUIState();
  persist();
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  exportStateAsFile(state);
});
