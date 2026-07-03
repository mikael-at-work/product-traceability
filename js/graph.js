// graph.js
// Core data model: nodes, edges, and the small helpers everything else builds on.
// No DOM, no storage — just shape and lookups.

export const NODE_W = 150;
export const NODE_H = 54;

export const TYPE_COLORS = {
  product: '#5B8DB8',
  variant: '#7C8CA8',
  article: '#A9B4C4',
  production: '#C9A227',
  system: '#9B6BC7',
  certificate: '#4A9B7F',
  other: '#D97A3D'
};

export const TYPE_LABELS = {
  product: 'Product',
  variant: 'Variant',
  article: 'Article',
  production: 'Production',
  system: 'System',
  certificate: 'Certificate',
  other: 'Other'
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyState() {
  return { nodes: [], edges: [], paths: [] };
}

export function createNode(overrides = {}) {
  return { id: uid(), label: 'New node', type: 'other', x: 40, y: 40, notes: '', ...overrides };
}

export function createEdge(fromId, toId, overrides = {}) {
  return { id: uid(), from: fromId, to: toId, joinKey: '', status: 'unknown', systems: '', owner: '', ...overrides };
}

export function findNode(state, id) {
  return state.nodes.find(n => n.id === id);
}

export function findEdgeBetween(state, a, b) {
  return state.edges.find(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
}

export function center(node) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

export function deleteNode(state, id) {
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.edges = state.edges.filter(e => e.from !== id && e.to !== id);
  state.paths.forEach(p => { p.nodeIds = p.nodeIds.filter(nid => nid !== id); });
}

export function deleteEdge(state, id) {
  state.edges = state.edges.filter(e => e.id !== id);
}

export function deletePath(state, id) {
  state.paths = state.paths.filter(p => p.id !== id);
}
