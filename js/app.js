// app.js
// Entry point and router. Owns which of the three views (home / assessment
// / graph) is showing, and glues the view modules to storage + graph state.
// Assessment-first: the app opens on the home screen, not the graph.

import { loadState, saveState, exportStateAsFile, getRecents, addRecent } from './storage.js';
import { exampleGraph } from '../data/sample-data.js';
import { createNode } from './graph.js';
import { initUI, render as renderGraph, resetUIState, selectNode } from './ui.js';
import { initHome, renderRecents } from './home.js';
import { renderAssessment } from './assessment.js';

const state = loadState(exampleGraph);
const statusEl = document.getElementById('saveStatus');

function persist() {
  saveState(state, (msg) => { statusEl.textContent = msg; });
}

const views = {
  home: document.getElementById('homeView'),
  assessment: document.getElementById('assessmentView'),
  graph: document.getElementById('graphView')
};
function showView(name) {
  Object.entries(views).forEach(([key, el]) => el.classList.toggle('hidden', key !== name));
}

function goHome() {
  renderRecents(getRecents());
  showView('home');
}

function goToAssessment(productName) {
  addRecent(productName);
  renderAssessment(state, productName, {
    onOpenGraph: goToGraph,
    onCreate: (name) => {
      const node = createNode({ label: name, type: 'product', x: 80, y: 80 });
      state.nodes.push(node);
      persist();
      goToGraph(node.id);
    },
    onBack: goHome
  });
  showView('assessment');
}

function goToGraph(nodeId) {
  showView('graph');
  if (nodeId) selectNode(nodeId);
  else renderGraph();
}

initHome({ onSelect: goToAssessment, onOpenGraphDirect: () => goToGraph(null) });
initUI(state, persist);

document.getElementById('backToHomeBtn').addEventListener('click', goHome);

document.getElementById('resetBtn').addEventListener('click', () => {
  const fresh = exampleGraph();
  state.nodes = fresh.nodes;
  state.edges = fresh.edges;
  state.paths = fresh.paths;
  resetUIState();
  persist();
  renderGraph();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  exportStateAsFile(state);
});

goHome();
