FD.add({
  id: 'banks',
  title: 'Banks and education providers',
  tab: 'Banks / VLE',
  icon: 'banks',
  color: '--c7',
  section: true,
  interactive: true,
  vocab: [
    ['Balance', 'The amount of money in a bank account (also known as bank balance or account balance).'],
    ['Balance alert', 'A service that automatically informs a customer, by text message or email, when the balance of their account reaches a specified amount.'],
    ['Assessment', 'The process of judging the value or quality of something, such as the quality of a student’s work.'],
  ],
  mount(el) {
    el.innerHTML = `
      <div class="sim bn-s">
        <div class="ptabs" role="group" aria-label="Simulations"><button data-p="bank">🏦 Online banking</button><button data-p="vle">🎓 Online course (VLE)</button></div>
        <div data-panel="bank" class="bn-wrap">
          <div class="bn-phone">
            <div class="bn-notif" id="notif" hidden></div>
            <div class="bn-top">🏦 <b>BS Bank</b><small>Hello, Alex</small></div>
            <div class="bn-screen" id="scr"></div>
            <nav class="bn-nav" id="nav">
              <button data-v="home" data-zone="home">🏠<small>Balances</small></button>
              <button data-v="pay" data-zone="pay">💸<small>Pay</small></button>
              <button data-v="alerts" data-zone="alerts">🔔<small>Alerts</small></button>
              <button data-v="loans" data-zone="loans">📄<small>Loans</small></button>
              <button data-v="help" data-zone="help">💬<small>Help</small></button>
              <button data-v="me" data-zone="me">👤<small>Profile</small></button>
            </nav>
          </div>
          <div class="sim-box bn-log"><h5 class="mw-h">📱 Text messages and emails from the bank</h5><ul id="log"><li class="note">Nothing yet.</li></ul></div>
        </div>
        <div data-panel="vle" class="vle" hidden>
          <div class="win"><div class="win-bar">🎓 BS Online Academy · Virtual learning environment</div>
            <div class="win-body">
              <div class="seg" id="vtab"><button data-v="lib" data-zone="lib">📚 Library</button><button data-v="sup" data-zone="sup">💬 Online support</button><button data-v="ass" data-zone="ass">📝 Assessment</button></div>
              <div id="vbody"></div>
            </div>
          </div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.bn-s'), $ = (s) => root.querySelector(s);
    let acc, alertAt, view, log, addr, loan, vt, posts, answers, dead = false, nt = null;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const gbp = (n) => '£' + n.toFixed(2);
    const show = FD.panels(root, (p) => { FD.focus(root); if (p === 'vle') drawVle(); });

    function notify(kind, text) {
      log.unshift({ kind, text, t: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) });
      $('#log').innerHTML = log.map((l) => `<li><span>${l.kind === 'sms' ? '💬 Text' : '📧 Email'}</span><small>${l.t}</small><p>${l.text}</p></li>`).join('');
      const n = $('#notif'); n.hidden = false; n.innerHTML = `<b>BS Bank</b> ${l0(text)}`;
      FD.pulse(n); clearTimeout(nt); nt = setTimeout(() => { if (!dead) n.hidden = true; }, FD.dur(3500));
    }
    const l0 = (t) => t.length > 70 ? t.slice(0, 68) + '…' : t;
    function checkAlert() {
      if (alertAt != null && acc.cur.bal < alertAt && !acc.cur.warned) { acc.cur.warned = true; notify('sms', `Balance alert: your current account balance is ${gbp(acc.cur.bal)}, below ${gbp(alertAt)}.`); }
      if (alertAt != null && acc.cur.bal >= alertAt) acc.cur.warned = false;
    }
    function draw() {
      root.querySelectorAll('#nav [data-v]').forEach((b) => b.classList.toggle('on', b.dataset.v === view));
      const s = $('#scr');
      if (view === 'home') {
        s.innerHTML = `<p class="kick">Your balances</p>${Object.values(acc).map((a) => `<div class="bn-acc"><span>${a.e} ${a.n}</span><b class="${a.bal < 0 ? 'bad-t' : ''}">${gbp(a.bal)}</b></div>`).join('')}
          <p class="kick">Recent</p><ul class="bn-tx">${acc.cur.tx.slice(0, 4).map((t) => `<li><span>${t[0]}</span><b class="${t[1] < 0 ? '' : 'good-t'}">${t[1] < 0 ? '−' : '+'}${gbp(Math.abs(t[1]))}</b></li>`).join('')}</ul>`;
      } else if (view === 'pay') {
        s.innerHTML = `<p class="kick">Payments and transfers</p>
          <button class="bn-row" data-act="rent">🏠 Pay rent to J. Smith · ${gbp(450)}</button>
          <button class="bn-row" data-act="phone">📱 Pay phone bill · ${gbp(25)}</button>
          <button class="bn-row" data-act="save">🐷 Transfer ${gbp(100)} to savings</button>
          <button class="bn-row" data-act="back">↩️ Transfer ${gbp(200)} back from savings</button>`;
      } else if (view === 'alerts') {
        s.innerHTML = `<p class="kick">Alerts and notifications</p>
          <label class="small">Text me when my current account balance goes below<span class="bn-in">£<input type="number" id="thr" min="0" step="50" value="${alertAt ?? 100}"></span></label>
          <div class="chk-btns"><button class="btn primary" id="setA">${alertAt != null ? 'Update alert' : 'Set balance alert'}</button>${alertAt != null ? '<button class="btn ghost" id="offA">Turn off</button>' : ''}</div>
          <p class="small">${alertAt != null ? `<span class="good-t">✓ Balance alert on: below ${gbp(alertAt)}</span>` : 'No balance alert set.'}</p>
          <label class="tgl small"><input type="checkbox" id="payN" checked> Email me about every payment</label>`;
      } else if (view === 'loans') {
        s.innerHTML = `<p class="kick">Loans and other financial products</p>
          <label class="small">Amount <b id="lv">${gbp(loan.amt)}</b><input type="range" id="la" min="500" max="5000" step="250" value="${loan.amt}"></label>
          <label class="small">Pay back over <b id="lm">${loan.m} months</b><input type="range" id="lmo" min="6" max="36" step="6" value="${loan.m}"></label>
          <p class="bn-acc"><span>Monthly payment (6% a year)</span><b id="lp"></b></p>
          <button class="btn primary" id="apply">${loan.sent ? '✓ Application sent' : 'Apply for this loan'}</button>
          <p class="small muted">Also: savings accounts, credit cards, insurance.</p>`;
        const calc = () => { const r = 0.06 / 12, n = loan.m; $('#lp').textContent = gbp(loan.amt * r / (1 - Math.pow(1 + r, -n))); };
        calc();
        s.querySelector('#la').addEventListener('input', (e) => { loan.amt = +e.target.value; s.querySelector('#lv').textContent = gbp(loan.amt); calc(); });
        s.querySelector('#lmo').addEventListener('input', (e) => { loan.m = +e.target.value; s.querySelector('#lm').textContent = loan.m + ' months'; calc(); });
      } else if (view === 'help') {
        s.innerHTML = `<p class="kick">Customer service and help</p><div class="bn-chat" id="chat">
          <p class="bn-b">Hi Alex, I’m the BS Bank assistant. What do you need help with?</p></div>
          <div class="chips"><button class="mini-btn" data-help="card">I lost my card</button><button class="mini-btn" data-help="fee">What is this fee?</button></div>`;
      } else {
        s.innerHTML = `<p class="kick">Change personal information</p>
          <label class="small">Address<input type="text" id="addr" value="${FD.esc(addr)}"></label>
          <label class="small">Mobile<input type="text" value="07700 900123" readonly></label>
          <button class="btn primary" id="saveMe">Save changes</button>`;
      }
    }
    function go(v) { view = v; draw(); FD.focus(root, v); }
    function move(kind) {
      const c = acc.cur, sv = acc.sav;
      const M = { rent: ['Rent · J. Smith', -450], phone: ['Phone bill', -25], save: ['To savings', -100], back: ['From savings', 200] };
      const [what, v] = M[kind];
      c.bal += v; c.tx.unshift([what, v]);
      if (kind === 'save') sv.bal += 100; if (kind === 'back') sv.bal -= 200;
      notify('email', `Payment ${v < 0 ? 'out' : 'in'}: ${what}, ${gbp(Math.abs(v))}. New balance ${gbp(c.bal)}.`);
      checkAlert(); draw();
      say(`✓ ${kind === 'save' || kind === 'back' ? 'Transfer' : 'Payment'} made online, without travelling to the bank.`, 'good');
    }
    function setAlert(v) { alertAt = v; acc.cur.warned = false; go('alerts'); say(`✓ <b>Balance alert</b> set: the bank will text Alex automatically when the balance goes below ${gbp(v)}.`, 'good'); checkAlert(); }
    function apply() { loan.sent = true; draw(); notify('email', `We have received your application for a ${gbp(loan.amt)} loan. We will reply within 24 hours.`); say('✓ Customers can <b>apply for loans</b> and other financial products online.', 'good'); }
    function ask(q) {
      const chat = $('#chat'); if (!chat) return;
      const Q = { card: ['I lost my card', 'I have frozen your card and a new one will arrive in 3–5 days.'], fee: ['What is this fee?', 'That is the monthly fee for your account. You can find all our fees in Help › Fees.'] }[q];
      chat.insertAdjacentHTML('beforeend', `<p class="bn-u">${Q[0]}</p><p class="bn-b">${Q[1]}</p>`);
    }
    function saveMe(v) { addr = v ?? ($('#addr') ? $('#addr').value : addr); draw(); notify('email', 'Your personal information was changed. If this was not you, call us now.'); say('✓ Personal information changed online.', 'good'); }

    root.addEventListener('click', (e) => {
      const n = e.target.closest('#nav [data-v]'), a = e.target.closest('[data-act]'), q = e.target.closest('[data-help]'), t = e.target.closest('#vtab [data-v]');
      if (n) go(n.dataset.v); else if (a) move(a.dataset.act); else if (q) ask(q.dataset.help);
      else if (e.target.closest('#setA')) setAlert(Math.max(0, +$('#thr').value || 0));
      else if (e.target.closest('#offA')) { alertAt = null; draw(); }
      else if (e.target.closest('#apply')) apply();
      else if (e.target.closest('#saveMe')) saveMe();
      else if (t) vtab(t.dataset.v);
      else if (e.target.closest('#post')) post();
      else if (e.target.closest('#sub')) submit();
      else { const o = e.target.closest('[data-ans]'); if (o) { answers[o.dataset.q] = +o.dataset.ans; drawVle(); } }
    });

    // ---------- VLE ----------
    const JOURNALS = [['IT Today', 'Cloud computing in schools', '2025'], ['Computing Review', 'How online banking keeps data secure', '2024'], ['Journal of Digital Life', 'Online shopping and young people', '2025'], ['Encyclopaedia of ICT', 'Reference: cookies', 'archive']];
    const QZ = [['A VLE is…', ['a virtual learning environment', 'a video loading engine', 'a very large email'], 0], ['Which is an assessment material?', ['an online quiz', 'a balance alert', 'a voucher code'], 0]];
    function vtab(v) { vt = v; drawVle(); FD.focus(root, v); }
    function drawVle() {
      FD.segSet($('#vtab'), vt);
      const b = $('#vbody');
      if (vt === 'lib') b.innerHTML = `<p class="small">Libraries of <b>online journals</b> and <b>reference archives</b>:</p><input type="text" id="jq" placeholder="Search the library…" aria-label="Search the library"><ul class="vle-lib" id="jl"></ul>`;
      else if (vt === 'sup') b.innerHTML = `<p class="small"><b>Online support</b> from teachers and other learners:</p><ul class="vle-forum">${posts.map((p) => `<li><span class="av" style="--av:${p[2]}">${p[0].split(' ').map((w) => w[0]).join('')}</span><div><b>${p[0]}</b><p>${p[1]}</p></div></li>`).join('')}</ul><div class="ck-v"><input type="text" id="pq" placeholder="Ask a question…" aria-label="Ask a question"><button class="mini-btn" id="post">Post</button></div>`;
      else b.innerHTML = `<p class="small"><b>Learning and assessment materials</b>: an online quiz, marked automatically.</p>${QZ.map(([q, o], i) => `<div class="vle-q"><b>${i + 1}. ${q}</b><div class="chips">${o.map((t, k) => `<button class="mini-btn ${answers[i] === k ? 'ok' : ''}" data-q="${i}" data-ans="${k}">${t}</button>`).join('')}</div></div>`).join('')}<button class="btn primary" id="sub">Submit to my teacher</button><p class="small" id="vres"></p>`;
      const jq = b.querySelector('#jq');
      if (jq) { const f = () => { const s = jq.value.toLowerCase(); b.querySelector('#jl').innerHTML = JOURNALS.filter((j) => j.join(' ').toLowerCase().includes(s)).map((j) => `<li>📄 <b>${j[1]}</b><small>${j[0]} · ${j[2]}</small></li>`).join('') || '<li class="note">Nothing found.</li>'; }; jq.addEventListener('input', f); f(); }
    }
    function post(text) {
      const q = text || ($('#pq') && $('#pq').value.trim()) || 'Can someone explain what a balance alert is?';
      posts.push(['Alex Pérez', q, '#1c7ed6']); drawVle();
      setTimeout(() => { if (dead || vt !== 'sup') return; posts.push(['Ms Navarro (teacher)', 'Good question! It is a text or email the bank sends when your balance reaches an amount you choose.', '#2f9e44']); drawVle(); }, FD.dur(1200));
    }
    function submit() { const got = QZ.reduce((s, q, i) => s + (answers[i] === q[2]), 0); const r = $('#vres'); if (r) r.innerHTML = `<span class="good-t">✓ Submitted. Marked automatically: ${got}/${QZ.length}. Your teacher can see your result.</span>`; }

    function reset() {
      acc = { cur: { e: '💳', n: 'Current account', bal: 620, tx: [['Salary', 900], ['Supermarket', -64.2], ['Bus pass', -30]], warned: false }, sav: { e: '🐷', n: 'Savings account', bal: 1500, tx: [] } };
      alertAt = null; view = 'home'; log = []; addr = '12 High Street, Alzira'; loan = { amt: 2000, m: 12, sent: false };
      vt = 'lib'; answers = {}; posts = [['Sam Lee', 'Does anyone have notes on hosted applications?', '#e8590c'], ['Ms Navarro (teacher)', 'Yes, Sam: they are in Library › Week 3.', '#2f9e44']];
      $('#log').innerHTML = '<li class="note">Nothing yet.</li>'; $('#notif').hidden = true;
      show('bank'); draw(); say('');
    }
    reset();
    return {
      reset, go, move, setAlert, apply, ask, saveMe, vtab, post, submit, show,
      focus: (z) => FD.focus(root, z),
      answer: (i, k) => { answers[i] = k; drawVle(); },
      search: (s) => { const jq = $('#jq'); if (jq) { jq.value = s; jq.dispatchEvent(new Event('input')); } },
      destroy() { dead = true; clearTimeout(nt); },
    };
  },
  steps: [
    {
      title: 'Online banking',
      text: `<p>Banks offer their customers many online services, including <b>checking balances</b>: the <b>balance</b> is the amount of money in a bank account.</p>`,
      tip: 'Try it: use the buttons at the bottom of the banking app.',
      async on(a) { a.reset(); a.go('home'); },
    },
    {
      title: 'Payments and transfers',
      text: `<p>Customers can make <b>payments</b> to other people and <b>transfers</b> between their own accounts, and manage alerts and notifications of payments.</p>`,
      tip: 'Try it: pay the phone bill and move money to savings.',
      async on(a, ctx) { a.reset(); a.go('pay'); if (!(await ctx.sleep(1000))) return; a.move('phone'); if (!(await ctx.sleep(1500))) return; a.move('save'); },
    },
    {
      title: 'Balance alerts',
      text: `<p>A <strong>balance alert</strong> is a service that <b>automatically</b> informs a customer, by <b>text message or email</b>, when the balance of their account reaches a <b>specified amount</b>.</p>`,
      tip: 'Try it: set an alert at £200, then pay the rent.',
      async on(a, ctx) { a.reset(); a.go('alerts'); if (!(await ctx.sleep(1200))) return; a.setAlert(200); if (!(await ctx.sleep(1400))) return; a.go('pay'); if (!(await ctx.sleep(900))) return; a.move('rent'); },
    },
    {
      title: 'Loans, help and personal information',
      text: `<p>Customers can also:</p><ul><li><b>apply for loans</b> and other financial products</li><li>access <b>customer service</b> and help systems</li><li><b>change personal information</b>, such as their address.</li></ul>`,
      async on(a, ctx) { a.reset(); a.go('loans'); if (!(await ctx.sleep(1500))) return; a.apply(); if (!(await ctx.sleep(1600))) return; a.go('help'); a.ask('card'); if (!(await ctx.sleep(1800))) return; a.go('me'); a.saveMe('8 Plaza Mayor, Xàtiva'); },
    },
    {
      title: 'Education and training providers',
      text: `<p>Online training courses allow learners to access:</p><ul><li>libraries of <b>online journals</b> and <b>reference archives</b></li><li><b>online support</b> from teachers and other learners</li><li>learning and <b>assessment</b> materials.</li></ul>
             <p>Learners can use these services from home or anywhere else, at any time: this is <b>remote access</b> to the provider’s systems.</p>
             <p>This access is provided through <b>virtual learning environments (VLEs)</b>. See <i>Unit 3 Operating online</i> (page 139).</p>`,
      tip: 'Try it: search the library, post a question and do the quiz.',
      async on(a, ctx) {
        a.reset(); a.show('vle'); a.vtab('lib'); if (!(await ctx.sleep(900))) return; a.search('cloud');
        if (!(await ctx.sleep(1500))) return; a.vtab('sup'); a.post('How do I open the Week 3 notes?');
        if (!(await ctx.sleep(2400))) return; a.vtab('ass'); a.answer(0, 0); if (!(await ctx.sleep(700))) return; a.answer(1, 0); a.submit();
      },
    },
  ],
});

FD.check({
  section: 'banks',
  items: [
    { type: 'mcq', q: 'Which <b>one</b> of these is <b>not</b> provided by banks as an online service? <small>(Chapter question 1)</small>', opts: ['Paying in cheques', 'Transferring money', 'Viewing an account’s balance', 'Applying for a loan'], why: 'Banks offer balances, alerts, payments and transfers, loans, customer service and changing personal information.' },
    { type: 'mcq', q: 'What is a <b>balance alert</b>?', opts: ['A text or email sent automatically when the balance reaches a specified amount', 'A warning that the website is not secure', 'A loan from the bank', 'A list of recent payments'], why: 'The customer chooses the amount.' },
    { type: 'multi', q: 'State <b>two</b> ways in which education providers can use online services to help learners. <small>(Chapter question 2)</small>', need: 2, opts: [['Libraries of online journals and reference archives', true], ['Online support from teachers and other learners', true], ['Balance alerts', false], ['Voucher codes', false]], why: 'Also learning and assessment materials, through a VLE.' },
    { type: 'tf', q: 'Online courses give access to learning materials through a virtual learning environment (VLE).', a: true, why: 'See Unit 3 Operating online, page 139.' },
  ],
});
