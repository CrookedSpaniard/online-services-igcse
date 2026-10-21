// Real, scannable codes drawn without any library:
//   FD.qr(text)      → square matrix of booleans (QR code, byte mode, error correction L, versions 1–5)
//   FD.ean13(digits) → { digits, bits } for a 13-digit EAN barcode (the check digit is calculated)
//   FD.qrSvg / FD.barSvg draw them as SVG.
(() => {
  'use strict';
  const FD = window.FD;

  // ---------- QR code ----------
  const DATA_CW = [0, 19, 34, 55, 80, 108]; // data codewords, level L
  const EC_CW = [0, 7, 10, 15, 20, 26];     // error-correction codewords (one block), level L
  const ALIGN = [0, 0, 18, 22, 26, 30];     // centre of the single alignment pattern

  const gmul = (x, y) => {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
    return z & 0xff;
  };
  function rsDivisor(deg) {
    const r = new Array(deg).fill(0);
    r[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) { r[j] = gmul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
      root = gmul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div) {
    const r = new Array(div.length).fill(0);
    data.forEach((b) => {
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((d, i) => { r[i] ^= gmul(d, f); });
    });
    return r;
  }

  FD.QR_MAX = 106;
  FD.qr = (text) => {
    const bytes = [...new TextEncoder().encode(text)];
    const ver = [1, 2, 3, 4, 5].find((v) => bytes.length <= DATA_CW[v] - 2);
    if (!ver) throw new Error('Too long for this QR maker.');
    const cap = DATA_CW[ver] * 8;
    const bits = [];
    const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    const all = data.concat(rsRemainder(data, rsDivisor(EC_CW[ver])));

    const n = 17 + 4 * ver;
    const m = Array.from({ length: n }, () => new Array(n).fill(false));
    const fn = Array.from({ length: n }, () => new Array(n).fill(false));
    const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
    for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < n && y >= 0 && y < n) set(x, y, d !== 2 && d !== 4);
      }
    });
    if (ver > 1) {
      const c = ALIGN[ver];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const MASK = 0;
    const format = () => {
      const d = (1 << 3) | MASK; // level L = 01
      let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      const bit = (i) => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
      set(8, n - 8, true);
    };
    format();
    let i = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let v = 0; v < n; v++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - v : v;
          if (!fn[y][x] && i < all.length * 8) { m[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
        }
      }
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fn[y][x] && (x + y) % 2 === 0) m[y][x] = !m[y][x];
    return m;
  };

  FD.qrSvg = (text, cls = '') => {
    const m = FD.qr(text), n = m.length, q = 4;
    let d = '';
    m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + q} ${y + q}h1v1h-1z`; }));
    return `<svg class="qr ${cls}" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  };

  // ---------- EAN-13 barcode ----------
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const R = L.map((c) => [...c].map((b) => (b === '1' ? '0' : '1')).join(''));
  const G = R.map((c) => [...c].reverse().join(''));
  const PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  FD.ean13 = (twelve) => {
    const d = String(twelve).replace(/\D/g, '').slice(0, 12).padEnd(12, '0').split('').map(Number);
    const sum = d.reduce((s, v, i) => s + v * (i % 2 ? 3 : 1), 0);
    d.push((10 - (sum % 10)) % 10);
    const p = PAR[d[0]];
    const bits = '101' + d.slice(1, 7).map((v, i) => (p[i] === 'L' ? L : G)[v]).join('') + '01010' + d.slice(7).map((v) => R[v]).join('') + '101';
    return { digits: d.join(''), bits };
  };
  FD.barSvg = (twelve, cls = '') => {
    const { digits, bits } = FD.ean13(twelve);
    const q = 11, w = bits.length + 2 * q;
    const guard = (i) => i < 3 || (i >= 45 && i < 50) || i >= 92;
    let bars = '';
    [...bits].forEach((b, i) => { if (b === '1') bars += `<rect x="${i + q}" y="2" width="1" height="${guard(i) ? 58 : 52}"/>`; });
    const txt = `<text x="${q - 6}" y="66">${digits[0]}</text><text x="${q + 24}" y="66">${digits.slice(1, 7).split('').join(' ')}</text><text x="${q + 71}" y="66">${digits.slice(7).split('').join(' ')}</text>`;
    return `<svg class="bar13 ${cls}" viewBox="0 0 ${w} 70" shape-rendering="crispEdges" role="img" aria-label="Barcode ${digits}"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${bars}</g><g class="bar-num">${txt}</g></svg>`;
  };
})();
