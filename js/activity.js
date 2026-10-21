// Book activities: a page after a section. Answers are saved as the student types
// and go into "My progress" so they can be copied and sent to the teacher.
// Item types:
//   write { id, title, task, fields?: [label, …], lines?, sim?: [sceneId, label], hint? }
//   table { id, title, task, head: [col, …], rows: [[given, [answerIndex, …]], …], opts: [[option, …] per answer column], why }
FD.ACTS = [];

FD.activities = (cfg) => {
  const sec = FD.section(cfg.section);
  cfg.items.forEach((it) => FD.ACTS.push({ ...it, section: cfg.section }));
  FD.add({
    id: 'act-' + cfg.section,
    title: 'Activities: ' + sec.name,
    icon: 'activity',
    color: sec.color,
    activity: true,
    page: true,
    acts: cfg.items.map((it) => it.id),
    mount(el, nav) {
      const nextSc = FD.scenes[FD.scenes.findIndex((s) => s.id === 'act-' + cfg.section) + 1];
      el.innerHTML = `
        <div class="chk-head" style="--c:var(${sec.color})">
          <span class="chk-ic">${FD.icon.activity}</span>
          <div><p class="kick">Activities from the book</p><h2>${sec.name}</h2></div>
          <p class="chk-score" id="actCount" aria-live="polite"></p>
        </div>
        <p class="lead">${cfg.intro || 'Write your answers in the boxes. They are <b>saved automatically</b> on this device and included when you copy <b>My progress</b>.'}</p>
        <div class="acts" id="acts"></div>
        <div class="card chk-end act-end">
          <p>Finished? Your answers are already saved. You can come back and change them at any time.</p>
          <div class="chk-btns">
            <button class="btn primary" id="actNext">Continue: ${nextSc ? nextSc.tab || nextSc.title : 'Next'} ▶</button>
            <button class="btn ghost" id="actBack">◀ Back to the section</button>
          </div>
        </div>`;
      const box = el.querySelector('#acts');
      cfg.items.forEach((it, i) => box.appendChild(it.type === 'table' ? table(it, i) : write(it, i)));
      el.querySelector('#actNext').addEventListener('click', nav.next);
      el.querySelector('#actBack').addEventListener('click', () => FD.goto(cfg.section));
      count();

      function count() {
        const n = cfg.items.filter((it) => FD.actDone(it.id)).length;
        el.querySelector('#actCount').innerHTML = `<b>${n}</b> / ${cfg.items.length}`;
        if (FD.onResult) FD.onResult('act-' + cfg.section);
      }

      function head(it, i) {
        return `<p class="chk-q"><span class="qn">${i + 1}</span><span>${it.title}</span><span class="act-ok" hidden>✓ saved</span></p><div class="act-task">${it.task}</div>`;
      }

      function write(it, i) {
        const saved = FD.state.acts[it.id] || {};
        const card = FD.h(`<section class="card chk-item act" id="a-${it.id}">${head(it, i)}
          ${it.sim ? `<p class="small"><button class="link-btn" data-go="${it.sim[0]}">${FD.icon.play} ${it.sim[1]}</button></p>` : ''}
          ${(it.fields || []).map((f, k) => `<label class="act-f"><span>${f}</span><input data-k="f${k}" value="${FD.esc((saved.f || [])[k] || '')}"></label>`).join('')}
          <label class="act-a"><span class="sr">Your answer</span><textarea rows="${it.lines || 4}" data-k="text" placeholder="${it.hint || 'Write your answer here…'}">${FD.esc(saved.text || '')}</textarea></label>
        </section>`);
        const sync = () => {
          const f = [...card.querySelectorAll('input[data-k]')].map((x) => x.value);
          const text = card.querySelector('textarea').value;
          FD.state.acts[it.id] = { f, text, date: FD.today() };
          FD.save();
          card.querySelector('.act-ok').hidden = !FD.actDone(it.id);
          card.classList.toggle('is-right', FD.actDone(it.id));
          count();
        };
        card.querySelectorAll('input, textarea').forEach((x) => x.addEventListener('input', sync));
        card.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => FD.goto(b.dataset.go)));
        card.querySelector('.act-ok').hidden = !FD.actDone(it.id);
        card.classList.toggle('is-right', FD.actDone(it.id));
        return card;
      }

      function table(it, i) {
        const saved = FD.state.acts[it.id] || {};
        const picks = saved.picks || {};
        const card = FD.h(`<section class="card chk-item act" id="a-${it.id}">${head(it, i)}
          <div class="tbl-wrap"><table class="tbl act-tbl">
            <thead><tr>${it.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${it.rows.map(([given, ans], r) => `<tr><th scope="row">${given}</th>${ans.map((a, c) => a == null ? '<td class="muted">–</td>' : `<td><select data-r="${r}" data-c="${c}" aria-label="${it.head[c + 1]} for ${given}"><option value="">Choose…</option>${it.opts[c].map((o, k) => `<option value="${k}" ${picks[r + '-' + c] === k ? 'selected' : ''}>${o}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody>
          </table></div>
          <div class="chk-btns"><button class="btn small-btn chk-go" id="tg-${it.id}">Check my table</button></div>
          <p class="chk-fb" hidden></p>
        </section>`);
        const sels = [...card.querySelectorAll('select')], fb = card.querySelector('.chk-fb');
        const mark = (show) => {
          let got = 0, tot = 0;
          sels.forEach((s) => {
            const want = it.rows[s.dataset.r][1][s.dataset.c];
            tot++;
            const ok = s.value !== '' && +s.value === want;
            got += ok;
            s.classList.toggle('right', show && ok);
            s.classList.toggle('wrong', show && !ok);
          });
          return [got, tot];
        };
        sels.forEach((s) => s.addEventListener('change', () => {
          const p = (FD.state.acts[it.id] || {}).picks || {};
          p[s.dataset.r + '-' + s.dataset.c] = s.value === '' ? undefined : +s.value;
          FD.state.acts[it.id] = { ...(FD.state.acts[it.id] || {}), picks: p };
          s.classList.remove('right', 'wrong');
          FD.save();
        }));
        card.querySelector('.chk-go').addEventListener('click', () => {
          const [got, tot] = mark(true);
          FD.state.acts[it.id] = { ...(FD.state.acts[it.id] || {}), score: got, total: tot, date: FD.today() };
          FD.save();
          fb.hidden = false;
          fb.className = 'chk-fb ' + (got === tot ? 'good' : 'bad');
          fb.innerHTML = `<b>${got === tot ? '✓ All correct!' : `${got} / ${tot} correct.`}</b> ${got === tot ? it.why || '' : 'The red boxes are not right yet. Change them and check again.'}`;
          card.querySelector('.act-ok').hidden = !FD.actDone(it.id);
          card.classList.toggle('is-right', got === tot);
          count();
        });
        if (saved.score != null) card.querySelector('.chk-go').click();
        return card;
      }
    },
  });
};

// An activity counts as done when it has a real answer (or the table has been checked).
FD.actDone = (id) => {
  const a = FD.state.acts[id];
  if (!a) return false;
  if (a.total != null) return true;
  const words = ((a.text || '') + ' ' + (a.f || []).join(' ')).trim();
  return words.length >= 8;
};

// The answer as plain text, for the copied report.
FD.actText = (it) => {
  const a = FD.state.acts[it.id];
  if (!a) return '(not done)';
  if (it.type === 'table') {
    const p = a.picks || {};
    const rows = it.rows.map(([given, ans], r) => `${given}: ${ans.map((x, c) => (x == null ? '' : it.opts[c][p[r + '-' + c]] || '?')).filter(Boolean).join(' / ')}`);
    return (a.total != null ? `Score ${a.score}/${a.total}. ` : '(not checked) ') + rows.join('; ');
  }
  const f = (it.fields || []).map((l, k) => `${l}: ${((a.f || [])[k] || '').trim() || '–'}`);
  const t = (a.text || '').trim().replace(/\s+/g, ' ');
  return [...f, t].filter(Boolean).join(' | ') || '(not done)';
};
