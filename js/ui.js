// ui.js
// All DOM rendering and canvas interaction. Owns transient UI state
// (selection, drag, connect mode, path-building draft) — the persisted
// graph state lives in the object passed into initUI() and is mutated
// in place so app.js keeps a valid reference for saving.

import {
  NODE_W, NODE_H, TYPE_COLORS, TYPE_LABELS,
  createNode, createEdge, findNode, findEdgeBetween, center,
  deleteNode, deleteEdge, deletePath
} from './graph.js';
import { computePathStats, statusLabel } from './scoring.js';

let state = null;
let onChange = () => {};

let selection = null;        // { type: 'node'|'edge', id }
let connectMode = false;
let pendingConnectFrom = null;
let pathDraft = null;        // { name, nodeIds: [] }
let activePathId = null;
let drag = null;

export function initUI(graphState, changeCallback) {
  state = graphState;
  onChange = changeCallback;
  bindToolbar();
  render();
}

export function selectNode(id) {
  connectMode = false;
  pendingConnectFrom = null;
  pathDraft = null;
  selection = id ? { type: 'node', id } : null;
  render();
}

export function resetUIState() {
  selection = null;
  activePathId = null;
  pathDraft = null;
  connectMode = false;
  pendingConnectFrom = null;
}

function bindToolbar() {
  document.getElementById('addNodeBtn').addEventListener('click', () => {
    const node = createNode({
      x: 40 + (state.nodes.length * 22) % 400,
      y: 40 + (state.nodes.length * 17) % 300
    });
    state.nodes.push(node);
    selection = { type: 'node', id: node.id };
    onChange(); render();
  });

  document.getElementById('connectBtn').addEventListener('click', () => {
    connectMode = !connectMode;
    pendingConnectFrom = null;
    if (connectMode) pathDraft = null;
    render();
  });

  document.getElementById('newPathBtn').addEventListener('click', () => {
    pathDraft = { name: '', nodeIds: [] };
    connectMode = false;
    pendingConnectFrom = null;
    render();
  });
}

/* ---------- top-level render ---------- */

export function render() {
  renderModeHint();
  renderNodes();
  renderEdges();
  renderInspector();
  renderPathsPanel();
}

function renderModeHint() {
  const hint = document.getElementById('modeHint');
  if (connectMode) hint.textContent = pendingConnectFrom ? 'Click the target node…' : 'Click a node to start a connection…';
  else if (pathDraft) hint.textContent = 'Click nodes in order to build the path…';
  else hint.textContent = '';
  document.getElementById('connectBtn').className = connectMode ? 'btn-active' : '';
}

/* ---------- nodes ---------- */

function renderNodes() {
  const layer = document.getElementById('nodesLayer');
  layer.innerHTML = '';
  const activePath = activePathId ? state.paths.find(p => p.id === activePathId) : null;

  state.nodes.forEach(node => {
    const el = document.createElement('div');
    el.className = 'node';
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    el.dataset.node = node.id;

    if (selection && selection.type === 'node' && selection.id === node.id) el.classList.add('selected');
    if (pendingConnectFrom === node.id) el.classList.add('pending-connect');

    let orderIndex = -1;
    if (pathDraft) {
      orderIndex = pathDraft.nodeIds.indexOf(node.id);
    } else if (activePath) {
      orderIndex = activePath.nodeIds.indexOf(node.id);
      if (orderIndex === -1) el.classList.add('dimmed'); else el.classList.add('in-path');
    }

    const color = TYPE_COLORS[node.type] || TYPE_COLORS.other;
    el.innerHTML = `
      <div class="n-type"><span class="n-dot" style="background:${color}"></span>${TYPE_LABELS[node.type] || 'Other'}</div>
      <div class="n-label">${escapeHtml(node.label)}</div>
    `;
    if (orderIndex !== -1) {
      const badge = document.createElement('div');
      badge.className = 'n-order';
      badge.textContent = orderIndex + 1;
      el.appendChild(badge);
    }

    el.addEventListener('mousedown', (e) => startDrag(e, node));
    layer.appendChild(el);
  });
}

/* ---------- edges ---------- */

function renderEdges() {
  const svg = document.getElementById('svg');
  svg.innerHTML = '';
  const activePath = activePathId ? state.paths.find(p => p.id === activePathId) : null;
  const activePathEdgeIds = new Set();
  if (activePath) {
    for (let i = 0; i < activePath.nodeIds.length - 1; i++) {
      const ed = findEdgeBetween(state, activePath.nodeIds[i], activePath.nodeIds[i + 1]);
      if (ed) activePathEdgeIds.add(ed.id);
    }
  }

  state.edges.forEach(edge => {
    const a = findNode(state, edge.from), b = findNode(state, edge.to);
    if (!a || !b) return;
    const ca = center(a), cb = center(b);
    const inPath = activePathEdgeIds.has(edge.id);
    const dimmed = activePath && !inPath;

    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hit.setAttribute('x1', ca.x); hit.setAttribute('y1', ca.y);
    hit.setAttribute('x2', cb.x); hit.setAttribute('y2', cb.y);
    hit.setAttribute('class', 'edge-hit');
    hit.addEventListener('click', () => handleEdgeClick(edge.id));
    svg.appendChild(hit);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', ca.x); line.setAttribute('y1', ca.y);
    line.setAttribute('x2', cb.x); line.setAttribute('y2', cb.y);
    let cls = 'edge-line edge-status-' + edge.status;
    if (selection && selection.type === 'edge' && selection.id === edge.id) cls += ' selected';
    if (inPath) cls += ' in-path';
    if (dimmed) cls += ' dimmed';
    line.setAttribute('class', cls);
    svg.appendChild(line);
  });
}

/* ---------- inspector panel ---------- */

function renderInspector() {
  const panel = document.getElementById('inspectorPanel');
  if (!selection) {
    panel.innerHTML = `<h2>Inspector</h2><p class="empty-note">Select a node or connection to edit its properties. Drag nodes to rearrange the graph.</p>`;
    return;
  }

  if (selection.type === 'node') {
    const node = findNode(state, selection.id);
    if (!node) { selection = null; return renderInspector(); }
    panel.innerHTML = `
      <h2>Node</h2>
      <div class="field"><label>Label</label><input id="f-label" value="${escapeAttr(node.label)}"></div>
      <div class="field"><label>Type</label>
        <select id="f-type">
          ${Object.keys(TYPE_LABELS).map(t => `<option value="${t}" ${t === node.type ? 'selected' : ''}>${TYPE_LABELS[t]}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Notes</label><textarea id="f-notes" placeholder="notes…">${escapeHtml(node.notes || '')}</textarea></div>
      <button class="del-btn" id="f-delete">✕ delete node</button>
    `;
    document.getElementById('f-label').addEventListener('input', e => { node.label = e.target.value; onChange(); renderNodes(); });
    document.getElementById('f-type').addEventListener('change', e => { node.type = e.target.value; onChange(); renderNodes(); });
    document.getElementById('f-notes').addEventListener('input', e => { node.notes = e.target.value; onChange(); });
    document.getElementById('f-delete').addEventListener('click', (e) => confirmThenRun(e.target, () => {
      deleteNode(state, node.id);
      selection = null; onChange(); render();
    }));
  } else {
    const edge = state.edges.find(e => e.id === selection.id);
    if (!edge) { selection = null; return renderInspector(); }
    const a = findNode(state, edge.from), b = findNode(state, edge.to);
    panel.innerHTML = `
      <h2>Connection</h2>
      <div class="field"><label>From → To</label><input value="${escapeAttr((a ? a.label : '?') + ' → ' + (b ? b.label : '?'))}" disabled></div>
      <div class="field"><label>Join key</label><input id="f-key" value="${escapeAttr(edge.joinKey)}" placeholder="e.g. Article No."></div>
      <div class="field"><label>Status</label>
        <select id="f-status">
          <option value="traced" ${edge.status === 'traced' ? 'selected' : ''}>Traced</option>
          <option value="partial" ${edge.status === 'partial' ? 'selected' : ''}>Partial</option>
          <option value="gap" ${edge.status === 'gap' ? 'selected' : ''}>Gap</option>
          <option value="unknown" ${edge.status === 'unknown' ? 'selected' : ''}>Unknown</option>
        </select>
      </div>
      <div class="field"><label>Systems</label><input id="f-systems" value="${escapeAttr(edge.systems || '')}" placeholder="e.g. ERP → MES"></div>
      <div class="field"><label>Owner</label><input id="f-owner" value="${escapeAttr(edge.owner || '')}" placeholder="e.g. Manufacturing"></div>
      <button class="del-btn" id="f-delete">✕ delete connection</button>
    `;
    document.getElementById('f-key').addEventListener('input', e => { edge.joinKey = e.target.value; onChange(); });
    document.getElementById('f-status').addEventListener('change', e => { edge.status = e.target.value; onChange(); renderEdges(); renderPathsPanel(); });
    document.getElementById('f-systems').addEventListener('input', e => { edge.systems = e.target.value; onChange(); });
    document.getElementById('f-owner').addEventListener('input', e => { edge.owner = e.target.value; onChange(); });
    document.getElementById('f-delete').addEventListener('click', (e) => confirmThenRun(e.target, () => {
      deleteEdge(state, edge.id);
      selection = null; onChange(); render();
    }));
  }
}

/* ---------- paths panel ---------- */

function renderPathsPanel() {
  const panel = document.getElementById('pathsPanel');
  let html = '<h2>Paths</h2>';

  if (pathDraft) {
    html += `
      <div class="draft-box">
        <input id="draft-name" placeholder="Path name (e.g. Sustainability trace)" value="${escapeAttr(pathDraft.name)}">
        <div class="draft-list">${pathDraft.nodeIds.length
          ? pathDraft.nodeIds.map((id, i) => `${i + 1}. ${escapeHtml(findNode(state, id) ? findNode(state, id).label : '?')}`).join('<br>')
          : 'No nodes yet — click nodes on the canvas in order.'}</div>
        <div class="draft-actions">
          <button id="draft-undo">↩ undo last</button>
          <button id="draft-finish" class="btn-primary">✓ finish</button>
          <button id="draft-cancel">✕ cancel</button>
        </div>
      </div>
    `;
  }

  if (state.paths.length === 0 && !pathDraft) {
    html += '<p class="empty-note">No saved paths yet. Click "+ New path", then click nodes on the canvas in order to trace a specific concern (manufacturing, compliance, channel…).</p>';
  }

  state.paths.forEach(path => {
    const stats = computePathStats(state, path);
    const scoreColor = stats.score >= 80 ? 'var(--traced)' : stats.score >= 40 ? 'var(--partial)' : 'var(--gap)';
    let detail;
    if (stats.total === 0) {
      detail = 'Only one node in this path.';
    } else if (!stats.breakInfo) {
      detail = `Fully traced across all <b>${stats.total}</b> hop${stats.total === 1 ? '' : 's'}.`;
    } else {
      const keyPart = stats.breakInfo.edge && stats.breakInfo.edge.joinKey
        ? `join key <b>${escapeHtml(stats.breakInfo.edge.joinKey)}</b> is`
        : (stats.breakInfo.edge ? 'no join key defined,' : 'no connection defined,');
      detail = `Traceable <b>${stats.depth} of ${stats.total}</b> hops. Breaks at <b>${escapeHtml(stats.breakInfo.from.label)}</b> → <b>${escapeHtml(stats.breakInfo.to.label)}</b> (${keyPart} <b>${statusLabel(stats.breakInfo.status).toLowerCase()}</b>).`;
    }
    html += `
      <div class="path-row">
        <div class="path-name-row">
          <span class="path-name">${escapeHtml(path.name)}</span>
          <span class="path-score" style="color:${scoreColor}">${stats.score}%</span>
        </div>
        <div class="path-detail">${detail}</div>
        <div class="path-actions">
          <button data-action="show-path" data-path="${path.id}">${activePathId === path.id ? '● showing' : '○ show on graph'}</button>
          <button data-action="delete-path" data-path="${path.id}">✕ delete</button>
        </div>
      </div>
    `;
  });

  panel.innerHTML = html;

  if (pathDraft) {
    document.getElementById('draft-name').addEventListener('input', e => { pathDraft.name = e.target.value; });
    document.getElementById('draft-undo').addEventListener('click', () => { pathDraft.nodeIds.pop(); render(); });
    document.getElementById('draft-cancel').addEventListener('click', () => { pathDraft = null; render(); });
    document.getElementById('draft-finish').addEventListener('click', () => {
      if (pathDraft.nodeIds.length < 2) return;
      state.paths.push({ id: cryptoUid(), name: pathDraft.name.trim() || 'Untitled path', nodeIds: pathDraft.nodeIds.slice() });
      pathDraft = null; onChange(); render();
    });
  }

  panel.querySelectorAll('[data-action="show-path"]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.path;
    activePathId = (activePathId === id) ? null : id;
    render();
  }));
  panel.querySelectorAll('[data-action="delete-path"]').forEach(b => b.addEventListener('click', (e) => confirmThenRun(e.target, () => {
    deletePath(state, b.dataset.path);
    if (activePathId === b.dataset.path) activePathId = null;
    onChange(); render();
  })));
}

/* ---------- drag / click interaction ---------- */

function startDrag(e, node) {
  e.preventDefault();
  drag = { id: node.id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y, moved: false };
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}
function onDragMove(e) {
  if (!drag) return;
  const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  const node = findNode(state, drag.id);
  if (!node) return;
  node.x = Math.max(0, drag.origX + dx);
  node.y = Math.max(0, drag.origY + dy);
  const el = document.querySelector(`.node[data-node="${node.id}"]`);
  if (el) { el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; }
  renderEdges();
}
function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  if (!drag) return;
  const node = findNode(state, drag.id);
  const moved = drag.moved;
  drag = null;
  if (!moved && node) handleNodeClick(node.id);
  else onChange();
}

function handleNodeClick(id) {
  if (connectMode) {
    if (pendingConnectFrom === null) {
      pendingConnectFrom = id;
    } else if (pendingConnectFrom !== id) {
      if (!findEdgeBetween(state, pendingConnectFrom, id)) {
        const edge = createEdge(pendingConnectFrom, id);
        state.edges.push(edge);
        selection = { type: 'edge', id: edge.id };
        onChange();
      }
      pendingConnectFrom = null;
      connectMode = false;
    }
    render();
    return;
  }
  if (pathDraft) {
    const last = pathDraft.nodeIds[pathDraft.nodeIds.length - 1];
    if (last !== id) pathDraft.nodeIds.push(id);
    render();
    return;
  }
  selection = { type: 'node', id };
  render();
}
function handleEdgeClick(id) {
  if (connectMode || pathDraft) return;
  selection = { type: 'edge', id };
  render();
}

function confirmThenRun(btn, fn) {
  if (btn.dataset.confirming === '1') { fn(); return; }
  const original = btn.textContent;
  btn.dataset.confirming = '1';
  btn.textContent = 'sure?';
  setTimeout(() => { if (btn.dataset.confirming === '1') { btn.dataset.confirming = '0'; btn.textContent = original; } }, 2500);
}

function cryptoUid() { return Math.random().toString(36).slice(2, 10); }

function escapeHtml(s) { return (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escapeAttr(s) { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
