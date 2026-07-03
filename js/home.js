// home.js
// Renders the landing screen: search + family chips + recent assessments.
// Doesn't touch the graph state directly — just tells app.js which product
// name was picked, via the onSelect callback.

import { PRODUCTS, FAMILIES } from '../data/products.js';

let onSelect = () => {};

export function initHome({ onSelect: selectCb, onOpenGraphDirect }) {
  onSelect = selectCb;
  renderFamilyChips();
  document.getElementById('productSearch').addEventListener('input', onSearchInput);
  document.getElementById('openGraphDirectBtn').addEventListener('click', onOpenGraphDirect);
}

function renderFamilyChips() {
  const wrap = document.getElementById('familyChips');
  wrap.innerHTML = FAMILIES.map(f => `<button class="chip" data-family="${escapeAttr(f)}">${escapeHtml(f)}</button>`).join('');
  wrap.querySelectorAll('.chip').forEach(btn => btn.addEventListener('click', () => {
    const input = document.getElementById('productSearch');
    input.value = btn.dataset.family;
    input.focus();
    renderSearchResults(btn.dataset.family);
  }));
}

function onSearchInput(e) {
  renderSearchResults(e.target.value);
}

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  const results = document.getElementById('searchResults');
  if (!q) { results.innerHTML = ''; return; }

  const matches = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.family.toLowerCase().includes(q)
  );

  if (matches.length) {
    results.innerHTML = matches.map(p => `
      <button class="result-item" data-name="${escapeAttr(p.name)}">
        <span>${escapeHtml(p.name)}</span>
        <span class="result-family">${escapeHtml(p.family)}</span>
      </button>
    `).join('');
  } else {
    const raw = query.trim();
    results.innerHTML = `
      <button class="result-item" data-name="${escapeAttr(raw)}">
        <span>Assess "${escapeHtml(raw)}"</span>
        <span class="result-family">new</span>
      </button>
    `;
  }

  results.querySelectorAll('.result-item').forEach(btn => {
    btn.addEventListener('click', () => onSelect(btn.dataset.name));
  });
}

export function renderRecents(list) {
  const el = document.getElementById('recentList');
  el.innerHTML = list.length
    ? list.map(name => `<li><button class="recent-item" data-name="${escapeAttr(name)}">${escapeHtml(name)}</button></li>`).join('')
    : '<li class="empty-note">No assessments yet — search a product above to get started.</li>';

  el.querySelectorAll('.recent-item').forEach(btn => {
    btn.addEventListener('click', () => onSelect(btn.dataset.name));
  });
}

function escapeHtml(s) { return (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escapeAttr(s) { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
