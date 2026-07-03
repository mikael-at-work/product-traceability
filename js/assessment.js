// assessment.js
// Renders the assessment screen for one product: overall coverage, DPP
// readiness (if a sustainability/DPP path exists), and a score card per
// path that starts at that product's node. This is the primary "answer the
// executive question" view — the graph is where you go to fix what it finds.

import { computePathStats, statusLabel } from './scoring.js';

export function findProductNode(state, name) {
  const target = name.trim().toLowerCase();
  return state.nodes.find(n => n.type === 'product' && n.label.trim().toLowerCase() === target);
}

export function renderAssessment(state, productName, { onOpenGraph, onCreate, onBack }) {
  document.getElementById('backHomeBtn').onclick = onBack;
  const container = document.getElementById('assessmentContent');
  const node = findProductNode(state, productName);

  if (!node) {
    container.innerHTML = `
      <h1>${escapeHtml(productName)}</h1>
      <p class="empty-note">No traceability graph exists yet for this product.</p>
      <button id="createGraphBtn" class="btn-primary">+ Build graph for ${escapeHtml(productName)}</button>
    `;
    document.getElementById('createGraphBtn').addEventListener('click', () => onCreate(productName));
    return;
  }

  const paths = state.paths
    .filter(p => p.nodeIds[0] === node.id)
    .map(p => ({ path: p, stats: computePathStats(state, p) }));

  const dppEntry = paths.find(p => /dpp|sustainab/i.test(p.path.name));
  const avgScore = paths.length ? Math.round(paths.reduce((s, p) => s + p.stats.score, 0) / paths.length) : 0;

  container.innerHTML = `
    <h1>${escapeHtml(node.label)}</h1>
    <div class="assessment-summary">
      <div class="summary-stat">
        <span class="stat-label">Overall coverage</span>
        <span class="stat-value" style="color:${scoreColor(avgScore)}">${paths.length ? avgScore + '%' : '—'}</span>
      </div>
      ${dppEntry ? `
        <div class="summary-stat">
          <span class="stat-label">DPP readiness</span>
          <span class="stat-value" style="color:${scoreColor(dppEntry.stats.score)}">${dppEntry.stats.score}%</span>
        </div>
      ` : ''}
      <div class="summary-stat">
        <span class="stat-label">Paths defined</span>
        <span class="stat-value">${paths.length}</span>
      </div>
    </div>

    <div class="score-cards">
      ${paths.length ? paths.map(scoreCardHtml).join('') : '<p class="empty-note">No paths defined yet for this product. Open the graph editor to build one.</p>'}
    </div>

    <button id="openGraphBtn2" class="btn-primary">Open graph editor →</button>
  `;
  document.getElementById('openGraphBtn2').addEventListener('click', () => onOpenGraph(node.id));
}

function scoreCardHtml({ path, stats }) {
  const color = scoreColor(stats.score);
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
  return `
    <div class="score-card">
      <div class="score-card-head">
        <span class="score-card-name">${escapeHtml(path.name)}</span>
        <span class="score-card-value" style="color:${scoreColor(stats.score)}">${stats.score}%</span>
      </div>
      <div class="score-card-detail">${detail}</div>
    </div>
  `;
}

function scoreColor(score) {
  return score >= 80 ? 'var(--traced)' : score >= 40 ? 'var(--partial)' : 'var(--gap)';
}
function escapeHtml(s) { return (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
