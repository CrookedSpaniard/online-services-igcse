FD.add({
  id: 'news',
  title: 'Gaming, news and information providers',
  tab: 'Gaming / news',
  icon: 'news',
  color: '--c3',
  section: true,
  interactive: true,
  vocab: [
    ['Subscriber', 'Someone who signs up for a regular service.'],
  ],
  mount(el) {
    const W = 8, H = 5;
    const CATS = { sport: ['⚽', 'Sport'], weather: ['🌦️', 'Weather'], stocks: ['📈', 'Stock markets'], money: ['💱', 'Currency'], world: ['🌍', 'World news'], tech: ['💻', 'Technology'] };
    const STORIES = {
      sport: ['Valencia CF score in the 89th minute!', 'Tennis: final moved to Sunday', 'New 100 m school record'],
      weather: ['Heavy rain expected after 16:00', 'Heat warning for tomorrow', 'Clear skies tonight'],
      stocks: ['Tech shares rise 2%', 'Markets close lower', 'Car maker shares fall 4%'],
      money: ['€1 now buys £0.86', 'Pound rises against the dollar', 'Euro falls after bank news'],
      world: ['Leaders meet for climate talks', 'New bridge opens in Lisbon', 'Election results announced'],
      tech: ['New smartphone launched', 'Major app update released', 'Data centre runs on solar power'],
    };
    el.innerHTML = `
      <div class="sim nw-s">
        <div class="ptabs" role="group" aria-label="Simulations"><button data-p="game">🎮 Gaming site</button><button data-p="news">📰 News and information</button></div>
        <div data-panel="game" class="gm" tabindex="0">
          <div class="gm-row">
            <div class="gm-scr" data-zone="me"><h5 class="mw-h">🧙 Your screen · Alzira</h5><div class="gm-board" id="bA"></div></div>
            <div class="gm-mid" data-zone="server">
              <svg viewBox="0 0 160 150" class="gm-net" aria-hidden="true">
                <path class="gm-l" d="M0 75H160"/>
                ${FD.dv.server(50, 52)}
                <text class="svg-lbl" x="80" y="124">Remote game server</text>
                <circle class="gm-pk me" id="pk1" r="5" cx="-20" cy="75"/>
                <circle class="gm-pk kai" id="pk2" r="5" cx="-20" cy="75"/>
              </svg>
              <p class="small" id="lat">Delay ≈ <b>40 ms</b></p>
            </div>
            <div class="gm-scr" data-zone="kai"><h5 class="mw-h">🤖 Kai’s screen · Tokyo</h5><div class="gm-board" id="bB"></div></div>
          </div>
          <div class="gm-ctl" data-zone="ctl">
            <span class="small">Move your character:</span>
            <button class="mini-btn" data-mv="0,-1" aria-label="Up">▲</button><button class="mini-btn" data-mv="-1,0" aria-label="Left">◀</button><button class="mini-btn" data-mv="0,1" aria-label="Down">▼</button><button class="mini-btn" data-mv="1,0" aria-label="Right">▶</button>
            <label class="tgl small"><input type="checkbox" id="multi" checked> Multiplayer (Kai is playing too)</label>
          </div>
        </div>
        <div data-panel="news" class="nw" hidden>
          <div class="sim-box nw-subs" data-zone="subs">
            <h5 class="mw-h">🔔 BS News app · choose your alerts</h5>
            <div class="nw-cats">${Object.entries(CATS).map(([k, [e, n]]) => `<label class="tgl"><input type="checkbox" data-cat="${k}"> ${e} ${n}</label>`).join('')}</div>
            <button class="btn primary" id="sub">Subscribe</button>
            <p class="small" id="subMsg">You are not a subscriber yet.</p>
          </div>
          <div class="nw-feed" data-zone="feed"><h5 class="mw-h">🗞️ Newsroom: stories published</h5><ul id="feed"></ul></div>
          <div class="nw-dev" data-zone="watch">
            <div class="nw-watch"><div class="nw-wscr" id="watch"><span>⌚</span></div></div>
            <div class="nw-live" data-zone="live" id="live"></div>
          </div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.nw-s'), $ = (s) => root.querySelector(s);
    let me, kai, kaiSeen, meSeen, subs, subscribed, live, timers = [], dead = false, run = 0, kaiTimer = null;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const show = FD.panels(root, (p) => { FD.focus(root); stop(); if (p === 'news') startNews(); else startGame(); });

    // ---------- game ----------
    function board(id, a, b) {
      let h = '';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h += `<i>${a[0] === x && a[1] === y ? '🧙' : b && b[0] === x && b[1] === y ? '🤖' : (x * 7 + y * 3) % 11 === 0 ? '🌳' : ''}</i>`;
      $(id).innerHTML = h;
    }
    function drawGame() { board('#bA', me, $('#multi').checked ? kaiSeen : null); board('#bB', meSeen, $('#multi').checked ? kai : null); }
    async function packet(id, from, to) {
      const c = $(id);
      await FD.tween(500, (t) => { if (!dead) c.setAttribute('cx', from + (to - from) * t); });
      c.setAttribute('cx', -20);
    }
    async function move(dx, dy) {
      me = [FD.clamp(me[0] + dx, 0, W - 1), FD.clamp(me[1] + dy, 0, H - 1)];
      drawGame();
      const r = run;
      await packet('#pk1', 0, 80); if (dead || r !== run) return;
      await packet('#pk1', 80, 160); if (dead || r !== run) return;
      meSeen = [...me]; drawGame(); FD.pulse($('#bB'));
    }
    async function kaiMove() {
      if (!$('#multi').checked) return;
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const [dx, dy] = opts[Math.floor(Math.random() * 4)];
      kai = [FD.clamp(kai[0] + dx, 0, W - 1), FD.clamp(kai[1] + dy, 0, H - 1)];
      drawGame();
      const r = run;
      await packet('#pk2', 160, 80); if (dead || r !== run) return;
      await packet('#pk2', 80, 0); if (dead || r !== run) return;
      kaiSeen = [...kai]; drawGame();
    }
    function startGame() {
      clearInterval(kaiTimer);
      kaiTimer = setInterval(() => { if (!dead && root.dataset.panel === 'game') kaiMove(); }, FD.dur(1800));
      drawGame();
    }

    // ---------- news ----------
    function subscribe(list) {
      if (list) root.querySelectorAll('[data-cat]').forEach((c) => { c.checked = list.includes(c.dataset.cat); });
      subs = [...root.querySelectorAll('[data-cat]:checked')].map((c) => c.dataset.cat);
      subscribed = subs.length > 0;
      $('#subMsg').innerHTML = subscribed ? `<span class="good-t">✓ You are a <b>subscriber</b>: alerts for ${subs.map((k) => CATS[k][1].toLowerCase()).join(', ')}.</span>` : 'Tick at least one category.';
      say(subscribed ? 'Now every new story in your categories is sent to you as a <b>notification</b>.' : '');
    }
    function publish(cat) {
      const k = cat || Object.keys(CATS)[Math.floor(Math.random() * 6)];
      const list = STORIES[k], s = list[Math.floor(Math.random() * list.length)];
      const sent = subscribed && subs.includes(k);
      $('#feed').insertAdjacentHTML('afterbegin', `<li class="${sent ? 'sent' : ''}"><span>${CATS[k][0]}</span><p>${s}</p><small>${sent ? '🔔 sent to you' : 'not in your alerts'}</small></li>`);
      while ($('#feed').children.length > 6) $('#feed').lastElementChild.remove();
      if (sent) {
        $('#watch').innerHTML = `<b>${CATS[k][0]} ${CATS[k][1]}</b><small>${s}</small>`;
        FD.pulse($('#watch').parentElement);
      }
    }
    function tickLive() {
      live.temp += Math.round((Math.random() - 0.5) * 2); live.goals += Math.random() < 0.15 ? 1 : 0;
      live.idx += (Math.random() - 0.48) * 12; live.fx += (Math.random() - 0.5) * 0.004;
      $('#live').innerHTML = `<h5 class="mw-h">⏱️ Real-time information</h5>
        <div><span>🌦️ Weather, Alzira</span><b>${live.temp} °C</b></div>
        <div><span>⚽ Valencia v Sevilla</span><b>${live.goals} – 1</b></div>
        <div><span>📈 Stock market index</span><b>${live.idx.toFixed(1)}</b></div>
        <div><span>💱 €1 =</span><b>£${live.fx.toFixed(4)}</b></div>`;
    }
    function startNews() {
      tickLive();
      timers.push(setInterval(() => { if (!dead) tickLive(); }, FD.dur(1500)));
      timers.push(setInterval(() => { if (!dead) publish(); }, FD.dur(2600)));
    }
    function stop() { run++; timers.forEach(clearInterval); timers = []; clearInterval(kaiTimer); }

    root.addEventListener('click', (e) => {
      const m = e.target.closest('[data-mv]');
      if (m) { const [dx, dy] = m.dataset.mv.split(',').map(Number); move(dx, dy); }
      else if (e.target.closest('#sub')) subscribe();
    });
    $('#multi').addEventListener('change', drawGame);
    root.querySelector('.gm').addEventListener('keydown', (e) => {
      const K = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (K) { e.preventDefault(); e.stopPropagation(); move(...K); }
    });
    root.querySelector('.gm').setAttribute('data-keys', '');

    function reset() {
      stop(); me = [1, 2]; kai = [6, 2]; kaiSeen = [...kai]; meSeen = [...me];
      subs = []; subscribed = false; live = { temp: 18, goals: 1, idx: 7520, fx: 0.86 };
      root.querySelectorAll('[data-cat]').forEach((c) => { c.checked = false; });
      $('#multi').checked = true; $('#feed').innerHTML = ''; $('#watch').innerHTML = '<span>⌚</span>';
      $('#subMsg').textContent = 'You are not a subscriber yet.';
      say(''); show('game');
    }
    reset();
    return {
      reset, show, move, kaiMove, subscribe, publish,
      multi: (on) => { $('#multi').checked = on; drawGame(); },
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; stop(); },
    };
  },
  steps: [
    {
      title: 'Gaming sites',
      text: `<p><b>Gaming sites</b> are online applications that allow users to play games that are <b>hosted on a remote server</b>.</p>`,
      tip: 'Try it: turn off Multiplayer and move your wizard. Each move goes through the server.',
      async on(a, ctx) { a.reset(); a.multi(false); a.focus('server'); for (const [x, y] of [[1, 0], [1, 0], [0, 1]]) { if (!(await ctx.sleep(900))) return; a.move(x, y); } },
    },
    {
      title: 'Multiplayer games in real time',
      text: `<p>Sometimes these games are <b>multiplayer</b>, so that players control <b>different characters</b> in the game and other players can see their actions in <b>real time</b>, even from the other side of the world.</p>
             <p>For more about online gaming communities, see <i>Unit 3 Operating online</i> (page 138).</p>`,
      tip: 'Try it: use the arrows (or the arrow keys after clicking the game). Watch your move appear on Kai’s screen.',
      async on(a, ctx) { a.reset(); a.multi(true); a.focus(['me', 'kai']); for (const [x, y] of [[1, 0], [1, 0], [1, 0], [0, -1]]) { if (!(await ctx.sleep(1000))) return; a.move(x, y); } },
    },
    {
      title: 'News providers and subscribers',
      text: `<p><b>News providers</b> give up-to-date access to stories using <b>blogs</b> and <b>notifications</b> that are sent to <strong>subscribers</strong>. A subscriber is someone who signs up for a regular service.</p>`,
      tip: 'Try it: watch the newsroom. Nothing reaches the watch until you subscribe.',
      async on(a, ctx) { a.reset(); a.show('news'); a.focus('feed'); if (!(await ctx.sleep(600))) return; a.publish('world'); },
    },
    {
      title: 'Choosing categories',
      text: `<p>Subscribers can choose to receive <b>alerts</b> on stories from a <b>range of categories</b>. Once a user has subscribed to a service, they can be <b>notified automatically</b>, via an app, of any activity on that service (Figure 11.4).</p>`,
      tip: 'Try it: tick the categories you like and press Subscribe.',
      async on(a, ctx) { a.reset(); a.show('news'); a.focus(['subs', 'watch']); if (!(await ctx.sleep(900))) return; a.subscribe(['sport', 'tech']); if (!(await ctx.sleep(900))) return; a.publish('sport'); if (!(await ctx.sleep(1300))) return; a.publish('weather'); },
    },
    {
      title: 'Real-time information',
      text: `<p>Other information providers can provide <b>real-time notifications</b> about information such as:</p><ul><li>weather</li><li>sports</li><li>stock markets</li><li>currency values.</li></ul>`,
      async on(a) { a.reset(); a.show('news'); a.subscribe(['weather', 'sport', 'stocks', 'money']); a.focus('live'); },
    },
  ],
});

FD.check({
  section: 'news',
  items: [
    { type: 'mcq', q: 'Where are the games on a gaming site hosted?', opts: ['On a remote server', 'On the player’s keyboard', 'In the player’s email', 'On a DVD only'], why: 'Gaming sites are online applications.' },
    { type: 'mcq', q: 'In a multiplayer game, what can other players see?', opts: ['Each player’s actions in real time', 'Each player’s bank balance', 'Only the final score the next day', 'Nothing until the game is downloaded'], why: 'Players control different characters.' },
    { type: 'mcq', q: 'State the way in which news services can use a feature of smartphone apps to keep users up to date. <small>(Chapter question 10)</small>', opts: ['Notifications / alerts sent automatically to subscribers', 'Voucher codes', 'Balance alerts', 'Product catalogues'], why: 'Subscribers choose the categories they want alerts about.' },
    { type: 'multi', q: 'Which of these can information providers send real-time notifications about? Choose <b>three</b>.', need: 3, opts: [['Weather', true], ['Stock markets', true], ['Currency values', true], ['Your password', false]], why: 'Also sports.' },
  ],
});
