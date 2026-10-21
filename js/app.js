(() => {
  'use strict';
  const FD = window.FD, S = FD.scenes;
  const $ = (s) => document.querySelector(s);
  const tabsEl = $('#tabs'), stageEl = $('#stage'), pageEl = $('#page'), labEl = $('#lab');
  const btnPlay = $('#btnPlay');

  let cur = -1, step = 0, api = {}, playing = false, run = 0, timer = null, demo = false;

  // ---------- tabs (grouped into Part A and Part B) ----------
  const tabs = [];
  let sectionNo = 0, lastPart = null;
  S.forEach((sc, i) => {
    const sec = FD.section(sc.id) || (sc.check || sc.activity ? FD.section(sc.id.replace(/^(check|act)-/, '')) : null);
    const part = sec ? sec.part : sc.test ? sc.id.slice(-1) : null;
    if (part && part !== lastPart) {
      tabsEl.appendChild(FD.h(`<span class="tab-part">Part ${part}<small>${FD.PARTS[part].name}</small></span>`));
      lastPart = part;
    }
    const b = document.createElement('button');
    b.type = 'button';
    if (sc.check) {
      b.className = 'chk';
      b.innerHTML = `${FD.icon.check}<span>Check</span>`;
      b.title = sc.title;
    } else if (sc.activity) {
      b.className = 'chk act-tab';
      b.innerHTML = `${FD.icon.activity}<span>Activities</span>`;
      b.title = sc.title;
    } else {
      const n = sc.section ? `<b>${++sectionNo}</b>` : '';
      b.innerHTML = `${FD.icon[sc.icon] || ''}${n}<span>${sc.tab || sc.title}</span>`;
      if (sc.section || sc.test) b.classList.add('sec');
    }
    b.style.setProperty('--c', `var(${sc.color || '--accent'})`);
    b.addEventListener('click', () => { pause(); go(i, 0); });
    tabsEl.appendChild(b);
    tabs.push(b);
  });
  const markTabs = () => S.forEach((sc, i) => tabs[i].classList.toggle('done', FD.isDone(sc)));
  FD.onResult = () => { markTabs(); if (FD.onChange) FD.onChange(); };
  FD.refresh = () => { markTabs(); if (FD.onChange) FD.onChange(); if (S[cur].page) mount(cur); };

  const stepsOf = (sc) => (sc.page ? 1 : sc.steps.length);
  const totalSteps = S.reduce((n, sc) => n + stepsOf(sc), 0);

  // ---------- scenes ----------
  function mount(i) {
    run++;
    clearTimeout(timer);
    demo = false;
    if (api && api.destroy) api.destroy();
    cur = i;
    const sc = S[i];
    document.documentElement.style.setProperty('--scene', `var(${sc.color || '--accent'})`);
    labEl.hidden = !!sc.page;
    pageEl.hidden = !sc.page;
    const host = sc.page ? pageEl : stageEl;
    host.innerHTML = '';
    host.className = sc.page ? 'page page-' + (sc.check ? 'check' : sc.activity ? 'check page-act' : sc.test ? 'final' : sc.id) : 'stage stage-' + sc.id;
    if (!sc.page) {
      $('#sceneTitle').textContent = sc.title;
      $('#sceneIc').innerHTML = FD.icon[sc.icon] || '';
      $('#tryBadge').hidden = !sc.interactive;
      renderVocab(sc);
    }
    api = sc.mount(host, { next: () => { pause(); next(); } }) || {};
    tabs.forEach((b, k) => {
      b.classList.toggle('active', k === i);
      if (k === i) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const tab = tabs[i];
    const tr = tab.getBoundingClientRect(), nr = tabsEl.getBoundingClientRect();
    tabsEl.scrollBy({ left: tr.left - nr.left - nr.width / 2 + tr.width / 2, behavior: 'smooth' });
    try { history.replaceState(null, '', '#' + sc.id); } catch (e) { /* file:// */ }
    if (sc.page && !sc.check && !sc.activity && !sc.test && sc.id !== 'start') FD.markSeen(sc.id);
  }

  function renderVocab(sc) {
    const box = $('#vocab');
    box.hidden = !(sc.vocab && sc.vocab.length);
    if (box.hidden) return;
    $('#vocabList').innerHTML = sc.vocab.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('');
  }

  function go(i, k = 0) {
    if (i !== cur) {
      mount(i);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    showStep(k);
  }

  function remember() {
    if (S[cur].id !== 'start') { FD.state.last = S[cur].id; FD.state.step = step; }
    if (!S[cur].page && step === S[cur].steps.length - 1) FD.markSeen(S[cur].id);
    FD.save();
  }

  async function showStep(k) {
    const sc = S[cur];
    if (sc.page) {
      step = 0;
      updateProgress();
      remember();
      if (playing) pause();
      return;
    }
    step = Math.max(0, Math.min(k, sc.steps.length - 1));
    const st = sc.steps[step];
    const id = ++run;
    clearTimeout(timer);

    $('#stepCount').textContent = `Step ${step + 1} of ${sc.steps.length}`;
    $('#stepTitle').textContent = st.title;
    $('#stepText').innerHTML = st.text;
    const tip = $('#stepTip');
    tip.hidden = !st.tip;
    tip.innerHTML = st.tip || '';
    const nar = $('#narration');
    nar.classList.remove('enter');
    void nar.offsetWidth;
    nar.classList.add('enter');
    updateProgress();
    remember();

    const ctx = {
      alive: () => id === run,
      sleep: async (ms) => { await FD.wait(ms); return id === run; },
    };
    demo = true;
    try { await (st.on && st.on(api, ctx)); } catch (e) { console.error(e); }
    if (id !== run) return;
    demo = false;
    if (playing) timer = setTimeout(() => { if (id === run) next(); }, FD.dur(readTime(st)));
  }

  function readTime(st) {
    const words = (st.title + ' ' + st.text + ' ' + (st.tip || '')).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(4000, words * 330);
  }

  function next() {
    const sc = S[cur];
    if (!sc.page && step < sc.steps.length - 1) return showStep(step + 1);
    if (cur < S.length - 1) go(cur + 1, 0);
    else pause();
  }
  function back() {
    const sc = S[cur];
    if (!sc.page && step > 0) return showStep(step - 1);
    if (cur > 0) {
      const p = S[cur - 1];
      go(cur - 1, p.page ? 0 : p.steps.length - 1);
    }
  }
  function restart() { pause(); mount(cur); showStep(0); }

  function play() {
    if (S[cur].page) return;
    playing = true;
    btnPlay.innerHTML = '❚❚ Pause';
    btnPlay.classList.add('playing');
    if (!demo) { clearTimeout(timer); timer = setTimeout(next, FD.dur(900)); }
  }
  function pause() {
    playing = false;
    clearTimeout(timer);
    btnPlay.innerHTML = '▶ Play';
    btnPlay.classList.remove('playing');
  }
  const toggle = () => (playing ? pause() : play());

  function updateProgress() {
    let n = 0;
    for (let i = 0; i < cur; i++) n += stepsOf(S[i]);
    n += step + 1;
    $('#progressFill').style.width = (100 * n / totalSteps) + '%';
    $('#btnBack').disabled = cur === 0 && step === 0;
    $('#btnNext').disabled = cur === S.length - 1;
    btnPlay.disabled = !!S[cur].page;
  }

  // Any click inside the stage hands control to the user.
  stageEl.addEventListener('pointerdown', () => {
    if (playing) pause();
    if (demo) { run++; demo = false; }
  }, true);

  FD.goto = (id, k = 0) => {
    const i = S.findIndex((s) => s.id === id);
    if (i >= 0) { pause(); go(i, k); }
  };

  // ---------- controls ----------
  btnPlay.addEventListener('click', toggle);
  $('#btnNext').addEventListener('click', () => { pause(); next(); });
  $('#btnBack').addEventListener('click', () => { pause(); back(); });
  $('#btnReset').addEventListener('click', restart);
  $('#speed').addEventListener('change', (e) => { FD.speed = +e.target.value; });
  $('#btnProgress').addEventListener('click', FD.openProgress);
  $('#btnHelp').addEventListener('click', FD.openHelp);

  function setProjector(on) {
    document.body.classList.toggle('projector', on);
    $('#btnProjector').setAttribute('aria-pressed', on);
    try { localStorage.setItem('og-projector', on ? '1' : '0'); } catch (e) { /* ignore */ }
  }
  $('#btnProjector').addEventListener('click', () => setProjector(!document.body.classList.contains('projector')));
  try { if (localStorage.getItem('og-projector') === '1') setProjector(true); } catch (e) { /* ignore */ }

  function fullScreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  }
  $('#btnFull').addEventListener('click', fullScreen);

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable], dialog, [data-keys]') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === ' ' && !e.target.closest('button')) { e.preventDefault(); toggle(); }
    else if (k === 'ArrowRight') { pause(); next(); }
    else if (k === 'ArrowLeft') { pause(); back(); }
    else if (k === 'r' || k === 'R') restart();
    else if (k === 'p' || k === 'P') setProjector(!document.body.classList.contains('projector'));
    else if (k === 'f' || k === 'F') fullScreen();
  });

  // ---------- start ----------
  markTabs();
  const fromHash = S.findIndex((s) => '#' + s.id === location.hash);
  go(fromHash >= 0 ? fromHash : 0, 0);
  FD.welcome();
})();
