FD.add({
  id: 'start',
  title: 'Start here',
  tab: 'Start',
  icon: 'start',
  color: '--accent',
  page: true,
  mount(el) {
    const S = FD.state;
    const part = (p) => `
      <section class="card st-part">
        <h3>Part ${p} · ${FD.PARTS[p].name} <small>${FD.PARTS[p].ch}, ${FD.PARTS[p].pages}</small></h3>
        <ul class="st-list">${FD.SECTIONS.filter((s) => s.part === p).map((s) => `
          <li><button data-go="${s.id}" style="--c:var(${s.color})">${FD.icon[s.id]}<span><b>${FD.SECTIONS.indexOf(s) + 1}. ${s.name}</b><small>${s.line}</small></span>${FD.state.checks['check-' + s.id] ? '<span class="st-done" title="Check done">✓</span>' : ''}</button></li>`).join('')}
          <li><button data-go="test${p}" style="--c:var(--red-ui)">${FD.icon.final}<span><b>Test Part ${p}</b><small>Multiple choice + exam-style questions</small></span>${S.tests['test' + p] && S.tests['test' + p].done ? '<span class="st-done">✓</span>' : ''}</button></li>
        </ul>
      </section>`;
    const tiles = [
      ['🛒', 'Shopping'], ['🎫', 'Booking'], ['🏦', 'Banking'],
      ['🎓', 'Learning'], ['🎮', 'Gaming'], ['📰', 'News'],
      ['🔨', 'Auctions'], ['🍪', 'Cookies'], ['🌐', 'Web apps'],
    ];
    const cloud = 'M150 196h120a32 32 0 0 0 4-64 46 46 0 0 0-88-12 36 36 0 0 0-36 76z';
    el.innerHTML = `
      <section class="card st-hero">
        <div>
          <p class="kick">Unit 4 · Online goods and services · Pearson Edexcel International GCSE ICT</p>
          <h2>Online services and the cloud</h2>
          <p>Before the internet, people used the telephone or the post to shop, study or book flights. Now we can use <b>online services</b> anywhere, with any connected device. In this lesson you will try out <b>shopping</b>, <b>booking</b>, <b>banking</b>, <b>learning</b>, <b>gaming</b>, <b>news</b>, <b>entertainment</b> and <b>auction</b> services, see their <b>impact</b> on people and organisations, follow your data in <b>cookies</b>, and finish in <b>the cloud</b>: hosted applications and online data storage.</p>
          <div class="who">
            <label>Your name<input id="sName" autocomplete="name" placeholder="First name and surname" value="${FD.esc(S.name)}"></label>
            <label>Class<input id="sClass" placeholder="e.g. 10B" value="${FD.esc(S.cls)}"></label>
          </div>
          <p class="small" id="sMsg">Your name goes on the results you send to your teacher.</p>
          <div class="chk-btns">
            <button class="btn primary" id="sGo">${S.last && S.last !== 'start' ? '▶ Continue where I left off' : '▶ Start Part A'}</button>
            <button class="btn ghost" id="sProg" style="color:#fff;border-color:rgb(255 255 255 / .4)">${FD.icon.progress} My progress</button>
          </div>
        </div>
        <svg class="st-net st-flow" viewBox="0 0 420 230" role="img" aria-label="Online services all around the cloud">
          <path class="st-cloud" d="${cloud}" transform="translate(-0 -40)"/>
          <text x="210" y="128" class="st-ct">☁️ The cloud</text>
          ${tiles.map(([e, n], i) => {
            const a = (i / tiles.length) * Math.PI * 2 - Math.PI / 2;
            const x = 210 + Math.cos(a) * 168, y = 118 + Math.sin(a) * 92;
            return `<line class="st-l" x1="210" y1="118" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/><circle class="st-bit" r="3.2"><animateMotion dur="3s" begin="${(i * 0.33).toFixed(2)}s" repeatCount="indefinite" path="M${x.toFixed(1)} ${y.toFixed(1)}L210 118"/></circle>
              <g><rect class="nd" x="${(x - 46).toFixed(1)}" y="${(y - 15).toFixed(1)}" width="92" height="30" rx="9"><animate attributeName="fill" values="rgb(255 255 255 / .07);rgb(246 201 76 / .35);rgb(255 255 255 / .07)" dur="9s" begin="${i}s" repeatCount="indefinite"/></rect><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}">${e} ${n}</text></g>`;
          }).join('')}
        </svg>
      </section>

      <section class="card">
        <h3>How to use this website on your own</h3>
        ${FD.HOWTO}
      </section>

      <div class="st-cols">${part('A')}${part('B')}</div>
      <p class="small muted">Your progress is saved in this browser only. Nothing is sent to the internet. The shops, banks, people and websites in the simulations are made up, and nothing can really be bought or paid for.</p>`;
    const $ = (s) => el.querySelector(s);
    $('#sName').addEventListener('input', (e) => { FD.state.name = e.target.value; FD.save(); });
    $('#sClass').addEventListener('input', (e) => { FD.state.cls = e.target.value; FD.save(); });
    $('#sGo').addEventListener('click', () => {
      if (FD.state.last && FD.state.last !== 'start') FD.goto(FD.state.last, FD.state.step || 0);
      else FD.goto('shopping');
    });
    $('#sProg').addEventListener('click', FD.openProgress);
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => FD.goto(b.dataset.go)));
  },
});
