// products.js
// Example product catalog — illustrative grades per family, standing in for
// a real feed (e.g. exported from the PIM) until that integration exists.
// Shape: { id, name, family }. Swap this array's contents for a real fetch
// once available; nothing else needs to change, since home.js and
// assessment.js only depend on this shape.

export const PRODUCTS = [
  { id: 'hardox-450', name: 'Hardox 450', family: 'Hardox' },
  { id: 'hardox-500', name: 'Hardox 500', family: 'Hardox' },
  { id: 'hardox-600', name: 'Hardox 600', family: 'Hardox' },

  { id: 'strenx-700', name: 'Strenx 700', family: 'Strenx' },
  { id: 'strenx-900', name: 'Strenx 900', family: 'Strenx' },
  { id: 'strenx-1300', name: 'Strenx 1300', family: 'Strenx' },

  { id: 'docol-1000dp', name: 'Docol 1000DP', family: 'Docol' },
  { id: 'docol-1200m', name: 'Docol 1200M', family: 'Docol' },
  { id: 'docol-phs', name: 'Docol PHS', family: 'Docol' },

  { id: 'toolox-33', name: 'Toolox 33', family: 'Toolox' },
  { id: 'toolox-44', name: 'Toolox 44', family: 'Toolox' },

  { id: 'armox-500t', name: 'Armox 500T', family: 'Armox' },
  { id: 'armox-600t', name: 'Armox 600T', family: 'Armox' },

  { id: 'green-steel', name: 'Green Steel', family: 'Green Steel' }
];

export const FAMILIES = [...new Set(PRODUCTS.map(p => p.family))];
