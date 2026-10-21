FD.add({
  id: 'storage',
  title: 'Online data storage',
  tab: 'Online storage',
  icon: 'storage',
  color: '--c1',
  section: true,
  interactive: true,
  vocab: [
    ['Scalable', 'Something that is able to grow or shrink in order to meet demand, such as at busy times of day.'],
    ['Data protection issues', 'Problems with maintaining security of data and information.'],
  ],
  mount(el) {
    const B = [
      ['backup', 'Files are often backed up automatically'], ['scale', 'The storage is scalable'], ['share', 'Sharing data is easier'],
      ['plans', 'Unlimited storage packages: less need to buy local storage'], ['collab', 'Enables collaboration'], ['free', 'More local storage for apps and local files'],
    ];
    const D = [
      ['country', 'Possible data protection issues if stored in a different country'], ['provider', 'Dependent on the provider for security'], ['slow', 'File transfer speeds much slower than local storage'],
      ['offline', 'Only accessible using an internet connection'], ['nohost', 'Some software not available as hosted applications'], ['pay', 'Often have to pay for more space'],
    ];
    el.innerHTML = `
      <div class="sim st-s">
        <div class="st-devs">
          <div class="sim-box st-dev" data-zone="laptop"><h5 class="mw-h">💻 Laptop <small id="lapState"></small></h5><ul id="lap"></ul><div class="rm-meter"><i id="disk"></i></div><small id="diskT"></small></div>
          <div class="sim-box st-dev st-cloud" data-zone="cloud"><h5 class="mw-h">☁️ BS Drive <small id="loc"></small></h5><ul id="cloud"></ul><div class="rm-meter"><i id="quota"></i></div><small id="quotaT"></small></div>
          <div class="sim-box st-dev" data-zone="phone"><h5 class="mw-h">📱 Phone <small id="net"></small></h5><ul id="phone"></ul></div>
          <div class="sim-box st-dev" data-zone="sam"><h5 class="mw-h">👤 Sam’s tablet</h5><ul id="sam"></ul></div>
        </div>
        <div class="st-acts">
          <div><p class="seg-l good-t">Benefits</p><div class="chips">${B.map(([k, t]) => `<button class="mini-btn st-b" data-a="${k}" data-zone="${k}">${t}</button>`).join('')}</div></div>
          <div><p class="seg-l bad-t">Drawbacks</p><div class="chips">${D.map(([k, t]) => `<button class="mini-btn st-d" data-a="${k}" data-zone="${k}">${t}</button>`).join('')}</div></div>
        </div>
        <div class="st-plans" id="plans" hidden data-zone="planbox"></div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.st-s'), $ = (s) => root.querySelector(s);
    let files, quota, lapOk, online, abroad, shared, dead = false, run = 0;
    const DISK = 256000;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const size = (mb) => (mb >= 1000 ? (mb / 1000).toFixed(1) + ' GB' : mb + ' MB');
    const ic = (n) => ({ docx: '📄', jpg: '🖼️', mp4: '🎬', pptx: '📽️', cad: '📐' }[n.split('.').pop()] || '📁');

    function draw() {
      const L = files.filter((f) => f.local && lapOk), C = files.filter((f) => f.cloud);
      $('#lap').innerHTML = lapOk ? L.map((f) => `<li>${ic(f.n)} ${f.n}<small>${size(f.mb)}${f.cloud ? ' · ☁️ synced' : ' · not synced'}</small></li>`).join('') + files.filter((f) => !f.local && f.cloud).map((f) => `<li class="muted">☁️ ${f.n}<small>online only</small></li>`).join('') : '<li class="bad-t">💥 Broken! All local files lost.</li>';
      $('#lapState').textContent = lapOk ? '' : '(broken)';
      const used = 120000 + L.reduce((s, f) => s + f.mb, 0);
      $('#disk').style.width = (100 * used / DISK) + '%'; $('#diskT').textContent = `Local disk: ${size(used)} of ${size(DISK)} used`;
      $('#cloud').innerHTML = C.map((f) => `<li>${ic(f.n)} ${f.n}<small>${size(f.mb)}${f.v > 1 ? ` · v${f.v}` : ''}</small></li>`).join('') || '<li class="note">Empty</li>';
      const cu = C.reduce((s, f) => s + f.mb, 0);
      $('#quota').style.width = Math.min(100, 100 * cu / quota) + '%'; $('#quota').className = cu > quota * 0.9 ? 'bad' : '';
      $('#quotaT').textContent = quota === Infinity ? `${size(cu)} used · unlimited plan` : `${size(cu)} of ${size(quota)} used`;
      $('#loc').innerHTML = abroad ? '<span class="bad-t">· servers in another country</span>' : '· servers in the EU';
      $('#net').innerHTML = online ? '' : '<span class="bad-t">· offline</span>';
      $('#phone').innerHTML = online ? C.map((f) => `<li><button class="link-btn" data-open="${f.n}">${ic(f.n)} ${f.n}</button></li>`).join('') : '<li class="bad-t">📵 No internet connection: cannot reach the files.</li>';
      $('#sam').innerHTML = shared.length ? (online ? files.filter((f) => shared.includes(f.n)).map((f) => `<li>${ic(f.n)} ${f.n}<small>shared with Sam${f.v > 1 ? ` · v${f.v}` : ''}</small></li>`).join('') : '<li class="bad-t">📵 Offline</li>') : '<li class="note">Nothing shared yet.</li>';
    }
    function mark(k) { root.querySelectorAll('[data-a]').forEach((b) => b.classList.toggle('on', b.dataset.a === k)); FD.focus(root, k ? [k, 'laptop', 'cloud', 'phone', 'sam', 'planbox'] : null); }
    async function sync(ctx) { for (const f of files.filter((x) => x.local && !x.cloud)) { f.cloud = true; draw(); FD.pulse($('#cloud')); if (ctx && !(await ctx.sleep(400))) return; } }
    function plans() {
      const P = $('#plans'); P.hidden = false;
      P.innerHTML = `<b>Storage plans</b> ${[['Free', 15000, '£0'], ['Plus', 100000, '£1.99 a month'], ['Unlimited', Infinity, '£9.99 a month']].map(([n, q, p]) => `<button class="mini-btn ${quota === q ? 'ok' : ''}" data-plan="${q}">${n} · ${q === Infinity ? 'unlimited' : size(q)} · ${p}</button>`).join('')}`;
    }
    async function act(k, ctx) {
      const r = ++run; mark(k);
      const alive = async (ms) => { await FD.wait(ms); return !dead && r === run; };
      $('#plans').hidden = !['scale', 'plans', 'pay'].includes(k);
      if (k === 'backup') {
        await sync(); if (!(await alive(900))) return;
        lapOk = false; draw(); say('💥 The laptop broke, but the files were <b>backed up automatically</b> to online storage.');
        if (!(await alive(1600))) return; lapOk = true; files.forEach((f) => { f.local = true; }); draw(); say('✓ New laptop: everything was downloaded again from online storage.', 'good');
      } else if (k === 'scale' || k === 'plans' || k === 'pay') {
        if (!files.some((f) => f.n === 'Holiday video.mp4')) files.push({ n: 'Holiday video.mp4', mb: 18000, local: true, cloud: false, v: 1 });
        const need = files.reduce((s, f) => s + f.mb, 0);
        plans(); draw();
        if (need > quota) say(k === 'pay' ? 'The video does not fit in the free 15 GB. You <b>often have to pay</b> for additional storage space if more space is needed.' : 'The video does not fit. The storage is <b>scalable</b>: choose a bigger plan and it grows to meet your needs. Many providers offer <b>unlimited</b> packages.', k === 'pay' ? 'bad' : '');
        else { await sync(); say('✓ Everything fits in the current plan.', 'good'); }
      } else if (k === 'share') {
        await sync(); shared = ['Project.docx']; draw(); FD.pulse($('#sam')); say('✓ Instead of emailing a copy, you share a <b>link</b>: sharing data is easier.', 'good');
      } else if (k === 'collab') {
        await sync(); shared = ['Project.docx']; draw(); if (!(await alive(900))) return;
        const f = files.find((x) => x.n === 'Project.docx'); f.v = 2; draw(); FD.pulse($('#cloud'));
        say('✓ Sam edited the shared file and everyone sees the new version: online storage <b>enables collaboration</b>.', 'good');
      } else if (k === 'free') {
        await sync(); files.forEach((f) => { if (f.mb > 500) f.local = false; }); draw();
        say('✓ Big files are kept <b>online only</b>, so there is more local storage for locally installed apps and local files.', 'good');
      } else if (k === 'country') {
        abroad = true; draw(); say('The provider keeps your files on servers in a different country. That country’s laws apply, so there are possible <b>data protection issues</b>.', 'bad');
      } else if (k === 'provider') {
        await sync(); say('⚠️ News: “BS Drive investigates a security breach.” Your files are only as safe as the provider’s security: you are <b>dependent on the online storage provider</b>.', 'bad');
      } else if (k === 'slow') {
        say('Copying 400 MB… <b>Local SSD:</b> <span id="t1">0.0</span> s · <b>Upload to online storage:</b> <span id="t2">0.0</span> s', '');
        const t0 = performance.now();
        await FD.tween(2600, (t) => { if (r !== run) return; const s = (performance.now() - t0) / 1000 * FD.speed; const a = root.querySelector('#t1'), b = root.querySelector('#t2'); if (a) a.textContent = Math.min(0.4, s).toFixed(1); if (b) b.textContent = (t * 64).toFixed(1); });
        if (dead || r !== run) return;
        say('Local SSD: <b>0.4 s</b> · Upload at 50 Mbps: <b>64 s</b>. File transfer speeds are <b>much slower</b> than local storage.', 'bad');
      } else if (k === 'offline') {
        await sync(); online = false; draw(); say('📵 Online data storage is <b>only accessible using an internet connection</b>.', 'bad');
      } else if (k === 'nohost') {
        await sync(); open('Bridge model.cad');
      }
    }
    function open(n) {
      const f = files.find((x) => x.n === n); if (!f) return;
      if (n.endsWith('.cad')) say(`📐 “${n}”: there is no hosted application that can open this file, so it cannot be opened <b>without being downloaded</b> to a device with the right software.`, 'bad');
      else say(`✓ ${ic(n)} ${n} opened on the phone: online storage can be accessed <b>from anywhere, from any device</b> with an internet connection.`, 'good');
    }
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]'), p = e.target.closest('[data-plan]'), o = e.target.closest('[data-open]');
      if (a) act(a.dataset.a);
      else if (p) { quota = +p.dataset.plan; plans(); sync().then(draw); say(`✓ Plan changed to ${quota === Infinity ? 'unlimited' : size(quota)}: the storage scaled up to fit your files.`, 'good'); }
      else if (o) open(o.dataset.open);
    });
    function reset() {
      run++;
      files = [{ n: 'Project.docx', mb: 2, local: true, cloud: true, v: 1 }, { n: 'Photos 2025.jpg', mb: 3400, local: true, cloud: true, v: 1 }, { n: 'Talk.pptx', mb: 40, local: true, cloud: false, v: 1 }, { n: 'Bridge model.cad', mb: 300, local: true, cloud: false, v: 1 }];
      quota = 15000; lapOk = true; online = true; abroad = false; shared = []; $('#plans').hidden = true; mark(''); draw(); say(''); FD.focus(root);
    }
    reset();
    return {
      reset, act, open, sync, draw,
      plan: (q) => { quota = q; plans(); sync().then(draw); },
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; run++; },
    };
  },
  steps: [
    {
      title: 'Online data storage',
      text: `<p>Just like hosted applications, <b>online data storage</b> can be accessed <b>from anywhere</b>, from <b>any device</b> with an internet connection. This also has its benefits and drawbacks (Table 12.3).</p>`,
      tip: 'Try it: open a file from the phone.',
      async on(a, ctx) { a.reset(); a.focus(['laptop', 'cloud']); await a.sync(ctx); if (!(await ctx.sleep(800))) return; a.focus('phone'); a.open('Photos 2025.jpg'); },
    },
    {
      title: 'Backups, sharing and collaboration',
      text: `<p>Benefits of online data storage:</p><ul><li>files are often <b>backed up automatically</b></li><li><b>sharing data</b> is easier</li><li>it <b>enables collaboration</b>.</li></ul>`,
      tip: 'Try it: press the green buttons.',
      async on(a, ctx) { a.reset(); await a.act('backup'); if (!(await ctx.sleep(1200))) return; await a.act('share'); if (!(await ctx.sleep(1800))) return; await a.act('collab'); },
    },
    {
      title: 'Scalable storage',
      text: `<p>The storage is <strong>scalable</strong>: it can grow or shrink to meet demand. Many providers offer <b>unlimited</b> storage packages, so there is less need to buy additional local storage, and there is <b>more local storage</b> for locally installed apps and local files.</p>`,
      tip: 'Try it: choose a bigger plan for the holiday video.',
      async on(a, ctx) { a.reset(); await a.act('scale'); if (!(await ctx.sleep(2000))) return; a.plan(100000); if (!(await ctx.sleep(1600))) return; await a.act('free'); },
    },
    {
      title: 'Drawbacks: security and data protection',
      text: `<p>Drawbacks of online data storage:</p><ul><li>possible <strong>data protection issues</strong> if files are stored on servers in a <b>different country</b></li><li>you are <b>dependent on the online storage provider</b> for security.</li></ul>`,
      async on(a, ctx) { a.reset(); await a.act('country'); if (!(await ctx.sleep(2600))) return; await a.act('provider'); },
    },
    {
      title: 'Drawbacks: speed, connection, software and cost',
      text: `<ul><li>file transfer speeds are <b>much slower</b> than local storage</li><li>only accessible using an <b>internet connection</b></li><li>some software is not available as hosted applications, so files <b>cannot be opened without being downloaded</b></li><li>you often have to <b>pay</b> for additional storage space if more space is needed.</li></ul>`,
      tip: 'Try it: press the red buttons.',
      async on(a, ctx) { a.reset(); await a.act('slow'); if (!(await ctx.sleep(1600))) return; await a.act('offline'); if (!(await ctx.sleep(2000))) return; a.reset(); await a.act('nohost'); if (!(await ctx.sleep(2200))) return; await a.act('pay'); },
    },
  ],
});

FD.activities({
  section: 'storage',
  items: [
    {
      id: 'storage-presentation',
      title: 'Choosing online data storage',
      task: '<p>Create a short presentation (<b>no more than 5 slides</b>) to explain the benefits and drawbacks of online data storage. Try to only use images that are distributed under a <b>free licence</b>.</p><p>Plan your slides here.</p>',
      fields: ['Slide 1 · title', 'Slide 2', 'Slide 3', 'Slide 4', 'Slide 5', 'Where the free-licence images came from'],
      lines: 3,
      hint: 'Use Table 12.3: one slide for benefits, one for drawbacks, one example of a provider, and a conclusion.',
    },
  ],
});

FD.check({
  section: 'storage',
  items: [
    { type: 'multi', q: 'State <b>three</b> benefits of using online data storage. <small>(Chapter 12, question 2)</small>', need: 3, opts: [['Files are often backed up automatically', true], ['The storage is scalable', true], ['Sharing data is easier', true], ['File transfers are faster than local storage', false], ['It works without an internet connection', false]], why: 'Also unlimited packages, collaboration and more local storage.' },
    { type: 'mcq', q: 'What does <b>scalable</b> mean?', opts: ['Able to grow or shrink in order to meet demand', 'Very secure', 'Stored in another country', 'Faster than local storage'], why: 'For example at busy times of day.' },
    { type: 'mcq', q: 'Why might storing files on servers in a different country be a problem?', opts: ['There could be data protection issues', 'The files become bigger', 'The files cannot be shared', 'It is always more expensive'], why: 'Data protection issues are problems with maintaining security of data and information.' },
    { type: 'tf', q: 'File transfer speeds for online storage are much slower than for local storage.', a: true, why: 'Data must travel over the internet connection.' },
  ],
});
