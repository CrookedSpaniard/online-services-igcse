FD.add({
  id: 'hosted',
  title: 'Hosted applications software',
  tab: 'Hosted apps',
  icon: 'hosted',
  color: '--c4',
  section: true,
  interactive: true,
  vocab: [
    ['Hosted application (web app)', 'An application stored and run on an online server; its user interface is displayed in a web browser.'],
    ['Application loading time', 'How long it takes an application to load.'],
    ['Unresponsive', 'Not reacting to something or not affected by it.'],
    ['Edit', '(noun) a change to a document.'],
  ],
  mount(el) {
    const HOSTED_F = ['Fonts and styles', 'Tables', 'Comments', 'Chat', 'Track edits', 'Share a link'];
    const LOCAL_F = ['Fonts and styles', 'Tables', 'Comments', 'Track changes', 'Mail merge', 'Macros', 'Advanced layout', 'Offline use'];
    el.innerHTML = `
      <div class="sim hs-s">
        <div class="ptabs" role="group" aria-label="Simulations"><button data-p="app">🌐 Hosted v local</button><button data-p="collab">👥 Working together</button><button data-p="table">📋 Table 12.1</button></div>
        <div data-panel="app" class="hs-app">
          <div class="hs-net sim-box" data-zone="net">
            <label class="small">Latency <b id="latV"></b><input type="range" id="lat" min="20" max="900" step="20"></label>
            <label class="small">Bandwidth <b id="bwV"></b><input type="range" id="bw" min="1" max="100" step="1"></label>
            <label class="tgl small"><input type="checkbox" id="off"> 📵 No internet connection</label>
          </div>
          <div class="hs-two">
            <div class="win" data-zone="hosted"><div class="win-bar">🌐 Browser · https://docs.bs-cloud.example</div>
              <div class="win-body">
                <div class="hs-load" id="load"><button class="btn primary" id="open">Open the web app</button><div class="rm-meter"><i id="lbar"></i></div><small id="ltime"></small></div>
                <div class="hs-doc" id="hdoc" hidden>
                  <div class="hs-tools" data-zone="hfeat">${HOSTED_F.map((f) => `<span class="pill">${f}</span>`).join('')}</div>
                  <input type="text" id="hin" placeholder="Type here…" aria-label="Type in the hosted app">
                  <p class="hs-out" id="hout"><span class="muted">What the server sends back appears here</span></p>
                </div>
              </div>
            </div>
            <div class="hs-path" data-zone="server">
              <svg viewBox="0 0 120 150" aria-hidden="true">${FD.dv.server(30, 40)}<path class="hs-wire" d="M0 60H30M90 60H120"/><circle class="hs-pk" id="pk" r="5" cx="-10" cy="60"/><text class="svg-lbl" x="60" y="108">Online server</text><text class="svg-lbl svg-sm" x="60" y="124">runs the app</text></svg>
            </div>
            <div class="win" data-zone="local"><div class="win-bar">💻 Locally installed word processor</div>
              <div class="win-body">
                <div class="hs-tools" data-zone="lfeat">${LOCAL_F.map((f) => `<span class="pill">${f}</span>`).join('')}</div>
                <input type="text" id="lin" placeholder="Type here…" aria-label="Type in the local app">
                <p class="hs-out" id="lout"><span class="muted">Uses this computer’s own resources</span></p>
              </div>
            </div>
          </div>
        </div>
        <div data-panel="collab" class="hs-col" hidden>
          <div class="win"><div class="win-bar">🌐 Shared document · Group project.docx · <span id="who">👤 You · 👤 Sam</span></div>
            <div class="win-body hs-cgrid">
              <div class="hs-paper" id="paper" data-zone="paper"></div>
              <div class="hs-cside">
                <div data-zone="edits"><h5 class="mw-h">✏️ Edits and comments</h5><ul id="edits"></ul></div>
                <div data-zone="chat"><h5 class="mw-h">💬 Chat</h5><ul class="bz-chat" id="chat"></ul><div class="ck-v"><input type="text" id="cin" placeholder="Message…" aria-label="Chat message"><button class="mini-btn" id="csend">Send</button></div></div>
              </div>
            </div>
          </div>
          <div class="chk-btns"><button class="btn" id="mine">✍️ Add my sentence</button><button class="btn ghost" id="sam">👤 Let Sam edit</button></div>
        </div>
        <div data-panel="table" hidden>
          <div class="tbl-wrap"><table class="tbl"><caption class="small">Table 12.1 The benefits and drawbacks of hosted applications</caption><thead><tr><th>Benefits</th><th>Drawbacks</th></tr></thead><tbody>
            <tr data-row="0"><td>Accessible from many types of connected device</td><td>Only accessible using an internet connection</td></tr>
            <tr data-row="1"><td>Can include the use of online data storage to save files online</td><td>User experience can be affected by high latency or low bandwidth</td></tr>
            <tr data-row="2"><td>Features that enable collaboration</td><td>Not as many features as locally installed software</td></tr></tbody></table></div>
          <button class="btn" id="nextRow">Show the next row ▶</button>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.hs-s'), $ = (s) => root.querySelector(s);
    let lat, bw, opened, paper, edits, chat, rows, dead = false, run = 0, q = Promise.resolve();
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const show = FD.panels(root, () => FD.focus(root));

    function net(o = {}) {
      if (o.lat != null) lat = o.lat; if (o.bw != null) bw = o.bw; if (o.off != null) $('#off').checked = o.off;
      $('#lat').value = lat; $('#bw').value = bw;
      $('#latV').textContent = lat + ' ms'; $('#latV').className = lat > 400 ? 'bad-t' : '';
      $('#bwV').textContent = bw + ' Mbps'; $('#bwV').className = bw < 10 ? 'bad-t' : '';
      if ($('#off').checked) { opened = false; $('#hdoc').hidden = true; $('#load').hidden = false; $('#ltime').innerHTML = '<span class="bad-t">✗ No internet connection: the hosted app is not available.</span>'; }
    }
    async function openApp() {
      const r = ++run;
      $('#hdoc').hidden = true; $('#load').hidden = false; opened = false;
      if ($('#off').checked) { $('#ltime').innerHTML = '<span class="bad-t">✗ No internet connection: hosted applications are only available with an internet connection.</span>'; say('Hosted applications are <b>only available with an internet connection</b>. The local app still works.', 'bad'); return; }
      const ms = Math.round(400 + 24000 / bw + lat * 2);
      $('#ltime').textContent = 'Loading the app from the server…';
      await FD.tween(ms, (t) => { if (r === run) $('#lbar').style.width = 100 * t + '%'; });
      if (dead || r !== run) return;
      $('#lbar').style.width = '0';
      $('#ltime').innerHTML = `Application loading time: <b class="${ms > 2500 ? 'bad-t' : 'good-t'}">${(ms / 1000).toFixed(1)} s</b>`;
      $('#load').hidden = true; $('#hdoc').hidden = false; opened = true;
      say(ms > 2500 ? 'Low bandwidth or high latency gives a slow <b>application loading time</b>.' : '✓ The user interface is displayed in the web browser, but the app runs on the server.', ms > 2500 ? 'bad' : 'good');
    }
    async function packet(dir) {
      const c = $('#pk'), from = dir > 0 ? 0 : 120, to = dir > 0 ? 60 : 0;
      await FD.tween(Math.max(120, lat / 2), (t) => c.setAttribute('cx', from + (to - from) * t));
      c.setAttribute('cx', -10);
    }
    function typedHosted(text) {
      const r = run;
      q = q.then(async () => {
        if (dead || r !== run || !opened) return;
        await packet(1); await packet(-1);
        if (dead || r !== run) return;
        $('#hout').textContent = text || ' ';
      });
    }
    async function type(text, ctx) {
      $('#hin').value = ''; $('#lin').value = '';
      for (const ch of text) {
        $('#hin').value += ch; $('#lin').value += ch;
        $('#lout').textContent = $('#lin').value; typedHosted($('#hin').value);
        if (!(await ctx.sleep(110))) return false;
      }
      return true;
    }

    // ---------- collaboration ----------
    function drawPaper() {
      $('#paper').innerHTML = `<h4>Our project: the cloud</h4>${paper.map((p) => `<p class="${p.who === 'Sam' ? 'sam' : 'me'} ${p.ok ? '' : 'pend'}"><span class="pill">${p.who}</span> ${p.t}</p>`).join('')}`;
      $('#edits').innerHTML = edits.map((e, i) => `<li class="${e.done ? 'done' : ''}">${e.who === 'Sam' ? '👤 Sam' : '👤 You'}: ${e.t}${e.done ? ' <span class="good-t">✓ resolved</span>' : ` <button class="mini-btn" data-res="${i}">Resolve</button>`}</li>`).join('') || '<li class="note">No edits yet.</li>';
      $('#chat').innerHTML = chat.map(([w, t]) => `<li class="${w === 'You' ? 'me' : ''}">${w}: ${t}</li>`).join('');
    }
    function mine() { paper.push({ who: 'You', t: 'The cloud lets us store files on servers in data centres.', ok: true }); edits.push({ who: 'You', t: 'added a sentence' }); drawPaper(); say('Because hosted software uses the <b>client-server model</b>, several clients can use the same file at the same time.'); }
    async function sam(ctx) {
      paper.push({ who: 'Sam', t: 'We can open it from any device with a browser.', ok: false }); edits.push({ who: 'Sam', t: 'added a sentence (suggested edit)' });
      edits.push({ who: 'Sam', t: 'comment: “Should we add a picture?”' }); drawPaper();
      chat.push(['Sam', 'Hi! I added the second sentence 🙂']); drawPaper();
      say('Hosted applications often have <b>chat</b> features and <b>tracking</b> features that let users add and resolve <b>edits</b> and comments.');
      if (ctx && !(await ctx.sleep(600))) return;
    }
    function resolve(i) { edits[i].done = true; paper.forEach((p) => { p.ok = true; }); drawPaper(); }
    function send(t) { const v = t || $('#cin').value.trim(); if (!v) return; chat.push(['You', FD.esc(v)]); $('#cin').value = ''; drawPaper(); setTimeout(() => { if (!dead) { chat.push(['Sam', 'OK 👍']); drawPaper(); } }, FD.dur(900)); }
    function row(k) { rows = k ?? Math.min(3, rows + 1); root.querySelectorAll('[data-row]').forEach((r) => { r.hidden = +r.dataset.row >= rows; }); $('#nextRow').disabled = rows >= 3; }

    $('#lat').addEventListener('input', (e) => net({ lat: +e.target.value }));
    $('#bw').addEventListener('input', (e) => net({ bw: +e.target.value }));
    $('#off').addEventListener('change', () => { net(); if (!$('#off').checked) $('#ltime').textContent = 'Connected. Open the web app.'; });
    $('#hin').addEventListener('input', (e) => typedHosted(e.target.value));
    $('#lin').addEventListener('input', (e) => { $('#lout').textContent = e.target.value; });
    $('#cin').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    root.addEventListener('click', (e) => {
      if (e.target.closest('#open')) openApp(); else if (e.target.closest('#mine')) mine(); else if (e.target.closest('#sam')) sam();
      else if (e.target.closest('#csend')) send(); else if (e.target.closest('#nextRow')) row();
      else { const r = e.target.closest('[data-res]'); if (r) resolve(+r.dataset.res); }
    });
    function reset() {
      run++; q = Promise.resolve(); lat = 60; bw = 50; opened = false; $('#off').checked = false; net();
      $('#hdoc').hidden = true; $('#load').hidden = false; $('#ltime').textContent = ''; $('#hin').value = ''; $('#lin').value = '';
      $('#hout').innerHTML = '<span class="muted">What the server sends back appears here</span>'; $('#lout').innerHTML = '<span class="muted">Uses this computer’s own resources</span>';
      paper = [{ who: 'Sam', t: 'The cloud is the internet used to provide software or storage.', ok: true }]; edits = []; chat = []; drawPaper(); row(0);
      show('app'); say(''); FD.focus(root);
    }
    reset();
    return {
      reset, show, net, openApp, type, mine, sam, resolve, send, row,
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; run++; },
    };
  },
  steps: [
    {
      title: 'Web apps run on a server',
      text: `<p>Web applications (<b>web apps</b>) are stored on <b>online servers</b>. The application runs on an online server and the <b>user interface</b> is displayed in a <b>web browser</b> (Figure 12.1).</p>
             <p>Web apps are also known as <strong>hosted applications</strong> because the software is <b>hosted</b> on a server. See the client-server model in <i>Unit 2 Connectivity</i> (page 89).</p>`,
      tip: 'Try it: open the web app and type in both apps.',
      async on(a, ctx) { a.reset(); a.focus(['hosted', 'server']); await a.openApp(); if (!(await ctx.sleep(500))) return; await a.type('Hello cloud', ctx); },
    },
    {
      title: 'Latency and bandwidth',
      text: `<p>Hosted applications are <b>only available with an internet connection</b> and can be affected by <b>latency</b> and <b>bandwidth</b>, which can create a poor user experience.</p>
             <p>They can lead to slow <strong>application loading times</strong> or a delay between user input and activity in the browser, which makes the application seem <strong>unresponsive</strong>. See <i>Unit 2 Connectivity</i> (pages 67–68).</p>`,
      tip: 'Try it: raise the latency, lower the bandwidth and open the app again. Then tick “No internet connection”.',
      async on(a, ctx) {
        a.reset(); a.focus(['net', 'hosted']); a.net({ lat: 700, bw: 4 }); await a.openApp();
        if (!(await ctx.sleep(400))) return; if (!(await a.type('Why so slow?', ctx))) return;
        if (!(await ctx.sleep(2500))) return; a.net({ off: true }); await a.openApp();
      },
    },
    {
      title: 'Fewer features',
      text: `<p>To reduce latency and the need for bandwidth, hosted applications usually do <b>not offer as many features</b> as some locally installed software, though they may still have some advanced features.</p>
             <p><b>Key point:</b> fewer complex features means <b>less data</b> is processed by the server, which makes the user experience smoother and easier. Hosted applications often use <b>online data storage</b>.</p>`,
      async on(a, ctx) { a.reset(); await a.openApp(); a.focus(['hfeat', 'lfeat']); },
    },
    {
      title: 'Working together',
      text: `<p>Because hosted software uses the <b>client-server model</b>, multiple clients can use the same application or even the <b>same file at the same time</b>. This gives users the ability to work on a document together.</p>
             <p>Many hosted applications also have <b>chat</b> features and <b>tracking</b> features that allow users to add and resolve <strong>edits</strong> and comments.</p>`,
      tip: 'Try it: add your sentence, let Sam edit, chat and resolve the edits.',
      async on(a, ctx) {
        a.reset(); a.show('collab'); a.focus('paper'); if (!(await ctx.sleep(900))) return; a.mine();
        if (!(await ctx.sleep(1300))) return; await a.sam(ctx); a.focus(['edits', 'chat']);
        if (!(await ctx.sleep(1500))) return; a.send('Yes, a picture of a data centre!');
      },
    },
    {
      title: 'Benefits and drawbacks (Table 12.1)',
      text: `<p>Table 12.1 sets out the benefits and drawbacks of hosted applications. For more about collaborative working, see <i>Unit 3 Operating online</i> (page 113), and about locally installed software, <i>Unit 1 Digital devices</i> (pages 42–57).</p>`,
      tip: 'Press “Show the next row”.',
      async on(a, ctx) { a.reset(); a.show('table'); for (let i = 1; i <= 3; i++) { if (!(await ctx.sleep(1300))) return; a.row(i); } },
    },
  ],
});

FD.activities({
  section: 'hosted',
  items: [
    {
      id: 'hosted-local',
      title: 'Hosted and local software (Table 12.2)',
      task: '<p>For each type of application, give <b>one</b> example of a <b>hosted</b> version and <b>one</b> example of a <b>local</b> version. The first one (word processing) has been done for you: <b>Google Docs™</b> (hosted) and <b>LibreOffice Writer</b> (local).</p><p>Then, in the box at the end, list features that they <b>share</b> and any features that are <b>unique</b> to either hosted or local software.</p>',
      fields: ['Image editing · hosted', 'Image editing · local', 'Sound editing · hosted', 'Sound editing · local', 'Presentation · hosted', 'Presentation · local', 'Email · hosted', 'Email · local', 'Social media · hosted', 'Social media · local'],
      lines: 6,
      hint: 'Shared features: what can both do? Unique to hosted: collaboration, chat, access from any device. Unique to local: more advanced features, works offline.',
    },
  ],
});

FD.check({
  section: 'hosted',
  items: [
    { type: 'mcq', q: 'Which <b>one</b> of these is used to store hosted applications? <small>(Chapter 12, question 1)</small>', opts: ['Server', 'Laptop', 'Smartwatch', 'Tablet'], why: 'The app runs on an online server; the interface is shown in a browser.' },
    { type: 'mcq', q: 'What can make a hosted application seem <b>unresponsive</b>?', opts: ['High latency or low bandwidth', 'Too many features', 'A large monitor', 'Using a local app at the same time'], why: 'They cause a delay between user input and activity in the browser.' },
    { type: 'sort', q: 'Benefit or drawback of hosted applications (Table 12.1)?', bins: ['Benefit', 'Drawback'], rows: [['Accessible from many types of connected device', 0], ['Only accessible using an internet connection', 1], ['Features that enable collaboration', 0], ['Not as many features as locally installed software', 1], ['Can use online data storage to save files online', 0], ['Affected by high latency or low bandwidth', 1]], why: 'See Table 12.1.' },
    { type: 'tf', q: 'Hosted applications let several users work on the same file at the same time.', a: true, why: 'Because they use the client-server model.' },
  ],
});
