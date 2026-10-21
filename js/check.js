// Section checks: a short, auto-marked activity after each section.
// Item types:
//   mcq   { q, opts: [correct, ...wrong], why }
//   tf    { q, a: true|false, why }
//   multi { q, need, opts: [[text, isCorrect], ...], why }
//   sort  { q, bins: [...], rows: [[text, binIndex], ...], fig?, why }
//   spot  { q, html (elements with data-spot="1" risky / "0" safe and data-why), why }
FD.check = (cfg) => {
  const sec = FD.section(cfg.section);
  FD.add({
    id: 'check-' + cfg.section,
    title: 'Check: ' + sec.name,
    icon: 'check',
    color: sec.color,
    check: true,
    page: true,
    mount(el, nav) {
      let got = 0, done = 0, total = 0;

      function build() {
        got = 0; done = 0; total = 0;
        el.innerHTML = `
          <div class="chk-head" style="--c:var(${sec.color})">
            <span class="chk-ic">${FD.icon[cfg.section]}</span>
            <div><p class="kick">Check your understanding</p><h2>${sec.name}</h2></div>
            <p class="chk-score" id="chkScore" aria-live="polite"></p>
          </div>
          <p class="lead">${cfg.intro || 'Answer every question. You will see if you are right straight away.'}</p>
          <ol class="chk-list" id="chkList"></ol>
          <div class="card chk-end" id="chkEnd" hidden></div>`;
        const list = el.querySelector('#chkList');
        cfg.items.forEach((it, i) => {
          const li = FD.h(`<li class="card chk-item"><p class="chk-q"><span class="qn">${i + 1}</span>${it.q}</p><div class="chk-body"></div><p class="chk-fb" hidden></p></li>`);
          list.appendChild(li);
          const body = li.querySelector('.chk-body');
          const n = TYPES[it.type](it, body, (score) => {
            got += score;
            done++;
            const fb = li.querySelector('.chk-fb');
            const full = score === n;
            li.classList.add('done', full ? 'is-right' : score > 0 ? 'is-part' : 'is-wrong');
            fb.hidden = false;
            fb.className = 'chk-fb ' + (full ? 'good' : 'bad');
            fb.innerHTML = `<b>${full ? '✓ Correct!' : score > 0 ? `Partly right (${score}/${n}).` : '✗ Not quite.'}</b> ${it.why || ''}`;
            update();
          });
          total += n;
        });
        update();
      }

      function update() {
        el.querySelector('#chkScore').innerHTML = `<b>${got}</b> / ${total}`;
        if (done < cfg.items.length) return;
        FD.saveResult('check-' + cfg.section, got, total);
        const pct = got / total;
        const nextSc = FD.scenes[FD.scenes.findIndex((s) => s.id === 'check-' + cfg.section) + 1];
        const end = el.querySelector('#chkEnd');
        end.hidden = false;
        end.innerHTML = `
          <p class="chk-big">${pct === 1 ? '🎉' : pct >= .6 ? '👍' : '📖'} You scored <b>${got} / ${total}</b></p>
          <p>${pct === 1 ? 'Perfect! You are ready for the next section.' : pct >= .6 ? 'Good work. Read the feedback for the ones you missed.' : 'Go back to the section, read it again, then try once more.'}</p>
          <div class="chk-btns">
            <button class="btn primary" id="chkNext">Continue: ${nextSc ? nextSc.tab || nextSc.title : 'Next'} ▶</button>
            <button class="btn ghost" id="chkRetry">↺ Try again</button>
            <button class="btn ghost" id="chkBack">◀ Back to the section</button>
          </div>`;
        end.querySelector('#chkNext').addEventListener('click', nav.next);
        end.querySelector('#chkRetry').addEventListener('click', () => { build(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        end.querySelector('#chkBack').addEventListener('click', () => FD.goto(cfg.section));
        end.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      build();
    },
  });
};

// Each type renders into `body`, calls finish(score) once, and returns the maximum score.
const TYPES = {
  mcq(it, body, finish) {
    body.innerHTML = `<div class="chk-opts">${FD.shuffle(it.opts.map((o, k) => [o, k === 0])).map(([o, ok]) => `<button class="opt" data-ok="${ok}">${o}</button>`).join('')}</div>`;
    body.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
      if (body.dataset.done) return;
      body.dataset.done = 1;
      const ok = b.dataset.ok === 'true';
      b.classList.add(ok ? 'right' : 'wrong');
      body.querySelector('[data-ok="true"]').classList.add('right');
      body.querySelectorAll('.opt').forEach((o) => { o.disabled = true; });
      finish(ok ? 1 : 0);
    }));
    return 1;
  },

  tf(it, body, finish) {
    return TYPES.mcq({ opts: it.a ? ['True', 'False'] : ['False', 'True'] }, body, finish);
  },

  multi(it, body, finish) {
    body.innerHTML = `
      <p class="chk-hint">Choose <b>${it.need}</b>.</p>
      <div class="chk-opts two">${FD.shuffle(it.opts).map(([o, ok]) => `<button class="opt pick" data-ok="${ok}" aria-pressed="false">${o}</button>`).join('')}</div>
      <button class="btn small-btn chk-go" disabled>Check answer</button>`;
    const opts = [...body.querySelectorAll('.opt')], go = body.querySelector('.chk-go');
    const sel = () => opts.filter((o) => o.classList.contains('on'));
    opts.forEach((b) => b.addEventListener('click', () => {
      if (body.dataset.done) return;
      if (!b.classList.contains('on') && sel().length >= it.need) { FD.shake(b); return; }
      b.classList.toggle('on');
      b.setAttribute('aria-pressed', b.classList.contains('on'));
      go.disabled = sel().length !== it.need;
    }));
    go.addEventListener('click', () => {
      body.dataset.done = 1;
      go.hidden = true;
      let score = 0;
      opts.forEach((o) => {
        o.disabled = true;
        const ok = o.dataset.ok === 'true', on = o.classList.contains('on');
        o.classList.remove('on');
        if (on && ok) { score++; o.classList.add('right'); }
        else if (on) o.classList.add('wrong');
        else if (ok) o.classList.add('missed');
      });
      finish(score);
    });
    return it.need;
  },

  sort(it, body, finish) {
    body.innerHTML = `
      ${it.fig ? `<div class="chk-fig">${it.fig}</div>` : ''}
      <div class="sort-rows">${it.rows.map(([t], r) => `
        <div class="sort-row" data-r="${r}">
          <span class="sort-t">${t}</span>
          <span class="sort-bins">${it.bins.map((b, k) => `<button class="sb" data-k="${k}" aria-pressed="false">${b}</button>`).join('')}</span>
        </div>`).join('')}</div>
      <button class="btn small-btn chk-go" disabled>Check answer</button>`;
    const rows = [...body.querySelectorAll('.sort-row')], go = body.querySelector('.chk-go');
    rows.forEach((row) => row.addEventListener('click', (e) => {
      const b = e.target.closest('.sb');
      if (!b || body.dataset.done) return;
      row.querySelectorAll('.sb').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      row.dataset.v = b.dataset.k;
      go.disabled = rows.some((r) => r.dataset.v == null);
    }));
    go.addEventListener('click', () => {
      body.dataset.done = 1;
      go.hidden = true;
      let score = 0;
      rows.forEach((row, r) => {
        const want = it.rows[r][1], ok = +row.dataset.v === want;
        score += ok;
        row.classList.add(ok ? 'ok' : 'no');
        row.querySelectorAll('.sb').forEach((x) => {
          x.disabled = true;
          if (+x.dataset.k === want) x.classList.add('right');
          else if (x.classList.contains('on')) x.classList.add('wrong');
        });
      });
      finish(score);
    });
    return it.rows.length;
  },

  spot(it, body, finish) {
    body.innerHTML = `
      <p class="chk-hint">Tap every part that is a risk. Tap again to undo.</p>
      <div class="spot">${it.html}</div>
      <button class="btn small-btn chk-go">Check answer</button>
      <ul class="spot-why" hidden></ul>`;
    const spots = [...body.querySelectorAll('[data-spot]')], go = body.querySelector('.chk-go');
    spots.forEach((s) => {
      s.setAttribute('role', 'button');
      s.tabIndex = 0;
      const t = () => { if (!body.dataset.done) s.classList.toggle('picked'); };
      s.addEventListener('click', t);
      s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
    });
    go.addEventListener('click', () => {
      body.dataset.done = 1;
      go.hidden = true;
      let hit = 0, wrong = 0;
      const why = [];
      spots.forEach((s) => {
        const risky = s.dataset.spot === '1', on = s.classList.contains('picked');
        if (risky && on) hit++;
        if (!risky && on) wrong++;
        s.classList.add(risky ? (on ? 'right' : 'missed') : on ? 'wrong' : 'safe');
        if (risky) why.push(`<li class="${on ? 'good' : 'bad'}">${on ? '✓' : '✗ Missed:'} ${s.dataset.why}</li>`);
      });
      const ul = body.querySelector('.spot-why');
      ul.innerHTML = why.join('') + (wrong ? `<li class="muted">${wrong} safe part${wrong > 1 ? 's' : ''} picked by mistake (−${wrong}).</li>` : '');
      ul.hidden = false;
      finish(Math.max(0, hit - wrong));
    });
    return body.querySelectorAll('[data-spot="1"]').length;
  },
};
