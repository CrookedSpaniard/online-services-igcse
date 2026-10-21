FD.add({
  id: 'auction',
  title: 'Auction sites',
  tab: 'Auctions',
  icon: 'auction',
  color: '--c8',
  section: true,
  interactive: true,
  vocab: [
    ['Auction', 'A public meeting or website where goods or services are sold to the person who offers the most money for them.'],
  ],
  mount(el) {
    const BUYERS = {
      you: { n: 'You (alex_p)', r: 4.8 },
      mia: { n: 'mia_k', r: 4.9, max: 74 },
      fast: { n: 'fastbuy22', r: 2.1, max: 90, nopay: true },
      tom: { n: 'tomas_r', r: 4.6, max: 66 },
    };
    const OTHERS = [
      { e: '🎸', n: 'Acoustic guitar', s: 'music_shop', r: 4.9, p: 'Bid £42 · 2 days left' },
      { e: '🕹️', n: 'Games console', s: 'cheapdeals', r: 1.8, p: 'Bid £30 · 5 hours left', bad: 'Late deliveries · item not as described' },
      { e: '📚', n: 'IGCSE ICT textbook', s: 'books4u', r: 4.7, p: 'Buy it now £18', fixed: true },
    ];
    el.innerHTML = `
      <div class="sim au-s">
        <div class="au-grid">
          <div class="sim-box au-item" data-zone="item">
            <div class="au-head"><span class="au-pic">📷</span><div><b>Vintage film camera</b><small>Seller <b>retro_lens</b> <span class="stars sm">★★★★★</span> 4.9 · 1,204 ratings</small></div></div>
            <div class="au-stats">
              <div data-zone="clock"><small>Time left</small><b id="left">—</b></div>
              <div data-zone="top"><small>Highest bid</small><b id="top">£20.00</b></div>
              <div><small>Bids</small><b id="nb">0</b></div>
            </div>
            <div class="au-bid" data-zone="bid"><span>£</span><input type="number" id="amt" min="0" step="1" aria-label="Your bid"><button class="btn primary" id="bid">Place bid</button><button class="btn ghost" id="start">▶ Start the auction</button></div>
            <ol class="au-hist" id="hist" data-zone="hist"></ol>
            <div class="au-end" id="end" hidden data-zone="end"></div>
          </div>
          <div class="au-side">
            <div class="sim-box" data-zone="seller"><h5 class="mw-h">🧑‍💼 Seller settings (retro_lens)</h5>
              <label class="tgl small"><input type="checkbox" id="onlyGood"> Only accept bids from buyers rated 4★ or more</label></div>
            <div class="sim-box au-phone" data-zone="alerts"><h5 class="mw-h">📱 Your notifications</h5><ul id="alerts"><li class="note">No alerts yet.</li></ul></div>
            <div class="sim-box" data-zone="others"><h5 class="mw-h">🔎 Other listings</h5><ul class="au-others">${OTHERS.map((o, i) => `
              <li class="${o.bad ? 'risky' : ''}" data-zone="${o.fixed ? 'fixed' : o.bad ? 'badseller' : 'o' + i}"><span>${o.e}</span><div><b>${o.n}</b><small>${o.s} <span class="stars sm">${'★'.repeat(Math.round(o.r))}${'☆'.repeat(5 - Math.round(o.r))}</span> ${o.r}${o.bad ? ` · <span class="bad-t">${o.bad}</span>` : ''}</small><small>${o.p}</small></div>${o.fixed ? '<button class="mini-btn" id="bin">Buy it now</button>' : ''}</li>`).join('')}</ul></div>
          </div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.au-s'), $ = (s) => root.querySelector(s);
    let bids, left, running, timer, dead = false, warned, winner;
    const say = (h, cls = '') => { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; };
    const gbp = (n) => '£' + n.toFixed(2);
    const top = () => bids[bids.length - 1];
    const minNext = () => (bids.length ? top().amt + 2 : 20);
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    function alert(h) {
      const a = $('#alerts'); if (a.querySelector('.note')) a.innerHTML = '';
      a.insertAdjacentHTML('afterbegin', `<li>${h}</li>`); FD.pulse(a.firstElementChild);
    }
    function draw() {
      $('#left').textContent = running || left < 60 ? fmt(left) : 'Not started';
      $('#left').classList.toggle('bad-t', running && left <= 15);
      $('#top').textContent = bids.length ? gbp(top().amt) : '£20.00 start';
      $('#nb').textContent = bids.length;
      $('#amt').placeholder = 'at least ' + minNext();
      $('#hist').innerHTML = bids.slice().reverse().map((b) => `<li class="${b.who === 'you' ? 'me' : ''}"><b>${BUYERS[b.who].n}</b> <span class="stars sm">★</span><small>${BUYERS[b.who].r}</small><span>${gbp(b.amt)}</span></li>`).join('') + (bids.rej || []).map((r) => `<li class="rej"><b>${BUYERS[r].n}</b><small>★ ${BUYERS[r].r}</small><span class="bad-t">bid rejected: rating too low</span></li>`).join('');
    }
    function place(who, amt) {
      if (!running) return false;
      if (amt < minNext()) { if (who === 'you') say(`Your bid must be at least ${gbp(minNext())}.`, 'bad'); return false; }
      if ($('#onlyGood').checked && BUYERS[who].r < 4) { (bids.rej = bids.rej || []).push(who); draw(); say(`The seller only accepts offers from buyers with a <b>high rating</b>, so ${BUYERS[who].n} (★ ${BUYERS[who].r}) cannot bid.`); return false; }
      const prev = bids.length ? top().who : null;
      bids.push({ who, amt });
      if (prev === 'you' && who !== 'you') alert(`💬 <b>You have been outbid</b> on Vintage film camera. New highest bid ${gbp(amt)}.`);
      draw();
      return true;
    }
    function bot() {
      const t = bids.length ? top() : null;
      const ready = Object.keys(BUYERS).filter((k) => k !== 'you' && (!t || t.who !== k) && BUYERS[k].max >= minNext() && !($('#onlyGood').checked && BUYERS[k].r < 4 && (bids.rej || []).includes(k)));
      if (!ready.length) return;
      const k = ready[Math.floor(Math.random() * ready.length)];
      place(k, Math.min(BUYERS[k].max, minNext() + Math.floor(Math.random() * 4)));
    }
    function tick() {
      if (dead || !running) return;
      left--;
      if (left === 15 && !warned) { warned = true; alert('⏰ <b>Ending soon:</b> the auction on Vintage film camera ends in 15 seconds.'); }
      if (Math.random() < 0.35) bot();
      draw();
      if (left <= 0) return finish();
      timer = setTimeout(tick, FD.dur(450));
    }
    function start(sec = 60) {
      clearTimeout(timer); bids = []; left = sec; running = true; warned = false; winner = null;
      $('#end').hidden = true; draw();
      say('The item is listed for a <b>certain period of time</b>. Buyers offer money until the time runs out.');
      timer = setTimeout(tick, FD.dur(450));
    }
    function finish() {
      running = false; clearTimeout(timer); left = 0; draw();
      winner = bids.length ? top() : null;
      const e = $('#end'); e.hidden = false;
      if (!winner) { e.innerHTML = '<b>No bids. The item was not sold.</b>'; return; }
      const w = BUYERS[winner.who];
      if (winner.who === 'you') alert(`🎉 <b>You won</b> the Vintage film camera for ${gbp(winner.amt)}. Go to the checkout to pay.`);
      e.innerHTML = `<b>🔨 Sold to ${w.n} for ${gbp(winner.amt)}</b><small>The buyer who offered the most money now completes a <b>checkout</b> process, like on a shopping site.</small>
        <div class="chk-btns"><button class="mini-btn" id="paid">✓ Buyer pays</button><button class="mini-btn" id="nopay">✗ Buyer does not pay</button></div><div id="after"></div>`;
      say(`The auction has ended. The highest bidder, <b>${w.n}</b>, wins.`, 'good');
    }
    function paid() { const a = $('#after'); if (a) a.innerHTML = `<p class="small good-t">✓ Paid on time. The seller rates ${BUYERS[winner.who].n} as a reliable buyer ★★★★★.</p>`; }
    function nopay() {
      if (!winner) return;
      const second = bids.slice(0, -1).reverse().find((b) => b.who !== winner.who);
      const a = $('#after'); if (!a) return;
      a.innerHTML = `<p class="small bad-t">✗ ${BUYERS[winner.who].n} did not pay. Their rating goes down.</p><p class="small">The seller can either:</p>
        <div class="chk-btns"><button class="mini-btn" id="relist">🔁 Try to sell the item again</button>${second ? `<button class="mini-btn" id="second">🥈 Sell to ${BUYERS[second.who].n} for ${gbp(second.amt)}</button>` : ''}</div>`;
      say('If a buyer does not pay, the seller can try to sell the item again or sell it to the buyer who offered the <b>second highest</b> amount of money.');
    }
    function setOnly(on) { $('#onlyGood').checked = on; }
    function buyNow() { alert('🛒 <b>Bought</b> IGCSE ICT textbook for £18.00 at a fixed price: no bidding, no waiting.'); say('Most auction sites also allow sellers to list items for sale with a <b>fixed price</b> (“Buy it now”).', 'good'); }

    root.addEventListener('click', (e) => {
      if (e.target.closest('#start')) start();
      else if (e.target.closest('#bid')) { const v = +$('#amt').value || minNext(); if (!running) start(); if (place('you', v)) { $('#amt').value = ''; say(`✓ You are the highest bidder with ${gbp(v)}.`, 'good'); } }
      else if (e.target.closest('#paid')) paid();
      else if (e.target.closest('#nopay')) nopay();
      else if (e.target.closest('#relist')) start();
      else if (e.target.closest('#second')) { $('#after').insertAdjacentHTML('beforeend', '<p class="small good-t">✓ Offered to the second highest bidder.</p>'); }
      else if (e.target.closest('#bin')) buyNow();
    });
    $('#amt').addEventListener('keydown', (e) => { if (e.key === 'Enter') root.querySelector('#bid').click(); });

    function reset() { clearTimeout(timer); bids = []; left = 60; running = false; warned = false; winner = null; setOnly(false); $('#end').hidden = true; $('#alerts').innerHTML = '<li class="note">No alerts yet.</li>'; draw(); say(''); FD.focus(root); }
    reset();
    return {
      reset, start, place, bot, finish, nopay, paid, setOnly, buyNow,
      fast: async (ctx, n) => { for (let i = 0; i < n && running; i++) { left = Math.max(1, left - 4); bot(); draw(); if (!(await ctx.sleep(500))) return false; } return true; },
      end: () => { left = 1; },
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; clearTimeout(timer); },
    };
  },
  steps: [
    {
      title: 'How an auction works',
      text: `<p><strong>Auction</strong> sites allow sellers to list items for sale for a <b>certain period of time</b> and allow buyers to <b>offer money</b> for these items.</p>
             <p>When the auction ends, the buyer who has offered the <b>most money</b> completes a <b>checkout</b> process similar to that used on shopping sites.</p>`,
      tip: 'Try it: start the auction and place your own bids before the time runs out.',
      async on(a, ctx) { a.reset(); a.focus(['item']); a.start(40); if (!(await ctx.sleep(1500))) return; a.place('you', 30); },
    },
    {
      title: 'Fixed price',
      text: `<p>Most auction sites also allow sellers to list items for sale with a <b>fixed price</b>: the buyer pays that price straight away, without bidding.</p>`,
      tip: 'Try it: press “Buy it now” on the textbook.',
      async on(a, ctx) { a.reset(); a.focus('fixed'); if (!(await ctx.sleep(1200))) return; a.buyNow(); },
    },
    {
      title: 'Ratings for buyers',
      text: `<p>Auction sites provide <b>ratings for buyers</b>. A buyer with a high rating has been rated by sellers for being <b>reliable</b> and <b>paying on time</b>. Sellers can choose to <b>only accept offers</b> from buyers with a high rating.</p>
             <p>If a buyer does not pay, the seller can try to sell the item again, or sell it to the buyer who offered the <b>second highest</b> amount of money.</p>`,
      tip: 'Try it: tick the seller setting, start again and see fastbuy22 (★ 2.1) get rejected.',
      async on(a, ctx) {
        a.reset(); a.focus(['seller', 'hist']); a.setOnly(true); a.start(30);
        if (!(await ctx.sleep(400))) return; a.place('fast', 25);
        if (!(await ctx.sleep(1800))) return; a.setOnly(false); a.place('fast', 50); a.place('mia', 56); a.place('fast', 80); a.finish(); a.focus('end');
        if (!(await ctx.sleep(1400))) return; a.nopay();
      },
    },
    {
      title: 'Ratings for sellers',
      text: `<p>Auction sites also provide <b>ratings for sellers</b>. A seller with a high rating has been rated by buyers for being reliable and <b>sending items promptly</b>. Buyers can choose not to bid on items being sold by <b>unreliable sellers</b>.</p>`,
      async on(a) { a.reset(); a.focus(['badseller', 'item']); },
    },
    {
      title: 'Outbid and ending-soon alerts',
      text: `<p>If a buyer offers money for an item but someone else offers more money, some auction sites <b>alert</b> the first buyer via <b>email or app notifications</b>.</p>
             <p>Some services also alert customers if an auction on an item they have looked at is <b>going to end soon</b>, so that they do not miss their chance to make an offer.</p>`,
      tip: 'Try it: bid, wait to be outbid, then bid again in the last 15 seconds.',
      async on(a, ctx) { a.reset(); a.focus(['alerts', 'hist']); a.start(22); if (!(await ctx.sleep(500))) return; a.place('you', 26); if (!(await ctx.sleep(900))) return; a.place('tom', 30); },
    },
  ],
});

FD.check({
  section: 'auction',
  items: [
    { type: 'mcq', q: 'Who wins an online auction?', opts: ['The buyer who has offered the most money when the auction ends', 'The first buyer to make an offer', 'The buyer with the highest rating', 'The seller'], why: 'The winner then completes a checkout process.' },
    { type: 'mcq', q: 'Explain why auction sites provide ratings for buyers. <small>(Chapter question 4)</small>', opts: ['So sellers can see which buyers are reliable and pay on time, and only accept offers from them', 'So buyers get a discount', 'So the auction lasts longer', 'So the site can show adverts'], why: 'A high rating means the buyer has been rated by sellers for being reliable and paying on time.' },
    { type: 'mcq', q: 'A buyer wins but does not pay. What can the seller do?', opts: ['Sell the item again, or sell it to the second highest bidder', 'Take the money from the buyer’s bank', 'Nothing: the item is lost', 'Give the item to the buyer anyway'], why: 'See page 171.' },
    { type: 'tf', q: 'Some auction sites send an alert when someone offers more money than you.', a: true, why: 'Via email or app notifications. Some also alert you when an auction is ending soon.' },
  ],
});
