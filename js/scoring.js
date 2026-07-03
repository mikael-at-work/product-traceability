// scoring.js
// Turns a path (ordered node sequence) into the numbers and narrative that
// answer the executive question: how far back can we trace, and where does it break.

import { findNode, findEdgeBetween } from './graph.js';

export function statusLabel(status) {
  return { traced: 'Traced', partial: 'Partial', gap: 'Gap', unknown: 'Unknown' }[status] || 'Unknown';
}

/**
 * @returns {{ total:number, depth:number, score:number, breakInfo: null | {
 *   from: object, to: object, edge: object|undefined, status: string
 * } }}
 */
export function computePathStats(state, path) {
  const total = path.nodeIds.length - 1;
  let depth = 0;
  let broken = false;
  let tracedCount = 0;
  let breakInfo = null;

  for (let i = 0; i < total; i++) {
    const a = path.nodeIds[i];
    const b = path.nodeIds[i + 1];
    const edge = findEdgeBetween(state, a, b);
    const status = edge ? edge.status : 'unknown';

    if (status === 'traced') {
      tracedCount++;
      if (!broken) depth++;
    } else if (!broken) {
      broken = true;
      breakInfo = { from: findNode(state, a), to: findNode(state, b), edge, status };
    }
  }

  const score = total > 0 ? Math.round((tracedCount / total) * 100) : 0;
  return { total, depth, score, breakInfo };
}
