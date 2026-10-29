// End-of-part test: multiple choice + exam-style questions with mark schemes.
// Answers are saved as the student goes, so a test can be finished in another lesson.
// Q:    [topic, question, [correct, ...wrong], why, sectionId]
// LONG: { q, m (marks), s: [mark-scheme points] }
FD.TESTS = {};

FD.test = (cfg) => {
  const part = FD.PARTS[cfg.part];
  FD.TESTS[cfg.id] = cfg;
  FD.add({
    id: cfg.id,
    title: `Test · Part ${cfg.part}: ${part.name}`,
    tab: `Test ${cfg.part}`,
    icon: 'final',
    color: '--accent',
    page: true,
    test: true,
    mount(el) {
      const { Q, LONG } = cfg;
      // Option order is fixed per question (a seeded shuffle), so saved picks still match after a reload.
      const order = Q.map((q, i) => seeded(q[2].map((o, k) => k), i * 7 + 3));
      const T = () => FD.state.tests[cfg.id] || (FD.state.tests[cfg.id] = { picks: {}, long: [], done: false });

      function build() {
        const t = T();
        el.innerHTML = `
          <div class="fin-head">
            <span class="chk-ic">${FD.icon.final}</span>
            <div><p class="kick">Part ${cfg.part} · ${part.name}</p><h2>End-of-part test</h2></div>
          </div>
          <p class="lead">${Q.length} multiple-choice questions and ${LONG.length} exam-style questions (${LONG.reduce((n, l) => n + l.m, 0)} marks). Your answers are <b>saved as you go</b>, so you can finish another day. When you finish, <b>copy your results</b> and send them to your teacher.</p>
          <div class="card who">
            <label>Your name<input id="fName" autocomplete="name" placeholder="First name and surname"></label>
            <label>Class<input id="fClass" placeholder="e.g. 10B"></label>
          </div>
          <h3 class="mt">Section A · Multiple choice</h3>
          <ol class="quiz" id="fq">${Q.map(([, q], i) => `
            <li class="card qz" data-i="${i}"><p class="qz-q">${q}</p>
              <div class="qz-opts">${order[i].map((k) => `<button class="opt" data-k="${k}" aria-pressed="false">${Q[i][2][k]}</button>`).join('')}</div>
              <p class="qz-fb" hidden></p></li>`).join('')}</ol>
          <h3 class="mt">Section B · Exam-style questions</h3>
          ${LONG.map((l, i) => `
            <div class="card long">
              <p><b>${i + 1}.</b> ${l.q} <span class="marks">[${l.m} mark${l.m > 1 ? 's' : ''}]</span></p>
              ${l.link ? `<p class="small"><button class="link-btn" data-go="${l.link[0]}">${FD.icon.play} ${l.link[1]}</button></p>` : ''}
              <textarea rows="${l.m > 4 ? 8 : l.m > 2 ? 5 : 3}" id="lg${i}" placeholder="Write your answer here…" aria-label="Answer to question ${i + 1}">${FD.esc(t.long[i] || '')}</textarea>
              <div class="scheme-box" id="ms${i}" hidden><b>Mark scheme</b><ul class="scheme">${l.s.map((s) => `<li>${s}</li>`).join('')}</ul></div>
            </div>`).join('')}
          <div class="fin-go"><p id="left" class="small"></p><button class="btn primary" id="finish">✓ Finish and mark my test</button></div>
          <div class="card results" id="results" hidden></div>`;
        const $ = (s) => el.querySelector(s);
        $('#fName').value = FD.state.name; $('#fClass').value = FD.state.cls;
        $('#fName').addEventListener('input', (e) => { FD.state.name = e.target.value; FD.save(); begin(); });
        $('#fClass').addEventListener('input', (e) => { FD.state.cls = e.target.value; FD.save(); });
        LONG.forEach((_, i) => $('#lg' + i).addEventListener('input', (e) => { T().long[i] = e.target.value; begin(); FD.save(); }));
        el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => FD.goto(b.dataset.go)));
        el.querySelectorAll('.qz').forEach((li) => {
          const i = li.dataset.i;
          if (t.picks[i] != null) pick(li, t.picks[i]);
          li.addEventListener('click', (e) => {
            const b = e.target.closest('.opt');
            if (!b || T().done) return;
            begin();
            T().picks[i] = +b.dataset.k;
            FD.save();
            pick(li, +b.dataset.k);
            left();
          });
        });
        $('#finish').addEventListener('click', finish);
        left();
        if (t.done) mark(false);
      }
      function pick(li, k) {
        li.querySelectorAll('.opt').forEach((o) => { const on = +o.dataset.k === k; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on); });
        li.classList.add('answered');
      }
      function begin() { const t = T(); if (!t.start) { t.start = Date.now(); FD.save(); } }
      function left() {
        const n = Q.length - Object.keys(T().picks).length;
        el.querySelector('#left').textContent = n ? `${n} multiple-choice question${n > 1 ? 's' : ''} left to answer.` : 'All multiple-choice questions answered. Ready when you are!';
      }

      function finish() {
        const $ = (s) => el.querySelector(s);
        if (!FD.state.name.trim()) { FD.shake($('#fName')); $('#fName').focus(); $('#left').innerHTML = '<b class="bad">Write your name first.</b>'; return; }
        const miss = Q.findIndex((_, i) => T().picks[i] == null);
        if (miss >= 0) {
          const li = el.querySelector(`.qz[data-i="${miss}"]`);
          li.scrollIntoView({ behavior: 'smooth', block: 'center' });
          FD.shake(li);
          return;
        }
        mark(true);
      }

      function mark(fresh) {
        const $ = (s) => el.querySelector(s), t = T();
        let right = 0;
        const wrong = [];
        el.querySelectorAll('.qz').forEach((li) => {
          const i = +li.dataset.i, ok = t.picks[i] === 0;
          right += ok;
          if (!ok) wrong.push(i);
          li.classList.add('done');
          li.querySelectorAll('.opt').forEach((o) => {
            o.classList.remove('on');
            if (+o.dataset.k === 0) o.classList.add('right');
            else if (+o.dataset.k === t.picks[i]) o.classList.add('wrong');
          });
          const fb = li.querySelector('.qz-fb');
          fb.hidden = false;
          fb.className = 'qz-fb ' + (ok ? 'good' : 'bad');
          fb.textContent = (ok ? '✓ Correct. ' : '✗ Not quite. ') + Q[i][3];
        });
        LONG.forEach((_, i) => { $('#ms' + i).hidden = false; $('#lg' + i).readOnly = true; });
        $('#finish').hidden = true; $('#left').hidden = true;
        if (fresh) {
          Object.assign(t, {
            done: true, score: right, total: Q.length, pct: Math.round((100 * right) / Q.length), wrong,
            mins: Math.max(1, Math.round((Date.now() - (t.start || Date.now())) / 60000)), date: FD.today(),
          });
          FD.save(true);
          if (FD.onResult) FD.onResult(cfg.id);
        }
        const text = FD.testText(cfg.id);
        const r = $('#results');
        r.hidden = false;
        r.innerHTML = `
          <p class="kick">Your results</p>
          <div class="res-top"><span class="big-score">${t.score}<small>/${t.total}</small></span>
            <span><b>${t.pct}%</b> · ${t.mins} min · ${t.date}<br><span class="muted">${t.pct >= 80 ? 'Excellent work! 🎉' : t.pct >= 60 ? 'Good job. Review the questions you missed.' : 'Go back through the sections and try again.'}</span></span></div>
          <div class="res-checks">${FD.SECTIONS.filter((s) => s.part === cfg.part).map((s) => { const c = FD.state.checks['check-' + s.id]; return `<span class="${c ? '' : 'nd'}"><small>${s.short}</small><b>${c ? `${c.score}/${c.total}` : 'not done'}</b></span>`; }).join('')}</div>
          <p class="small muted">Mark your written answers yourself with the mark schemes above.</p>
          <pre class="res-text" id="resText"></pre>
          <div class="chk-btns">
            <button class="btn primary" id="copyBtn">${FD.icon.copy} Copy my results</button>
            <button class="btn ghost" id="dlBtn">${FD.icon.download} Download .txt</button>
            <button class="btn ghost" id="again">↺ Try the test again</button>
          </div>
          <p class="small" id="copyMsg">Then paste them (Ctrl+V / ⌘V) in an email or in Google Classroom for your teacher. Tip: <b>My progress</b> (top of the page) copies everything you have done in the whole unit.</p>`;
        $('#resText').textContent = text;
        $('#copyBtn').addEventListener('click', async () => {
          const ok = await FD.copy(text);
          $('#copyMsg').innerHTML = ok ? '<b class="good">✓ Copied!</b> Now paste it (Ctrl+V / ⌘V) in an email or in Google Classroom.' : '<b class="bad">Could not copy automatically.</b> Select the text in the box above and copy it, or download the .txt file.';
        });
        $('#dlBtn').addEventListener('click', () => FD.download(`online-services-test-${cfg.part.toLowerCase()}-${FD.slug(FD.state.name)}.txt`, text));
        $('#again').addEventListener('click', () => {
          if (!confirm('Start this test again? Your answers to this test will be cleared.')) return;
          FD.state.tests[cfg.id] = { picks: {}, long: [], done: false };
          FD.save(true);
          if (FD.onResult) FD.onResult(cfg.id);
          build();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        if (fresh) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      build();
    },
  });
};

// The results of one test as plain text (also used by My progress).
FD.testLines = (id) => {
  const cfg = FD.TESTS[id], t = FD.state.tests[id];
  if (!t || !t.done) return ['Not finished yet.'];
  const lines = [
    `Score:     ${t.score} / ${t.total} (${t.pct}%)`,
    `Time:      ${t.mins} min`,
    `Date:      ${t.date}`,
    '',
    t.wrong && t.wrong.length ? 'Questions to review:' : 'Questions to review: none, all correct!',
    ...(t.wrong || []).map((i) => `   ✗ Q${i + 1}. ${cfg.Q[i][1].replace(/<[^>]+>/g, '')}`),
  ];
  cfg.LONG.forEach((l, i) => lines.push('', `Written answer ${i + 1} (${l.m} mark${l.m > 1 ? 's' : ''}): ${l.q.replace(/<[^>]+>/g, '')}`, `   ${(t.long[i] || '').trim().replace(/\s+/g, ' ') || '(no answer)'}`));
  return lines;
};
FD.testText = (id) => {
  const cfg = FD.TESTS[id], t = FD.state.tests[id];
  const rule = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  return [
    `ONLINE SERVICES AND THE CLOUD · TEST PART ${cfg.part}`,
    `IGCSE ICT · Unit 4 · ${FD.PARTS[cfg.part].name}`,
    rule,
    `Name:      ${FD.state.name.trim() || '–'}`,
    `Class:     ${FD.state.cls.trim() || '–'}`,
    ...(t && t.done ? [] : [`Date:      ${FD.today()}`]),
    ...FD.testLines(id),
  ].join('\n');
};

// Deterministic shuffle (mulberry32).
function seeded(a, seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
