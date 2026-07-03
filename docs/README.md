# Product Traceability Designer

Answers one question: **starting from a customer-facing product, how far
back can we trace it through business, manufacturing, and compliance data —
and where does it break?**

It's a graph, not a set of independent lanes: nodes (products, articles,
systems, certificates, mills…) are shared, and a "trace" is just an ordered
path through nodes that already exist. Fix a broken join once and every
saved path that crosses it updates.

## Running it

Static site, no build step. Either open `index.html` directly, or serve the
folder (needed if you add anything that fetches other files, e.g. a real
`data/products.js` catalog):

```
npx serve .
```

## Structure

```
index.html          shell: canvas + inspector + paths panel
css/styles.css       all styling
js/
  app.js             entry point — loads state, wires storage/export buttons
  ui.js              rendering + canvas interaction (drag, connect, path-build)
  graph.js           data model: nodes, edges, lookups — no DOM
  scoring.js         path → { depth, score, break point } narrative
  storage.js         localStorage persistence + JSON export/import
data/
  sample-data.js     the worked Hardox 450 example, used to seed a fresh install
  trace-templates.js name suggestions for new paths (Manufacturing, Compliance…)
  products.js        placeholder — wire up a real product catalog feed here
assets/logo.svg, assets/icons/
exports/             where manual JSON exports land locally (git-ignored)
robots.txt, noindex.html   keep this out of search indexes (see note below)
```

## Notes / assumptions made while splitting this up

- **Storage moved from `window.storage` to `localStorage`.** The earlier
  prototype was built inside a Claude.ai artifact, which provides a
  `window.storage` API that only exists in that runtime. A real deployed
  page (GitHub Pages or otherwise) doesn't have it, so `storage.js` now uses
  `localStorage` — per-browser, per-origin, no server. If you want the graph
  to sync across machines or be shared with teammates, that's the file to
  replace with a real backend, or lean harder on the JSON export/import as
  the sharing mechanism.
- **`noindex.html`** — I wasn't sure of its intended role, so I made it a
  minimal redirect page with a `noindex` meta tag pointing at `index.html`,
  as a belt-and-suspenders alongside `robots.txt` (which stops crawling but
  not indexing of a URL that's linked from elsewhere). Repoint or repurpose
  it if you had something else in mind.
- **`data/products.js`** is an empty placeholder — nothing currently reads
  it. It's there as the seam for when a real catalog export replaces
  hand-built example data.
- Node positions are still manual (drag to arrange) — no auto-layout. Fine
  at the current scale; worth revisiting if the graph grows into the
  hundreds of nodes.
