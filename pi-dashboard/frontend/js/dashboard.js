
const API = { stats: '/api/stats', earnings: '/api/earnings', processes: '/api/processes' };
const REFRESH_MS = 5000;

function renderSparkline(id, data, color) {
  const w = document.getElementById(id);
  if (!w) return;
  w.innerHTML = '';
  const max = Math.max(...data, 1);
  data.forEach(v => {
    const b = document.createElement('div');
    b.className = 'spark-bar';
    b.style.height = Math.max((v / max) * 100, 2) + '%';
    b.style.background = color;
    w.appendChild(b);
  });
}

function setText(id, t) { const e = document.getElementById(id); if (e) e.textContent = t; }
function colorForPct(p) { return p >= 90 ? 'var(--accent-red)' : p >= 75 ? 'var(--accent-yellow)' : null; }
function tempColor(t)   { return t >= 75 ? 'var(--accent-red)' : t >= 60 ? 'var(--accent-yellow)' : 'var(--accent-teal)'; }
function fmtKbps(k)     { return k >= 1024 ? (k/1024).toFixed(1)+' MB/s' : k.toFixed(1)+' KB/s'; }
function esc(s)         { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── stats ──────────────────────────────────────────────────── */
async function fetchStats() {
  try {
    const d = await (await fetch(API.stats)).json();
    const cc = colorForPct(d.cpu.value)    || 'var(--accent-pi)';
    const mc = colorForPct(d.memory.value) || 'var(--accent-linux)';
    const dc = colorForPct(d.disk.value)   || 'var(--accent-win)';
    const tc = tempColor(d.temp.value);

    setText('cpu-value',  d.cpu.value);    document.getElementById('cpu-value').style.color  = cc;
    setText('mem-value',  d.memory.value); document.getElementById('mem-value').style.color  = mc;
    setText('disk-value', d.disk.value);   document.getElementById('disk-value').style.color = dc;
    setText('temp-value', d.temp.value);   document.getElementById('temp-value').style.color = tc;

    renderSparkline('cpu-spark',    d.cpu.history,            cc);
    renderSparkline('mem-spark',    d.memory.history,         mc);
    renderSparkline('disk-spark',   d.disk.history,           dc);
    renderSparkline('temp-spark',   d.temp.history,           tc);
    renderSparkline('net-tx-spark', d.network.tx_history, 'var(--accent-money)');
    renderSparkline('net-rx-spark', d.network.rx_history, 'var(--accent-teal)');

    setText('net-tx-value', fmtKbps(d.network.tx_kbps));
    setText('net-rx-value', fmtKbps(d.network.rx_kbps));
    setText('uptime-val', d.uptime);
    setText('last-updated', 'Updated ' + new Date(d.timestamp).toLocaleTimeString());

    document.querySelector('.dot').classList.add('live');
    document.getElementById('alert-bar').classList.remove('show');
  } catch(e) {
    document.getElementById('alert-bar').classList.add('show');
    setText('alert-msg', 'Cannot reach backend — retrying…');
    document.querySelector('.dot').classList.remove('live');
  }
}

/* ── earnings ───────────────────────────────────────────────── */
async function fetchEarnings() {
  try {
    const d = await (await fetch(API.earnings)).json();
    setText('earn-daily-total', '$' + d.summary.total_daily_usd.toFixed(2));
    setText('earn-total-all',   '$' + d.summary.total_earned_usd.toFixed(2));
    const src = d.sources;
    const maxD = Math.max(...Object.values(src).map(s => s.daily));
    const bd = document.getElementById('earnings-breakdown');
    if (bd) {
      bd.innerHTML = '';
      for (const [, s] of Object.entries(src)) {
        const r = document.createElement('div'); r.className = 'earn-row';
        r.innerHTML =
          `<span class="earn-dot" style="background:${s.color}"></span>` +
          `<span class="earn-name">${esc(s.label)}</span>` +
          `<div class="earn-bar-track"><div class="earn-bar-fill" style="width:${(s.daily/maxD)*100}%;background:${s.color}"></div></div>` +
          `<span class="earn-daily" style="color:${s.color}">+$${s.daily.toFixed(2)}/d</span>` +
          `<span class="earn-total">$${s.total.toFixed(2)}</span>`;
        bd.appendChild(r);
      }
    }
    renderDonut(src);
  } catch(e) {}
}

function renderDonut(sources) {
  const svg = document.getElementById('donut-svg');
  if (!svg) return;
  svg.querySelectorAll('.donut-seg').forEach(e => e.remove());
  const vals = Object.values(sources);
  const total = vals.reduce((s, v) => s + v.daily, 0);
  const circ = 2 * Math.PI * 55;
  let off = 0;
  vals.forEach(s => {
    const frac = s.daily / total, dash = frac * circ;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('class','donut-seg'); c.setAttribute('cx','70'); c.setAttribute('cy','70');
    c.setAttribute('r','55'); c.setAttribute('fill','none'); c.setAttribute('stroke', s.color);
    c.setAttribute('stroke-width','18');
    c.setAttribute('stroke-dasharray', `${dash} ${circ - dash}`);
    c.setAttribute('stroke-dashoffset', -(off * circ / (2*Math.PI)) + circ * 0.25);
    svg.appendChild(c); off += frac * 2 * Math.PI;
  });
  const dv = document.querySelector('.dc-val');
  if (dv) dv.textContent = '$' + total.toFixed(2);
  const leg = document.getElementById('donut-legend');
  if (leg) {
    leg.innerHTML = '';
    vals.forEach(s => {
      const i = document.createElement('div'); i.className = 'dl-item';
      i.innerHTML = `<span class="dl-dot" style="background:${s.color}"></span>${esc(s.label)}`;
      leg.appendChild(i);
    });
  }
}

/* ── processes ──────────────────────────────────────────────── */
async function fetchProcesses() {
  try {
    const d = await (await fetch(API.processes)).json();
    setText('proc-count', d.total + ' shown');
    const tb = document.getElementById('proc-tbody');
    if (!tb) return;
    tb.innerHTML = '';
    const maxCpu = Math.max(...d.processes.map(p => p.cpu), 1);
    const maxMem = Math.max(...d.processes.map(p => p.mem), 1);
    d.processes.forEach(p => {
      const cpuPct = Math.min((p.cpu / maxCpu) * 100, 100);
      const memPct = Math.min((p.mem / maxMem) * 100, 100);
      const cpuCol = p.cpu >= 50 ? 'var(--accent-red)' : p.cpu >= 25 ? 'var(--accent-yellow)' : 'var(--accent-pi)';
      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td><strong>${esc(p.name)}</strong></td>` +
        `<td class="mono">${esc(p.pid)}</td>` +
        `<td>` +
          `<span style="font-size:.82rem;font-weight:600;color:${cpuCol};margin-right:8px">${p.cpu}%</span>` +
          `<span class="mini-bar-track"><span class="mini-bar-fill" style="width:${cpuPct}%;background:${cpuCol}"></span></span>` +
        `</td>` +
        `<td>` +
          `<span style="font-size:.82rem;font-weight:600;color:var(--accent-linux);margin-right:8px">${p.mem}%</span>` +
          `<span class="mini-bar-track"><span class="mini-bar-fill" style="width:${memPct}%;background:var(--accent-linux)"></span></span>` +
        `</td>`;
      tb.appendChild(tr);
    });
  } catch(e) {}
}

/* ── init ───────────────────────────────────────────────────── */
async function init() {
  await Promise.all([fetchStats(), fetchEarnings(), fetchProcesses()]);
  setInterval(fetchStats,     REFRESH_MS);
  setInterval(fetchProcesses, REFRESH_MS * 2);   // every 10 s
  setInterval(fetchEarnings,  REFRESH_MS * 6);   // every 30 s
}
document.addEventListener('DOMContentLoaded', init);
