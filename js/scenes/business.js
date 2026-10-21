FD.add({
  id: 'business',
  title: 'The impact on the ways that organisations do business',
  tab: 'Business',
  icon: 'business',
  color: '--c5',
  section: true,
  interactive: true,
  mount(el) {
    const ll = (lon, lat) => [((lon + 180) / 360) * 600, ((90 - lat) / 180) * 300];
    const C = {
      alz: ['Alzira', ll(-0.4, 39.2)], lon: ['London', ll(-0.1, 51.5)], ber: ['Berlin', ll(13.4, 52.5)], ny: ['New York', ll(-74, 40.7)],
      mex: ['Mexico City', ll(-99.1, 19.4)], sp: ['São Paulo', ll(-46.6, -23.5)], lag: ['Lagos', ll(3.4, 6.5)], mum: ['Mumbai', ll(72.8, 19)],
      tok: ['Tokyo', ll(139.7, 35.7)], syd: ['Sydney', ll(151.2, -33.9)],
    };
    const TZ = { lon: 0, ber: 1, ny: -5, mex: -6, sp: -3, lag: 1, mum: 5.5, tok: 9, syd: 11, alz: 1 };
    const MODES = [
      ['comms', '💬', 'Improved communication'], ['markets', '🌍', 'Global markets'], ['workforce', '👩‍💻', 'Global workforce'],
      ['data', '📊', 'Big data'], ['security', '🛡️', 'Securing business information'], ['competition', '⚔️', 'Increased competition'],
    ];
    const [hx, hy] = C.alz[1];
    el.innerHTML = `
      <div class="sim bz-s">
        <div class="seg" id="modes">${MODES.map(([k, e, n]) => `<button data-v="${k}">${e} ${n}</button>`).join('')}</div>
        <div class="bz-grid">
          <div class="sim-box bz-map" data-zone="map">
            <svg viewBox="0 20 600 230" class="bz-svg" role="img" aria-label="World map with the business in Alzira">
              ${Array.from({ length: 13 }, (_, i) => `<path class="bz-gr" d="M${i * 50} 20V250"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<path class="bz-gr" d="M0 ${30 + i * 45}H600"/>`).join('')}
              <g id="lines"></g>
              ${Object.entries(C).filter(([k]) => k !== 'alz').map(([k, [n, [x, y]]]) => `<g class="bz-city" data-c="${k}"><circle cx="${x}" cy="${y}" r="4"/><text x="${x + (k === 'ber' ? 30 : k === 'lon' ? -22 : 0)}" y="${y - 8}">${n}</text><text class="bz-tag" id="tag-${k}" x="${x + (k === 'ber' ? 34 : k === 'lon' ? -26 : 0)}" y="${y + 18}"></text></g>`).join('')}
              <g class="bz-home"><circle cx="${hx}" cy="${hy}" r="9"/><text x="${hx}" y="${hy + 1}" class="emo">🥐</text><text x="${hx + 14}" y="${hy + 22}" class="bz-hl">Alzira Bakes</text></g>
              <g id="fx"></g>
            </svg>
          </div>
          <div class="sim-box bz-panel" id="panel" data-zone="panel"></div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.bz-s'), $ = (s) => root.querySelector(s);
    let run = 0, dead = false, stats;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const NS = 'http://www.w3.org/2000/svg';
    function dot(from, to, cls, ms = 1200) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 4.5); c.setAttribute('class', 'bz-pk ' + cls);
      $('#fx').appendChild(c);
      return FD.tween(ms, (t) => {
        const x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * 30;
        c.setAttribute('cx', x); c.setAttribute('cy', y);
      }).then(() => c.remove());
    }
    function lines(keys, cls = '') { $('#lines').innerHTML = keys.map((k) => `<path class="bz-ln ${cls}" d="M${hx} ${hy}Q${(hx + C[k][1][0]) / 2} ${Math.min(hy, C[k][1][1]) - 40} ${C[k][1][0]} ${C[k][1][1]}"/>`).join(''); }
    function tags(map) { Object.keys(C).forEach((k) => { const t = root.querySelector('#tag-' + k); if (t) t.textContent = map[k] || ''; }); }

    async function set(m) {
      run++;
      FD.segSet($('#modes'), m); $('#fx').innerHTML = ''; lines([]); tags({});
      root.querySelectorAll('.bz-city').forEach((g) => g.classList.remove('rival', 'bad'));
      const P = $('#panel');
      if (m === 'comms') {
        lines(['ber', 'lon'], 'on'); tags({ ber: 'flour supplier', lon: 'designer' });
        P.innerHTML = `<h5 class="mw-h">💬 Improved communication</h5><ul class="bz-chat" id="chat"></ul>`;
        say('Email, instant messaging and video calls connect the business with suppliers and staff anywhere, in seconds.');
        const msgs = [['ber', '🇩🇪 Supplier: Your 200 kg of flour leaves today.'], ['alz', '🥐 Alzira Bakes: Thanks! Can we add 50 kg of sugar?'], ['ber', '🇩🇪 Supplier: Done, same lorry.'], ['lon', '🇬🇧 Designer: New box design attached 📎']];
        const r = run;
        for (const [k, t] of msgs) {
          const from = k === 'alz' ? [hx, hy] : C[k][1], to = k === 'alz' ? C.ber[1] : [hx, hy];
          await dot(from, to, 'msg', 700); if (dead || r !== run) return;
          $('#chat').insertAdjacentHTML('beforeend', `<li class="${k === 'alz' ? 'me' : ''}">${t}<small>sent ${['0.4', '0.3', '0.5', '0.6'][msgs.findIndex((x) => x[1] === t)]} s</small></li>`);
          await FD.wait(500); if (dead || r !== run) return;
        }
      } else if (m === 'markets') {
        stats = { orders: 0, money: 0, from: {} };
        P.innerHTML = `<h5 class="mw-h">🌍 Access to global markets</h5><p class="bz-big"><b id="ord">0</b> orders · <b id="mon">€0</b></p><ul class="bz-list" id="from"></ul>`;
        say('An online shop is open to customers in <b>every country</b>, 24 hours a day, not only to people who walk past the shop.');
        const keys = Object.keys(C).filter((k) => k !== 'alz'), r = run;
        while (!dead && r === run) {
          const k = keys[Math.floor(Math.random() * keys.length)];
          dot(C[k][1], [hx, hy], 'order', 1300).then(() => {
            if (dead || r !== run) return;
            stats.orders++; stats.money += 12 + Math.floor(Math.random() * 30); stats.from[k] = (stats.from[k] || 0) + 1;
            $('#ord').textContent = stats.orders; $('#mon').textContent = '€' + stats.money;
            $('#from').innerHTML = Object.entries(stats.from).sort((a, b) => b[1] - a[1]).map(([c, n]) => `<li><span>${C[c][0]}</span><b>${n}</b></li>`).join('');
          });
          await FD.wait(450);
        }
      } else if (m === 'workforce') {
        const team = { mum: 'web developer', sp: 'customer service', lon: 'marketing', tok: 'translator' };
        lines(Object.keys(team), 'on');
        const now = new Date(), utc = now.getUTCHours() + now.getUTCMinutes() / 60;
        const t = (k) => { const h = (utc + TZ[k] + 24) % 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`; };
        tags(Object.fromEntries(Object.keys(team).map((k) => [k, `🕒 ${t(k)}`])));
        P.innerHTML = `<h5 class="mw-h">👩‍💻 Access to a global workforce</h5><ul class="bz-list">${Object.entries(team).map(([k, j]) => `<li><span>${C[k][0]}</span><small>${j}</small><b>${t(k)}</b></li>`).join('')}</ul><p class="small">Staff can work online from home, in any country and time zone. See <i>Unit 3 Operating online</i> (pages 119–121).</p>`;
        say('The business can employ the best people for each job, wherever they live, and work goes on around the clock.');
      } else if (m === 'data') {
        const D = [['🥐 Croissants', 34], ['🍞 Bread', 22], ['🎂 Cakes', 18], ['🍪 Biscuits', 26]];
        const H = [2, 1, 1, 3, 9, 14, 12, 8, 6, 7, 11, 16];
        P.innerHTML = `<h5 class="mw-h">📊 Big data: customer behaviour</h5>
          <p class="small">From millions of website visits and orders:</p>
          <div class="bz-bars">${D.map(([n, v]) => `<div><span>${n}</span><i style="--w:${v * 2.6}%"></i><b>${v}%</b></div>`).join('')}</div>
          <p class="small">Orders by hour of the day</p><div class="bz-hours">${H.map((v, i) => `<i style="--h:${v * 6}%" title="${i * 2}:00"></i>`).join('')}</div>
          <p class="small good-t">Decision: bake more croissants and run adverts at 20:00–22:00.</p>`;
        say('Using <b>big data</b> helps organisations understand customer behaviour and make better decisions.');
        tags({ lon: '👀 browsed cakes', ny: '🛒 bought biscuits', tok: '⭐ rated 5', sp: '🔁 reordered' });
      } else if (m === 'security') {
        P.innerHTML = `<h5 class="mw-h">🛡️ Securing business information</h5><ul class="bz-list" id="sec"><li><span>🔐 Encryption (HTTPS)</span><b class="good-t">on</b></li><li><span>🧱 Firewall</span><b class="good-t">on</b></li><li><span>💾 Online backup</span><b class="good-t">daily</b></li></ul><p class="bz-big"><b id="blk">0</b> attacks blocked</p>`;
        say('Online, customer and business data must be protected from hackers: organisations have changed the way they secure business information.');
        root.querySelectorAll('.bz-city').forEach((g) => { if (['mex', 'lag', 'syd'].includes(g.dataset.c)) g.classList.add('bad'); });
        $('#fx').insertAdjacentHTML('beforeend', `<circle class="bz-shield" cx="${hx}" cy="${hy}" r="24"/>`);
        const r = run; let n = 0;
        while (!dead && r === run) {
          const k = ['mex', 'lag', 'syd'][Math.floor(Math.random() * 3)], from = C[k][1];
          const to = [hx + (from[0] - hx) * 0.1, hy + (from[1] - hy) * 0.1];
          dot(from, to, 'attack', 1100).then(() => { if (dead || r !== run) return; n++; const b = $('#blk'); if (b) b.textContent = n; });
          await FD.wait(900);
        }
      } else if (m === 'competition') {
        const R = { ber: ['Berlin Bakery', 1.9], lon: ['London Loaf', 2.4], ny: ['NY Bagels', 2.1], tok: ['Tokyo Pan', 2.6] };
        Object.keys(R).forEach((k) => root.querySelector(`[data-c="${k}"]`).classList.add('rival'));
        tags(Object.fromEntries(Object.entries(R).map(([k, [, p]]) => [k, `€${p.toFixed(2)}`])));
        P.innerHTML = `<h5 class="mw-h">⚔️ Increased competition</h5><p class="small">A customer compares the price of 6 croissants online:</p><ul class="bz-list">${[['Alzira Bakes', 2.2, 1], ...Object.values(R)].sort((a, b) => a[1] - b[1]).map(([n, p, me]) => `<li class="${me ? 'me' : ''}"><span>${n}</span><b>€${p.toFixed(2)}</b></li>`).join('')}</ul><p class="small">Competitors from all over the world are only one click away, so businesses must keep prices low and quality high.</p>`;
        say('Because every business can sell online, there is <b>increased competition</b>.');
      }
    }
    $('#modes').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) set(b.dataset.v); });
    $('#panel').innerHTML = '<p class="note">Choose a change above.</p>';
    return {
      reset: () => { run++; FD.segSet($('#modes'), ''); $('#fx').innerHTML = ''; lines([]); tags({}); $('#panel').innerHTML = '<p class="note">Choose a change above.</p>'; say(''); FD.focus(root); },
      set, focus: (z) => FD.focus(root, z),
      destroy() { dead = true; run++; },
    };
  },
  steps: [
    {
      title: 'New ways to work',
      text: `<p>The internet has provided new ways for people to work online, such as <b>working from home</b>. The way in which organisations do business has also changed. These changes include:</p>
             <ul><li>improved communication</li><li>access to global markets</li><li>access to a global workforce</li><li>use of big data to understand customer behaviour</li><li>the way the organisation secures business information</li><li>increased competition.</li></ul>`,
      tip: 'Try it: choose each change at the top.',
      async on(a) { a.reset(); },
    },
    {
      title: 'Communication and global markets',
      text: `<p><b>Improved communication</b>: messages, files and video calls reach suppliers and staff in seconds.</p><p><b>Access to global markets</b>: a small business can sell to customers all over the world.</p>`,
      async on(a, ctx) { a.reset(); a.set('comms'); if (!(await ctx.sleep(4500))) return; a.set('markets'); },
    },
    {
      title: 'A global workforce and big data',
      text: `<p><b>Access to a global workforce</b>: staff can be employed in any country and work online.</p><p><b>Big data</b>: huge amounts of data about visits and orders help organisations understand <b>customer behaviour</b>.</p>`,
      async on(a, ctx) { a.reset(); a.set('workforce'); if (!(await ctx.sleep(4000))) return; a.set('data'); },
    },
    {
      title: 'Security and competition',
      text: `<p>Organisations have changed <b>the way they secure business information</b>, because it can be attacked online.</p><p>There is also <b>increased competition</b>, because competitors anywhere are one click away.</p>
             <p>For more about these positive and negative impacts, see <i>Unit 3 Operating online</i> (pages 120–121).</p>`,
      async on(a, ctx) { a.reset(); a.set('security'); if (!(await ctx.sleep(4500))) return; a.set('competition'); },
    },
  ],
});

FD.check({
  section: 'business',
  items: [
    { type: 'multi', q: 'Which of these are changes to the way organisations do business because of the internet? Choose <b>three</b>.', need: 3, opts: [['Access to global markets', true], ['Access to a global workforce', true], ['Increased competition', true], ['Customers must visit the shop', false], ['Less need to secure information', false]], why: 'Also improved communication, big data and the way business information is secured.' },
    { type: 'mcq', q: 'How can <b>big data</b> help an organisation?', opts: ['It helps them understand customer behaviour', 'It makes the website load faster', 'It removes all competition', 'It stops hackers'], why: 'Data about visits and orders shows what customers do.' },
    { type: 'tf', q: 'The internet means a business can employ people who live in other countries.', a: true, why: 'This is access to a global workforce.' },
  ],
});
