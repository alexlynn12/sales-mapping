/* Sales Mapping — data layer.
   The app ships with no real numbers. A dataset is resolved in this order:
     1. one you loaded from your own machine (kept in this browser's localStorage, never uploaded)
     2. data/demo-plan.json — synthetic figures, safe to publish
   Nothing here ever sends your dataset anywhere. There is no server. */

const LS_KEY = 'salesmapping.dataset.v1';
const DEMO_URL = 'data/demo-plan.json';

const REQUIRED = ['territories', 'areas', 'adj', 'stateTerr', 'adds', 'baseline', 'palette', 'total', 'totalHeads'];

function validate(ds) {
  if (!ds || typeof ds !== 'object') throw new Error('not an object');
  const missing = REQUIRED.filter(k => !(k in ds));
  if (missing.length) throw new Error('missing: ' + missing.join(', '));
  if (!Array.isArray(ds.territories) || !ds.territories.length) throw new Error('no territories');
  if (ds.baseline.length !== ds.territories.length) throw new Error('baseline length does not match territories');
  ds.colocate = ds.colocate || [];
  ds.homes = ds.homes || [];
  ds.uncovered = ds.uncovered || [];
  ds.k = ds.k || ds.areas.length;
  ds.meta = ds.meta || { name: 'untitled dataset' };
  return ds;
}

function fail(msg, detail) {
  const el = document.getElementById('bootmsg');
  el.classList.remove('hide');
  el.innerHTML = `<b>${msg}</b>${detail ? `<div class="muted">${detail}</div>` : ''}
    <div class="muted">Load a dataset file to continue, or see <code>data/README.md</code> for the format.</div>`;
}

function stored() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? validate(JSON.parse(raw)) : null;
  } catch (e) {
    console.warn('stored dataset rejected:', e.message);
    localStorage.removeItem(LS_KEY);
    return null;
  }
}

/* ---------- toolbar actions ---------- */
window.loadDataset = function (ev) {
  const f = ev.target.files[0];
  ev.target.value = '';
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    let ds;
    try { ds = validate(JSON.parse(r.result)); }
    catch (e) { alert('That file is not a Sales Mapping dataset.\n\n' + e.message); return; }
    localStorage.setItem(LS_KEY, JSON.stringify(ds));
    document.getElementById('bootmsg').classList.add('hide');
    window.boot(ds);
  };
  r.readAsText(f);
};

window.useDemoData = async function () {
  if (!confirm('Switch to the published demo dataset? Your own dataset is removed from this browser — the file on your machine is untouched.')) return;
  localStorage.removeItem(LS_KEY);
  const ds = await fetchDemo();
  if (ds) window.boot(ds);
};

window.downloadDataset = function () {
  const ds = stored();
  if (!ds) { alert('The demo dataset is already in the repo at data/demo-plan.json.'); return; }
  const b = new Blob([JSON.stringify(ds, null, 1)], { type: 'application/json' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u;
  a.download = (ds.meta.name || 'dataset').replace(/\W+/g, '-').toLowerCase() + '.json';
  a.click();
  URL.revokeObjectURL(u);
};

async function fetchDemo() {
  try {
    const res = await fetch(DEMO_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return validate(await res.json());
  } catch (e) {
    fail('No dataset loaded.',
      location.protocol === 'file:'
        ? 'Opened straight from disk, so the browser blocks reading the demo file. Serve the folder instead — <code>python3 -m http.server</code> — or load your own dataset below.'
        : 'Could not read ' + DEMO_URL + ' (' + e.message + ').');
    return null;
  }
}

/* ---------- start ---------- */
window.addEventListener('load', async () => {
  try {
    const topo = await (await fetch('vendor/usa_110m.json', { cache: 'force-cache' })).json();
    window.PlotlyGeoAssets = window.PlotlyGeoAssets || {};
    window.PlotlyGeoAssets.topojson = window.PlotlyGeoAssets.topojson || {};
    window.PlotlyGeoAssets.topojson['usa_110m'] = topo;
  } catch (e) {
    console.warn('local topojson unavailable, Plotly will fetch its own:', e.message);
  }
  const ds = stored() || await fetchDemo();
  if (ds) window.boot(ds);
});
