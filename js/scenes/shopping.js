FD.add({
  id: 'shopping',
  title: 'Shopping sites',
  tab: 'Shopping',
  icon: 'shopping',
  color: '--c4',
  section: true,
  interactive: true,
  vocab: [
    ['Product catalogue', 'A list of products that can be bought.'],
    ['Rating', 'A measurement of how good or how popular something or someone is.'],
    ['Voucher code', 'A code representing a specified amount of money that can be used on a shopping website to purchase goods or services.'],
  ],
  mount(el) {
    const P = [
      { id: 1, e: '📱', n: 'Nova 8 smartphone', d: '6.1-inch screen, 128 GB, dual camera', c: 'Tech', s: 'Phones', p: 299, r: 4.5, sold: 412, code: 'TP-1082', stock: 14 },
      { id: 2, e: '🎧', n: 'Wireless headphones', d: 'Noise cancelling, 30-hour battery', c: 'Tech', s: 'Audio', p: 59, r: 4.2, sold: 980, code: 'TA-2210', stock: 3 },
      { id: 3, e: '💻', n: 'Study laptop', d: '14-inch, 8 GB RAM, 256 GB SSD', c: 'Tech', s: 'Laptops', p: 449, r: 4.7, sold: 205, code: 'TL-3304', stock: 0 },
      { id: 4, e: '⌚', n: 'Fitness smartwatch', d: 'Heart rate, GPS, notifications', c: 'Tech', s: 'Phones', p: 129, r: 3.9, sold: 150, code: 'TP-1190', stock: 22 },
      { id: 5, e: '👟', n: 'Running trainers', d: 'Lightweight, sizes 3–12', c: 'Clothes', s: 'Shoes', p: 65, r: 4.6, sold: 640, code: 'CS-4410', stock: 8 },
      { id: 6, e: '🧥', n: 'Rain jacket', d: 'Waterproof, with a hood', c: 'Clothes', s: 'Coats', p: 39, r: 4.1, sold: 310, code: 'CC-5120', stock: 30 },
      { id: 7, e: '☕', n: 'Coffee maker', d: '1.2 litres, keeps warm for 2 hours', c: 'Home', s: 'Kitchen', p: 34, r: 4.4, sold: 520, code: 'HK-6021', stock: 11 },
      { id: 8, e: '🪴', n: 'Plant pot set', d: 'Three ceramic pots', c: 'Home', s: 'Garden', p: 18, r: 3.6, sold: 90, code: 'HG-6640', stock: 50 },
    ];
    const CATS = { Tech: ['Phones', 'Audio', 'Laptops'], Clothes: ['Shoes', 'Coats'], Home: ['Kitchen', 'Garden'] };
    const VOUCHERS = { SAVE10: 10, SCHOOL5: 5 };
    el.innerHTML = `
      <div class="sim sh-s">
        <div class="app shop">
          <div class="app-bar">
            <span class="app-logo">🛍️ BS Outlet <small>online</small></span>
            <span class="url safe" data-zone="https">${FD.icon.lock} https://www.bs-outlet.example</span>
            <div class="app-icons"><button class="ib" id="bBag" title="My bag" data-zone="bag">🛒<i class="badge" id="bagN" hidden>0</i></button></div>
          </div>
          <div class="sh-body">
            <nav class="sh-menu" data-zone="menu" aria-label="Categories">
              <button data-cat="" class="on">All products</button>
              ${Object.entries(CATS).map(([c, subs]) => `<button data-cat="${c}">${c} ▸</button><div class="sh-sub" data-subs="${c}" hidden>${subs.map((s) => `<button data-sub="${s}">${s}</button>`).join('')}</div>`).join('')}
              <div class="sh-filter" data-zone="filter">
                <p class="seg-l">Narrow the results</p>
                <label class="small">Max price <b id="maxV">£500</b><input type="range" id="max" min="20" max="500" step="10" value="500"></label>
                <span class="seg" id="minR"><button data-v="0">Any ★</button><button data-v="4">4★ +</button></span>
                <label class="tgl small"><input type="checkbox" id="inStock"> In stock only</label>
              </div>
            </nav>
            <div class="sh-main">
              <p class="small muted" id="crumb"></p>
              <div class="sh-grid" id="grid" data-zone="cat"></div>
            </div>
            <aside class="sh-side" id="side" data-zone="side"></aside>
          </div>
        </div>
        <p class="verdict" id="msg"></p>
      </div>`;
    const root = el.querySelector('.sh-s'), $ = (s) => root.querySelector(s);
    let cat = '', sub = '', max = 500, minR = 0, inStock = false, bag = {}, view = 'bag', ck = null, dead = false;

    const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
    const money = (n) => '£' + n.toFixed(2);
    function list() {
      return P.filter((p) => (!cat || p.c === cat) && (!sub || p.s === sub) && p.p <= max && p.r >= minR && (!inStock || p.stock > 0));
    }
    function drawGrid() {
      const L = list();
      $('#crumb').textContent = `${cat || 'All products'}${sub ? ' › ' + sub : ''} · ${L.length} of ${P.length} products`;
      $('#grid').innerHTML = L.map((p) => `
        <article class="sh-card ${p.stock ? '' : 'out'}" data-id="${p.id}">
          <div class="sh-img" data-zone="img">${p.e}</div>
          <b class="sh-n" data-zone="desc">${p.n}</b><small class="sh-d" data-zone="desc">${p.d}</small>
          <span class="sh-p" data-zone="price">£${p.p}</span>
          <span class="stars sm" data-zone="rating" title="Rating ${p.r} out of 5">${stars(p.r)} <small>${p.r}</small></span>
          <small data-zone="pop">🔥 ${p.sold} sold this month</small>
          <small class="mono" data-zone="code">Code ${p.code}</small>
          <small data-zone="stock" class="${p.stock ? (p.stock < 5 ? 'warn-t' : 'good-t') : 'bad-t'}">${p.stock ? (p.stock < 5 ? `Only ${p.stock} left` : `${p.stock} in stock`) : 'Out of stock'}</small>
          <button class="mini-btn" data-add="${p.id}" ${p.stock ? '' : 'disabled'}>Add to bag</button>
        </article>`).join('') || '<p class="note">No products match. Change the filters.</p>';
    }
    function count() { return Object.values(bag).reduce((a, b) => a + b, 0); }
    function subtotal() { return Object.entries(bag).reduce((s, [id, q]) => s + P.find((p) => p.id === +id).p * q, 0); }
    function drawBag() {
      const n = count();
      $('#bagN').hidden = !n; $('#bagN').textContent = n;
      const side = $('#side');
      if (view === 'bag') {
        side.innerHTML = `<h5 class="mw-h">🛒 My bag</h5>
          ${n ? `<ul class="sh-bag">${Object.entries(bag).map(([id, q]) => { const p = P.find((x) => x.id === +id); return `<li><span>${p.e}</span><b>${p.n}</b><small>${q} × £${p.p}</small><button class="mini-btn" data-rm="${p.id}" title="Remove">✕</button></li>`; }).join('')}</ul>
          <p class="sh-tot">Subtotal <b>${money(subtotal())}</b></p>
          <button class="btn primary" id="toCk">Go to checkout ▶</button>` : '<p class="note">Your bag is empty. Add some products: the bag keeps a record of them while you shop, so you pay for everything at once.</p>'}`;
        const b = side.querySelector('#toCk'); if (b) b.addEventListener('click', () => checkout());
      } else drawCheckout();
    }
    function drawCheckout() {
      const side = $('#side');
      const sub = subtotal(), off = ck.voucher ? VOUCHERS[ck.voucher] : 0, del = 3.99;
      const step = (k, t, body) => `<li class="ck-step ${ck.step === k ? 'now' : ck.step > k ? 'done' : ''}" data-zone="ck${k}"><b><i>${k}</i>${t}</b>${ck.step >= k ? body : ''}</li>`;
      side.innerHTML = `<h5 class="mw-h">💳 Checkout</h5><ol class="ck">
        ${step(1, 'Account or guest', ck.step === 1 ? `<div class="chk-btns"><button class="mini-btn" data-who="account">👤 Log in / create an account</button><button class="mini-btn" data-who="guest">🚶 Continue as a guest</button></div>` : `<small>${ck.who === 'guest' ? '🚶 Guest checkout' : '👤 Logged in as alex.p@mail.example'}</small>`)}
        ${step(2, 'Delivery details', ck.step === 2 ? `<small>Alex Pérez · 12 High Street, Alzira</small><button class="mini-btn" data-ck="3">Use this address ▶</button>` : '<small>Alex Pérez · 12 High Street, Alzira</small>')}
        ${step(3, 'Voucher code', `<div class="ck-v"><input type="text" id="vc" placeholder="e.g. SAVE10" value="${ck.voucher || ''}" aria-label="Voucher code" ${ck.step > 3 ? 'disabled' : ''}><button class="mini-btn" id="vcGo" ${ck.step > 3 ? 'disabled' : ''}>Apply</button></div><small id="vcMsg">${ck.voucher ? `<span class="good-t">✓ ${ck.voucher}: £${off} off</span>` : 'Try SAVE10'}</small>${ck.step === 3 ? '<button class="mini-btn" data-ck="4">Continue to payment ▶</button>' : ''}`)}
        ${step(4, 'Secure payment', ck.paid ? `<small class="good-t">✓ Paid by card ending 0000 (simulation)</small>` : `<small>${FD.icon.lock} Card details are encrypted before they are sent (HTTPS).</small><button class="btn primary" id="pay">Pay ${money(sub - off + del)} (pretend)</button>`)}
      </ol>
      <p class="sh-tot small">Items ${money(sub)}${off ? ` · voucher −£${off}` : ''} · delivery £3.99 · <b>Total ${money(sub - off + del)}</b></p>
      ${ck.paid ? `<div class="sh-done" data-zone="done"><b>✓ Order BS-${ck.no} confirmed</b>${ck.who === 'account' ? '<small>📦 Log in at any time to follow the progress of your order: <b>Dispatched → Out for delivery</b></small>' : '<small class="warn-t">You shopped as a guest, so you cannot log into the site later to see this order or follow its progress.</small>'}</div>` : ''}
      <button class="link-btn" id="back">◀ Back to my bag</button>`;
    }
    function checkout() {
      if (!count()) add(5);
      view = 'ck'; ck = { step: 1, who: '', voucher: '', paid: false, no: 40000 + Math.floor(Math.random() * 9999) };
      drawBag(); FD.focus(root, 'side');
      say('At the <b>checkout</b> the customer enters their delivery details and pays for everything in the basket at once.');
    }
    function who(w) { if (!ck) checkout(); ck.who = w; ck.step = Math.max(ck.step, 2); drawBag(); FD.focus(root, 'ck1'); say(w === 'guest' ? 'Shopping as a <b>guest</b>: no account is needed, but you cannot log in later to see your shopping or follow your order.' : 'With an <b>account</b> the customer can log in again later to see their orders and follow their progress.'); }
    function goStep(k) { if (!ck) checkout(); if (!ck.who) who('account'); ck.step = Math.max(ck.step, k); drawBag(); FD.focus(root, 'ck' + k); }
    function voucher(code) {
      goStep(3);
      const c = String(code || '').trim().toUpperCase();
      if (VOUCHERS[c]) { ck.voucher = c; say(`✓ Voucher code <b>${c}</b> accepted: £${VOUCHERS[c]} off the total.`, 'good'); }
      else { ck.voucher = ''; say('That voucher code is not valid.', 'bad'); }
      drawBag(); FD.focus(root, 'ck3');
    }
    function pay() { goStep(4); ck.paid = true; drawBag(); FD.focus(root, ['https', 'done']); say('✓ The payment information was protected by a <b>secure payment system</b> while it was transmitted.', 'good'); }
    function add(id) {
      const p = P.find((x) => x.id === id); if (!p || !p.stock) return;
      bag[id] = (bag[id] || 0) + 1; if (view !== 'bag') { view = 'bag'; ck = null; }
      drawBag(); FD.pulse($('#bBag'));
      say(`${p.e} ${p.n} added to the bag.`);
    }
    function say(h, cls = '') { const m = $('#msg'); m.className = 'verdict ' + cls; m.innerHTML = h; }
    function setCat(c, s = '') {
      cat = c; sub = s;
      root.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('on', b.dataset.cat === c && !s));
      root.querySelectorAll('[data-subs]').forEach((d) => { d.hidden = d.dataset.subs !== c; });
      root.querySelectorAll('[data-sub]').forEach((b) => b.classList.toggle('on', b.dataset.sub === s));
      drawGrid();
    }
    function filter(o = {}) {
      if (o.max != null) { max = o.max; $('#max').value = max; }
      if (o.minR != null) minR = o.minR;
      if (o.inStock != null) { inStock = o.inStock; $('#inStock').checked = inStock; }
      $('#maxV').textContent = '£' + max; FD.segSet($('#minR'), minR);
      drawGrid();
    }

    root.querySelector('.sh-menu').addEventListener('click', (e) => {
      const c = e.target.closest('[data-cat]'), s = e.target.closest('[data-sub]');
      if (c) setCat(c.dataset.cat); else if (s) setCat(cat, s.dataset.sub);
    });
    $('#max').addEventListener('input', (e) => filter({ max: +e.target.value }));
    $('#minR').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) filter({ minR: +b.dataset.v }); });
    $('#inStock').addEventListener('change', (e) => filter({ inStock: e.target.checked }));
    $('#grid').addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) add(+b.dataset.add); });
    $('#bBag').addEventListener('click', () => { view = 'bag'; ck = null; drawBag(); });
    $('#side').addEventListener('click', (e) => {
      const r = e.target.closest('[data-rm]'), w = e.target.closest('[data-who]'), k = e.target.closest('[data-ck]');
      if (r) { delete bag[r.dataset.rm]; drawBag(); }
      else if (w) who(w.dataset.who);
      else if (k) goStep(+k.dataset.ck);
      else if (e.target.closest('#vcGo')) voucher($('#vc').value);
      else if (e.target.closest('#pay')) pay();
      else if (e.target.closest('#back')) { view = 'bag'; ck = null; drawBag(); }
    });
    $('#side').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'vc') voucher(e.target.value); });

    function reset() { bag = {}; view = 'bag'; ck = null; setCat(''); filter({ max: 500, minR: 0, inStock: false }); drawBag(); FD.focus(root); say(''); }
    reset();
    return {
      reset, add, setCat, filter, checkout, who, goStep, voucher, pay, say,
      focus: (z) => FD.focus(root, z),
      typeVoucher: async (code, ctx) => { goStep(3); const i = $('#vc'); i.value = ''; for (const ch of code) { i.value += ch; if (!(await ctx.sleep(140)) || dead) return false; } voucher(code); return true; },
      destroy() { dead = true; },
    };
  },
  steps: [
    {
      title: 'The product catalogue',
      text: `<p>When a user shops online, they use a <strong>product catalogue</strong>. For each product, the catalogue can store:</p>
             <ul><li>an image of the product</li><li>a product description</li><li>the product’s price</li><li><b>ratings</b> by customers, shop staff or other people on review sites</li><li>the popularity of the product</li><li>a product code</li><li>the number of items in stock.</li></ul>`,
      tip: 'Watch each piece of information light up on the product cards.',
      async on(a, ctx) {
        a.reset();
        for (const z of ['img', 'desc', 'price', 'rating', 'pop', 'code', 'stock']) { a.focus(z); if (!(await ctx.sleep(1100))) return; }
        a.focus('cat');
      },
    },
    {
      title: 'Categories and sub-menus',
      text: `<p>Products are often grouped into types or <b>categories</b>. These are often displayed in <b>menus</b>, with any sub-categories appearing in <b>sub-menus</b> (Figure 11.1).</p>`,
      tip: 'Try it: open Tech, then choose Phones.',
      async on(a, ctx) { a.reset(); a.focus('menu'); a.setCat('Tech'); if (!(await ctx.sleep(1400))) return; a.setCat('Tech', 'Phones'); },
    },
    {
      title: 'Narrowing the results',
      text: `<p>Customers can use the information about products to <b>narrow their results</b> when searching for products: for example, only products under a certain price, with good ratings, or in stock.</p>`,
      tip: 'Try it: move the price slider and choose 4★ +.',
      async on(a, ctx) {
        a.reset(); a.focus('filter');
        for (const m of [400, 250, 150, 100]) { a.filter({ max: m }); if (!(await ctx.sleep(450))) return; }
        a.filter({ minR: 4 }); if (!(await ctx.sleep(900))) return; a.filter({ inStock: true });
      },
    },
    {
      title: 'The basket (or bag)',
      text: `<p>When a customer selects a product, they can add it to an online <b>basket</b> or <b>bag</b>. Baskets keep a record of the items that the customer selects as they shop, so that they do not have to pay for each item separately.</p>`,
      tip: 'Try it: add products to the bag, then remove one.',
      async on(a, ctx) {
        a.reset(); a.focus(['bag', 'side']);
        for (const id of [5, 2, 7]) { a.add(id); if (!(await ctx.sleep(900))) return; }
      },
    },
    {
      title: 'Checkout and voucher codes',
      text: `<p>When the customer is ready to pay for everything in the basket, they are directed to the <b>checkout</b>, where they can enter their delivery details and pay for the products in their basket.</p>
             <p>Sometimes customers can use <strong>voucher codes</strong> at the checkout in order to receive a discount.</p>`,
      tip: 'Try it: type SAVE10 in the voucher box and press Apply.',
      async on(a, ctx) {
        a.reset(); a.add(5); a.add(2); a.checkout(); a.who('account');
        if (!(await ctx.sleep(1000))) return; a.goStep(3);
        if (!(await ctx.sleep(700))) return; await a.typeVoucher('SAVE10', ctx);
      },
    },
    {
      title: 'An account, or shop as a guest?',
      text: `<p>If the customer does not already have an <b>account</b> on that website, they may be asked to create one. Often customers can shop as a <b>guest</b>, so that they do not have to create an account.</p>
             <p>However, on some websites this means that they <b>cannot log into the site again later</b> to see their shopping or follow the progress of their order.</p>`,
      tip: 'Try it: pay as a guest, then go back to the bag and pay with an account. Compare the two confirmations.',
      async on(a, ctx) { a.reset(); a.add(6); a.checkout(); if (!(await ctx.sleep(1200))) return; a.who('guest'); if (!(await ctx.sleep(1000))) return; a.pay(); },
    },
    {
      title: 'Secure payment',
      text: `<p>Shopping sites often offer <b>secure payment systems</b> that protect customers’ payment information when it is transmitted online (look for <b>https</b> and the padlock). For more about secure websites, see <i>Unit 3 Operating online</i> (page 104).</p>`,
      async on(a, ctx) { a.reset(); a.add(1); a.checkout(); a.who('account'); a.goStep(4); if (!(await ctx.sleep(1500))) return; a.pay(); },
    },
  ],
});

FD.activities({
  section: 'shopping',
  items: [
    {
      id: 'shopping-stages',
      title: 'Online shopping services',
      task: '<p>Visit a shopping site and go through the stages of buying some products to see how the process works. Make sure that you do <b>not</b> complete the checkout procedure unless you actually want to buy those products.</p><p>Write down the stages you went through and the features you noticed.</p>',
      fields: ['Shopping site visited', 'Features of the product catalogue you saw'],
      lines: 5,
      hint: 'For example: categories → product page → add to basket → checkout (account or guest, delivery, voucher code, payment).',
      sim: ['shopping', 'Practise with the BS Outlet simulation'],
    },
  ],
});

FD.check({
  section: 'shopping',
  items: [
    { type: 'multi', q: 'Which of these can a <b>product catalogue</b> store for each product? Choose <b>three</b>.', need: 3, opts: [['The product’s price', true], ['Ratings by customers', true], ['The number of items in stock', true], ['The customer’s password', false], ['The customer’s IP address', false]], why: 'Also an image, a description, the popularity and a product code.' },
    { type: 'mcq', q: 'Why do shopping sites use a <b>basket</b>?', opts: ['It keeps a record of the items selected, so the customer does not have to pay for each item separately', 'It stores the customer’s card details for ever', 'It shows the products in categories', 'It gives the customer a discount'], why: 'At the checkout the customer pays for everything in the basket.' },
    { type: 'mcq', q: 'What is a <b>voucher code</b>?', opts: ['A code representing an amount of money that can be used to purchase goods or services', 'The product code of an item', 'The password to an account', 'A code that tracks the order'], why: 'It is entered at the checkout to receive a discount.' },
    { type: 'tf', q: 'If you shop as a guest, on some websites you cannot log in later to follow the progress of your order.', a: true, why: 'Guests do not have to create an account, but they lose this feature.' },
  ],
});
