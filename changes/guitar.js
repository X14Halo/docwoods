/* Guitar voicings for any chord in standard tuning + chord diagram SVGs. Exposes window.Guitar */
(function () {
'use strict';
const T = window.Changes.theory;
const TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4, low → high
const cache = new Map();

function sets(ch) {
  const q = T.Q[ch.q];
  const ivs = q.iv.map(([s]) => s);
  const all = new Set(ivs.map(s => T.mod(ch.root + s)));
  const opt = new Set();
  if (ivs.length >= 4) opt.add(T.mod(ch.root + 7));                       // drop the 5th in bigger chords
  if (ivs.includes(21) && ivs.includes(14)) opt.add(T.mod(ch.root + 14)); // 13ths can lose the 9th
  if (ivs.length >= 6 && ivs.includes(17)) opt.add(T.mod(ch.root + 17));  // and big 11ths the 11th
  const req = new Set([...all].filter(p => !opt.has(p)));
  return { all, req, opt, bass: ch.bass != null ? ch.bass : ch.root, power: ch.q === '5' };
}

function fingering(frets) {
  const fr = frets.map((f, i) => ({ f, i })).filter(x => x.f > 0);
  const fingers = frets.map(() => 0);
  if (!fr.length) return { fingers, barre: null, count: 0 };
  const min = Math.min(...fr.map(x => x.f));
  const atMin = fr.filter(x => x.f === min);
  let barre = null, next = 1;
  if (atMin.length >= 2 && fr.length > 4) {   // only barre when four fingers aren't enough
    const a = atMin[0].i, b = atMin[atMin.length - 1].i;
    let ok = true;
    for (let s = a; s <= b; s++) if (frets[s] <= 0) { ok = false; break; }
    if (ok) { barre = { fret: min, from: a, to: b }; atMin.forEach(x => { fingers[x.i] = 1; }); next = 2; }
  }
  fr.filter(x => !fingers[x.i]).sort((x, y) => x.f - y.f || x.i - y.i).forEach(x => { fingers[x.i] = next++; });
  return { fingers, barre, count: next - 1 };
}

function search(ch) {
  const S = sets(ch);
  const seen = new Set(), out = [];
  const minStrings = S.power ? 2 : 4;
  for (let lo = 1; lo <= 12; lo++) {
    const hi = lo + 3;
    const opts = TUNING.map(b => {
      const o = [-1];
      if (S.all.has(T.mod(b))) o.push(0);
      for (let f = lo; f <= hi; f++) if (S.all.has(T.mod(b + f))) o.push(f);
      return o;
    });
    const cur = [];
    (function rec(s) {
      if (s === 6) { evaluate(cur.slice()); return; }
      for (const f of opts[s]) { cur.push(f); rec(s + 1); cur.pop(); }
    })(0);
  }
  function evaluate(frets) {
    const key = frets.join(',');
    if (seen.has(key)) return; seen.add(key);
    const snd = frets.map((f, i) => (f >= 0 ? i : -1)).filter(i => i >= 0);
    if (snd.length < minStrings) return;
    const i0 = snd[0], i1 = snd[snd.length - 1];
    if (T.mod(TUNING[i0] + frets[i0]) !== S.bass) return;
    let interior = 0; for (let s = i0; s <= i1; s++) if (frets[s] < 0) interior++;
    if (interior > 1) return;
    const pcs = new Set(snd.map(i => T.mod(TUNING[i] + frets[i])));
    for (const p of S.req) if (!pcs.has(p)) return;
    const fretted = snd.filter(i => frets[i] > 0).map(i => frets[i]);
    const pos = fretted.length ? Math.min(...fretted) : 0;
    if (fretted.length && Math.max(...fretted) - pos > 3) return;
    const fg = fingering(frets);
    if (fg.count > 4) return;
    if (S.power && snd.length > 3) return;
    const opens = snd.filter(i => frets[i] === 0).length;
    const missingOpt = [...S.opt].filter(p => !pcs.has(p)).length;
    const score = pos * 0.9 + interior * 2.6 + (6 - snd.length) * 0.6 + fg.count * 0.35 + i0 * 0.7 + missingOpt * 0.25
      + (pos >= 5 ? opens * 0.8 : -opens * 0.6) + (fg.barre ? 0.5 : 0) + (S.power && snd.length < 3 ? 0.6 : 0)
      + (opens && fretted.length && Math.max(...fretted) > 3 ? (Math.max(...fretted) - 3) * 3 : 0)   // open chords stay compact
      + (frets[0] > 0 && frets[1] === 0 ? 1.5 : 0);                                                     // fretted low E next to an open A is awkward
    out.push({ frets, fingers: fg.fingers, barre: fg.barre, pos, score, midi: snd.map(i => TUNING[i] + frets[i]) });
  }
  out.sort((a, b) => a.score - b.score);
  return out;
}

const ckey = ch => ch.root + ':' + ch.q + ':' + (ch.bass == null ? '' : ch.bass);
const allCache = new Map(), tweakCache = new Map();
function allShapes(ch) { const k = ckey(ch); if (!allCache.has(k)) allCache.set(k, search(ch)); return allCache.get(k); }
const same = (a, b) => a.frets.join() === b.frets.join();
const differs = (a, b) => a.frets.filter((f, i) => f !== b.frets[i]).length;

/* up to ~10 shapes: spread up the neck first, then other useful grips; tweak targets always included */
function voicings(ch) {
  const k = ckey(ch);
  if (cache.has(k)) return cache.get(k);
  const all = allShapes(ch);
  const picked = [];
  for (const v of all) { if (picked.length >= 6) break; if (picked.every(p => Math.abs(p.pos - v.pos) >= 2)) picked.push(v); }
  for (const v of all) { if (picked.length >= 10) break; if (picked.every(p => differs(p, v) >= 2)) picked.push(v); }
  tweaks(ch).forEach(t => { if (!picked.some(p => same(p, t.target))) picked.push(t.target); });
  const best = picked.shift();
  picked.sort((a, b) => a.pos - b.pos || a.score - b.score);
  const list = best ? [best, ...picked] : [];
  cache.set(k, list);
  return list;
}
function voicing(ch) { const vs = voicings(ch); return vs.length ? vs[Math.min(ch.v || 0, vs.length - 1)] : null; }
function indexOfShape(ch, v) { return voicings(ch).findIndex(x => same(x, v)); }

/* ── "build it from a shape you know" ── */
const STR = ['low E', 'A', 'D', 'G', 'B', 'high E'];
const ord = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
function makeShape(frets) {
  const fg = fingering(frets);
  const snd = frets.map((f, i) => (f >= 0 ? i : -1)).filter(i => i >= 0);
  const fretted = frets.filter(f => f > 0);
  return { frets, fingers: fg.fingers, barre: fg.barre, pos: fretted.length ? Math.min(...fretted) : 0, score: 0, midi: snd.map(i => TUNING[i] + frets[i]) };
}
function baseShapes(ch) {
  const q = T.Q[ch.q];
  const has = s => q.iv.some(([x]) => T.mod(x) === s);
  const minor = has(3) && !has(4);
  const triad = { root: ch.root, acc: ch.acc, q: minor ? 'm' : 'maj', bass: null };
  const name = T.chordName(triad);
  const out = [];
  const OPEN = { maj: { 0: [-1, 3, 2, 0, 1, 0], 9: [-1, 0, 2, 2, 2, 0], 7: [3, 2, 0, 0, 0, 3], 4: [0, 2, 2, 1, 0, 0], 2: [-1, -1, 0, 2, 3, 2] },
    m: { 9: [-1, 0, 2, 2, 1, 0], 4: [0, 2, 2, 0, 0, 0], 2: [-1, -1, 0, 2, 3, 1] } };
  const of = OPEN[minor ? 'm' : 'maj'][ch.root];
  const open = of ? makeShape(of) : null;
  const o6 = T.mod(ch.root - 4), o5 = T.mod(ch.root - 9);
  if (open) out.push({ label: 'Open ' + name + ' chord', short: 'open ' + name, v: open, barre: false });
  if (o6 > 0 && o6 <= 10) out.push({ label: name + ' barre chord · root on the low E string · ' + ord(o6) + ' fret', short: name + ' barre (E shape)', v: makeShape(minor ? [o6, o6 + 2, o6 + 2, o6, o6, o6] : [o6, o6 + 2, o6 + 2, o6 + 1, o6, o6]), barre: true });
  if (o5 > 0 && o5 <= 10) out.push({ label: name + ' barre chord · root on the A string · ' + ord(o5) + ' fret', short: name + ' barre (A shape)', v: makeShape(minor ? [-1, o5, o5 + 2, o5 + 2, o5 + 1, o5] : [-1, o5, o5 + 2, o5 + 2, o5 + 2, o5]), barre: true });
  return { triad, list: out.filter((b, i) => out.findIndex(x => same(x.v, b.v)) === i) };
}
function steps(base, target, isBarre) {
  const out = [], changed = new Set();
  const bar = isBarre && base.barre ? base.barre.fret : null;
  for (let i = 0; i < 6; i++) {
    const a = base.frets[i], b = target.frets[i];
    if (a === b) continue;
    changed.add(i);
    const s = STR[i] + ' string';
    if (b < 0) out.push('Don’t play the ' + s);
    else if (b === 0) out.push(a > 0 ? 'Lift off the ' + s + ' so it rings open' : 'Let the ' + s + ' ring open');
    else if (bar && b === bar) out.push(a < 0 ? 'Let your barre sound the ' + s : 'Lift your finger off the ' + s + ', your barre covers it');
    else if (a > 0 && !(bar && a === bar)) out.push('Move your finger on the ' + s + ' from fret ' + a + ' to fret ' + b);
    else out.push('Add a finger on the ' + s + ', fret ' + b);
  }
  return { steps: out, changed };
}
function tweaks(ch) {
  const k = ckey(ch);
  if (tweakCache.has(k)) return tweakCache.get(k);
  const { triad, list } = baseShapes(ch);
  const res = [];
  if (!(triad.q === ch.q && ch.bass == null)) {
    const all = allShapes(ch);
    list.forEach(b => {
      let best = null, bc = Infinity;
      all.forEach(t => {
        let cost = 0, n = 0;
        for (let i = 0; i < 6; i++) {
          const x = b.v.frets[i], y = t.frets[i];
          if (x === y) continue;
          n++;
          cost += x >= 0 && y >= 0 ? Math.abs(x - y) + 0.5 : 2;
        }
        if (n > 3 || cost > 6.5 || Math.abs(t.pos - b.v.pos) > 1) return;
        const c = cost + t.score * 0.05;
        if (c < bc) { bc = c; best = t; }
      });
      if (best) { const st = steps(b.v, best, b.barre); res.push({ base: b, target: best, steps: st.steps, changed: st.changed }); }
    });
  }
  tweakCache.set(k, res);
  return res;
}

const tab = v => v.frets.map(f => (f < 0 ? 'x' : f > 9 ? '(' + f + ')' : f)).join('');

/* chord diagram: strings vertical (low E on the left), frets horizontal */
function diagram(v, o) {
  o = o || {};
  const hl = o.hl || new Set();
  const dot = i => (hl.has(i) ? 'var(--gd-hl, #E2502A)' : 'var(--gd-dot, currentColor)');
  const W = 100, H = 116, L = 23, R = 87, top = 24, fh = 17, nF = 5;
  const sx = i => L + i * (R - L) / 5;
  if (!v) return `<svg viewBox="0 0 ${W} ${H}" class="gd" aria-hidden="true"><text x="50" y="64" text-anchor="middle" font-size="11" fill="currentColor" opacity=".6">No shape</text></svg>`;
  const fr = v.frets.filter(f => f > 0);
  const max = fr.length ? Math.max(...fr) : 0, min = fr.length ? Math.min(...fr) : 1;
  const start = max <= nF ? 1 : min;
  const y = f => top + (f - start + 0.5) * fh;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="gd" role="img" aria-label="Fingering ${tab(v)}">`;
  for (let f = 0; f <= nF; f++) s += `<line x1="${L}" x2="${R}" y1="${top + f * fh}" y2="${top + f * fh}" stroke="currentColor" stroke-opacity=".28" stroke-width="1"/>`;
  for (let i = 0; i < 6; i++) s += `<line x1="${sx(i)}" x2="${sx(i)}" y1="${top}" y2="${top + nF * fh}" stroke="currentColor" stroke-opacity=".38" stroke-width="${1 + (5 - i) * 0.12}"/>`;
  if (start === 1) s += `<rect x="${L - 1}" y="${top - 3.5}" width="${R - L + 2}" height="4" rx="1.5" fill="currentColor"/>`;
  else s += `<text x="${L - 5}" y="${y(start) + 4}" text-anchor="end" font-size="12.5" font-weight="700" fill="currentColor" opacity=".8">${start}</text>`;
  v.frets.forEach((f, i) => {
    if (f < 0) s += `<path d="M${sx(i) - 3.5} ${top - 14}l7 7M${sx(i) + 3.5} ${top - 14}l-7 7" stroke="${hl.has(i) ? 'var(--gd-hl, #E2502A)' : 'currentColor'}" stroke-opacity="${hl.has(i) ? 1 : 0.55}" stroke-width="1.6" stroke-linecap="round"/>`;
    else if (f === 0) s += `<circle cx="${sx(i)}" cy="${top - 10.5}" r="3.6" fill="none" stroke="${hl.has(i) ? 'var(--gd-hl, #E2502A)' : 'currentColor'}" stroke-width="1.5"/>`;
  });
  if (v.barre) s += `<rect x="${sx(v.barre.from) - 6.5}" y="${y(v.barre.fret) - 6.5}" width="${sx(v.barre.to) - sx(v.barre.from) + 13}" height="13" rx="6.5" fill="var(--gd-dot, currentColor)"/>`;
  v.frets.forEach((f, i) => {
    if (f <= 0) return;
    if (v.barre && f === v.barre.fret && v.fingers[i] === 1) {
      if (o.fingers && i === v.barre.from) s += `<text x="${sx(i)}" y="${y(f) + 3.6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--gd-num, #fff)">1</text>`;
      return;
    }
    s += `<circle cx="${sx(i)}" cy="${y(f)}" r="7" fill="${dot(i)}"/>`;
    if (o.fingers && v.fingers[i]) s += `<text x="${sx(i)}" y="${y(f) + 3.6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--gd-num, #fff)">${v.fingers[i]}</text>`;
  });
  return s + '</svg>';
}

/* beginner-friendly: an open shape, no barre, low on the neck, at most four fretted notes */
const easyCache = new Map();
function easyIndex(ch) {
  const k = ckey(ch);
  if (easyCache.has(k)) return easyCache.get(k);
  const vs = voicings(ch);
  const power = ch.q === '5';
  const i = vs.findIndex(v => {
    if (v.barre) return false;
    const fr = v.frets.filter(f => f > 0), snd = v.frets.filter(f => f >= 0);
    if (power) return fr.length <= 3 && Math.max(0, ...fr) <= 5;
    if (!(fr.length <= 4 && Math.max(0, ...fr) <= 3 && v.frets.includes(0) && snd.length >= 4)) return false;
    const first = v.frets.findIndex(f => f >= 0), last = 5 - [...v.frets].reverse().findIndex(f => f >= 0);
    for (let s = first; s <= last; s++) if (v.frets[s] < 0) return false;                 // no skipped strings in the middle
    const low = Math.min(...fr);
    if (fr.length >= 4) for (let a = 0; a < 6; a++) for (let b = a + 2; b < 6; b++) {       // index finger can't cover two strings at its fret with an open string ringing between
      if (v.frets[a] === low && v.frets[b] === low && v.frets.slice(a + 1, b).some(f => f === 0)) return false;
    }
    return true;
  });
  easyCache.set(k, i);
  return i;
}
const isEasy = ch => easyIndex(ch) >= 0;

window.Guitar = { voicings, voicing, diagram, tab, tweaks, indexOfShape, isEasy, easyIndex, STR };
})();
