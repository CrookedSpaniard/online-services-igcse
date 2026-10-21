// Shared namespace, helpers, icons, the sections and the saved progress.
window.FD = (() => {
  'use strict';
  const FD = { scenes: [], speed: 1 };

  FD.add = (scene) => FD.scenes.push(scene);

  // Build one element from an HTML string.
  FD.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  // Durations are divided by the playback speed.
  FD.dur = (ms) => ms / FD.speed;
  FD.wait = (ms) => new Promise((r) => setTimeout(r, FD.dur(ms)));
  FD.fmt = (n) => Math.round(n).toLocaleString('en-GB');
  FD.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  FD.shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  FD.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  FD.today = () => new Date().toLocaleDateString('en-GB');

  // Run fn(t) with t going 0 → 1 over ms (scaled by speed). Resolves when finished.
  FD.tween = (ms, fn) => new Promise((res) => {
    const t0 = performance.now(), d = FD.dur(ms);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / d);
      fn(t);
      if (t < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  // Point at fraction t along a polyline [[x, y], …].
  FD.along = (pts, t) => {
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    let d = t * seg.reduce((a, b) => a + b, 0);
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? Math.min(1, d / seg[i]) : 1;
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  };

  FD.shake = (el) => {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  };
  FD.pulse = (el) => {
    if (!el) return;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  };

  // Segmented control: buttons with data-v, one is .on.
  FD.segSet = (root, v) => {
    root.querySelectorAll('button[data-v]').forEach((b) => {
      const on = b.dataset.v === String(v);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
  };

  // Highlight one zone of a mock: root gets .focusing, matching [data-zone] gets .focus.
  FD.focus = (root, zones) => {
    const list = zones ? [].concat(zones) : [];
    root.classList.toggle('focusing', list.length > 0);
    const zs = [...root.querySelectorAll('[data-zone]')];
    zs.forEach((z) => { z.classList.toggle('focus', list.includes(z.dataset.zone)); z.classList.remove('focus-in'); });
    zs.filter((z) => z.classList.contains('focus')).forEach((z) => {
      for (let p = z.parentElement?.closest('[data-zone]'); p && root.contains(p); p = p.parentElement?.closest('[data-zone]')) p.classList.add('focus-in');
    });
  };

  // Small toast inside a mock.
  FD.toast = (host, html, ms = 2600) => {
    const t = FD.h(`<div class="toast">${html}</div>`);
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), FD.dur(ms));
    setTimeout(() => t.remove(), FD.dur(ms) + 400);
  };

  // Panels inside a stage: buttons [data-p] switch the visible [data-panel].
  FD.panels = (root, onShow) => {
    const show = (p) => {
      root.querySelectorAll('[data-panel]').forEach((x) => { x.hidden = x.dataset.panel !== p; });
      root.querySelectorAll('.ptabs button[data-p]').forEach((b) => {
        const on = b.dataset.p === p;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
      root.dataset.panel = p;
      if (onShow) onShow(p);
    };
    root.querySelectorAll('.ptabs button[data-p]').forEach((b) => b.addEventListener('click', () => show(b.dataset.p)));
    return show;
  };

  // Copy text to the clipboard, with a fallback for older browsers.
  FD.copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  };

  FD.download = (name, text, type = 'text/plain') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  FD.slug = (s) => String(s || 'student').trim().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'student';

  // ---------- the two parts and their sections ----------
  FD.PARTS = {
    A: { name: 'Online services', ch: 'Chapter 11', pages: 'pages 168–175' },
    B: { name: 'The cloud', ch: 'Chapter 12', pages: 'pages 176–179' },
  };
  FD.SECTIONS = [
    { id: 'shopping', part: 'A', name: 'Shopping sites', short: 'Shopping', color: '--c4', line: 'Product catalogue, categories, basket, checkout, voucher codes, secure payment.' },
    { id: 'booking', part: 'A', name: 'Booking systems', short: 'Booking', color: '--c1', line: 'Travel, leisure and entertainment tickets, seat choice and e-tickets.' },
    { id: 'banks', part: 'A', name: 'Banks and education', short: 'Banks / VLE', color: '--c7', line: 'Balances, balance alerts, payments; online courses and VLEs.' },
    { id: 'news', part: 'A', name: 'Gaming, news and information', short: 'Gaming / news', color: '--c3', line: 'Games hosted on remote servers, subscribers and real-time notifications.' },
    { id: 'auction', part: 'A', name: 'Auction sites', short: 'Auctions', color: '--c8', line: 'Bidding, ratings for buyers and sellers, outbid and ending-soon alerts.' },
    { id: 'lifestyle', part: 'A', name: 'Impact on lifestyle and behaviour', short: 'Lifestyle', color: '--c6', line: 'Benefits and drawbacks (Table 11.1); online services vs local services.' },
    { id: 'business', part: 'A', name: 'Impact on organisations', short: 'Business', color: '--c5', line: 'Global markets and workforce, big data, security, competition.' },
    { id: 'cookies', part: 'A', name: 'Transactional data and cookies', short: 'Cookies', color: '--c9', line: 'What is collected, session, persistent and third-party cookies, targeted marketing.' },
    { id: 'hosted', part: 'B', name: 'Hosted applications software', short: 'Hosted apps', color: '--c4', line: 'Web apps on servers, latency and bandwidth, collaboration (Table 12.1).' },
    { id: 'storage', part: 'B', name: 'Online data storage', short: 'Online storage', color: '--c1', line: 'Benefits and drawbacks of storing files in the cloud (Table 12.3).' },
    { id: 'impact', part: 'B', name: 'The impact of the cloud', short: 'Cloud impact', color: '--c7', line: 'Cheaper devices, the digital divide, scalable services for organisations.' },
  ];
  FD.section = (id) => FD.SECTIONS.find((s) => s.id === id);

  // ---------- saved progress (this browser, plus a progress code to move it) ----------
  const KEY = 'og-progress-v1';
  const blank = () => ({ v: 1, name: '', cls: '', seen: {}, last: '', step: 0, checks: {}, acts: {}, tests: {}, started: FD.today(), updated: '' });
  FD.state = blank();
  FD.canSave = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) FD.state = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { FD.canSave = false; }
  FD.results = FD.state.checks;

  let saveTimer = null;
  FD.save = (now) => {
    FD.state.updated = new Date().toISOString();
    clearTimeout(saveTimer);
    const write = () => { try { localStorage.setItem(KEY, JSON.stringify(FD.state)); FD.canSave = true; } catch (e) { FD.canSave = false; } };
    if (now) write(); else saveTimer = setTimeout(write, 250);
    if (FD.onChange) FD.onChange();
  };
  FD.replaceState = (s) => {
    FD.state = Object.assign(blank(), s);
    FD.results = FD.state.checks;
    FD.save(true);
  };
  FD.resetState = () => FD.replaceState(blank());
  FD.hasProgress = () => !!(Object.keys(FD.state.seen).length || Object.keys(FD.state.checks).length || Object.keys(FD.state.acts).length || Object.keys(FD.state.tests).length);

  FD.saveResult = (id, score, total) => {
    const r = FD.state.checks[id] || { tries: 0, best: 0 };
    FD.state.checks[id] = { score, total, tries: r.tries + 1, best: Math.max(r.best || 0, score), date: FD.today() };
    FD.save();
    if (FD.onResult) FD.onResult(id);
  };
  FD.markSeen = (id) => {
    if (FD.state.seen[id]) return;
    FD.state.seen[id] = FD.today();
    FD.save();
    if (FD.onResult) FD.onResult(id);
  };

  // ---------- icons (24×24 line icons) ----------
  const ic = (p) => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  FD.icon = {
    start: ic('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>'),
    apps: ic('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><path d="M17 13.5v7M13.5 17h7"/>'),
    office: ic('<path d="M6 3h8l4.5 4.5V21H6z"/><path d="M14 3v4.5h4.5"/><path d="M9 12h6M9 15.5h6M9 8.5h2.5"/>'),
    spreadsheet: ic('<rect x="3.5" y="4" width="17" height="16" rx="1.5"/><path d="M3.5 9h17M3.5 14.5h17M9 4v16M14.5 4v16"/>'),
    database: ic('<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>'),
    web: ic('<path d="M8.5 8L4 12l4.5 4M15.5 8L20 12l-4.5 4M13.5 5l-3 14"/>'),
    image: ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 2.5-2.5 5 4.5"/>'),
    sound: ic('<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0"/>'),
    present: ic('<rect x="3" y="4" width="18" height="11" rx="1.5"/><path d="M12 15v3M8 21l4-3 4 3"/><path d="M7 11.5l3-3 2.5 2 4-4"/>'),
    control: ic('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'),
    project: ic('<path d="M3.5 4v16h17"/><rect x="6" y="6.5" width="6" height="2.5" rx="1"/><rect x="10" y="10.75" width="6" height="2.5" rx="1"/><rect x="13" y="15" width="6" height="2.5" rx="1"/>'),
    comms: ic('<path d="M4 5h16v10.5H10L5.5 19.5v-4H4z"/><path d="M8 9.2h8M8 12h5"/>'),
    licence: ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7 9h7M7 12.5h5"/><circle cx="16.5" cy="14" r="2.2"/><path d="M15.4 16l-.6 3 1.7-1 1.7 1-.6-3"/>'),
    updates: ic('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4.5v4.5h-4.5"/><path d="M12 8v4.5l3 1.8"/>'),
    shopping: ic('<path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H6.6"/><circle cx="9.5" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/>'),
    booking: ic('<path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-2a2.5 2.5 0 0 0 0-5z"/><path d="M14.5 6v12" stroke-dasharray="2 2"/>'),
    banks: ic('<path d="M3.5 9.5L12 4l8.5 5.5z"/><path d="M5.5 10v7M9.5 10v7M14.5 10v7M18.5 10v7M3.5 20h17"/>'),
    news: ic('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    auction: ic('<path d="M13.5 4l6 6M11 6.5l6 6M12.2 5.3l-4.4 4.4 6 6 4.4-4.4"/><path d="M9.5 13.5L3.5 19.5"/><path d="M12 21h8.5"/>'),
    lifestyle: ic('<path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z"/>'),
    business: ic('<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3.5 13h17"/>'),
    cookies: ic('<path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 2.5 2.5 0 0 0 2 2z"/><circle cx="9" cy="10" r=".9"/><circle cx="8.5" cy="15" r=".9"/><circle cx="13.5" cy="15.5" r=".9"/><circle cx="12.5" cy="11.5" r=".6"/>'),
    hosted: ic('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 8h18M8 21h8M12 17v4"/><path d="M8.5 13l2-2-2-2" transform="translate(0 1)"/>'),
    storage: ic('<path d="M7 18.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.6-1.4A4.8 4.8 0 0 0 7 18.5z"/><path d="M12 16v-5.5M9.5 12.5L12 10l2.5 2.5"/>'),
    impact: ic('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" stroke-dasharray="2.5 2.5"/><circle cx="12" cy="12" r="9.5" stroke-dasharray="1.5 3"/>'),
    bulb: ic('<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v1.6h5V16c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'),
    terms: ic('<path d="M3.5 5h6a2.5 2.5 0 0 1 2.5 2.5V20a2 2 0 0 0-2-2H3.5z"/><path d="M20.5 5h-6A2.5 2.5 0 0 0 12 7.5V20a2 2 0 0 1 2-2h6.5z"/>'),
    final: ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8.5 11l1.6 1.6 3-3M8.5 16.5h7"/>'),
    check: ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.6"/>'),
    activity: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    progress: ic('<path d="M3.5 3.5v17h17"/><path d="M7.5 15l4-4.5 3 2.5 5-6"/>'),
    help: ic('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><circle cx="12" cy="17.2" r=".5"/>'),
    tick: ic('<path d="M4.5 12.5l5 5 10-11"/>'),
    cross: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    copy: ic('<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>'),
    download: ic('<path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M4.5 19.5h15"/>'),
    upload: ic('<path d="M12 15.5V4.5M7 9l5-5 5 5"/><path d="M4.5 19.5h15"/>'),
    key: ic('<circle cx="7.5" cy="12" r="3.5"/><path d="M11 12h10M17.5 12v3M20.5 12v2"/>'),
    lock: ic('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    unlock: ic('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>'),
    globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    play: ic('<path d="M7 4.5v15l12-7.5z"/>'),
    shield: ic('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/>'),
    search: ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    file: ic('<path d="M6 3h8l4.5 4.5V21H6z"/><path d="M14 3v4.5h4.5"/>'),
    printer: ic('<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.5"/><path d="M7 14h10v6.5H7z"/>'),
    bt: ic('<path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9"/>'),
  };

  // ---------- small device drawings used in several scenes (inline SVG <g>) ----------
  // Each returns markup for a 60×46 box with its top-left corner at (x, y).
  FD.dv = {
    laptop: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="8" y="2" width="44" height="30" rx="3"/><rect class="dv-screen" x="12" y="6" width="36" height="22" rx="1"/><path class="dv-body" d="M2 34h56l-4 7H6z"/></g>`,
    desktop: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="6" y="2" width="48" height="32" rx="3"/><rect class="dv-screen" x="10" y="6" width="40" height="24" rx="1"/><rect class="dv-body" x="26" y="34" width="8" height="6"/><rect class="dv-body" x="18" y="40" width="24" height="4" rx="2"/></g>`,
    phone: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="19" y="0" width="22" height="44" rx="4"/><rect class="dv-screen" x="22" y="5" width="16" height="32" rx="1"/><circle class="dv-detail" cx="30" cy="40.5" r="1.6"/></g>`,
    tablet: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="10" y="0" width="40" height="46" rx="4"/><rect class="dv-screen" x="14" y="4" width="32" height="36" rx="1"/><circle class="dv-detail" cx="30" cy="43" r="1.4"/></g>`,
    printer: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-paper" x="16" y="2" width="28" height="14"/><rect class="dv-body" x="4" y="14" width="52" height="20" rx="4"/><rect class="dv-paper" x="14" y="30" width="32" height="12"/><circle class="dv-led" cx="48" cy="21" r="2"/></g>`,
    server: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="14" y="0" width="32" height="46" rx="3"/><path class="dv-detail" d="M18 7h24v3H18zM18 15h24v3H18zM18 23h24v3H18z"/><circle class="dv-led" cx="40" cy="38" r="2"/></g>`,
    router: (x, y) => `<g transform="translate(${x} ${y})"><path class="dv-detail" d="M14 22V4h3v18zM43 22V4h3v18z"/><rect class="dv-body" x="4" y="20" width="52" height="18" rx="5"/><circle class="dv-led" cx="14" cy="29" r="2"/><circle class="dv-led" cx="21" cy="29" r="2"/><circle class="dv-led" cx="28" cy="29" r="2"/></g>`,
    switch: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="2" y="14" width="56" height="18" rx="3"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect class="dv-screen" x="${7 + i * 8}" y="19" width="5" height="5" rx="1"/>`).join('')}<circle class="dv-led" cx="52" cy="27" r="1.6"/></g>`,
    tv: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="2" y="2" width="56" height="34" rx="3"/><rect class="dv-screen" x="6" y="6" width="48" height="26" rx="1"/><rect class="dv-body" x="22" y="36" width="16" height="4"/><rect class="dv-body" x="16" y="40" width="28" height="4" rx="2"/></g>`,
    ap: (x, y) => `<g transform="translate(${x} ${y})"><ellipse class="dv-body" cx="30" cy="30" rx="22" ry="9"/><ellipse class="dv-screen" cx="30" cy="27" rx="18" ry="5"/><circle class="dv-led" cx="30" cy="31" r="1.6"/><path class="dv-arc" d="M20 14a14 14 0 0 1 20 0M24 18a8 8 0 0 1 12 0"/></g>`,
    cloud: (x, y) => `<g transform="translate(${x} ${y})"><path class="dv-cloud" d="M16 40h30a10 10 0 0 0 1-20 14 14 0 0 0-27-3 11 11 0 0 0-4 23z"/></g>`,
  };

  // ---------- a picture drawn at any resolution (used for pixels, projectors and zoom) ----------
  // Draws the same landscape into a w×h buffer, then copies it onto `canvas` without smoothing,
  // so low resolutions look blocky. `view` = [x, y, size] crops part of the picture (0–1 units).
  FD.pic = (canvas, w, h, view = [0, 0, 1]) => {
    const buf = document.createElement('canvas');
    buf.width = w; buf.height = h;
    const c = buf.getContext('2d');
    const [vx, vy, vs] = view;
    c.scale(w / vs, h / vs);
    c.translate(-vx, -vy);
    const g = c.createLinearGradient(0, 0, 0, 0.62);
    g.addColorStop(0, '#4c8bd6'); g.addColorStop(1, '#bfe0ff');
    c.fillStyle = g; c.fillRect(0, 0, 1, 1);
    c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(0.78, 0.2, 0.08, 0, 7); c.fill();
    c.fillStyle = '#ffffff';
    [[0.18, 0.16], [0.27, 0.15], [0.23, 0.11]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 0.05, 0, 7); c.fill(); });
    c.fillStyle = '#5c940d'; c.beginPath(); c.moveTo(0, 0.7); c.quadraticCurveTo(0.3, 0.5, 0.6, 0.66); c.quadraticCurveTo(0.8, 0.75, 1, 0.6); c.lineTo(1, 1); c.lineTo(0, 1); c.fill();
    c.fillStyle = '#2b8a3e'; c.fillRect(0, 0.82, 1, 0.18);
    c.fillStyle = '#f1f3f5'; c.fillRect(0.38, 0.58, 0.2, 0.17);
    c.fillStyle = '#c92a2a'; c.beginPath(); c.moveTo(0.35, 0.59); c.lineTo(0.48, 0.47); c.lineTo(0.61, 0.59); c.fill();
    c.fillStyle = '#495057'; c.fillRect(0.46, 0.66, 0.04, 0.09);
    c.fillStyle = '#74c0fc'; c.fillRect(0.4, 0.62, 0.04, 0.035); c.fillRect(0.52, 0.62, 0.04, 0.035);
    c.save(); c.translate(0.06, 0.95); c.scale(0.001, 0.001);
    c.fillStyle = '#ffffff'; c.font = 'bold 80px sans-serif'; c.fillText('ICT', 0, 0);
    c.restore();
    const out = canvas.getContext('2d');
    out.imageSmoothingEnabled = false;
    out.clearRect(0, 0, canvas.width, canvas.height);
    out.drawImage(buf, 0, 0, canvas.width, canvas.height);
  };

  // ---------- a 5×7 dot font (for dot matrix and laser printing) ----------
  FD.FONT = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'], 0: ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'], 2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], 7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  };
  // Columns of dots for a word: [[colIndex, [rows with a dot]], …] with one empty column between letters.
  FD.dotCols = (word) => {
    const cols = [];
    [...word].forEach((ch) => {
      const g = FD.FONT[ch] || FD.FONT[' '];
      for (let x = 0; x < 5; x++) cols.push(g.map((r, y) => (r[x] === '1' ? y : -1)).filter((y) => y >= 0));
      cols.push([]);
    });
    return cols;
  };

  // ---------- short sounds (only after a click; muted by default in auto-play) ----------
  let actx = null;
  FD.audio = () => {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; }
    return actx;
  };
  FD.beep = (freq = 880, ms = 160, type = 'square', vol = 0.08, pan = 0) => {
    const a = FD.audio();
    if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + ms / 1000);
    let last = g;
    if (a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = pan; g.connect(p); last = p; }
    o.connect(g); last.connect(a.destination);
    o.start(); o.stop(a.currentTime + ms / 1000 + 0.02);
  };

  return FD;
})();
