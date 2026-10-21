FD.add({
  id: 'impact',
  title: 'The impact of the cloud',
  tab: 'Cloud impact',
  icon: 'impact',
  color: '--c7',
  section: true,
  interactive: true,
  vocab: [
    ['Cloud', 'A term used to describe the internet when it is used to provide software or space for storing information, rather than relying on local storage.'],
    ['Netbook', 'A computer that does not have lots of storage or fast processors.'],
    ['Massive online open course (MOOC)', 'An online course open to very large numbers of learners.'],
  ],
  mount(el) {
    const DEMAND = [2, 1, 1, 1, 1, 2, 3, 5, 7, 8, 8, 9, 10, 9, 8, 8, 9, 11, 14, 16, 15, 11, 6, 3];
    const FAM = Array.from({ length: 24 }, (_, i) => [180, 950, 320, 1200, 240, 600, 150, 820, 400, 270, 1500, 210, 700, 330, 260, 900, 190, 450, 230, 1100, 350, 280, 620, 205][i]);
    el.innerHTML = `
      <div class="sim im-s">
        <div class="ptabs" role="group" aria-label="Simulations"><button data-p="dev">🧑‍💻 Software developers</button><button data-p="cheap">💻 Cheaper devices</button><button data-p="org">🏢 Organisations</button><button data-p="ind">🙋 Individuals</button></div>
        <div data-panel="dev" class="im-dev">
          <div class="im-vs">
            <div class="sim-box" data-zone="local"><h5 class="mw-h">💿 PhotoPro (locally installed)</h5><ul class="im-feat" id="lf"></ul></div>
            <div class="sim-box" data-zone="hostedc"><h5 class="mw-h">🌐 Free hosted photo editors</h5><ul class="im-feat"><li>✓ Crop and resize</li><li>✓ Filters</li><li>✓ Works in any browser</li><li>✓ Free</li></ul></div>
          </div>
          <button class="btn primary" id="respond">PhotoPro responds to the competition ▶</button>
        </div>
        <div data-panel="cheap" class="im-cheap" hidden>
          <div class="seg" id="devs"><button data-v="laptop">💻 Powerful laptop · £800</button><button data-v="chrome">💻 Chromebook / netbook · £200</button></div>
          <div class="im-spec" id="spec" data-zone="spec"></div>
          <div class="sim-box" data-zone="town"><h5 class="mw-h">🏘️ 24 families: who can afford one? <small class="muted">(each family’s budget for a computer)</small></h5><div class="im-town" id="town"></div><p class="small" id="tmsg"></p></div>
        </div>
        <div data-panel="org" class="im-org" hidden>
          <div class="seg" id="srv"><button data-v="own">🏢 Own servers (6)</button><button data-v="cloud">☁️ Cloud-based services</button></div>
          <div class="sim-box" data-zone="chart">
            <svg viewBox="0 0 480 190" class="im-chart" aria-label="Demand over the day">
              <g id="bars"></g><path id="cap" class="im-cap" d=""/><line id="now" class="im-now" x1="0" x2="0" y1="10" y2="160"/>
              ${[0, 6, 12, 18].map((h) => `<text class="svg-lbl svg-sm" x="${20 + h * 19 + 9}" y="178">${String(h).padStart(2, '0')}:00</text>`).join('')}
            </svg>
            <div class="im-racks" id="racks"></div>
            <p class="small" id="omsg"></p>
          </div>
          <div class="im-costs" data-zone="costs" id="costs"></div>
          <button class="btn" id="day">▶ Run a day</button>
        </div>
        <div data-panel="ind" class="im-ind" hidden>
          <div class="sim-box" data-zone="svc"><h5 class="mw-h">Cloud-based services for individuals</h5><div class="im-tiles">${[
            ['🛒', 'Shopping and auction sites', 'shopping'], ['🎫', 'Booking systems for travel, leisure and entertainment', 'booking'], ['🏦', 'Banking', 'banks'],
            ['🎓', 'VLEs and massive online open courses (MOOCs)', 'banks'], ['🎮', 'Gaming', 'news'], ['📰', 'News and other information', 'news'], ['📺', 'Entertainment: on-demand television and radio', ''],
          ].map(([e, n, go]) => `<button class="im-tile" ${go ? `data-go="${go}"` : ''}><span>${e}</span>${n}</button>`).join('')}</div></div>
          <div class="sim-box" data-zone="comm"><h5 class="mw-h">…and access to online communities</h5><div class="im-tiles">${[
            ['👥', 'Social networking sites'], ['🗂️', 'Online work spaces'], ['📖', 'User-generated reference sites: wikis and forums'], ['🎥', 'User-generated content: video-sharing sites, blogs and websites'], ['🔖', 'Social bookmarking sites'],
          ].map(([e, n]) => `<span class="im-tile"><span>${e}</span>${n}</span>`).join('')}</div><p class="small muted">See <i>Unit 3 Operating online</i> (pages 132–145).</p></div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.im-s'), $ = (s) => root.querySelector(s);
    let feats, devc, mode, hour, run = 0, dead = false;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const show = FD.panels(root, () => { run++; FD.focus(root); say(''); });

    // developers
    function drawFeat() { $('#lf').innerHTML = feats.map(([t, n]) => `<li class="${n ? 'new' : ''}">${n ? '✨' : '✓'} ${t}</li>`).join(''); }
    async function respond(ctx) {
      const add = [['AI background removal', 1], ['PhotoPro Online: a hosted version', 1], ['PhotoPro Cloud storage, linked to the app', 1]];
      for (const f of add) { if (feats.some((x) => x[0] === f[0])) continue; feats.push(f); drawFeat(); if (ctx && !(await ctx.sleep(700))) return; }
      say('Developers of locally installed software are in a very <b>competitive marketplace</b>. They respond by adding more features and providing their own cloud-based applications and online data storage that <b>link with their locally installed software</b>.');
    }
    // devices
    function device(v) {
      devc = v; FD.segSet($('#devs'), v);
      const D = { laptop: ['£800', '512 GB SSD', 'Fast processor', 'Software installed locally'], chrome: ['£200', '32 GB storage', 'Simple processor', 'Uses hosted apps and online storage'] }[v];
      $('#spec').innerHTML = `<div><b>${D[0]}</b><small>price</small></div><div><b>${D[1]}</b><small>storage</small></div><div><b>${D[2]}</b><small>processor</small></div><div><b>${D[3]}</b><small>software</small></div>`;
      const price = v === 'laptop' ? 800 : 200, ok = FAM.filter((b) => b >= price).length;
      $('#town').innerHTML = FAM.map((b) => `<i class="${b >= price ? 'yes' : ''}" title="Budget £${b}">${b >= price ? '🏠' : '🏚️'}<small>£${b}</small></i>`).join('');
      $('#tmsg').innerHTML = `<b>${ok} of ${FAM.length}</b> families can afford one.`;
      say(v === 'chrome' ? 'These devices do not need a lot of storage because they simply access hosted applications and online data storage. This reduction in cost lets <b>more people access technology</b> and helps to <b>reduce the digital divide</b>.' : 'A powerful laptop needs lots of local storage and a fast processor, so it costs more.', v === 'chrome' ? 'good' : '');
    }
    // organisations
    function drawOrg() {
      FD.segSet($('#srv'), mode);
      const x = (h) => 20 + h * 19, y = (d) => 160 - d * 8.5;
      $('#bars').innerHTML = DEMAND.map((d, h) => `<rect class="im-bar ${mode === 'own' && d > 6 ? 'over' : ''} ${h <= hour ? 'past' : ''}" x="${x(h) + 2}" y="${y(d)}" width="15" height="${160 - y(d)}"/>`).join('');
      $('#cap').setAttribute('d', mode === 'own' ? `M${x(0)} ${y(6)}H${x(24)}` : `M${x(0)} ${y(DEMAND[0])}` + DEMAND.map((d, h) => `V${y(d)}H${x(h + 1)}`).join(''));
      $('#now').setAttribute('x1', x(hour) + 9.5); $('#now').setAttribute('x2', x(hour) + 9.5);
      const d = DEMAND[Math.max(0, hour)], n = mode === 'own' ? 6 : d;
      $('#racks').innerHTML = Array.from({ length: Math.max(n, 6) }, (_, i) => `<span class="${i < n ? (mode === 'own' && i >= d ? 'idle' : 'on') : 'off'}">🗄️</span>`).join('') + (mode === 'own' && d > 6 ? `<span class="bad-t small">+${d - 6} needed: website too slow!</span>` : '');
      $('#omsg').innerHTML = `🕒 ${String(Math.max(0, hour)).padStart(2, '0')}:00 · demand needs <b>${d}</b> server(s)`;
      $('#costs').innerHTML = mode === 'own'
        ? '<div><b>Buy</b><small>6 servers up front</small></div><div><b>House</b><small>a cooled server room</small></div><div><b>Maintain</b><small>staff, repairs, power</small></div>'
        : '<div class="good-t"><b>Pay for use</b><small>only what is used</small></div><div class="good-t"><b>No server room</b><small>the provider’s data centre</small></div><div class="good-t"><b>Scales</b><small>up at busy times, down at night</small></div>';
    }
    function setMode(m) { mode = m; drawOrg(); say(m === 'cloud' ? 'Cloud-based services provide organisations with <b>scalable</b> solutions to suit their business needs, and save the cost of <b>buying, housing and maintaining</b> their own servers.' : 'With its own servers, the organisation pays for 6 servers all day. At night they sit idle; at busy times they are not enough.', m === 'cloud' ? 'good' : ''); }
    async function day(ctx) {
      const r = ++run;
      for (let h = 0; h < 24; h++) { hour = h; drawOrg(); await FD.wait(260); if (dead || r !== run) return; }
    }

    root.addEventListener('click', (e) => {
      const d = e.target.closest('#devs [data-v]'), s = e.target.closest('#srv [data-v]'), g = e.target.closest('[data-go]');
      if (e.target.closest('#respond')) respond(); else if (d) device(d.dataset.v); else if (s) setMode(s.dataset.v);
      else if (e.target.closest('#day')) day(); else if (g) FD.goto(g.dataset.go);
    });
    function reset() {
      run++; feats = [['Advanced editing tools', 0], ['Layers', 0], ['Works offline', 0]]; drawFeat();
      device('laptop'); mode = 'own'; hour = 0; drawOrg(); show('dev'); say(''); FD.focus(root);
    }
    reset();
    return {
      reset, show, respond, device, setMode, day,
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; run++; },
    };
  },
  steps: [
    {
      title: 'A competitive marketplace',
      text: `<p><strong>Cloud</strong>-based services include hosted applications and online data storage. Many different ones are available, so developers of <b>locally installed software</b> are operating in a very <b>competitive marketplace</b>.</p>
             <p>They have responded by adding <b>more features</b> to their software, and providing their <b>own cloud-based applications and online data storage</b> solutions that can link with their locally installed software.</p>`,
      tip: 'Try it: press “PhotoPro responds to the competition”.',
      async on(a, ctx) { a.reset(); a.focus(['local', 'hostedc']); if (!(await ctx.sleep(1500))) return; await a.respond(ctx); },
    },
    {
      title: 'Cheaper devices and the digital divide',
      text: `<p>Cloud-based services have made it possible for manufacturers to sell <b>inexpensive devices</b> such as the Google Chromebook™ or <strong>netbooks</strong> (Figure 12.3). They do not need a lot of storage because they simply access hosted applications and online data storage.</p>
             <p>This reduction in cost has allowed <b>more people to access technology</b> and has helped to reduce the <b>digital divide</b>. See <i>Unit 3 Operating online</i> (pages 125–128).</p>`,
      tip: 'Try it: switch between the two devices and count the families.',
      async on(a, ctx) { a.reset(); a.show('cheap'); a.device('laptop'); a.focus('town'); if (!(await ctx.sleep(2200))) return; a.device('chrome'); },
    },
    {
      title: 'Organisations',
      text: `<p>Cloud-based services can help organisations, as they can provide <b>scalable solutions</b> to suit their business needs. They also help organisations to <b>save on the cost</b> of buying, housing and maintaining their own servers.</p>`,
      tip: 'Try it: run a day with each option.',
      async on(a, ctx) { a.reset(); a.show('org'); a.setMode('own'); await a.day(ctx); if (!(await ctx.sleep(900))) return; a.setMode('cloud'); await a.day(ctx); },
    },
    {
      title: 'Individuals',
      text: `<p>Cloud-based services can provide individuals with access to a variety of online services, including shopping and auction sites, booking systems, banking, VLEs and <b>massive online open courses (MOOCs)</b>, gaming, news and other information, and entertainment such as on-demand television and radio.</p>
             <p>They also provide access to <b>online communities</b>: social networking sites, online work spaces, wikis and forums, video-sharing sites, blogs and websites, and social bookmarking sites.</p>`,
      tip: 'Click a service to go back to its section.',
      async on(a) { a.reset(); a.show('ind'); a.focus(['svc', 'comm']); },
    },
  ],
});

FD.check({
  section: 'impact',
  items: [
    { type: 'mcq', q: 'State what is meant by the term ‘<b>cloud</b>’. <small>(Chapter 12, question 4)</small>', opts: ['The internet when it is used to provide software or space for storing information, rather than relying on local storage', 'A type of local hard disk', 'A wireless network in the home', 'A program installed on a laptop'], why: 'Cloud-based services include hosted applications and online data storage.' },
    { type: 'multi', q: 'State <b>three</b> online services provided by cloud-based services. <small>(Chapter 12, question 3)</small>', need: 3, opts: [['Banking', true], ['Booking systems', true], ['VLEs and MOOCs', true], ['Defragmentation', false], ['Printing on paper', false]], why: 'Also shopping and auctions, gaming, news and on-demand entertainment.' },
    { type: 'mcq', q: 'How have cloud-based services helped to reduce the <b>digital divide</b>?', opts: ['Cheap devices like Chromebooks and netbooks need little storage, so more people can afford technology', 'They make all computers free', 'They remove the need for the internet', 'They make laptops more powerful'], why: 'The devices access hosted apps and online storage.' },
    { type: 'tf', q: 'Cloud-based services help organisations save the cost of buying, housing and maintaining their own servers.', a: true, why: 'They also provide scalable solutions.' },
  ],
});
