// sample-data.js
// A hand-built example graph, used to seed a fresh install and as a
// reference for "load example". Once data/products.js is wired to a real
// catalog, this file becomes optional — kept for onboarding and demos.

import { uid } from '../js/graph.js';

export function exampleGraph() {
  const n = {
    p:    { id: uid(), label: 'Hardox 450',         type: 'product',     x: 520,  y: 300 },
    art:  { id: uid(), label: 'Article',             type: 'article',     x: 520,  y: 430 },
    pp:   { id: uid(), label: 'Product Page',        type: 'system',      x: 260,  y: 430 },
    ds:   { id: uid(), label: 'Datasheet',           type: 'system',      x: 260,  y: 510 },
    cms:  { id: uid(), label: 'CMS',                 type: 'system',      x: 260,  y: 350 },
    po:   { id: uid(), label: 'Production Order',    type: 'production',  x: 770,  y: 430 },
    heat: { id: uid(), label: 'Heat',                type: 'production',  x: 960,  y: 430 },
    mill: { id: uid(), label: 'Mill (Raahe)',        type: 'production',  x: 1140, y: 430 },
    epd:  { id: uid(), label: 'EPD',                 type: 'certificate', x: 770,  y: 560 },
    co2:  { id: uid(), label: 'CO₂ Data',            type: 'certificate', x: 960,  y: 560 },
    dpp:  { id: uid(), label: 'DPP',                 type: 'certificate', x: 1140, y: 560 },
    qc:   { id: uid(), label: 'Quality Certificate',  type: 'certificate', x: 770,  y: 300 }
  };
  const nodes = Object.values(n);

  const e = (from, to, key, status) => ({
    id: uid(), from: from.id, to: to.id, joinKey: key, status, systems: '', owner: ''
  });

  const edges = [
    e(n.p,   n.art,  'Article No.',   'traced'),
    e(n.art, n.pp,   'SKU',           'traced'),
    e(n.art, n.ds,   'SKU',           'traced'),
    e(n.art, n.cms,  'Channel ID',    'partial'),
    e(n.art, n.po,   'Order No.',     'traced'),
    e(n.po,  n.heat, 'Heat No.',      'partial'),
    e(n.heat,n.mill, 'Mill Batch',    'gap'),
    e(n.art, n.epd,  'Product Group', 'partial'),
    e(n.epd, n.co2,  '',              'gap'),
    e(n.co2, n.dpp,  '',              'unknown'),
    e(n.po,  n.qc,   'Cert No.',      'traced')
  ];

  const paths = [
    { id: uid(), name: 'Manufacturing trace',  nodeIds: [n.p.id, n.art.id, n.po.id, n.heat.id, n.mill.id] },
    { id: uid(), name: 'Sustainability trace', nodeIds: [n.p.id, n.art.id, n.epd.id, n.co2.id, n.dpp.id] },
    { id: uid(), name: 'Channel trace',        nodeIds: [n.p.id, n.art.id, n.cms.id] }
  ];

  return { nodes, edges, paths };
}
