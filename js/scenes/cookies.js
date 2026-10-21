FD.add({
  id: 'cookies',
  title: 'Transactional data and cookies',
  tab: 'Cookies',
  icon: 'cookies',
  color: '--c9',
  section: true,
  interactive: true,
  vocab: [
    ['Transactional data', 'Data that is sent between digital devices.'],
    ['Track', 'Collect and analyse data.'],
    ['Cookies', 'Information that a website leaves on a user’s computer so that the website will recognise that user when they use it again.'],
    ['Encrypt', 'Protect information by putting it into a special code that only some people can read.'],
    ['Referring website', 'The website previously visited, which linked the user to the website that they are currently visiting.'],
    ['Banner advertisement', 'An image, animation or video that displays an advertisement for a product or service in a section of a web page.'],
    ['Ad server', 'A web server that stores, delivers and often tracks banner advertisements.'],
  ],
  mount(el) {
    const SITES = {
      weather: { host: 'weather-today.example', e: '🌦️', n: 'Weather Today' },
      football: { host: 'football-live.example', e: '⚽', n: 'Football Live' },
      shop: { host: 'bs-outlet.example', e: '🛍️', n: 'BS Outlet' },
    };
    const AD = 'ads.adnet.example';
    el.innerHTML = `
      <div class="sim ck-s">
        <div class="ck-grid">
          <div class="win ck-br" data-zone="browser">
            <div class="ck-tabs" id="tabs"></div>
            <div class="win-bar ck-bar"><span class="url safe" id="url">${FD.icon.lock} —</span></div>
            <div class="win-body ck-page" id="page"></div>
          </div>
          <div class="ck-side">
            <div class="sim-box ck-jar" data-zone="jar"><h5 class="mw-h">🍪 Cookies stored on this device <button class="mini-btn" id="del" title="Delete all cookies">🗑️ Delete all</button></h5><ul id="jar"></ul><label class="tgl small"><input type="checkbox" id="enc"> 🔒 Encrypt cookies while they are transferred</label></div>
            <div class="sim-box ck-http" data-zone="http"><h5 class="mw-h">📨 Last reply from a web server</h5><pre class="mono" id="http">(no request yet)</pre></div>
            <div class="sim-box ck-ad" data-zone="adsrv"><h5 class="mw-h">🎯 What the ad server (${AD}) has tracked</h5><ul id="track"><li class="note">Nothing yet.</li></ul>
              <label class="tgl small" data-zone="block"><input type="checkbox" id="block"> Block third-party cookies (browser setting)</label></div>
          </div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.ck-s'), $ = (s) => root.querySelector(s);
    let jar, open, cur, track, viewed, basket, user, dead = false, refFrom, enc;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const now = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const IP = '81.42.137.9';

    function setCookie(host, name, value, type, expires) {
      jar = jar.filter((c) => !(c.host === host && c.name === name));
      jar.push({ host, name, value, type, expires, t: Date.now() });
      $('#http').textContent = `HTTP/1.1 200 OK\nContent-type: text/html\nSet-Cookie: ${name}=${value}${expires ? `; Expires=${expires}` : ''}${type === 'third' ? '' : '; Secure'}`;
      FD.pulse($('#jar').parentElement);
      drawJar();
    }
    function drawJar() {
      const L = { session: ['Session', 'until the page is closed'], persistent: ['Persistent', ''], third: ['Third-party', ''] };
      $('#jar').innerHTML = jar.length ? jar.map((c) => `<li class="ck-${c.type}"><span class="pill">${L[c.type][0]}</span><b class="mono">${c.name}=${enc && c.type !== 'third' ? '🔒' + btoa(encodeURIComponent(c.value)).slice(0, 10) + '…' : FD.esc(c.value)}</b><small>${c.host}${c.expires ? ' · expires ' + c.expires : c.type === 'session' ? ' · deleted when the page is closed' : ''}</small></li>`).join('') : '<li class="note">No cookies.</li>';
    }
    function drawTrack() {
      $('#track').innerHTML = track.length ? track.map((t) => `<li>👁️ <b>AD-7731</b> on <span class="mono">${t}</span></li>`).join('') : '<li class="note">Nothing yet.</li>';
    }
    function banner(host, page) {
      // The banner is loaded from the ad server, which reads and sets its own (third-party) cookie.
      if ($('#block').checked) return `<div class="ck-banner gen" data-zone="banner"><small>Ad · ${AD}</small>🍕 Pizza deal: 2 for 1 tonight!<em>Third-party cookies are blocked, so this advert is not based on your browsing.</em></div>`;
      if (!jar.some((c) => c.host === AD)) setCookie(AD, 'adid', 'AD-7731', 'third', 'Thu, 05 Apr 2063 00:00:00 GMT');
      track.push(host + page); drawTrack();
      const v = viewed[0];
      return v ? `<div class="ck-banner" data-zone="banner"><small>Ad · ${AD}</small>${v.e} ${v.n} from £${v.p}: still interested?<em>Targeted: based on the pages where this ad server has seen cookie AD-7731.</em></div>`
        : `<div class="ck-banner gen" data-zone="banner"><small>Ad · ${AD}</small>🍕 Pizza deal: 2 for 1 tonight!</div>`;
    }
    function drawTabs() {
      $('#tabs').innerHTML = open.map((k) => `<span class="ck-tab ${k === cur ? 'on' : ''}"><button data-tab="${k}">${SITES[k].e} ${SITES[k].n}</button><button class="ck-x" data-close="${k}" aria-label="Close ${SITES[k].n}">✕</button></span>`).join('') + `<span class="ck-new">${Object.keys(SITES).filter((k) => !open.includes(k)).map((k) => `<button data-tab="${k}" title="Open ${SITES[k].n}">+ ${SITES[k].e}</button>`).join('')}</span>`;
    }
    function page() {
      const P = $('#page');
      if (!cur) { $('#url').innerHTML = '—'; P.innerHTML = '<p class="note">All tabs are closed. Open a website with the + buttons.</p>'; return; }
      const s = SITES[cur];
      $('#url').innerHTML = `${FD.icon.lock} https://${s.host}/`;
      if (cur === 'weather') {
        P.innerHTML = `<h4>🌦️ Weather Today · Alzira</h4><p class="ck-wx">☀️ 24 °C · 🌧️ rain after 16:00</p><a href="#" class="ck-link" data-ref="shop">👟 Running in the rain? Shop trainers at BS Outlet →</a>${banner(s.host, '/forecast')}`;
      } else if (cur === 'football') {
        P.innerHTML = `<h4>⚽ Football Live</h4><p class="ck-wx">Valencia 2 – 1 Sevilla · 78′</p>${banner(s.host, '/live')}`;
      } else {
        const items = [{ id: 'tr', e: '👟', n: 'Running trainers', p: 65 }, { id: 'hp', e: '🎧', n: 'Wireless headphones', p: 59 }];
        P.innerHTML = `<h4>🛍️ BS Outlet ${user ? `<small class="good-t">· logged in as ${user}</small>` : ''}</h4>
          <div class="ck-prods">${items.map((it) => `<div><span>${it.e}</span><b>${it.n}</b><small>£${it.p}</small><button class="mini-btn" data-view="${it.id}">View</button><button class="mini-btn" data-add="${it.id}">Add to basket</button></div>`).join('')}</div>
          <div class="ck-login" data-zone="login">${user ? '<button class="mini-btn" id="logout">Log out</button>' : `<input type="text" id="un" value="alex_p" aria-label="Username"><label class="tgl small"><input type="checkbox" id="keep" checked> Keep me logged in</label><button class="mini-btn" id="login">Log in</button>`}</div>
          <div class="ck-form" data-zone="form"><small>Delivery form:</small> <input type="text" id="nm" value="Alex Pérez" aria-label="Name"> <input type="text" id="ad" value="12 High Street" aria-label="Address"> <button class="mini-btn" id="send">Send form</button></div>
          ${banner(s.host, viewed[0] ? '/' + viewed[0].id : '/home')}`;
        P._items = items;
      }
    }
    function draw() { drawTabs(); page(); drawJar(); drawTrack(); }

    function visit(k, ref) {
      if (!open.includes(k)) open.push(k);
      cur = k; refFrom = ref || null;
      const host = SITES[k].host;
      if (k === 'shop') {
        setCookie(host, 'visit', `${now()}|ip=${IP}${ref ? '|ref=' + SITES[ref].host : ''}`, 'session');
        if (!jar.some((c) => c.host === host && c.name === 'sid')) setCookie(host, 'sid', 'S' + Math.floor(100000 + Math.random() * 899999), 'session');
      } else setCookie(host, 'lang', 'en-GB', 'persistent', 'Thu, 05 Apr 2063 00:00:00 GMT');
      draw();
      if (ref) say(`The shop stores the <b>referring website</b> (${SITES[ref].host}), the <b>time and date</b> and your <b>IP address</b>.`);
    }
    function view(id) {
      if (cur !== 'shop') visit('shop');
      const it = $('#page')._items.find((x) => x.id === id);
      viewed = [it, ...viewed.filter((v) => v.id !== id)];
      setCookie(SITES.shop.host, 'viewed', viewed.map((v) => v.id).join(','), 'persistent', 'Thu, 05 Apr 2063 00:00:00 GMT');
      page(); say(`Cookie updated: the <b>products you have viewed</b> (${it.n}).`);
    }
    function add(id) {
      if (cur !== 'shop') visit('shop');
      const it = $('#page')._items.find((x) => x.id === id);
      basket.push(id);
      setCookie(SITES.shop.host, 'basket', basket.join(','), 'session');
      setCookie(SITES.shop.host, 'btn', `add-to-basket@${new Date().toLocaleTimeString('en-GB')}`, 'session');
      page(); say(`Cookies updated: <b>items added to the basket</b> and the <b>button pressed</b> (${it.n}).`);
    }
    function form() {
      if (cur !== 'shop') visit('shop');
      setCookie(SITES.shop.host, 'form', `name=${$('#nm').value};addr=${$('#ad').value};card=•••• 0000`, 'session');
      say('<b>Data entered into web forms</b>, such as name, address and credit card information, can also be stored in cookies. This is why cookies can be <b>encrypted</b> when they are transferred.');
    }
    function login(keep = true) {
      if (cur !== 'shop') visit('shop');
      user = ($('#un') && $('#un').value) || 'alex_p';
      if (keep) setCookie(SITES.shop.host, 'login', user + '-token', 'persistent', 'Thu, 05 Apr 2063 00:00:00 GMT');
      else setCookie(SITES.shop.host, 'login', user + '-token', 'session');
      page();
      say(keep ? 'A <b>persistent cookie</b> keeps you logged in, so you do not have to log in every time you visit.' : 'Without “Keep me logged in”, the login is a session cookie: it disappears when the page is closed.');
    }
    function close(k) {
      open = open.filter((x) => x !== k);
      const host = SITES[k].host, before = jar.length;
      jar = jar.filter((c) => !(c.host === host && c.type === 'session'));
      if (k === 'shop' && !jar.some((c) => c.host === host && c.name === 'login')) user = '';
      if (k === 'shop') basket = [];
      cur = open[open.length - 1] || null;
      draw();
      say(`${SITES[k].n} closed: <b>${before - jar.length} session cookie(s)</b> deleted. Persistent and third-party cookies stay until they expire or are deleted.`);
    }
    function wipe() { jar = []; user = ''; viewed = []; basket = []; track = []; draw(); say('All cookies were <b>deleted manually</b> by the user. The ad server no longer recognises this device.', 'good'); }
    function block(on) { $('#block').checked = on; if (on) jar = jar.filter((c) => c.type !== 'third'); page(); drawJar(); say(on ? '✓ Third-party cookies are blocked. Banners can no longer track you between websites.' : ''); }
    function encrypt(on) { enc = on; $('#enc').checked = on; drawJar(); }

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]'), c = e.target.closest('[data-close]'), r = e.target.closest('[data-ref]'), v = e.target.closest('[data-view]'), a = e.target.closest('[data-add]');
      if (r) { e.preventDefault(); visit(r.dataset.ref, cur); }
      else if (c) close(c.dataset.close);
      else if (t) { if (open.includes(t.dataset.tab)) { cur = t.dataset.tab; draw(); } else visit(t.dataset.tab); }
      else if (v) view(v.dataset.view); else if (a) add(a.dataset.add);
      else if (e.target.closest('#login')) login($('#keep').checked);
      else if (e.target.closest('#logout')) { user = ''; jar = jar.filter((x) => x.name !== 'login'); page(); drawJar(); }
      else if (e.target.closest('#send')) form();
      else if (e.target.closest('#del')) wipe();
    });
    $('#block').addEventListener('change', (e) => block(e.target.checked));
    $('#enc').addEventListener('change', (e) => { encrypt(e.target.checked); say(e.target.checked ? 'Encrypted: anyone intercepting the cookies on the network only sees a special code.' : ''); });
    function reset() { jar = []; open = []; cur = null; track = []; viewed = []; basket = []; user = ''; enc = false; $('#enc').checked = false; $('#block').checked = false; $('#http').textContent = '(no request yet)'; draw(); say(''); FD.focus(root); }
    reset();
    return {
      reset, visit, view, add, form, login, close, wipe, block, encrypt,
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; },
    };
  },
  steps: [
    {
      title: 'Transactional data',
      text: `<p>An online transaction occurs whenever data is sent between devices on the internet. Some of this <strong>transactional data</strong> can be <b>tracked</b> online by network devices. This data is stored in <strong>cookies</strong>. It is possible to <b>encrypt</b> cookies when they are transferred between devices online.</p>
             <p>Transactional data is <b>not just</b> the data moved during financial transactions: it is the movement of <b>any</b> data between connected devices.</p>`,
      tip: 'Try it: open a website with the + buttons and watch the cookie jar.',
      async on(a, ctx) { a.reset(); a.focus(['browser', 'jar']); if (!(await ctx.sleep(700))) return; a.visit('weather'); a.visit('shop', 'weather'); if (!(await ctx.sleep(1800))) return; a.encrypt(true); },
    },
    {
      title: 'What can be stored in cookies?',
      text: `<p>Examples of data that can be stored as cookies include:</p>
             <ul><li>the time and date of the transaction</li><li>IP addresses</li><li>the <b>referring website</b></li><li>products or categories the user has previously viewed or bought</li><li>items added to the online shopping basket</li><li>buttons pressed by the user</li><li>data entered into web forms, such as name, address and credit card information.</li></ul>`,
      tip: 'Try it: follow the link to BS Outlet, view a product, add it to the basket and send the form.',
      async on(a, ctx) {
        a.reset(); a.visit('weather'); a.focus('jar');
        if (!(await ctx.sleep(1200))) return; a.visit('shop', 'weather');
        if (!(await ctx.sleep(1800))) return; a.view('tr');
        if (!(await ctx.sleep(1600))) return; a.add('tr');
        if (!(await ctx.sleep(1600))) return; a.form();
      },
    },
    {
      title: 'Expiry dates and deleting cookies',
      text: `<p>Cookies can be <b>manually deleted</b> by the user or set to <b>expire</b> after a specified period of time. In Figure 11.5, the third line of a web server’s reply shows that the cookie being sent is set to expire:</p>
             <p class="mono small">Set-Cookie: borg=no; Expires=Thu, 05 Apr 2063 00:00:00 GMT</p>`,
      tip: 'Try it: read the server reply, then press “Delete all”.',
      async on(a, ctx) { a.reset(); a.visit('football'); a.focus('http'); if (!(await ctx.sleep(2500))) return; a.focus('jar'); a.wipe(); },
    },
    {
      title: 'Session cookies',
      text: `<p><b>Session cookies</b> are only stored until a web page is <b>closed</b> in the browser.</p>`,
      tip: 'Try it: add something to the basket, then close the BS Outlet tab with ✕.',
      async on(a, ctx) { a.reset(); a.visit('shop'); a.add('hp'); a.focus('jar'); if (!(await ctx.sleep(2200))) return; a.close('shop'); },
    },
    {
      title: 'Persistent cookies',
      text: `<p><b>Persistent cookies</b> record information about the user’s use of the internet <b>over time</b>. They can keep a user <b>logged in</b> to an online account so they do not have to log in every time they visit a website. They also allow advertisers to track users’ use of the internet.</p>`,
      tip: 'Try it: log in with “Keep me logged in”, close the tab, then open BS Outlet again.',
      async on(a, ctx) { a.reset(); a.visit('shop'); a.focus(['login', 'jar']); if (!(await ctx.sleep(900))) return; a.login(true); if (!(await ctx.sleep(1800))) return; a.close('shop'); if (!(await ctx.sleep(1600))) return; a.visit('shop'); },
    },
    {
      title: 'Third-party cookies and targeted marketing',
      text: `<p><b>Third-party cookies</b> can personalise users’ online experience or send <b>targeted adverts</b>, for example in <strong>banner advertisements</strong> on other websites.</p>
             <p>When a page shows a banner from an <strong>ad server</strong>, the ad server stores a cookie on the device. Each time the banner loads on any website, the ad server can request the cookie, so the pages it was loaded from can be <b>tracked</b>. It then selects adverts that match the user’s <b>browsing history</b>.</p>`,
      tip: 'Try it: view the trainers in the shop, then open Football Live. Look at the banner and the ad server box.',
      async on(a, ctx) {
        a.reset(); a.visit('weather'); a.focus(['banner', 'adsrv']);
        if (!(await ctx.sleep(1800))) return; a.visit('shop'); a.view('tr');
        if (!(await ctx.sleep(1800))) return; a.visit('football'); a.focus(['banner', 'adsrv']);
      },
    },
    {
      title: 'Blocking third-party cookies',
      text: `<p><b>Did you know?</b> You can change the settings of your browser to <b>block third-party cookies</b>. Targeted marketing is advertising matched to people based on their attributes or browsing history (Figure 11.6).</p>`,
      tip: 'Try it: tick “Block third-party cookies” and reload a website.',
      async on(a, ctx) { a.reset(); a.visit('shop'); a.view('tr'); a.visit('football'); if (!(await ctx.sleep(1800))) return; a.focus('block'); a.block(true); if (!(await ctx.sleep(1200))) return; a.visit('weather'); },
    },
  ],
});

FD.activities({
  section: 'cookies',
  items: [
    {
      id: 'cookies-discuss',
      title: 'Cookies and individuals',
      task: '<p><b>Discuss</b> how the use of cookies by organisations impacts on individuals. <small>(Chapter question 11, 8 marks)</small></p><p>Write a balanced answer: positive impacts, negative impacts and a conclusion.</p>',
      lines: 10,
      hint: 'Positive: stay logged in, basket remembered, personalised content and adverts that are more relevant. Negative: tracking across websites, privacy, form data (name, address, card) stored, targeted marketing. Mention that cookies can be encrypted, deleted, set to expire, and that third-party cookies can be blocked.',
      sim: ['cookies', 'Use the cookie simulation again'],
    },
  ],
});

FD.check({
  section: 'cookies',
  items: [
    { type: 'multi', q: 'State <b>three</b> examples of data that can be stored in cookies. <small>(Chapter question 8)</small>', need: 3, opts: [['The time and date of the transaction', true], ['The referring website', true], ['Items added to the shopping basket', true], ['The colour of the user’s computer', false], ['The user’s blood group', false]], why: 'Also IP addresses, products viewed or bought, buttons pressed and data entered into web forms.' },
    { type: 'mcq', q: 'State the difference between session cookies and persistent cookies. <small>(Chapter question 9)</small>', opts: ['Session cookies are deleted when the page is closed; persistent cookies stay and record use over time', 'Session cookies are encrypted; persistent cookies are not', 'Persistent cookies are only for adverts', 'There is no difference'], why: 'Persistent cookies can keep a user logged in.' },
    { type: 'mcq', q: 'State <b>one</b> drawback of the use of third-party cookies. <small>(Chapter question 7)</small>', opts: ['They let advertisers track the user’s browsing across different websites', 'They make web pages load faster', 'They keep you logged in', 'They are deleted when the page is closed'], why: 'Ad servers can see every page their banner was loaded from.' },
    { type: 'tf', q: 'Transactional data only means data moved during financial transactions.', a: false, why: 'It relates to the movement of any data between connected devices.' },
    { type: 'mcq', q: 'What is an <b>ad server</b>?', opts: ['A web server that stores, delivers and often tracks banner advertisements', 'A person who sells adverts', 'A cookie that keeps you logged in', 'A browser setting'], why: 'It stores a cookie each time its banner loads.' },
  ],
});
