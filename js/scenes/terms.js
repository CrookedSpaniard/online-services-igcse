FD.add({
  id: 'terms',
  title: 'Key terms',
  tab: 'Key terms',
  icon: 'terms',
  color: '--accent',
  page: true,
  mount(el) {
    const T = [
      ['shopping', 'Product catalogue', 'A list of products that can be bought. It can store an image, description, price, ratings, popularity, product code and number in stock.'],
      ['shopping', 'Rating', 'A measurement of how good or how popular something or someone is.'],
      ['shopping', 'Basket (bag)', 'Keeps a record of the items a customer selects as they shop, so they do not have to pay for each item separately.'],
      ['shopping', 'Checkout', 'Where the customer enters their delivery details and pays for the products in their basket.'],
      ['shopping', 'Voucher code', 'A code representing a specified amount of money that can be used on a shopping website to purchase goods or services.'],
      ['booking', 'E-ticket', 'An electronic version of a paper ticket.'],
      ['banks', 'Balance', 'The amount of money in a bank account (also known as bank balance or account balance).'],
      ['banks', 'Balance alert', 'A service that automatically informs a customer, by text message or email, when the balance of their account reaches a specified amount.'],
      ['banks', 'Assessment', 'The process of judging the value or quality of something, such as the quality of a student’s work.'],
      ['banks', 'Virtual learning environment (VLE)', 'Gives learners access to online journals and reference archives, online support, and learning and assessment materials.'],
      ['news', 'Gaming site', 'An online application that lets users play games hosted on a remote server; multiplayer players see each other’s actions in real time.'],
      ['news', 'Subscriber', 'Someone who signs up for a regular service.'],
      ['media', 'Entertainment provider', 'An organisation that offers films, TV, music, podcasts, games or e-books online, on demand, by streaming or as downloads.'],
      ['media', 'On demand', 'Content that users can watch or listen to whenever they choose, not at a fixed broadcast time.'],
      ['media', 'Streaming', 'Playing video or audio while the data is still arriving over the internet; the file is not kept on the device.'],
      ['media', 'Download', 'Copying the whole file from a server and saving it on the device, so it can be used later without a connection.'],
      ['media', 'Buffering', 'Waiting while enough data arrives to carry on playing a stream.'],
      ['auction', 'Auction', 'A public meeting or website where goods or services are sold to the person who offers the most money for them.'],
      ['lifestyle', 'Reroute', 'To send something such as a vehicle to its original destination using a different route.'],
      ['business', 'Big data', 'Very large amounts of data that organisations analyse to understand customer behaviour.'],
      ['cookies', 'Transactional data', 'Data that is sent between digital devices (not just during financial transactions).'],
      ['cookies', 'Track', 'Collect and analyse data.'],
      ['cookies', 'Cookies', 'Information that a website leaves on a user’s computer so that the website will recognise that user when they use it again.'],
      ['cookies', 'Encrypt', 'Protect information by putting it into a special code that only some people can read.'],
      ['cookies', 'Referring website', 'The website previously visited, which linked the user to the website that they are currently visiting.'],
      ['cookies', 'Session cookie', 'A cookie that is only stored until a web page is closed in the browser.'],
      ['cookies', 'Persistent cookie', 'A cookie that records information about the user’s use of the internet over time, e.g. to keep them logged in.'],
      ['cookies', 'Third-party cookie', 'A cookie used to personalise the online experience or send targeted adverts, e.g. by an ad server.'],
      ['cookies', 'Banner advertisement', 'An image, animation or video that displays an advertisement for a product or service in a section of a web page.'],
      ['cookies', 'Ad server', 'A web server that stores, delivers and often tracks banner advertisements.'],
      ['cookies', 'Targeted marketing', 'Advertising that is matched to people based on their attributes or their browsing history.'],
      ['hosted', 'Hosted application (web app)', 'Software stored and run on an online server, with its user interface displayed in a web browser.'],
      ['hosted', 'Application loading time', 'How long it takes an application to load.'],
      ['hosted', 'Unresponsive', 'Not reacting to something or not affected by it.'],
      ['hosted', 'Edit', '(noun) a change to a document.'],
      ['storage', 'Scalable', 'Something that is able to grow or shrink in order to meet demand, such as at busy times of day.'],
      ['storage', 'Data protection issues', 'Problems with maintaining security of data and information.'],
      ['impact', 'Cloud', 'A term used to describe the internet when it is used to provide software or space for storing information, rather than relying on local storage.'],
      ['impact', 'Netbook', 'A computer that does not have lots of storage or fast processors.'],
      ['impact', 'Massive online open course (MOOC)', 'An online course open to very large numbers of learners.'],
    ];
    const colorOf = (id) => (FD.section(id) || { color: '--accent' }).color;
    el.innerHTML = `
      <h2>Key terms</h2>
      <div class="terms-tools"><input type="search" id="tq" placeholder="Search a term…" aria-label="Search terms">
        <span class="seg" id="tp"><button data-v="all">All</button><button data-v="A">Part A</button><button data-v="B">Part B</button></span>
        <span class="small muted" id="tn"></span></div>
      <div class="terms" id="terms">${T.map(([f, t, d]) => `
        <article class="term" data-part="${FD.section(f).part}" style="--c:var(${colorOf(f)})"><h3>${t}</h3><p>${d}</p><button class="link-btn" data-go="${f}">${FD.icon[f]} See it</button></article>`).join('')}</div>`;
    const cards = [...el.querySelectorAll('.term')];
    const q = el.querySelector('#tq'), n = el.querySelector('#tn');
    let part = 'all';
    const filter = () => {
      const s = q.value.trim().toLowerCase();
      let k = 0;
      cards.forEach((c) => { const show = (!s || c.textContent.toLowerCase().includes(s)) && (part === 'all' || c.dataset.part === part); c.hidden = !show; k += show; });
      n.textContent = `${k} of ${cards.length} terms`;
      FD.segSet(el.querySelector('#tp'), part);
    };
    q.addEventListener('input', filter);
    el.querySelector('#tp').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { part = b.dataset.v; filter(); } });
    filter();
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => FD.goto(b.dataset.go)));
  },
});
