FD.add({
  id: 'lifestyle',
  title: 'The impact on lifestyle and behaviour',
  tab: 'Lifestyle',
  icon: 'lifestyle',
  color: '--c6',
  section: true,
  interactive: true,
  vocab: [
    ['Reroute', 'To send something such as a vehicle to its original destination using a different route.'],
  ],
  mount(el) {
    const SV = [
      { id: 'groc', e: '🛒', n: 'Grocery shopping', off: [['Travel to the supermarket', 40], ['Walk round the sections to check stock', 30], ['Queue to pay', 15]], on: [['Reorder last week’s products', 10]],
        b: ['easily reorder the same products as last time, which saves time', 'avoid having to travel to the supermarket', 'check whether items are in stock without walking round all the product sections', 'avoid having to wait in queues to pay'] },
      { id: 'rail', e: '🚆', n: 'Rail travel', off: [['Go to the station to buy a ticket', 30], ['Queue at the ticket office', 15], ['Arrive early in case of queues', 20]], on: [['Buy in advance, arrive a few minutes before', 5]],
        b: ['avoid having to go to the station to buy a ticket', 'avoid having to queue, saving time', 'buy tickets in advance, so they only need to arrive a few minutes before the train leaves', 'be notified if there is a delay, using live travel information apps'] },
      { id: 'bank', e: '🏦', n: 'Banking', off: [['Travel to the bank to check balances and transfer funds', 45]], on: [['Check and transfer in the app', 3]],
        b: ['avoid travelling to the bank to check balances and transfer funds between accounts', 'avoid carrying cash, which is safer for the individual'] },
      { id: 'learn', e: '🎓', n: 'Learning', off: [['Travel to college and back', 300]], on: [['Log in to the online course', 0]],
        b: ['avoid having to travel to colleges or universities', 'avoid having to move closer to colleges or universities, so they do not have to move away from family and friends'] },
      { id: 'info', e: '🗺️', n: 'Information providers', off: [['Stuck in traffic you did not know about', 25]], on: [['Rerouted automatically', 5]],
        b: ['receive weather alerts or traffic advice while travelling', 'be <b>rerouted</b> automatically based on information about traffic conditions ahead'] },
    ];
    const DRAW = [
      ['⏳', 'Less patient', 'The immediate availability of online services could make people less patient and more demanding of others.'],
      ['🏝️', 'More isolated', 'People become more isolated as individuals and detached from their real-world communities, which could make us more detached from the needs of others.'],
      ['🗣️', 'Fewer face-to-face skills', 'Some people constantly check their online communications, such as social networking sites, so they spend less time with people face-to-face, which reduces their face-to-face communication skills.'],
      ['🧠', 'Memory', 'There is less need to memorise facts, so there is a negative impact on memory.'],
      ['👀', 'Skim-reading', 'People are becoming accustomed to skim-reading online information, which makes them less likely to pay attention to details.'],
    ];
    const T = [
      ['More time can be spent with family and friends', 'More time is spent using online services'],
      ['Safer lifestyle as there is no need to carry cash, which might put individuals at risk', 'Individuals can be inconvenienced if no connectivity is available'],
      ['Individuals are more engaged with creative media like art, photography, videos and drama', 'Individuals may become less active because they can access services without having to move'],
    ];
    el.innerHTML = `
      <div class="sim lf-s">
        <div class="ptabs" role="group" aria-label="Simulations"><button data-p="time">⏱️ My week: offline or online?</button><button data-p="draw">⚠️ Drawbacks</button><button data-p="table">📋 Table 11.1</button></div>
        <div data-panel="time" class="lf-time">
          <ul class="lf-sv" id="sv"></ul>
          <div class="sim-box lf-sum" data-zone="free"><div class="lf-clock"><b id="saved">0 min</b><small>saved this week</small></div><p id="freeTxt" class="small"></p><ul class="lf-ben" id="ben"></ul></div>
        </div>
        <div data-panel="draw" class="lf-draw" hidden>
          <p class="small">Some people argue that, although people spend more time at home with their families, they spend that time using online services such as gaming and social networking sites. The negative impact on human behaviour is largely <b>unknown</b>, because online services have not been around long enough. Click each card.</p>
          <div class="lf-cards">${DRAW.map((d, i) => `<button class="lf-card" data-d="${i}" data-zone="d${i}"><span>${d[0]}</span><b>${d[1]}</b><small>${d[2]}</small></button>`).join('')}</div>
          <div class="sim-box lf-net" data-zone="net"><label class="tgl"><input type="checkbox" id="noNet"> 📵 No connectivity available</label><div class="chips" id="netSv"></div></div>
        </div>
        <div data-panel="table" class="lf-table" hidden>
          <div class="tbl-wrap"><table class="tbl lf-t"><caption class="small">Table 11.1 The benefits and drawbacks of online services on individuals’ lifestyle and behaviour</caption>
            <thead><tr><th>Benefits</th><th>Drawbacks</th></tr></thead>
            <tbody>${T.map((r, i) => `<tr data-row="${i}"><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div>
          <button class="btn" id="nextRow">Show the next row ▶</button>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.lf-s'), $ = (s) => root.querySelector(s);
    let online, cur, rows, dead = false;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}` : m + ' min').trim();
    const show = FD.panels(root, () => FD.focus(root));
    const sum = (a) => a.reduce((s, x) => s + x[1], 0);

    function draw() {
      const max = Math.max(...SV.map((s) => sum(s.off)));
      $('#sv').innerHTML = SV.map((s) => {
        const on = online[s.id], parts = on ? s.on : s.off, tot = sum(parts);
        return `<li class="${cur === s.id ? 'cur' : ''}" data-zone="${s.id}"><button class="lf-tg ${on ? 'on' : ''}" data-s="${s.id}" aria-pressed="${on}">${s.e} <b>${s.n}</b><small>${on ? '🌐 Online' : '🚶 In person'}</small></button>
          <div class="lf-bar" title="${mins(tot)}">${parts.map((p) => `<i class="${on ? 'on' : ''}" style="width:${(100 * p[1] / max).toFixed(1)}%" title="${p[0]}: ${p[1]} min"></i>`).join('')}<span>${mins(tot)}</span></div>
          <small class="lf-why">${parts.map((p) => p[0]).join(' · ')}</small></li>`;
      }).join('');
      const saved = SV.reduce((t, s) => t + (online[s.id] ? sum(s.off) - sum(s.on) : 0), 0);
      $('#saved').textContent = mins(saved);
      $('#freeTxt').innerHTML = saved ? `That is <b>${mins(saved)}</b> of free time for important things, such as spending time with family, socialising with friends or working. The writer Clay Shirky argues that this build-up of free time is a <b>new resource</b> that can be used productively for activities people care about.` : 'Switch services to online to see how much time is saved.';
      const s = SV.find((x) => x.id === cur);
      $('#ben').innerHTML = s && online[s.id] ? `<li class="kick">${s.e} Online ${s.n.toLowerCase()} allows people to:</li>${s.b.map((b) => `<li>${b}</li>`).join('')}` : '';
    }
    function toggle(id, v) { online[id] = v ?? !online[id]; cur = id; draw(); FD.focus(root, [id, 'free']); }
    function reveal(i) { const c = root.querySelector(`[data-d="${i}"]`); c.classList.add('open'); FD.focus(root, 'd' + i); }
    function noNet(on) {
      $('#noNet').checked = on;
      $('#netSv').innerHTML = SV.map((s) => `<span class="pill ${on ? 'bad-t' : 'good-t'}">${s.e} ${on ? '✗' : '✓'} ${s.n}</span>`).join('');
      if (on) say('Individuals can be <b>inconvenienced</b> if no connectivity is available: none of the online services work.', 'bad'); else say('');
    }
    function row(k) { rows = k ?? Math.min(T.length, rows + 1); root.querySelectorAll('[data-row]').forEach((r) => { r.hidden = +r.dataset.row >= rows; }); $('#nextRow').disabled = rows >= T.length; }

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-s]'), d = e.target.closest('[data-d]');
      if (t) toggle(t.dataset.s); else if (d) reveal(+d.dataset.d); else if (e.target.closest('#nextRow')) row();
    });
    $('#noNet').addEventListener('change', (e) => noNet(e.target.checked));
    function reset() { online = {}; cur = ''; rows = 0; root.querySelectorAll('.lf-card').forEach((c) => c.classList.remove('open')); noNet(false); row(0); draw(); say(''); show('time'); FD.focus(root); }
    reset();
    return {
      reset, toggle, reveal, noNet, row, show,
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; },
    };
  },
  steps: [
    {
      title: 'More free time',
      text: `<p>The online availability of goods and services has many beneficial impacts on people’s lifestyles and behaviour. However, it also has drawbacks.</p>
             <p>Access to online services gives people <b>more time</b> to do important things, such as spending time with family, socialising with friends or working.</p>`,
      tip: 'Try it: switch each service to online and watch the time saved.',
      async on(a, ctx) { a.reset(); for (const s of ['groc', 'rail', 'bank']) { if (!(await ctx.sleep(1000))) return; a.toggle(s, true); } },
    },
    {
      title: 'Shopping, travel and banking',
      text: `<p>Online <b>grocery shopping</b> lets customers reorder the same products, avoid travelling, check stock and avoid queues. Online <b>rail booking</b> avoids going to the station and queuing, and live apps notify delays. Online <b>banking</b> avoids travelling to the bank and <b>carrying cash</b>, which is safer.</p>`,
      tip: 'Click a service to read its benefits.',
      async on(a, ctx) { a.reset(); a.toggle('groc', true); if (!(await ctx.sleep(2200))) return; a.toggle('rail', true); if (!(await ctx.sleep(2200))) return; a.toggle('bank', true); },
    },
    {
      title: 'Learning and information on the move',
      text: `<p>Online <b>learning</b> services mean people avoid travelling to colleges or universities, and do not have to move away from their family and friends.</p>
             <p>Online <b>information providers</b> send weather alerts or traffic advice while people are travelling, and can <b>reroute</b> them automatically based on traffic conditions ahead.</p>`,
      async on(a, ctx) { a.reset(); a.toggle('learn', true); if (!(await ctx.sleep(2400))) return; a.toggle('info', true); },
    },
    {
      title: 'Drawbacks',
      text: `<p>The negative impact of online services on human behaviour is largely unknown. However, people should consider these potential negative impacts:</p>
             <ul><li>less patient and more demanding of others</li><li>more isolated and detached from real-world communities</li><li>reduced face-to-face communication skills</li><li>a negative impact on memory</li><li>skim-reading, so less attention to details.</li></ul>`,
      tip: 'Try it: click each card, then tick “No connectivity”.',
      async on(a, ctx) { a.reset(); a.show('draw'); for (let i = 0; i < 5; i++) { if (!(await ctx.sleep(1000))) return; a.reveal(i); } if (!(await ctx.sleep(1200))) return; a.focus('net'); a.noNet(true); },
    },
    {
      title: 'Benefits and drawbacks (Table 11.1)',
      text: `<p>Table 11.1 sets out the benefits and drawbacks of the online availability of goods and services. For more about the impact of the internet on individuals, see <i>Unit 3 Operating online</i> (pages 110–119).</p>`,
      tip: 'Press “Show the next row”.',
      async on(a, ctx) { a.reset(); a.show('table'); for (let i = 1; i <= 3; i++) { if (!(await ctx.sleep(1300))) return; a.row(i); } },
    },
  ],
});

FD.check({
  section: 'lifestyle',
  items: [
    { type: 'sort', q: 'Benefit or drawback of online services for individuals?', bins: ['Benefit', 'Drawback'], rows: [['More time can be spent with family and friends', 0], ['Inconvenienced if no connectivity is available', 1], ['Safer, as there is no need to carry cash', 0], ['May become less active', 1], ['More engaged with creative media', 0], ['Less likely to pay attention to details', 1]], why: 'See Table 11.1 and the list of potential negative impacts.' },
    { type: 'mcq', q: 'How does online rail booking save customers time?', opts: ['They can buy tickets in advance and only arrive a few minutes before the train leaves', 'The train goes faster', 'They do not need a ticket', 'The station is closer'], why: 'They also avoid going to the station and queuing.' },
    { type: 'mcq', q: 'Why is the negative impact of online services on behaviour largely unknown?', opts: ['Online services have not been around long enough to understand their full impact', 'Nobody uses online services', 'It is a secret', 'Online services have no drawbacks'], why: 'People should still consider the potential negative impacts.' },
    { type: 'tf', q: 'Online information providers can reroute travellers automatically based on traffic conditions ahead.', a: true, why: 'They can also send weather alerts or traffic advice.' },
  ],
});
