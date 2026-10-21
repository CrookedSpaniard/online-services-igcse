FD.add({
  id: 'booking',
  title: 'Booking systems',
  tab: 'Booking',
  icon: 'booking',
  color: '--c1',
  section: true,
  interactive: true,
  vocab: [
    ['E-ticket', 'An electronic version of a paper ticket.'],
  ],
  mount(el) {
    const TIMES = [
      { id: 't1', dep: '07:15', arr: '08:20', price: 49 },
      { id: 't2', dep: '12:40', arr: '13:45', price: 79 },
      { id: 't3', dep: '19:05', arr: '20:10', price: 59 },
    ];
    const TYPES = { adult: ['Adult', 1], child: ['Child (2–11)', 0.6], student: ['Student', 0.8] };
    const ROWS = 6, COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
    el.innerHTML = `
      <div class="sim bk-s">
        <div class="bk-grid">
          <div class="sim-box" data-zone="search">
            <h5 class="mw-h">✈️ Valencia → London · Fri 14/11</h5>
            <ul class="bk-times" id="times"></ul>
            <div class="bk-pax" data-zone="pax">
              ${Object.entries(TYPES).map(([k, [n]]) => `<label class="small">${n}<span class="bk-step"><button class="mini-btn" data-pax="${k}" data-d="-1">−</button><b id="n-${k}">0</b><button class="mini-btn" data-pax="${k}" data-d="1">+</button></span></label>`).join('')}
            </div>
          </div>
          <div class="sim-box" data-zone="seats">
            <h5 class="mw-h">💺 Choose your seats <small class="muted" id="free"></small></h5>
            <div class="bk-plane" id="plane"></div>
            <p class="small bk-key"><span class="bk-k"></span> free <span class="bk-k me"></span> yours <span class="bk-k held"></span> held by another customer <span class="bk-k sold"></span> sold</p>
          </div>
          <div class="sim-box" data-zone="basket">
            <h5 class="mw-h">🧺 Basket</h5>
            <ul class="bk-basket" id="basket"></ul>
            <div class="chk-btns"><button class="btn" id="addTrip">+ Add this trip</button><button class="btn ghost" id="addShow">🎭 + Theatre tickets</button></div>
            <label class="small bk-mail" data-zone="email">Email address <input type="text" id="mail" placeholder="you@mail.example"></label>
            <button class="btn primary" id="buy">Buy (pretend)</button>
          </div>
        </div>
        <div class="bk-out" id="out" hidden>
          <div class="bk-mailbox" data-zone="inbox"><h5 class="mw-h">📧 Inbox</h5><div id="inbox"></div></div>
          <div class="bk-phone" data-zone="eticket"><div class="bk-tk" id="ticket"></div></div>
          <div class="bk-gate" data-zone="gate"><h5 class="mw-h">🛂 Airport gate</h5><div class="bk-scan" id="scan"><span>Hold the QR code here</span></div><button class="btn" id="bScan">📷 Scan my e-ticket</button><p class="small" id="gateMsg"></p></div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.bk-s'), $ = (s) => root.querySelector(s);
    let sg = 0, otherOn = false, time = '', pax = { adult: 0, child: 0, student: 0 }, seats = {}, mine = [], basket = [], timers = [], dead = false, gen = 0;

    const need = () => pax.adult + pax.child + pax.student;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    function initSeats() {
      seats = {};
      const sold = ['1A', '1B', '1E', '2C', '2D', '3F', '4A', '4B', '4C', '5E', '5F', '6A', '6D'];
      for (let r = 1; r <= ROWS; r++) COLS.forEach((c) => { seats[r + c] = sold.includes(r + c) ? 'sold' : 'free'; });
    }
    function draw() {
      $('#times').innerHTML = TIMES.map((t) => `<li><button class="bk-time ${time === t.id ? 'on' : ''}" data-t="${t.id}"><b>${t.dep} → ${t.arr}</b><small>from £${t.price}</small></button></li>`).join('');
      Object.keys(pax).forEach((k) => { $('#n-' + k).textContent = pax[k]; });
      $('#plane').innerHTML = `<div class="bk-row bk-hd"><i></i>${COLS.map((c, i) => `${i === 3 ? '<i class="aisle"></i>' : ''}<i>${c}</i>`).join('')}</div>` +
        Array.from({ length: ROWS }, (_, r) => `<div class="bk-row"><i>${r + 1}</i>${COLS.map((c, i) => { const id = r + 1 + c, st = mine.includes(id) ? 'me' : seats[id]; return `${i === 3 ? '<i class="aisle"></i>' : ''}<button class="bk-seat ${st}" data-seat="${id}" aria-label="Seat ${id}: ${st === 'me' ? 'yours' : st}" ${time ? '' : 'disabled'}></button>`; }).join('')}</div>`).join('');
      const free = Object.values(seats).filter((s) => s === 'free').length;
      $('#free').textContent = time ? `${free} seats available` : '(choose a flight time first)';
      const t = TIMES.find((x) => x.id === time);
      $('#basket').innerHTML = basket.length ? basket.map((b, i) => `<li><span>${b.e}</span><div><b>${b.what}</b><small>${b.detail}</small></div><b>£${b.price.toFixed(2)}</b><button class="mini-btn" data-rm="${i}">✕</button></li>`).join('') + `<li class="bk-tot">Total <b>£${basket.reduce((s, b) => s + b.price, 0).toFixed(2)}</b></li>`
        : `<li class="note">${t && need() ? `${need()} ticket(s) at ${t.dep}${mine.length < need() ? ` · choose ${need() - mine.length} more seat(s)` : ' · seats chosen ✓'}` : 'Empty. Choose a time, the number and type of tickets, and your seats.'}</li>`;
    }
    function pick(t) { time = t; mine = []; initSeats(); draw(); say(`Flight at <b>${TIMES.find((x) => x.id === t).dep}</b> chosen. Customers can choose their travel times, the number of tickets and the type of tickets.`); }
    function setPax(k, d) { pax[k] = FD.clamp(pax[k] + d, 0, 4); if (mine.length > need()) mine = mine.slice(0, need()); draw(); }
    function seat(id) {
      if (!time) { say('Choose a flight time first.', 'bad'); return; }
      const st = seats[id];
      if (mine.includes(id)) { mine = mine.filter((x) => x !== id); seats[id] = 'free'; draw(); return; }
      if (st === 'sold' || st === 'held') { FD.shake(root.querySelector(`[data-seat="${id}"]`)); say(`Seat ${id} is ${st === 'sold' ? 'already sold' : 'being held for another customer'}. The system checks the seat is available <b>before</b> selling it, so it is never sold twice.`, 'bad'); return; }
      if (!need()) setPax('adult', 1);
      if (mine.length >= need()) { const old = mine.shift(); seats[old] = 'free'; }
      mine.push(id); seats[id] = 'held-me';
      draw(); say(`Seat <b>${id}</b> is held for you while you finish booking. Nobody else can choose it now.`, 'good');
    }
    function addTrip(ret) {
      if (!time) pick('t1');
      if (!need()) setPax('adult', 1);
      while (mine.length < need()) { const f = Object.keys(seats).find((k) => seats[k] === 'free'); if (!f) break; mine.push(f); seats[f] = 'held-me'; }
      const t = TIMES.find((x) => x.id === time);
      const price = Object.entries(pax).reduce((s, [k, n]) => s + n * t.price * TYPES[k][1], 0);
      const kinds = Object.entries(pax).filter(([, n]) => n).map(([k, n]) => `${n} ${TYPES[k][0].split(' ')[0].toLowerCase()}`).join(', ');
      basket.push({ e: '✈️', what: ret ? `London → Valencia ${t.dep}` : `Valencia → London ${t.dep}`, detail: `${kinds} · seats ${mine.join(', ')}`, price, seats: [...mine] });
      mine.forEach((s) => { seats[s] = 'sold'; }); mine = [];
      draw(); FD.pulse($('#basket'));
      say(basket.length > 1 ? 'Tickets for <b>more than one trip</b> can be added to the basket and paid for together.' : 'The trip is in the basket.');
    }
    function addShow() { basket.push({ e: '🎭', what: 'Theatre · The Lion King', detail: 'Sat 15/11, 19:30 · 2 seats', price: 96 }); draw(); FD.pulse($('#basket')); say('Tickets for <b>leisure and entertainment</b> can be bought online in the same way.'); }
    function other() {
      // Another customer is booking at the same time: seats become held, then sold.
      if (otherOn) return;
      otherOn = true;
      const g = gen;
      const tick = () => {
        if (dead || g !== gen || !time) return;
        const free = Object.keys(seats).filter((k) => seats[k] === 'free');
        const held = Object.keys(seats).filter((k) => seats[k] === 'held');
        held.forEach((k) => { seats[k] = 'sold'; });
        if (free.length > 8) seats[free[Math.floor(Math.random() * free.length)]] = 'held';
        draw();
        timers.push(setTimeout(tick, FD.dur(2600)));
      };
      timers.push(setTimeout(tick, FD.dur(1500)));
    }
    async function buy() {
      if (!basket.length) addTrip();
      const mail = $('#mail').value.trim() || 'alex.p@mail.example';
      $('#mail').value = mail;
      $('#out').hidden = false;
      const fl = basket.find((b) => b.e === '✈️');
      const ref = 'BSX' + (100 + Math.floor(Math.random() * 899));
      const qrText = `BOARDING ${ref} PEREZ/ALEX ${fl ? fl.seats[0] : '3C'} VLC-LHR PASSPORT ****42`;
      $('#inbox').innerHTML = `<div class="bk-email"><b>BS Air</b> <small>to ${FD.esc(mail)}</small><p>Your booking <b>${ref}</b> is confirmed. Your e-tickets are attached and linked to passport ****42.</p><small>📎 e-ticket.pdf</small></div>`;
      $('#ticket').innerHTML = `<p class="bk-air">BS Air · e-ticket</p><b>ALEX PÉREZ</b><small>VLC → LHR · Fri 14/11 · Seat ${fl ? fl.seats[0] : '3C'}</small><small>Passport ****42</small>${FD.qrSvg(qrText, 'bk-qr')}<small class="mono">${ref}</small>`;
      $('#gateMsg').textContent = '';
      $('#scan').className = 'bk-scan';
      FD.focus(root, ['inbox', 'eticket']);
      say('The tickets are <b>sent by email</b>, so customers register an email address when they buy. This <b>e-ticket</b> is linked to the passport, so the customer can check in.', 'good');
      return ref;
    }
    async function scan() {
      if ($('#out').hidden) await buy();
      const g = ++sg;
      FD.focus(root, ['eticket', 'gate']);
      $('#scan').className = 'bk-scan reading';
      await FD.wait(1300); if (dead || g !== sg) return;
      $('#scan').className = 'bk-scan ok';
      $('#gateMsg').innerHTML = '<span class="good-t">✓ QR code read: passenger and passport match. Have a good flight!</span>';
      FD.beep(1320, 120, 'sine');
      say('Some airlines and train companies use <b>QR codes</b> (matrix codes) that can be <b>scanned</b> at airports or on trains. Point a phone camera at the code: it is real.', 'good');
    }
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]'), p = e.target.closest('[data-pax]'), s = e.target.closest('[data-seat]'), r = e.target.closest('[data-rm]');
      if (t) { pick(t.dataset.t); other(); } else if (p) setPax(p.dataset.pax, +p.dataset.d); else if (s) seat(s.dataset.seat);
      else if (r) { basket.splice(+r.dataset.rm, 1); draw(); }
      else if (e.target.closest('#addTrip')) addTrip(basket.some((b) => b.e === '✈️'));
      else if (e.target.closest('#addShow')) addShow();
      else if (e.target.closest('#buy')) buy();
      else if (e.target.closest('#bScan')) scan();
    });
    function stop() { gen++; sg++; otherOn = false; timers.forEach(clearTimeout); timers = []; }
    function reset() { stop(); time = ''; pax = { adult: 0, child: 0, student: 0 }; mine = []; basket = []; initSeats(); $('#out').hidden = true; $('#mail').value = ''; FD.focus(root); say(''); draw(); }
    reset();
    return {
      reset, pick, setPax, seat, addTrip, addShow, buy, scan, other,
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; stop(); },
    };
  },
  steps: [
    {
      title: 'Buying tickets online',
      text: `<p>Train tickets, airline tickets and bus tickets can all be purchased online. Customers can choose their <b>travel times</b>, the <b>number of tickets</b> and the <b>type of tickets</b> that they wish to buy.</p>`,
      tip: 'Try it: choose a time, then 2 adults and 1 child.',
      async on(a, ctx) {
        a.reset(); a.focus('search');
        if (!(await ctx.sleep(800))) return; a.pick('t2');
        for (const k of ['adult', 'adult', 'child']) { if (!(await ctx.sleep(600))) return; a.setPax(k, 1); }
      },
    },
    {
      title: 'Choosing specific seats',
      text: `<p>Some systems let you <b>choose specific seats</b> (Figure 11.3). A seat that has already been sold cannot be chosen again.</p>`,
      tip: 'Try it: click free seats. Then click a grey or orange seat. Watch another customer booking at the same time.',
      async on(a, ctx) {
        a.reset(); a.focus('seats'); a.pick('t3'); a.setPax('adult', 2); a.other();
        for (const s of ['3B', '3C', '2C']) { if (!(await ctx.sleep(1100))) return; a.seat(s); }
      },
    },
    {
      title: 'More than one trip in the basket',
      text: `<p>These tickets can also be added to a <b>basket</b> if the customer is buying tickets for more than one trip. Tickets for <b>leisure and entertainment</b> can also be purchased online in this way.</p>`,
      tip: 'Try it: add the outbound trip, change the time, add the return trip, then add theatre tickets.',
      async on(a, ctx) {
        a.reset(); a.focus('basket'); a.pick('t1'); a.setPax('adult', 1); a.seat('3C');
        if (!(await ctx.sleep(900))) return; a.addTrip(false);
        if (!(await ctx.sleep(1200))) return; a.pick('t3'); a.addTrip(true);
        if (!(await ctx.sleep(1200))) return; a.addShow();
      },
    },
    {
      title: 'Email and e-tickets',
      text: `<p>When customers buy tickets using an online booking system, the tickets are often <b>sent via email</b>, so customers need to register an email address with the service when making purchases.</p>
             <p>For some types of travel, companies use <strong>e-tickets</strong> that are linked to the customer’s <b>passport</b> so that the customer can check in.</p>`,
      async on(a, ctx) { a.reset(); a.pick('t2'); a.setPax('adult', 1); a.seat('3C'); a.addTrip(false); if (!(await ctx.sleep(900))) return; a.focus('email'); if (!(await ctx.sleep(900))) return; await a.buy(); },
    },
    {
      title: 'QR codes on a smartphone',
      text: `<p>Travel documents can be loaded onto a smartphone, often using an app (Figure 11.2). Some airlines and train companies use <b>QR codes</b> (matrix codes) that can be <b>scanned</b> at airports or on trains.</p>`,
      tip: 'Try it: press “Scan my e-ticket”.',
      async on(a, ctx) { a.reset(); a.pick('t2'); a.setPax('adult', 1); a.seat('3C'); a.addTrip(false); await a.buy(); if (!(await ctx.sleep(1500))) return; await a.scan(); },
    },
  ],
});

FD.activities({
  section: 'booking',
  items: [
    {
      id: 'booking-flights',
      title: 'Booking flights online',
      task: '<p>How does a flight booking system automatically manage the need to only sell tickets to customers if a flight has seats available? Discuss your thoughts with your teacher and the rest of your group, then write your answer.</p>',
      lines: 6,
      hint: 'Think about what the seat map showed: what is checked before a seat is sold, what happens while you are still booking, and what happens when two customers want the same seat.',
      sim: ['booking', 'Look at the seat map again'],
    },
  ],
});

FD.check({
  section: 'booking',
  items: [
    { type: 'mcq', q: 'What is an <b>e-ticket</b>?', opts: ['An electronic version of a paper ticket', 'A ticket that can only be bought at the station', 'An email address', 'A type of voucher code'], why: 'Some e-tickets are linked to the customer’s passport so they can check in.' },
    { type: 'mcq', q: 'Why do customers need to register an email address when they book tickets online?', opts: ['The tickets are often sent via email', 'To choose their seat', 'To get a discount', 'So the train is not delayed'], why: 'Tickets are sent to the email address.' },
    { type: 'multi', q: 'Which of these can customers choose when they buy travel tickets online? Choose <b>three</b>.', need: 3, opts: [['Travel times', true], ['The number of tickets', true], ['The type of tickets', true], ['The pilot', false], ['The price of the fuel', false]], why: 'Some systems also let you choose specific seats.' },
    { type: 'tf', q: 'Some airlines and train companies use QR codes that can be scanned at airports or on trains.', a: true, why: 'QR codes are matrix codes, often shown in an app on a smartphone.' },
  ],
});
