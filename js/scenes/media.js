FD.add({
  id: 'media',
  title: 'Entertainment providers',
  tab: 'Entertainment',
  icon: 'media',
  color: '--c6',
  section: true,
  interactive: true,
  vocab: [
    ['On demand', 'Content that users can watch or listen to whenever they choose, not at a fixed broadcast time.'],
    ['Streaming', 'Playing video or audio while the data is still arriving over the internet; the file is not kept on the device.'],
    ['Download', 'Copying the whole file from a server and saving it on the device, so it can be used later without a connection.'],
    ['Buffering', 'Waiting while enough data arrives to carry on playing a stream.'],
  ],
  mount(el) {
    // title, emoji, type, length (min)
    const CAT = [
      ['Ocean Rescue', '🌊', 'Film', 98],
      ['Space Cadets', '🚀', 'TV series · episode 1', 42],
      ['Summer Hits', '🎵', 'Music playlist', 55],
      ['History Hour', '🎙️', 'Podcast', 60],
      ['Kitchen Heroes', '🍳', 'TV series · episode 4', 38],
      ['Mountain Quest', '🎮', 'Game (cloud gaming)', 0],
    ];
    // broadcast schedule: time, title
    const TV = [['18:00', 'Evening news'], ['19:30', 'Quiz night'], ['21:00', 'Ocean Rescue (film)']];
    const NOW = '17:40';
    // connections: label, data arriving per tick (the film plays 1 unit per tick)
    const NET = { fast: ['🚀 Fast broadband', 2.6], slow: ['🐢 Slow connection', 0.55], off: ['✈️ No connection', 0] };
    const SIZE = 2.1; // GB for the film

    el.innerHTML = `
      <div class="sim md-s">
        <div class="ptabs" role="group" aria-label="Simulations"><button data-p="demand">📺 On demand</button><button data-p="stream">▶️ Stream or download</button></div>

        <div data-panel="demand" class="md-dem">
          <div class="sim-box md-tv" data-zone="tv">
            <h5 class="mw-h">📡 Broadcast TV · today</h5>
            <p class="small">Now: <b>${NOW}</b></p>
            <ul class="md-sched">${TV.map(([t, n], i) => `<li><button class="md-slot" data-tv="${i}"><b>${t}</b><span>${n}</span></button></li>`).join('')}</ul>
          </div>
          <div class="sim-box md-cat" data-zone="cat">
            <h5 class="mw-h">🍿 PlayNow · on-demand catalogue</h5>
            <div class="md-grid">${CAT.map(([n, e, t], i) => `<button class="md-item" data-c="${i}"><span class="md-e">${e}</span><b>${n}</b><small>${t}</small></button>`).join('')}</div>
          </div>
          <div class="sim-box md-play" data-zone="player">
            <h5 class="mw-h">🖥️ Your screen</h5>
            <div class="md-scr" id="dScr"><span class="muted">Choose something to watch.</span></div>
            <div class="md-ctl"><button class="mini-btn" id="dBack" disabled>⏪ 10 s</button><button class="mini-btn" id="dPause" disabled>⏸ Pause</button></div>
          </div>
        </div>

        <div data-panel="stream" class="md-str" hidden>
          <div class="sim-box md-opts" data-zone="opts">
            <h5 class="mw-h">🌊 Ocean Rescue · film · ${SIZE} GB</h5>
            <p class="seg-l">How do you get it?</p>
            <div class="seg" id="mode"><button data-v="stream">▶️ Stream</button><button data-v="download">⬇️ Download</button></div>
            <p class="seg-l">Internet connection</p>
            <div class="seg" id="net" data-zone="net">${Object.entries(NET).map(([k, [n]]) => `<button data-v="${k}">${n}</button>`).join('')}</div>
            <div class="md-go"><button class="btn primary" id="go">▶ Play</button><button class="btn ghost" id="again">↺ Start again</button></div>
            <div class="md-disk" data-zone="disk"><span>💾 Storage used on this tablet</span><span class="bar"><i id="disk"></i></span><small id="diskT"></small></div>
          </div>
          <div class="sim-box md-player" data-zone="pl">
            <h5 class="mw-h">🖥️ Player</h5>
            <div class="md-scr big" id="sScr"><span class="md-e">🌊</span></div>
            <div class="md-track" aria-hidden="true"><i class="md-buf" id="buf"></i><i class="md-pos" id="pos"></i></div>
            <p class="small md-key"><span class="k1"></span> data received <span class="k2"></span> watched</p>
            <p class="small" id="state">Ready.</p>
          </div>
          <table class="md-cmp" data-zone="cmp">
            <thead><tr><th></th><th>▶️ Streaming</th><th>⬇️ Download</th></tr></thead>
            <tbody>
              <tr><th>Starts playing</th><td>Almost at once</td><td>When the whole file has arrived</td></tr>
              <tr><th>Connection</th><td>Needed all the time, with enough bandwidth</td><td>Only while downloading; then it plays offline</td></tr>
              <tr><th>Storage on the device</th><td>Very little (a small buffer)</td><td>The whole file (a film can be 2 GB or more)</td></tr>
              <tr><th>Slow connection</th><td>Buffering or lower quality</td><td>The download takes longer</td></tr>
              <tr><th>Best for</th><td>Watching at home on good Wi-Fi</td><td>Flights, journeys, places with no signal</td></tr>
            </tbody>
          </table>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;

    const root = el.querySelector('.md-s'), $ = (s) => root.querySelector(s);
    let dead = false, run = 0, mode, net, buf, pos, saved, playing, dTimer = null, dPos = 0, dPaused = false;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const show = FD.panels(root, () => { stopAll(); FD.focus(root); });

    // ---------- on demand v broadcast ----------
    function stopDemand() { clearInterval(dTimer); dTimer = null; }
    function drawDemand(i) {
      const [n, e, t, len] = CAT[i];
      const m = Math.floor(dPos / 60), s = String(dPos % 60).padStart(2, '0');
      $('#dScr').innerHTML = `<span class="md-e">${e}</span><b>${n}</b><small>${t}${len ? ` · ${m}:${s} / ${len}:00` : ' · playing on a remote server'}</small>${dPaused ? '<em>⏸ Paused</em>' : ''}`;
    }
    function pickDemand(i) {
      stopDemand();
      root.querySelectorAll('.md-item').forEach((b) => b.classList.toggle('on', +b.dataset.c === i));
      root.querySelectorAll('.md-slot').forEach((b) => b.classList.remove('on', 'wait'));
      dPos = 0; dPaused = false;
      $('#dScr').dataset.c = i;
      drawDemand(i);
      $('#dBack').disabled = $('#dPause').disabled = false;
      $('#dPause').textContent = '⏸ Pause';
      dTimer = setInterval(() => { if (!dead && !dPaused) { dPos += 1; drawDemand(i); } }, FD.dur(250));
      say(`✓ <b>On demand:</b> it starts at ${NOW}, when <b>you</b> choose. You can pause it and rewind it.`, 'good');
    }
    function pickTv(i) {
      stopDemand();
      root.querySelectorAll('.md-item').forEach((b) => b.classList.remove('on'));
      root.querySelectorAll('.md-slot').forEach((b) => { b.classList.toggle('wait', +b.dataset.tv === i); b.classList.remove('on'); });
      const [t, n] = TV[i];
      const [h, m] = t.split(':').map(Number), mins = h * 60 + m - (17 * 60 + 40);
      $('#dScr').innerHTML = `<span class="md-e">⏳</span><b>${n}</b><small>Starts at ${t}: wait ${Math.floor(mins / 60)} h ${mins % 60} min</small>`;
      $('#dBack').disabled = $('#dPause').disabled = true;
      say(`Broadcast TV is shown at a <b>fixed time</b>. Everyone watches it at ${t}, or misses it.`, 'bad');
    }
    function pause() {
      dPaused = !dPaused;
      $('#dPause').textContent = dPaused ? '▶ Play' : '⏸ Pause';
      drawDemand(+$('#dScr').dataset.c);
    }
    function back() { dPos = Math.max(0, dPos - 10); drawDemand(+$('#dScr').dataset.c); }

    // ---------- stream or download ----------
    function setMode(v) { mode = v; FD.segSet($('#mode'), v); $('#go').textContent = v === 'stream' ? '▶ Play' : (saved ? '▶ Play from the tablet' : '⬇ Download'); }
    function setNet(v) { net = v; FD.segSet($('#net'), v); }
    function drawTrack() {
      $('#buf').style.width = Math.min(100, buf) + '%';
      $('#pos').style.width = Math.min(100, pos) + '%';
      const used = 3.4 + (saved ? SIZE : 0) + (mode === 'stream' && playing ? 0.05 : 0);
      $('#disk').style.width = (used / 32) * 100 + '%';
      $('#diskT').textContent = `${used.toFixed(1)} GB of 32 GB${saved ? ' · Ocean Rescue saved' : ''}`;
    }
    function state(h) { $('#state').innerHTML = h; }
    async function play() {
      const my = ++run;
      const rate = NET[net][1];
      if (mode === 'download' && !saved) return download(my, rate);
      if (mode === 'download' && saved) {
        // plays from the file on the tablet: no connection needed
        playing = true; buf = 100; pos = 0; drawTrack();
        state(`▶ Playing from the tablet${net === 'off' ? ' with <b>no connection</b>' : ''}.`);
        $('#sScr').classList.add('on');
        await FD.tween(3200, (t) => { if (my === run && !dead) { pos = t * 100; drawTrack(); } });
        if (my !== run || dead) return;
        playing = false; $('#sScr').classList.remove('on');
        say('✓ The downloaded film played from <b>storage</b>, so it works on a plane or anywhere without a signal.', 'good');
        state('Finished.');
        return;
      }
      // streaming
      if (!rate) { state('⚠️ No connection: nothing arrives, so nothing can be streamed.'); say('Streaming needs a <b>connection all the time</b>. With no connection you cannot watch.', 'bad'); FD.shake($('#sScr')); return; }
      playing = true; buf = 0; pos = 0; drawTrack();
      let stalls = 0;
      state('Loading…');
      while (pos < 100) {
        await FD.wait(70);
        if (my !== run || dead) return;
        buf = Math.min(100, buf + rate * 1.1);
        const ahead = buf - pos;
        if (ahead > 2 || buf >= 100) {
          pos = Math.min(buf, pos + 1.1);
          $('#sScr').classList.add('on'); $('#sScr').classList.remove('wait');
          state(`▶ Streaming · quality <b>${net === 'fast' ? 'HD 1080p' : '480p (lowered)'}</b>`);
        } else {
          if (!$('#sScr').classList.contains('wait')) stalls++;
          $('#sScr').classList.add('wait'); $('#sScr').classList.remove('on');
          state('⏳ Buffering… waiting for more data');
        }
        drawTrack();
        if (net === 'slow' && pos > 25) break;
      }
      playing = false; drawTrack();
      $('#sScr').classList.remove('on', 'wait');
      if (net === 'slow') {
        state(`Stopped after ${stalls} buffering pauses.`);
        say('The data arrives <b>more slowly</b> than the film plays, so it keeps <b>buffering</b> and the quality drops. Streaming needs enough <b>bandwidth</b>.', 'bad');
      } else {
        state('Finished. Nothing was saved on the tablet.');
        say('✓ <b>Streaming:</b> the film started almost at once and played while the data was still arriving. It was <b>not saved</b> on the tablet.', 'good');
      }
    }
    async function download(my, rate) {
      if (!rate) { state('⚠️ No connection: the download cannot start.'); say('You need a connection to <b>download</b> the file first.', 'bad'); FD.shake($('#sScr')); return; }
      buf = 0; pos = 0; drawTrack();
      state('⬇ Downloading… you cannot watch until it finishes.');
      while (buf < 100) {
        await FD.wait(70);
        if (my !== run || dead) return;
        buf = Math.min(100, buf + rate * 1.6);
        state(`⬇ Downloading… ${Math.round(buf)}% (${(SIZE * buf / 100).toFixed(1)} of ${SIZE} GB)`);
        drawTrack();
      }
      saved = true; setMode('download'); drawTrack();
      state('✓ Downloaded and saved on the tablet.');
      say(`✓ The whole file (${SIZE} GB) is now <b>stored</b> on the tablet. Try <b>No connection</b> and press Play.`, 'good');
    }
    function resetStream() {
      run++; playing = false; saved = false; buf = 0; pos = 0;
      $('#sScr').classList.remove('on', 'wait');
      setNet('fast'); setMode('stream'); state('Ready.'); drawTrack();
    }
    $('#mode').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { run++; setMode(b.dataset.v); state('Ready.'); } });
    $('#net').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { run++; setNet(b.dataset.v); state('Ready.'); } });
    $('#go').addEventListener('click', () => play());
    $('#again').addEventListener('click', () => { resetStream(); say(''); });

    root.addEventListener('click', (e) => {
      const c = e.target.closest('.md-item'), t = e.target.closest('.md-slot');
      if (c) pickDemand(+c.dataset.c);
      else if (t) pickTv(+t.dataset.tv);
    });
    $('#dPause').addEventListener('click', pause);
    $('#dBack').addEventListener('click', back);

    function stopAll() { run++; stopDemand(); }
    function reset() {
      stopAll();
      root.querySelectorAll('.md-item, .md-slot').forEach((b) => b.classList.remove('on', 'wait'));
      $('#dScr').innerHTML = '<span class="muted">Choose something to watch.</span>';
      $('#dBack').disabled = $('#dPause').disabled = true;
      resetStream(); say(''); show('demand');
    }
    reset();
    return {
      reset, show, pickDemand, pickTv, pause, setMode, setNet, play, resetStream,
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; stopAll(); },
    };
  },
  steps: [
    {
      title: 'Entertainment providers',
      text: `<p><b>Entertainment providers</b> offer films, TV series, music, podcasts, games and e-books online.</p>
             <p>Users often pay a monthly <b>subscription</b>, or pay for each item they rent or buy. The three ways of getting the content are <b>on demand</b>, <b>streaming</b> and <b>downloads</b>.</p>`,
      tip: 'This section completes the specification (4.1.1): entertainment providers.',
      on: (a) => { a.reset(); a.focus('cat'); },
    },
    {
      title: 'On demand',
      text: `<p>Broadcast TV and radio are shown at a <b>fixed time</b>: if you miss the programme, you miss it.</p>
             <p><strong>On demand</strong> services let users watch or listen <b>whenever they choose</b>. They can also pause, rewind and carry on later.</p>`,
      tip: 'Try it: choose the film on the TV schedule, then in the catalogue.',
      async on(a, ctx) { a.reset(); a.focus(['tv', 'cat']); if (!(await ctx.sleep(700))) return; a.pickTv(2); if (!(await ctx.sleep(2200))) return; a.pickDemand(0); },
    },
    {
      title: 'Streaming',
      text: `<p><strong>Streaming</strong> plays the video or audio <b>while the data is still arriving</b> over the internet. It starts almost at once.</p>
             <p>The file is <b>not kept</b> on the device, so it uses very little storage, but it needs a <b>connection all the time</b>.</p>`,
      tip: 'Try it: choose Stream and Fast broadband, then press Play.',
      async on(a) { a.show('stream'); a.resetStream(); a.focus(['pl', 'disk']); await a.play(); },
    },
    {
      title: 'Bandwidth and buffering',
      text: `<p>If the data arrives <b>more slowly</b> than the film plays, the player has to wait: this is <strong>buffering</strong>.</p>
             <p>Streaming services lower the <b>quality</b> on slow connections. Streaming high-quality video needs a lot of <b>bandwidth</b>.</p>`,
      tip: 'Try it: choose Slow connection and press Play.',
      async on(a) { a.show('stream'); a.resetStream(); a.setNet('slow'); a.focus(['net', 'pl']); await a.play(); },
    },
    {
      title: 'Downloads',
      text: `<p>A <strong>download</strong> copies the <b>whole file</b> from the provider’s server and saves it on the device.</p>
             <p>You have to wait until it has finished, and it uses <b>storage space</b>, but then it can be played with <b>no connection</b>, for example on a plane. Some downloads are <b>rented</b> and stop working after a time.</p>`,
      tip: 'Try it: download the film, choose No connection and press Play.',
      async on(a, ctx) { a.show('stream'); a.resetStream(); a.setMode('download'); a.focus(['pl', 'disk']); await a.play(); if (!(await ctx.sleep(900))) return; a.setNet('off'); if (!(await ctx.sleep(700))) return; await a.play(); },
    },
    {
      title: 'Stream or download?',
      text: `<p>Choose by thinking about the <b>connection</b> and the <b>storage</b> available.</p>
             <p>Streaming suits good Wi-Fi at home. Downloading suits journeys and places with no signal, if the device has enough free space.</p>`,
      on: (a) => { a.show('stream'); a.resetStream(); a.focus('cmp'); },
    },
  ],
});

FD.check({
  section: 'media',
  items: [
    { type: 'mcq', q: 'What does <b>on demand</b> mean?', opts: ['Users watch or listen whenever they choose', 'Programmes are only shown at a fixed time', 'Every film must be downloaded first', 'Users pay for each minute they watch'], why: 'Broadcast programmes are shown at a fixed time; on-demand content is not.' },
    { type: 'sort', q: 'Is each statement about streaming or downloading?', bins: ['Streaming', 'Downloading'], rows: [['Plays while the data is still arriving', 0], ['Can be watched with no connection once it has finished', 1], ['Saves the whole file in the device’s storage', 1], ['Needs a connection all the time', 0]], why: 'Streaming keeps almost nothing on the device; a download keeps the whole file.' },
    { type: 'mcq', q: 'A streamed film keeps stopping with the message “Buffering…”. What is the most likely cause?', opts: ['The connection’s bandwidth is too low', 'The film has been downloaded', 'The device has too much storage', 'The film is on demand'], why: 'The data arrives more slowly than the film plays.' },
    { type: 'tf', q: 'A downloaded film can be watched on a plane with no internet connection.', a: true, why: 'The whole file is stored on the device.' },
  ],
});
