/* Changes Lab — shared core: theory, key detection, store, audio, drag-reorder, chord picker, toast, presets.
   Exposes window.Changes = { theory, store, player, audio, ui, views, PRESETS } */
(function () {
'use strict';

/* ───────────────────────── THEORY ───────────────────────── */
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NAT = [0, 2, 4, 5, 7, 9, 11];
const SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const BLACK = [1, 3, 6, 8, 10];
const mod = (n, m = 12) => ((n % m) + m) % m;

function noteName(pc, acc) { return (acc === 'b' ? FLAT : SHARP)[mod(pc)]; }
function spell(letterIdx, pc) {
  let d = mod(pc - NAT[letterIdx]); if (d > 6) d -= 12;
  const a = d === 0 ? '' : d === 1 ? '♯' : d === 2 ? 'x' : d === -1 ? '♭' : d === -2 ? '♭♭' : '?';
  return LETTERS[letterIdx] + a;
}

const IV = { R: [0, 1], b2: [1, 2], n2: [2, 2], b3: [3, 3], n3: [4, 3], n4: [5, 4], b5: [6, 5], n5: [7, 5], s5: [8, 5], n6: [9, 6], bb7: [9, 7], b7: [10, 7], n7: [11, 7], b9: [13, 9], n9: [14, 9], s9: [15, 9], n11: [17, 11], s11: [18, 11], b13: [20, 13], n13: [21, 13] };
const { R, n2, b3, n3, n4, b5, n5, s5, n6, bb7, b7, n7, b9, n9, s9, n11, s11, b13, n13 } = IV;

const GROUPS = [
  { id: 'triads', name: 'Triads' },
  { id: 'sevenths', name: '7ths' },
  { id: 'extended', name: 'Extended' },
  { id: 'susadd', name: 'Sus & Add' },
  { id: 'altered', name: 'Altered' },
];
// id, symbol, name, group, intervals, family (case of numeral), roman suffix
const QDEF = [
  ['maj', '', 'major', 'triads', [R, n3, n5], 'maj', ''],
  ['m', 'm', 'minor', 'triads', [R, b3, n5], 'min', ''],
  ['dim', 'dim', 'diminished', 'triads', [R, b3, b5], 'dim', '°'],
  ['aug', 'aug', 'augmented', 'triads', [R, n3, s5], 'aug', '+'],
  ['sus2', 'sus2', 'suspended 2nd', 'triads', [R, n2, n5], 'sus', 'sus2'],
  ['sus4', 'sus4', 'suspended 4th', 'triads', [R, n4, n5], 'sus', 'sus4'],
  ['5', '5', 'power chord', 'triads', [R, n5], 'pow', '5'],

  ['6', '6', 'major 6th', 'sevenths', [R, n3, n5, n6], 'maj', '6'],
  ['m6', 'm6', 'minor 6th', 'sevenths', [R, b3, n5, n6], 'min', '6'],
  ['maj7', 'maj7', 'major 7th', 'sevenths', [R, n3, n5, n7], 'maj', 'maj7'],
  ['7', '7', 'dominant 7th', 'sevenths', [R, n3, n5, b7], 'maj', '7'],
  ['m7', 'm7', 'minor 7th', 'sevenths', [R, b3, n5, b7], 'min', '7'],
  ['mmaj7', 'm(maj7)', 'minor-major 7th', 'sevenths', [R, b3, n5, n7], 'min', '(maj7)'],
  ['m7b5', 'm7♭5', 'half-diminished', 'sevenths', [R, b3, b5, b7], 'dim', 'ø7'],
  ['dim7', 'dim7', 'diminished 7th', 'sevenths', [R, b3, b5, bb7], 'dim', '°7'],
  ['maj7s5', 'maj7♯5', 'augmented major 7th', 'sevenths', [R, n3, s5, n7], 'aug', '+maj7'],

  ['maj9', 'maj9', 'major 9th', 'extended', [R, n3, n5, n7, n9], 'maj', 'maj9'],
  ['9', '9', 'dominant 9th', 'extended', [R, n3, n5, b7, n9], 'maj', '9'],
  ['m9', 'm9', 'minor 9th', 'extended', [R, b3, n5, b7, n9], 'min', '9'],
  ['69', '6/9', 'six-nine', 'extended', [R, n3, n5, n6, n9], 'maj', '6/9'],
  ['m69', 'm6/9', 'minor six-nine', 'extended', [R, b3, n5, n6, n9], 'min', '6/9'],
  ['11', '11', 'dominant 11th', 'extended', [R, n5, b7, n9, n11], 'maj', '11'],
  ['m11', 'm11', 'minor 11th', 'extended', [R, b3, n5, b7, n9, n11], 'min', '11'],
  ['maj7s11', 'maj7♯11', 'Lydian major 7th', 'extended', [R, n3, n5, n7, s11], 'maj', 'maj7♯11'],
  ['9s11', '9♯11', 'Lydian dominant', 'extended', [R, n3, n5, b7, n9, s11], 'maj', '9♯11'],
  ['13', '13', 'dominant 13th', 'extended', [R, n3, n5, b7, n9, n13], 'maj', '13'],
  ['m13', 'm13', 'minor 13th', 'extended', [R, b3, n5, b7, n9, n13], 'min', '13'],
  ['maj13', 'maj13', 'major 13th', 'extended', [R, n3, n5, n7, n9, n13], 'maj', 'maj13'],

  ['add9', 'add9', 'add 9', 'susadd', [R, n3, n5, n9], 'maj', 'add9'],
  ['madd9', 'm(add9)', 'minor add 9', 'susadd', [R, b3, n5, n9], 'min', 'add9'],
  ['add11', 'add11', 'add 11', 'susadd', [R, n3, n5, n11], 'maj', 'add11'],
  ['madd11', 'm(add11)', 'minor add 11', 'susadd', [R, b3, n5, n11], 'min', 'add11'],
  ['7sus4', '7sus4', '7th, suspended 4th', 'susadd', [R, n4, n5, b7], 'sus', '7sus4'],
  ['7sus2', '7sus2', '7th, suspended 2nd', 'susadd', [R, n2, n5, b7], 'sus', '7sus2'],
  ['9sus4', '9sus4', '9th, suspended 4th', 'susadd', [R, n4, n5, b7, n9], 'sus', '9sus4'],
  ['sus2sus4', 'sus2sus4', 'sus 2 and 4', 'susadd', [R, n2, n4, n5], 'sus', 'sus24'],
  ['6sus4', '6sus4', '6th, suspended 4th', 'susadd', [R, n4, n5, n6], 'sus', '6sus4'],

  ['7b5', '7♭5', 'dominant 7 flat 5', 'altered', [R, n3, b5, b7], 'maj', '7♭5'],
  ['7s5', '7♯5', 'augmented 7th', 'altered', [R, n3, s5, b7], 'aug', '+7'],
  ['7b9', '7♭9', 'dominant 7 flat 9', 'altered', [R, n3, n5, b7, b9], 'maj', '7♭9'],
  ['7s9', '7♯9', 'dominant 7 sharp 9', 'altered', [R, n3, n5, b7, s9], 'maj', '7♯9'],
  ['7s11', '7♯11', 'dominant 7 sharp 11', 'altered', [R, n3, n5, b7, s11], 'maj', '7♯11'],
  ['7b13', '7♭13', 'dominant 7 flat 13', 'altered', [R, n3, n5, b7, b13], 'maj', '7♭13'],
  ['7s5b9', '7♯5♭9', '7 sharp 5 flat 9', 'altered', [R, n3, s5, b7, b9], 'aug', '+7♭9'],
  ['7alt', '7alt', 'altered dominant', 'altered', [R, n3, b7, s9, b13], 'maj', '7alt'],
  ['13b9', '13♭9', '13 flat 9', 'altered', [R, n3, n5, b7, b9, n13], 'maj', '13♭9'],
];
const QUALITIES = QDEF.map(([id, sym, name, group, iv, fam, rn]) => ({ id, sym, name, group, iv, fam, rn }));
const Q = Object.fromEntries(QUALITIES.map(q => [q.id, q]));
const BY_SYM = Object.fromEntries(QUALITIES.map(q => [q.sym, q.id]));

function chordPcs(ch) { return Q[ch.q].iv.map(([s]) => mod(ch.root + s)); }
function corePcs(ch) { return Q[ch.q].iv.filter(([s]) => s < 12).map(([s]) => mod(ch.root + s)); }
function rootName(ch) { return noteName(ch.root, ch.acc); }
function chordName(ch) {
  let s = rootName(ch) + Q[ch.q].sym;
  if (ch.bass != null && ch.bass !== ch.root) s += '/' + noteName(ch.bass, ch.bassAcc || ch.acc);
  return s;
}
function chordNotes(ch) {
  const L = LETTERS.indexOf(rootName(ch)[0]);
  return Q[ch.q].iv.map(([s, deg]) => spell(mod(L + deg - 1, 7), ch.root + s));
}
function qualityName(ch) { return Q[ch.q].name; }
function hasInt(ch, semi) { return Q[ch.q].iv.some(([s]) => mod(s) === semi); }

function parse(str) {
  const m = /^([A-G])([#♯b♭]?)(.*?)(?:\/([A-G])([#♯b♭]?))?$/.exec(str.trim());
  if (!m) return null;
  const pc = (L, a) => mod(NAT[LETTERS.indexOf(L)] + (a === '#' || a === '♯' ? 1 : a === 'b' || a === '♭' ? -1 : 0));
  const acc = m[2] === 'b' || m[2] === '♭' ? 'b' : '#';
  const suf = m[3].replace(/#/g, '♯').replace(/(\d)b/g, '$1♭');
  const q = BY_SYM[suf];
  if (!q) return null;
  const ch = { root: pc(m[1], m[2]), acc, q, bass: null, bassAcc: acc };
  if (m[4]) { ch.bass = pc(m[4], m[5]); ch.bassAcc = m[5] === 'b' || m[5] === '♭' ? 'b' : '#'; }
  return ch;
}

/* keys */
const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
const KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const KEY_MAJ_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const KEY_MIN_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];

function keyTonicName(key) { return (key.mode === 'major' ? KEY_MAJ_NAMES : KEY_MIN_NAMES)[key.tonic]; }
function keyName(key) { return key ? keyTonicName(key) + ' ' + key.mode : ''; }
function keyShort(key) { return key ? keyTonicName(key) + (key.mode === 'minor' ? 'm' : '') : ''; }
function keyAcc(key) {
  const n = keyTonicName(key);
  if (n.includes('♭')) return 'b';
  if (n.includes('♯')) return '#';
  return (key.mode === 'major' ? [5] : [2, 7, 0, 5]).includes(key.tonic) ? 'b' : '#';
}
function scaleIntervals(key) { return key.mode === 'major' ? MAJ : MIN; }
function scaleNotes(key) {
  const L = LETTERS.indexOf(keyTonicName(key)[0]);
  return scaleIntervals(key).map((iv, i) => spell(mod(L + i, 7), key.tonic + iv));
}
function scaleSet(key, harmonic = true) {
  const s = new Set(scaleIntervals(key).map(i => mod(key.tonic + i)));
  if (harmonic && key.mode === 'minor') s.add(mod(key.tonic + 11));
  return s;
}
function relativeKey(key) {
  return key.mode === 'major' ? { tonic: mod(key.tonic + 9), mode: 'minor' } : { tonic: mod(key.tonic + 3), mode: 'major' };
}
function parallelKey(key) { return { tonic: key.tonic, mode: key.mode === 'major' ? 'minor' : 'major' }; }
function sameKey(a, b) { return !!a && !!b && a.tonic === b.tonic && a.mode === b.mode; }

function pearson(a, b) {
  const n = a.length; let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
const isMajorish = ch => hasInt(ch, 4) && !hasInt(ch, 3);
const isMinorish = ch => hasInt(ch, 3) && !hasInt(ch, 4);

function scoreKey(chords, key) {
  const n = chords.length;
  const hist = new Array(12).fill(0);
  chords.forEach((c, i) => {
    const w = 1 + (i === 0 ? 0.5 : 0) + (i === n - 1 ? 0.5 : 0);
    chordPcs(c).forEach(p => { hist[p] += w; });
    hist[c.root] += w;
    if (c.bass != null) hist[c.bass] += 0.5 * w;
  });
  const prof = key.mode === 'major' ? KK_MAJ : KK_MIN;
  const rot = hist.map((_, i) => hist[mod(i + key.tonic)]);
  const r = pearson(rot, prof);
  const sc = scaleSet(key);
  let fit = 0;
  chords.forEach(c => { const core = corePcs(c); fit += core.filter(p => sc.has(p)).length / core.length; });
  fit /= n;
  const t = key.tonic;
  const matches = c => c.root === t && (key.mode === 'major' ? !isMinorish(c) : isMinorish(c) || Q[c.q].fam === 'sus' || Q[c.q].fam === 'pow');
  let bonus = 0;
  if (chords.some(matches)) bonus += 0.12;
  if (chords.some(c => c.root === t && (key.mode === 'major' ? isMinorish(c) : isMajorish(c)))) bonus -= 0.08;
  const f = chords[0], l = chords[n - 1];
  bonus += matches(f) ? 0.13 : f.root === t ? 0.04 : 0;
  bonus += matches(l) ? 0.16 : l.root === t ? 0.05 : 0;
  let cad = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = chords[i], b = chords[i + 1];
    if (a.root === mod(t + 7) && hasInt(a, 4) && b.root === t) cad += 0.09;
  }
  bonus += Math.min(cad, 0.18);
  return 1.2 * fit + 0.45 * r + bonus;
}

function detectKey(chords) {
  if (!chords.length) return null;
  const all = [];
  for (let t = 0; t < 12; t++) for (const mode of ['major', 'minor']) {
    const key = { tonic: t, mode };
    all.push({ ...key, score: scoreKey(chords, key) });
  }
  all.sort((a, b) => b.score - a.score);
  const T = 0.065, top = all[0].score;
  let sum = 0; all.forEach(k => { k.w = Math.exp((k.score - top) / T); sum += k.w; });
  all.forEach(k => { k.prob = k.w / sum; k.name = keyName(k); delete k.w; });
  return { best: all[0], ranked: all };
}

const RN_MAJ = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
const RN_MIN = ['I', '♭II', 'II', 'III', '♯III', 'IV', '♯IV', 'V', 'VI', '♯VI', 'VII', '♯VII'];
const FN_MAJ = { 0: 'tonic', 2: 'predominant', 4: 'tonic', 5: 'predominant', 7: 'dominant', 9: 'tonic', 11: 'dominant' };
const FN_MIN = { 0: 'tonic', 2: 'predominant', 3: 'tonic', 5: 'predominant', 7: 'dominant', 8: 'predominant', 10: 'dominant', 11: 'dominant' };
const DIA_TRIADS = { major: ['maj', 'm', 'm', 'maj', 'maj', 'm', 'dim'], minor: ['m', 'dim', 'maj', 'm', 'maj', 'maj', 'maj'] };
const DIA_SEVENTHS = { major: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'], minor: ['m7', 'm7b5', 'maj7', 'm7', '7', 'maj7', '7'] };
const FN_LABEL = { tonic: 'Tonic', predominant: 'Predominant', dominant: 'Dominant', outside: 'Outside' };

function numeral(iv, q, key) {
  let base = (key.mode === 'major' ? RN_MAJ : RN_MIN)[iv];
  if (key.mode === 'minor' && iv === 11 && q.fam === 'dim') base = 'VII';
  const lower = q.fam === 'min' || q.fam === 'dim';
  return (lower ? base.toLowerCase() : base) + q.rn;
}

function analyze(ch, key) {
  if (!key) return { rn: '', fn: 'outside', fnLabel: '', tag: null, inKey: false };
  const q = Q[ch.q];
  const iv = mod(ch.root - key.tonic);
  const rn = numeral(iv, q, key);
  const core = corePcs(ch);
  const sc = scaleSet(key);
  const inKey = core.every(p => sc.has(p));
  if (inKey) {
    const fn = (key.mode === 'major' ? FN_MAJ : FN_MIN)[iv] || 'outside';
    return { rn, fn, fnLabel: FN_LABEL[fn], tag: null, inKey: true };
  }
  const domish = hasInt(ch, 4) && !hasInt(ch, 11) && q.fam !== 'min';
  if (key.mode === 'major' && domish && hasInt(ch, 10) && (iv === 0 || iv === 5)) {
    const fn = iv === 0 ? 'tonic' : 'predominant';
    return { rn, fn, fnLabel: 'Blues ' + (iv === 0 ? 'tonic' : 'subdominant'), tag: 'blues', inKey: false };
  }
  const target = mod(iv + 5);
  const dIdx = scaleIntervals(key).indexOf(target);
  if (domish && iv !== 7 && iv !== 0 && dIdx > 0) {
    const tq = Q[DIA_TRIADS[key.mode][dIdx]];
    const tn = numeral(target, tq, key);
    const label = 'V' + (hasInt(ch, 10) ? '7' : '') + '/' + tn;
    return { rn: label, rnPlain: rn, fn: 'dominant', fnLabel: 'Secondary dominant', tag: 'secondary', inKey: false };
  }
  const par = scaleSet(parallelKey(key), false);
  if (core.every(p => par.has(p))) {
    return { rn, fn: 'outside', fnLabel: 'Borrowed', tag: 'borrowed', inKey: false };
  }
  return { rn, fn: 'outside', fnLabel: 'Chromatic', tag: 'chromatic', inKey: false };
}

function flavor(chords, key) {
  if (!key || !chords.length) return null;
  const t = key.tonic;
  const dom7 = c => hasInt(c, 4) && hasInt(c, 10);
  if (key.mode === 'major' && chords.some(c => c.root === t && dom7(c)) && chords.some(c => c.root === mod(t + 5) && dom7(c))) return 'Bluesy dominant 7ths';
  const sc = scaleSet(key, false);
  const outs = new Set();
  chords.forEach(c => {
    if (analyze(c, key).tag === 'secondary') return;
    corePcs(c).forEach(p => { if (!sc.has(p)) outs.add(mod(p - t)); });
  });
  if (key.mode === 'minor') outs.delete(11);
  if (!outs.size) return null;
  const sub = arr => [...outs].every(x => arr.includes(x));
  const par = keyTonicName(key) + (key.mode === 'major' ? ' minor' : ' major');
  if (key.mode === 'major') {
    if (sub([10])) return 'Mixolydian flavor (♭7)';
    if (sub([6])) return 'Lydian flavor (♯4)';
    if (sub([3, 8, 10])) return 'Borrows from ' + par;
  } else {
    if (sub([9])) return 'Dorian flavor (♮6)';
    if (sub([1])) return 'Phrygian flavor (♭2)';
    if (sub([4])) return 'Picardy third';
    if (sub([9, 4, 11])) return 'Borrows from ' + par;
  }
  return 'Some chromatic color';
}

function diatonic(key, sevenths) {
  if (!key) return [];
  const names = scaleNotes(key);
  const qs = (sevenths ? DIA_SEVENTHS : DIA_TRIADS)[key.mode];
  return scaleIntervals(key).map((iv, i) => {
    const nm = names[i];
    const acc = nm.includes('♭') ? 'b' : nm.includes('♯') || nm.includes('x') ? '#' : keyAcc(key);
    const chord = { root: mod(key.tonic + iv), acc, q: qs[i], bass: null, bassAcc: acc };
    return { chord, rn: analyze(chord, key).rn, fn: analyze(chord, key).fn };
  });
}

const theory = {
  LETTERS, SHARP, FLAT, BLACK, GROUPS, QUALITIES, Q, mod,
  noteName, chordPcs, chordName, chordNotes, rootName, qualityName, parse,
  detectKey, keyName, keyShort, keyTonicName, keyAcc, scaleNotes, relativeKey, parallelKey, sameKey,
  analyze, flavor, diatonic,
};

/* ───────────────────────── PRESETS ───────────────────────── */
const PRESETS = [
  { name: 'Pop anthem', rn: 'I – V – vi – IV', chords: 'G D Em C' },
  { name: 'Sad pop', rn: 'vi – IV – I – V', chords: 'Am F C G' },
  { name: 'Jazz turnaround', rn: 'ii7 – V7 – Imaj7 – V7/ii', chords: 'Dm7 G7 Cmaj7 A7' },
  { name: 'Andalusian cadence', rn: 'i – VII – VI – V', chords: 'Am G F E' },
  { name: '12-bar blues', rn: 'I7 – IV7 – V7', chords: 'A7 A7 A7 A7 D7 D7 A7 A7 E7 D7 A7 E7' },
  { name: 'Mixolydian rock', rn: 'I – ♭VII – IV – I', chords: 'D C G D' },
  { name: 'Canon', rn: 'I – V – vi – iii – IV – I – IV – V', chords: 'D A Bm F♯m G D G A' },
  { name: 'Royal road', rn: 'IVmaj7 – V7 – iii7 – vi', chords: 'Fmaj7 G7 Em7 Am' },
  { name: 'Epic borrowed', rn: 'I – ♭VI – ♭VII – I', chords: 'C A♭ B♭ C' },
  { name: 'Neo-soul', rn: 'IVmaj9 – iii7 – ii9 – Imaj9', chords: 'E♭maj9 Dm7 Cm9 B♭maj9' },
].map(p => ({ ...p, list: p.chords.split(' ').map(parse) }));

/* ───────────────────────── STORE ───────────────────────── */
const STORE_KEY = 'changes.lab.v1';
let nextId = 1;
const withId = c => ({ id: 'c' + (nextId++), root: c.root, acc: c.acc || '#', q: c.q, bass: c.bass == null ? null : c.bass, bassAcc: c.bassAcc || c.acc || '#', v: c.v || 0 });

let nextSec = 1;
const SECTION_NAMES = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Bridge', 'Solo', 'Outro'];
const mkSection = (name, chords) => ({ id: 's' + (nextSec++), name, chords: chords || [] });
function nextSectionName(sections, preferred) {
  const used = new Set(sections.map(s => s.name));
  const base = preferred || SECTION_NAMES.find(n => !used.has(n)) || 'Section';
  if (!used.has(base)) return base;
  let i = 2; while (used.has(base + ' ' + i)) i++;
  return base + ' ' + i;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const clean = list => (list || []).filter(c => c && Q[c.q]).map(withId);
      if (s && Array.isArray(s.sections) && s.sections.length) {
        const sections = s.sections.map(x => mkSection(x.name || 'Verse', clean(x.chords)));
        const ci = Math.max(0, Math.min(sections.length - 1, s.curIndex || 0));
        return { sections, cur: sections[ci].id, lock: s.lock || null, bpm: s.bpm || 96, design: s.design || null, capo: s.capo || 0 };
      }
      if (s && Array.isArray(s.chords)) {
        const sec = mkSection('Verse', clean(s.chords));
        return { sections: [sec], cur: sec.id, lock: s.lock || null, bpm: s.bpm || 96, design: s.design || null };
      }
    }
  } catch (e) { /* storage unavailable */ }
  const sec = mkSection('Verse', PRESETS[0].list.map(withId));
  return { sections: [sec], cur: sec.id, lock: null, bpm: 96, design: null, capo: 0 };
}

const store = (function () {
  let song = loadState();
  let state = null;
  let analysis = null;
  const subs = new Set();
  const history = [];
  const curSec = () => song.sections.find(x => x.id === song.cur) || song.sections[0];
  function view() { const c = curSec(); state = { chords: c.chords, sections: song.sections, cur: c.id, section: c, lock: song.lock, bpm: song.bpm, design: song.design, capo: song.capo || 0 }; }
  function put(arr) { song = { ...song, sections: song.sections.map(x => (x.id === song.cur ? { ...x, chords: arr } : x)) }; }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        sections: song.sections.map(x => ({ name: x.name, chords: x.chords.map(({ id, ...c }) => c) })),
        curIndex: song.sections.findIndex(x => x.id === song.cur), lock: song.lock, bpm: song.bpm, design: song.design, capo: song.capo || 0,
      }));
    } catch (e) { /* ignore */ }
  }
  function compute() {
    const all = [].concat(...song.sections.map(x => x.chords));
    const det = detectKey(all);
    const key = all.length ? (song.lock || (det && det.best) || null) : null;
    const items = {};
    all.forEach(c => { items[c.id] = analyze(c, key); });
    let prob = null;
    if (det && key) { const k = det.ranked.find(r => sameKey(r, key)); prob = k ? k.prob : null; }
    analysis = {
      key: key ? { tonic: key.tonic, mode: key.mode } : null,
      keyName: keyName(key),
      locked: !!song.lock,
      detected: det ? det.best : null,
      ranked: det ? det.ranked : [],
      prob,
      alternatives: det ? det.ranked.filter(r => !sameKey(r, key)).slice(0, 2) : [],
      scale: key ? scaleNotes(key) : [],
      flavor: flavor(state.chords, key),
      items,
    };
  }
  function emit(change) { view(); save(); compute(); subs.forEach(fn => { try { fn(state, analysis, change || {}); } catch (e) { console.error(e); } }); }
  function snap() { history.push(JSON.stringify({ sections: song.sections, cur: song.cur, lock: song.lock, capo: song.capo || 0 })); if (history.length > 60) history.shift(); }
  view(); compute();
  return {
    get state() { return state; },
    get analysis() { return analysis; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    find(id) { return state.chords.find(c => c.id === id) || null; },
    indexOf(id) { return state.chords.findIndex(c => c.id === id); },
    add(spec, index) {
      snap();
      const c = withId(spec);
      const arr = state.chords.slice();
      if (index == null || index > arr.length) arr.push(c); else arr.splice(index, 0, c);
      put(arr);
      emit({ type: 'add', id: c.id });
      return c.id;
    },
    update(id, spec) {
      snap();
      put(state.chords.map(c => c.id === id ? { ...c, root: spec.root, acc: spec.acc, q: spec.q, bass: spec.bass == null ? null : spec.bass, bassAcc: spec.bassAcc || spec.acc, v: spec.v || 0 } : c));
      emit({ type: 'update', id });
    },
    remove(id) {
      const i = this.indexOf(id); if (i < 0) return null;
      snap();
      const chord = state.chords[i];
      put(state.chords.filter(c => c.id !== id));
      emit({ type: 'remove', id, index: i });
      return chord;
    },
    move(from, to) {
      if (from === to || from < 0 || to < 0) return;
      snap();
      const arr = state.chords.slice();
      const [c] = arr.splice(from, 1);
      arr.splice(Math.min(to, arr.length), 0, c);
      put(arr);
      emit({ type: 'move', id: c.id, from, to });
    },
    setOrder(ids) {
      const map = new Map(state.chords.map(c => [c.id, c]));
      const arr = ids.map(id => map.get(id)).filter(Boolean);
      if (arr.length !== state.chords.length) return;
      snap(); put(arr); emit({ type: 'reorder' });
    },
    replaceAll(specs) {
      if (specs.length !== state.chords.length) return;
      snap();
      put(state.chords.map((c, i) => ({ ...c, root: specs[i].root, acc: specs[i].acc, q: specs[i].q, bass: specs[i].bass == null ? null : specs[i].bass, bassAcc: specs[i].bassAcc || specs[i].acc, v: specs[i].v || 0 })));
      emit({ type: 'replace' });
    },
    clear() { if (!state.chords.length) return; snap(); put([]); emit({ type: 'clear' }); },
    load(list) { snap(); put(list.map(withId)); emit({ type: 'load' }); },
    loadPreset(p) { this.load(p.list); },
    /* sections */
    nextSectionName(preferred) { return nextSectionName(song.sections, preferred); },
    addSection(name, list) {
      snap();
      const sec = mkSection(nextSectionName(song.sections, name), (list || []).map(withId));
      const i = song.sections.findIndex(x => x.id === song.cur);
      const arr = song.sections.slice(); arr.splice(i + 1, 0, sec);
      song = { ...song, sections: arr, cur: sec.id };
      emit({ type: 'section', id: sec.id, dir: 1 });
      return sec.id;
    },
    switchSection(id) {
      if (id === song.cur || !song.sections.some(x => x.id === id)) return;
      const from = song.sections.findIndex(x => x.id === song.cur), to = song.sections.findIndex(x => x.id === id);
      song = { ...song, cur: id };
      emit({ type: 'section', id, dir: to > from ? 1 : -1 });
    },
    renameSection(id, name) { snap(); song = { ...song, sections: song.sections.map(x => (x.id === id ? { ...x, name } : x)) }; emit({ type: 'rename', id }); },
    duplicateSection(id) {
      const src = song.sections.find(x => x.id === id); if (!src) return;
      snap();
      const sec = mkSection(nextSectionName(song.sections, src.name.replace(/ \d+$/, '')), src.chords.map(withId));
      const i = song.sections.findIndex(x => x.id === id);
      const arr = song.sections.slice(); arr.splice(i + 1, 0, sec);
      song = { ...song, sections: arr, cur: sec.id };
      emit({ type: 'section', id: sec.id, dir: 1 });
    },
    removeSection(id) {
      if (song.sections.length < 2) return;
      snap();
      const i = song.sections.findIndex(x => x.id === id);
      const arr = song.sections.filter(x => x.id !== id);
      const cur = song.cur === id ? arr[Math.max(0, i - 1)].id : song.cur;
      song = { ...song, sections: arr, cur };
      emit({ type: 'section', id: cur, dir: -1 });
    },
    /* capo: chords are stored as the shapes you finger; the capo raises how they sound.
       keepSound = true re-writes the shapes so the song keeps sounding the same. */
    setCapo(n, keepSound) {
      n = Math.max(0, Math.min(11, n | 0));
      const old = song.capo || 0;
      if (n === old) return;
      snap();
      let sections = song.sections, lock = song.lock;
      if (keepSound) {
        const d = n - old;
        const shift = c => ({ ...c, root: mod(c.root - d), bass: c.bass == null ? null : mod(c.bass - d) });
        sections = sections.map(x => ({ ...x, chords: x.chords.map(shift) }));
        if (lock) lock = { tonic: mod(lock.tonic - d), mode: lock.mode };
        const all = [].concat(...sections.map(x => x.chords));
        const det = lock || (detectKey(all) || {}).best;
        if (det) {
          const names = scaleNotes(det), ivs = scaleIntervals(det).map(i => mod(det.tonic + i));
          const accOf = pc => { const i = ivs.indexOf(pc); const nm = i >= 0 ? names[i] : ''; return nm.includes('♭') ? 'b' : nm.includes('♯') ? '#' : keyAcc(det); };
          sections = sections.map(x => ({ ...x, chords: x.chords.map(c => ({ ...c, acc: accOf(c.root), bassAcc: c.bass == null ? accOf(c.root) : accOf(c.bass), v: 0 })) }));
        }
      }
      song = { ...song, sections, lock, capo: n };
      emit({ type: 'capo', keepSound: !!keepSound });
    },
    setLock(key) { snap(); song = { ...song, lock: key ? { tonic: key.tonic, mode: key.mode } : null }; emit({ type: 'lock' }); },
    /* whole songs */
    getSong() {
      return { sections: song.sections.map(x => ({ name: x.name, chords: x.chords.map(({ id, ...c }) => c) })), lock: song.lock, cur: song.sections.findIndex(x => x.id === song.cur), capo: song.capo || 0 };
    },
    loadSong(data) {
      snap();
      const secs = (data && data.sections && data.sections.length ? data.sections : [{ name: 'Verse', chords: [] }]).map(x => mkSection(x.name || 'Verse', (x.chords || []).filter(c => c && Q[c.q]).map(withId)));
      const ci = Math.max(0, Math.min(secs.length - 1, (data && data.cur) || 0));
      song = { ...song, sections: secs, cur: secs[ci].id, lock: (data && data.lock) || null, capo: (data && data.capo) || 0 };
      emit({ type: 'song' });
    },
    setBpm(bpm) { song = { ...song, bpm: Math.max(40, Math.min(220, Math.round(bpm))) }; emit({ type: 'bpm' }); },
    setDesign(id) { song = { ...song, design: id }; view(); save(); },
    canUndo() { return history.length > 0; },
    undo() {
      const raw = history.pop(); if (!raw) return false;
      const o = JSON.parse(raw);
      song = { ...song, sections: o.sections, cur: o.cur, lock: o.lock, capo: o.capo || 0 };
      emit({ type: 'undo' });
      return true;
    },
  };
})();

/* ───────────────────────── AUDIO ───────────────────────── */
const audio = (function () {
  /* Electric guitar, physically modelled: each string is a Karplus–Strong waveguide (pick shape, pick position,
     frequency-dependent decay, fine tuning), heard through a pickup, a clean amp nudged just to the edge of
     breakup, a 1x12 speaker cabinet and a small room. */
  let ctx = null, input = null;
  const cache = new Map();
  function buildChain(c) {
    const inp = c.createGain(); inp.gain.value = 1;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 75; hp.Q.value = 0.7;
    const pick = c.createBiquadFilter(); pick.type = 'peaking'; pick.frequency.value = 1700; pick.Q.value = 0.9; pick.gain.value = 1.5;   // single-coil-ish presence
    const drive = c.createGain(); drive.gain.value = 1.15;
    const shaper = c.createWaveShaper();
    const n = 2048, curve = new Float32Array(n), k = 1.7, norm = Math.tanh(k);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(k * x + 0.08 * x * x) / norm; }   // soft, slightly asymmetric = tube-like
    shaper.curve = curve; shaper.oversample = '4x';
    const post = c.createGain(); post.gain.value = 0.7;
    const bass = c.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 160; bass.gain.value = 1.5;
    const mid = c.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 500; mid.Q.value = 0.8; mid.gain.value = -2.5;
    const treble = c.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 2800; treble.gain.value = 0.5;
    const cab1 = c.createBiquadFilter(); cab1.type = 'lowpass'; cab1.frequency.value = 4200; cab1.Q.value = 0.85;
    const cab2 = c.createBiquadFilter(); cab2.type = 'lowpass'; cab2.frequency.value = 6000; cab2.Q.value = 0.6;
    const cabRes = c.createBiquadFilter(); cabRes.type = 'peaking'; cabRes.frequency.value = 2100; cabRes.Q.value = 1.4; cabRes.gain.value = 1.5;
    const cabLow = c.createBiquadFilter(); cabLow.type = 'peaking'; cabLow.frequency.value = 120; cabLow.Q.value = 1.1; cabLow.gain.value = 2;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.006; comp.release.value = 0.25; comp.knee.value = 8;
    const dry = c.createGain(); dry.gain.value = 0.9;
    const wet = c.createGain(); wet.gain.value = 0.22;
    const verb = c.createConvolver(); verb.buffer = roomIR(c);
    const master = c.createGain(); master.gain.value = 0.85;
    inp.connect(hp); hp.connect(pick); pick.connect(drive); drive.connect(shaper); shaper.connect(post);
    post.connect(bass); bass.connect(mid); mid.connect(treble); treble.connect(cabLow); cabLow.connect(cab1); cab1.connect(cab2); cab2.connect(cabRes); cabRes.connect(comp);
    comp.connect(dry); comp.connect(verb); verb.connect(wet); dry.connect(master); wet.connect(master); master.connect(c.destination);
    return inp;
  }
  function roomIR(c) {
    const sr = c.sampleRate, len = Math.floor(sr * 1.3), b = c.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / sr, env = Math.pow(1 - i / len, 2.2) * Math.exp(-t * 3.2);
        lp += 0.35 * ((Math.random() * 2 - 1) - lp);        // darker tail
        d[i] = (i < sr * 0.012 ? 0 : lp * env) * 0.9;
      }
    }
    return b;
  }
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C({ latencyHint: 'interactive' });
      input = buildChain(ctx);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /* render one plucked string to a buffer (cached per note) */
  function renderString(c, midi) {
    const key = c.sampleRate + ':' + midi;
    if (cache.has(key)) return cache.get(key);
    const sr = c.sampleRate, f = 440 * Math.pow(2, (midi - 69) / 12);
    const T60 = Math.max(1.6, Math.min(7, 7.5 - (midi - 40) * 0.17));           // low strings ring longer
    const dur = Math.min(4.2, T60 * 0.75 + 0.6), N = Math.floor(sr * dur);
    const out = new Float32Array(N);
    const P = sr / f, d = 0.46 + Math.min(0.03, (midi - 40) * 0.001);           // loop low-pass amount
    const L = Math.max(2, Math.floor(P - d - 0.15)), D = P - d - L, C = (1 - D) / (1 + D);
    const g = Math.pow(10, -3 / (T60 * f));                                     // loss per period → T60
    const buf = new Float32Array(L);
    const pickPos = 0.12 + Math.random() * 0.03, pk = Math.max(1, Math.round(L * pickPos));
    let lpN = 0;
    for (let i = 0; i < L; i++) {                                               // pick shape: triangle + a little filtered noise
      const x = i / L, tri = x < pickPos ? x / pickPos : (1 - x) / (1 - pickPos);
      lpN += 0.35 * ((Math.random() * 2 - 1) - lpN);
      buf[i] = 0.85 * (tri - 0.5) + 0.2 * lpN;
    }
    const tmp = buf.slice();
    for (let i = 0; i < L; i++) buf[i] = tmp[i] - 0.6 * tmp[(i - pk + L) % L]; // pick-position comb
    let mean = 0; for (let i = 0; i < L; i++) mean += buf[i]; mean /= L; let peak = 0;
    for (let i = 0; i < L; i++) { buf[i] -= mean; peak = Math.max(peak, Math.abs(buf[i])); }
    for (let i = 0; i < L; i++) buf[i] /= peak || 1;
    let idx = 0, last = 0, apX = 0, apY = 0;
    for (let n = 0; n < N; n++) {
      const cur = buf[idx];
      const lp = g * ((1 - d) * cur + d * last); last = cur;
      const y = C * lp + apX - C * apY; apX = lp; apY = y;
      buf[idx] = y; out[n] = cur;
      if (++idx >= L) idx = 0;
    }
    const pu = Math.max(1, Math.round(P * 0.2));                                // pickup position (bridge-ish) comb
    for (let n = N - 1; n >= pu; n--) out[n] = out[n] - 0.45 * out[n - pu];
    const fade = Math.floor(sr * 0.25);
    for (let n = 0; n < fade; n++) out[N - 1 - n] *= n / fade;
    const b = c.createBuffer(1, N, sr); b.copyToChannel ? b.copyToChannel(out, 0) : b.getChannelData(0).set(out);
    const res = { buffer: b, dur };
    cache.set(key, res);
    return res;
  }
  function playString(c, dest, midi, t, vel, ring) {
    const { buffer, dur } = renderString(c, midi);
    const src = c.createBufferSource(); src.buffer = buffer;
    src.detune.value = (Math.random() - 0.5) * 4;                               // tiny human tuning drift
    const gn = c.createGain();
    const lvl = 0.3 * vel * (midi < 52 ? 0.95 : midi > 64 ? 0.8 : 0.88);
    gn.gain.setValueAtTime(lvl, t);
    const end = t + Math.min(dur, ring || dur);
    gn.gain.setValueAtTime(lvl, Math.max(t, end - 0.12)); gn.gain.linearRampToValueAtTime(0.0001, end);
    src.connect(gn); gn.connect(dest);
    src.start(t); src.stop(end + 0.02);
  }
  function fallbackVoicing(ch) {
    const q = Q[ch.q];
    let base = 48 + ch.root; if (base < 52) base += 12;
    const notes = q.iv.filter(([s]) => s < 12).map(([s]) => base + s);
    const bpc = ch.bass != null ? ch.bass : ch.root;
    let bass = 36 + bpc; if (bass < 40) bass += 12;
    return [bass, ...notes];
  }
  let voicer = null;
  function strumOn(c, dest, ch, t0, opts) {
    const o = Object.assign({ vel: 1, dir: 1, gap: 0.032, ring: null }, opts || {});
    let v = null;
    try { v = voicer && voicer(ch); } catch (e) { v = null; }
    if (!v || !v.length) v = fallbackVoicing(ch);
    const seq = o.dir > 0 ? v : v.slice().reverse();
    seq.forEach((m, i) => playString(c, dest, m, t0 + i * o.gap * (1 + (Math.random() - 0.5) * 0.25), o.vel * (o.dir > 0 ? 1 - i * 0.035 : 0.85), o.ring));
  }
  function strum(ch, when, opts) {
    if (!ac()) return;
    strumOn(ctx, input, ch, when == null ? ctx.currentTime + 0.03 : when, opts);
  }
  /* offline render, used for testing levels */
  async function renderOffline(ch, seconds) {
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const oc = new OC(2, Math.floor(44100 * (seconds || 3)), 44100);
    const dest = buildChain(oc);
    strumOn(oc, dest, ch, 0.02);
    return oc.startRendering();
  }
  return {
    ctx: () => ac(), now: () => (ac() ? ctx.currentTime : 0), strum, chord: ch => strum(ch),
    note(m) { if (ac()) playString(ctx, input, m, ctx.currentTime + 0.02, 1.1, 2.2); },
    setVoicer(fn) { voicer = fn; }, renderOffline,
  };
})();

const player = (function () {
  let playing = false, timer = null, pos = -1, nextTime = 0, curId = null;
  const subs = new Set();
  const uiTimers = [];
  function emit(i, id) { subs.forEach(fn => { try { fn(i, id, playing); } catch (e) { console.error(e); } }); }
  function schedule() {
    const ctx = audio.ctx(); if (!ctx || !playing) return;
    const chords = store.state.chords;
    if (!chords.length) { stop(); return; }
    const beat = 60 / store.state.bpm;
    while (nextTime < ctx.currentTime + 0.18) {
      // find next chord by id continuity
      let i = curId ? chords.findIndex(c => c.id === curId) : -1;
      i = i < 0 ? (pos + 1) % chords.length : (i + 1) % chords.length;
      pos = i; const ch = chords[i]; curId = ch.id;
      audio.strum(ch, nextTime, { vel: 1, dir: 1, dur: beat * 3 });
      audio.strum(ch, nextTime + beat * 1.5, { vel: 0.38, dir: -1, dur: beat * 1.2, gap: 0.011 });
      audio.strum(ch, nextTime + beat * 2, { vel: 0.72, dir: 1, dur: beat * 2 });
      audio.strum(ch, nextTime + beat * 3.5, { vel: 0.34, dir: -1, dur: beat, gap: 0.011 });
      const delay = Math.max(0, (nextTime - ctx.currentTime) * 1000);
      const idx = i, id = ch.id;
      uiTimers.push(setTimeout(() => { if (playing) emit(store.indexOf(id), id); }, delay));
      nextTime += beat * 4;
    }
    timer = setTimeout(schedule, 40);
  }
  function start() {
    const ctx = audio.ctx(); if (!ctx || !store.state.chords.length) return;
    playing = true; pos = -1; curId = null; nextTime = ctx.currentTime + 0.08;
    schedule();
  }
  function stop() {
    playing = false; clearTimeout(timer); uiTimers.splice(0).forEach(clearTimeout); curId = null; pos = -1;
    emit(-1, null);
  }
  return {
    start, stop,
    toggle() { playing ? stop() : start(); return playing; },
    get playing() { return playing; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();

/* ───────────────────────── UI HELPERS ───────────────────────── */
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.2,.8,.2,1)';

function el(tag, attrs, children) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  (children || []).forEach(c => { if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
}

/* FLIP: record → mutate → animate */
function flip(elements, mutate, opts) {
  const o = Object.assign({ duration: 260, easing: EASE }, opts || {});
  const list = Array.from(elements);
  const first = new Map(list.map(e => [e, e.getBoundingClientRect()]));
  mutate && mutate();
  if (reduceMotion()) return;
  list.forEach(e => {
    if (!e.isConnected) return;
    const a = first.get(e), b = e.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: o.duration, easing: o.easing });
  });
}

function scrollParent(node, axis) {
  let n = node;
  while (n && n !== document.body) {
    const cs = getComputedStyle(n);
    const ov = axis === 'x' ? cs.overflowX : cs.overflowY;
    if (/(auto|scroll)/.test(ov)) return n;
    n = n.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

/* Drag-to-reorder engine.
   container must be position:relative; items are its direct-or-nested elements matching opts.item with data-id.
   opts: { item, handle, longPress(ms, 0=off), axis 'grid'|'x'|'y', scroller, trash(): Element|null,
           onCommit(from,to,id), onTrash(id), onStart(id), onEnd(id) } */
function reorder(container, opts) {
  const o = Object.assign({ item: '[data-id]', handle: null, longPress: 320, axis: 'grid', trash: null }, opts || {});
  let pend = null, drag = null, suppressClick = false;
  const items = () => Array.from(container.querySelectorAll(o.item)).filter(e => !e.classList.contains('cx-ghost'));

  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (drag) return;
    const it = e.target.closest(o.item);
    if (!it || !container.contains(it) || it.classList.contains('cx-ghost')) return;
    if (e.target.closest('[data-nodrag]')) return;
    const viaHandle = o.handle && e.target.closest(o.handle);
    pend = { it, x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType };
    if (viaHandle) { e.preventDefault(); begin(e); return; }
    if (o.longPress > 0) {
      pend.timer = setTimeout(() => { if (pend) { it.classList.remove('cx-pressing'); begin({ clientX: pend.lx ?? pend.x, clientY: pend.ly ?? pend.y, pointerId: pend.id }); } }, o.longPress);
      it.classList.add('cx-pressing');
    }
  }
  function cancelPend() { if (pend) { clearTimeout(pend.timer); pend.it.classList.remove('cx-pressing'); pend = null; } }
  function onMovePre(e) {
    if (!pend || drag) return;
    pend.lx = e.clientX; pend.ly = e.clientY;
    if (Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > 9) cancelPend();
  }
  function begin(e) {
    const it = pend.it; clearTimeout(pend.timer); pend = null;
    const r = it.getBoundingClientRect();
    const ghost = it.cloneNode(true);
    ghost.classList.add('cx-ghost'); ghost.removeAttribute('data-id'); ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: '0', zIndex: 9999, pointerEvents: 'none', transition: 'none', boxSizing: 'border-box' });
    container.appendChild(ghost);
    ghost.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }], { duration: 160, easing: EASE, fill: 'forwards' });
    it.classList.add('cx-placeholder');
    container.classList.add('cx-dragging');
    document.documentElement.classList.add('cx-noselect');
    try { navigator.vibrate && navigator.vibrate(12); } catch (err) { /* ignore */ }
    drag = { it, ghost, ox: e.clientX - r.left, oy: e.clientY - r.top, x: e.clientX, y: e.clientY, from: items().indexOf(it), id: it.dataset.id, scroller: o.scroller || scrollParent(container, o.axis === 'x' ? 'x' : 'y'), overTrash: false, raf: 0 };
    suppressClick = true;
    o.onStart && o.onStart(drag.id);
    drag.raf = requestAnimationFrame(autoScroll);
  }
  function locate() {
    const cr = container.getBoundingClientRect();
    const lx = drag.x - cr.left + container.scrollLeft - container.clientLeft;
    const ly = drag.y - cr.top + container.scrollTop - container.clientTop;
    const list = items();
    let best = null, bd = Infinity;
    list.forEach(e => {
      const x = e.offsetLeft, y = e.offsetTop, w = e.offsetWidth, h = e.offsetHeight;
      const inside = lx >= x && lx <= x + w && ly >= y && ly <= y + h;
      const cx = x + w / 2, cy = y + h / 2;
      const d = inside ? -1 : o.axis === 'x' ? Math.abs(lx - cx) : o.axis === 'y' ? Math.abs(ly - cy) : Math.hypot(lx - cx, ly - cy);
      if (d < bd) { bd = d; best = e; }
    });
    if (!best || best === drag.it) return;
    const cur = list.indexOf(drag.it), tgt = list.indexOf(best);
    flip(list.filter(e => e !== drag.it), () => {
      if (tgt > cur) best.after(drag.it); else best.before(drag.it);
    }, { duration: 220 });
  }
  function onMove(e) {
    if (!drag) { onMovePre(e); return; }
    e.preventDefault();
    drag.x = e.clientX; drag.y = e.clientY;
    drag.ghost.style.left = (drag.x - drag.ox) + 'px';
    drag.ghost.style.top = (drag.y - drag.oy) + 'px';
    const t = o.trash && o.trash();
    let over = false;
    if (t) { const tr = t.getBoundingClientRect(); over = drag.x >= tr.left && drag.x <= tr.right && drag.y >= tr.top && drag.y <= tr.bottom; t.classList.toggle('cx-over', over); }
    if (over !== drag.overTrash) { drag.overTrash = over; drag.ghost.classList.toggle('cx-ghost-trash', over); if (over) { try { navigator.vibrate && navigator.vibrate(8); } catch (err) { /* ignore */ } } }
    if (!over) locate();
  }
  function autoScroll() {
    if (!drag) return;
    const s = drag.scroller;
    const r = s === document.scrollingElement ? { top: 0, left: 0, bottom: innerHeight, right: innerWidth } : s.getBoundingClientRect();
    const edge = 56; let dx = 0, dy = 0;
    if (o.axis !== 'x') { if (drag.y < r.top + edge) dy = -Math.ceil((r.top + edge - drag.y) / 6); else if (drag.y > r.bottom - edge) dy = Math.ceil((drag.y - (r.bottom - edge)) / 6); }
    if (o.axis === 'x') { if (drag.x < r.left + edge) dx = -Math.ceil((r.left + edge - drag.x) / 6); else if (drag.x > r.right - edge) dx = Math.ceil((drag.x - (r.right - edge)) / 6); }
    if (dx || dy) { s.scrollBy(dx, dy); if (!drag.overTrash) locate(); }
    drag.raf = requestAnimationFrame(autoScroll);
  }
  function onUp() {
    if (pend && !drag) { cancelPend(); return; }
    if (!drag) return;
    const d = drag; drag = null;
    cancelAnimationFrame(d.raf);
    container.classList.remove('cx-dragging');
    document.documentElement.classList.remove('cx-noselect');
    const t = o.trash && o.trash(); if (t) t.classList.remove('cx-over');
    if (d.overTrash) {
      const a = d.ghost.animate([{ transform: 'scale(1.06)', opacity: 1 }, { transform: 'scale(0.3)', opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
      a.onfinish = () => d.ghost.remove();
      d.it.classList.remove('cx-placeholder');
      o.onEnd && o.onEnd(d.id);
      o.onTrash && o.onTrash(d.id);
    } else {
      const to = items().indexOf(d.it);
      const r = d.it.getBoundingClientRect();
      const gr = d.ghost.getBoundingClientRect();
      const a = d.ghost.animate([{ transform: 'scale(1.06)', left: gr.left + 'px', top: gr.top + 'px' }, { transform: 'scale(1)', left: r.left + 'px', top: r.top + 'px' }], { duration: reduceMotion() ? 1 : 200, easing: EASE, fill: 'forwards' });
      a.onfinish = () => { d.ghost.remove(); d.it.classList.remove('cx-placeholder'); };
      o.onEnd && o.onEnd(d.id);
      if (to !== d.from && to >= 0) o.onCommit && o.onCommit(d.from, to, d.id);
    }
    setTimeout(() => { suppressClick = false; }, 60);
  }
  function onClick(e) { if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; } }
  function onTouchMove(e) { if (drag) e.preventDefault(); }
  function onCtx(e) { if (pend || drag) e.preventDefault(); }

  container.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  container.addEventListener('click', onClick, true);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('contextmenu', onCtx);
  return {
    get dragging() { return !!drag; },
    destroy() {
      cancelPend();
      container.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      container.removeEventListener('click', onClick, true);
      document.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('contextmenu', onCtx);
    },
  };
}

/* Toast with optional action. host must be position:relative (a view root). */
function toast(host, message, opts) {
  const o = Object.assign({ action: null, onAction: null, ms: 4200 }, opts || {});
  let t = host.querySelector(':scope > .cx-toast');
  if (t) { clearTimeout(t._timer); t.remove(); }
  t = el('div', { class: 'cx-toast', role: 'status' }, [el('span', { class: 'cx-toast-msg', text: message })]);
  if (o.action) t.append(el('button', { class: 'cx-toast-btn', text: o.action, onclick: () => { o.onAction && o.onAction(); hide(); } }));
  host.appendChild(t);
  requestAnimationFrame(() => t.classList.add('cx-in'));
  function hide() { t.classList.remove('cx-in'); setTimeout(() => t.remove(), 260); }
  t._timer = setTimeout(hide, o.ms);
  return { hide };
}

/* Bottom sheet scaffold (scrim + sheet + swipe-down to dismiss). Returns {layer, sheet, body, close} */
function sheet(host, opts) {
  const o = Object.assign({ label: 'Sheet', onClose: null, className: '' }, opts || {});
  const layer = el('div', { class: 'pk-layer ' + o.className });
  const scrim = el('div', { class: 'pk-scrim' });
  const sh = el('div', { class: 'pk-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.label, tabindex: '-1' });
  const grab = el('div', { class: 'pk-grab' }, [el('span')]);
  sh.append(grab);
  layer.append(scrim, sh);
  host.appendChild(layer);
  let closed = false;
  function close(result) {
    if (closed) return; closed = true;
    layer.classList.remove('pk-open');
    sh.style.transform = '';
    setTimeout(() => layer.remove(), 360);
    o.onClose && o.onClose(result);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { layer.classList.add('pk-open'); sh.focus({ preventScroll: true }); }));
  scrim.addEventListener('click', () => close());
  sh.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // swipe down to dismiss from grab area or header
  let sd = null;
  sh.addEventListener('pointerdown', e => {
    if (!e.target.closest('.pk-grab, .pk-head') || e.target.closest('button')) return;
    sd = { y: e.clientY, t: performance.now(), dy: 0 };
    sh.style.transition = 'none';
    sh.setPointerCapture && sh.setPointerCapture(e.pointerId);
  });
  sh.addEventListener('pointermove', e => {
    if (!sd) return;
    sd.dy = Math.max(0, e.clientY - sd.y);
    sh.style.transform = `translateY(${sd.dy}px)`;
  });
  const endSd = () => {
    if (!sd) return;
    const v = sd.dy / Math.max(1, performance.now() - sd.t);
    sh.style.transition = '';
    if (sd.dy > 110 || v > 0.7) close(); else sh.style.transform = '';
    sd = null;
  };
  sh.addEventListener('pointerup', endSd);
  sh.addEventListener('pointercancel', endSd);
  return { layer, sheet: sh, close };
}

const ICON = {
  speaker: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8v4h3l4 3V5L6 8z"/><path d="M13 7.5a3.5 3.5 0 010 5M15.5 5a7 7 0 010 10"/></svg>',
  close: '<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6"/></svg>',
  plus: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
  play: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M6 4v12l10-6z" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect x="5" y="5" width="10" height="10" rx="1.5" fill="currentColor"/></svg>',
  grip: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="3.5" r="1.3"/><circle cx="10.5" cy="3.5" r="1.3"/><circle cx="5.5" cy="8" r="1.3"/><circle cx="10.5" cy="8" r="1.3"/><circle cx="5.5" cy="12.5" r="1.3"/><circle cx="10.5" cy="12.5" r="1.3"/></svg>',
  lines: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h12M4 10h12M4 14h12"/></svg>',
  trash: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"/></svg>',
  undo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/></svg>',
  book: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5A1.5 1.5 0 015.5 3H16v12H5.5A1.5 1.5 0 004 16.5z"/><path d="M4 16.5A1.5 1.5 0 005.5 18H16v-3"/></svg>',
  lock: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 016 0V9"/></svg>',
  minus: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 8h10"/></svg>',
};

/* Chord picker sheet.
   opts: { host, chord (initial spec or null), mode 'add'|'edit', rootStyle 'piano'|'grid'|'pads', title, okLabel,
           onSubmit(spec), onDelete(), onClose() } — themed with --pk-* CSS variables on the host. */
function picker(opts) {
  const o = Object.assign({ mode: 'add', rootStyle: 'piano', title: null, okLabel: null }, opts || {});
  const an = store.analysis;
  const key = an.key;
  const defAcc = key ? keyAcc(key) : '#';
  const init = o.chord || (key ? { root: key.tonic, acc: defAcc, q: key.mode === 'minor' ? 'm' : 'maj', bass: null } : { root: 0, acc: '#', q: 'maj', bass: null });
  const st = { root: init.root, acc: init.acc || defAcc, q: init.q, bass: init.bass == null ? null : init.bass, group: Q[init.q].group, sev: false, v: init.v || 0 };
  const spec = () => ({ root: st.root, acc: st.acc, q: st.q, bass: st.bass, bassAcc: st.acc, v: st.v });
  let lastShape = st.root + ':' + st.q + ':' + st.bass;

  const S = sheet(o.host, { label: o.mode === 'edit' ? 'Edit chord' : 'Add chord', onClose: () => o.onClose && o.onClose() });
  const sh = S.sheet;
  const okBtn = el('button', { class: 'pk-ok', text: o.okLabel || (o.mode === 'edit' ? 'Save' : 'Add') });
  const head = el('div', { class: 'pk-head' }, [
    el('button', { class: 'pk-cancel', text: 'Cancel', onclick: () => S.close() }),
    el('div', { class: 'pk-title', text: o.title || (o.mode === 'edit' ? 'Edit chord' : 'Add chord') }),
    okBtn,
  ]);
  const body = el('div', { class: 'pk-body' });
  sh.append(head, body);

  // preview
  const pName = el('div', { class: 'pk-name' });
  const pQual = el('span', { class: 'pk-qname' });
  const pRn = el('span', { class: 'pk-rn' });
  const pNotes = el('div', { class: 'pk-notes' });
  const hear = el('button', { class: 'pk-hear', 'aria-label': 'Hear chord', html: ICON.speaker, onclick: () => { audio.chord(spec()); bump(hear); } });
  body.append(el('div', { class: 'pk-preview' }, [el('div', { class: 'pk-pv-text' }, [pName, el('div', { class: 'pk-sub' }, [pQual, pRn]), pNotes]), hear]));
  const extraBox = el('div', { class: 'pk-extra' });
  if (o.note) body.append(el('div', { class: 'pk-noteline' + (o.noteTone ? ' pk-note-' + o.noteTone : '') }, [el('span', { class: 'pk-note-dot', text: o.noteTone === 'off' ? '!' : '\u266d' }), el('span', { text: o.note })]));
  // optional tabs: Change / Play it / Ideas — keeps each job one tap away instead of one long scroll
  let panes = null, tabBtns = null, curTab = null, tabBar = null;
  const TAB_ORDER = [['change', 'Change'], ['play', 'Play it'], ['ideas', 'Ideas']];
  if (o.tabs) {
    panes = {}; tabBtns = {};
    tabBar = el('div', { class: 'pk-ptabs', role: 'tablist' });
    TAB_ORDER.forEach(([k, label]) => {
      panes[k] = el('div', { class: 'pk-pane', role: 'tabpanel', id: 'pk-pane-' + k });
      tabBtns[k] = el('button', { class: 'pk-ptab', role: 'tab', 'aria-controls': 'pk-pane-' + k, onclick: () => showTab(k) }, [el('span', { text: label })]);
      tabBar.append(tabBtns[k]);
    });
    body.append(tabBar, ...TAB_ORDER.map(([k]) => panes[k]));
    sh.classList.add('pk-tall');
  }
  const put = (k, n) => (panes ? panes[k] : body).append(n);
  function showTab(k) {
    if (!panes || !panes[k]) return;
    const prev = curTab; curTab = k;
    TAB_ORDER.forEach(([x]) => { const on = x === k; panes[x].hidden = !on; tabBtns[x].classList.toggle('pk-on', on); tabBtns[x].setAttribute('aria-selected', on ? 'true' : 'false'); });
    if (prev && prev !== k) {
      if (body.scrollTop > tabBar.offsetTop) body.scrollTop = tabBar.offsetTop;
      const dir = TAB_ORDER.findIndex(t => t[0] === k) > TAB_ORDER.findIndex(t => t[0] === prev) ? 1 : -1;
      if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) panes[k].animate([{ opacity: 0, transform: 'translateX(' + dir * 18 + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE });
      o.tabs.onTab && o.tabs.onTab(k);
    }
  }
  if (o.renderExtra) put('play', extraBox);

  // fits key
  let fitChips = null, sevBtns = [], fitSec = null;
  if (key) {
    fitChips = el('div', { class: 'pk-chips pk-fitchips' });
    sevBtns = [0, 1].map(v => el('button', { class: 'pk-segbtn', text: v ? '7ths' : 'Triads', onclick: () => { st.sev = !!v; renderFit(); refresh(); } }));
    fitSec = el('div', { class: 'pk-sec' }, [
      el('div', { class: 'pk-label' }, [el('span', { text: 'Chords in ' + keyName(key) }), el('div', { class: 'pk-seg' }, sevBtns)]),
      fitChips,
    ]);
    if (panes) put('change', fitSec); else body.append(fitSec);
  }
  function renderFit() {
    if (!fitChips) return;
    fitChips.textContent = '';
    diatonic(key, st.sev).forEach(d => {
      const b = el('button', { class: 'pk-chip pk-fit pk-fn-' + d.fn, 'data-root': d.chord.root, 'data-q': d.chord.q, onclick: () => { st.root = d.chord.root; st.acc = d.chord.acc; st.q = d.chord.q; st.bass = null; st.group = Q[st.q].group; renderTabs(); renderTypes(); refresh(); audition(); } }, [
        el('span', { class: 'pk-chip-rn', text: d.rn }), el('span', { class: 'pk-chip-nm', text: chordName(d.chord) }),
      ]);
      fitChips.append(b);
    });
  }

  // suggestion sections: [{ title, tone, items: [{ chord, tag }] }]
  const sugChips = [];
  (o.suggest || []).forEach(sec => {
    if (!sec.items || !sec.items.length) return;
    const row = el('div', { class: 'pk-chips pk-sugg' });
    sec.items.forEach(it => {
      const b = el('button', { class: 'pk-chip pk-sug' + (sec.tone ? ' pk-sug-' + sec.tone : ''), onclick: () => { st.root = it.chord.root; st.acc = it.chord.acc; st.q = it.chord.q; st.bass = it.chord.bass == null ? null : it.chord.bass; st.group = Q[st.q].group; renderTabs(); renderTypes(); renderBass(); refresh(); audition(); } }, [
        el('span', { class: 'pk-chip-nm', text: chordName(it.chord) }), it.tag ? el('span', { class: 'pk-sug-tag', text: it.tag }) : null,
      ]);
      b._c = it.chord; sugChips.push(b); row.append(b);
    });
    put('ideas', el('div', { class: 'pk-sec' + (sec.tone ? ' pk-sec-' + sec.tone : '') }, [el('div', { class: 'pk-label' }, [el('span', { text: sec.title }), sec.hint ? el('span', { class: 'pk-hint', text: sec.hint }) : null]), row]));
  });

  if (!panes && fitSec && sugChips.length) body.append(fitSec); // suggestions first, then in-key chords

  // roots
  const accBtns = ['#', 'b'].map(a => el('button', { class: 'pk-segbtn', text: a === '#' ? '♯' : '♭', 'aria-label': a === '#' ? 'Use sharps' : 'Use flats', onclick: () => { st.acc = a; renderRoots(); renderTypes(); renderBass(); refresh(); } }));
  const roots = el('div', { class: 'pk-roots pk-roots-' + o.rootStyle });
  put('change', el('div', { class: 'pk-sec' }, [el('div', { class: 'pk-label' }, [el('span', { text: 'Root' }), el('div', { class: 'pk-seg' }, accBtns)]), roots]));
  function renderRoots() {
    roots.textContent = '';
    const pick = pc => () => { st.root = pc; if (st.bass === pc) st.bass = null; renderTypes(); refresh(); audition(); };
    if (o.rootStyle === 'piano') {
      [0, 2, 4, 5, 7, 9, 11].forEach(pc => roots.append(el('button', { class: 'pk-key pk-white', 'data-pc': pc, text: noteName(pc, st.acc), onclick: pick(pc) })));
      [[1, 1], [3, 2], [6, 4], [8, 5], [10, 6]].forEach(([pc, k]) => roots.append(el('button', { class: 'pk-key pk-black', 'data-pc': pc, style: { left: `calc(${(k * 100) / 7}% - 6%)` }, text: noteName(pc, st.acc), onclick: pick(pc) })));
    } else {
      for (let pc = 0; pc < 12; pc++) roots.append(el('button', { class: 'pk-key' + (BLACK.includes(pc) ? ' pk-acc' : ''), 'data-pc': pc, text: noteName(pc, st.acc), onclick: pick(pc) }));
    }
  }

  // types (simple list first, everything else behind "More")
  const simple = o.simpleTypes || null;
  st.more = !simple || !simple.includes(st.q) || st.bass != null;
  const tabs = el('div', { class: 'pk-tabs', role: 'tablist' });
  const types = el('div', { class: 'pk-types' });
  const typeLabel = el('div', { class: 'pk-label' }, [el('span', { text: 'Chord type' })]);
  const moreBtn = el('button', { class: 'pk-more', onclick: () => { st.more = !st.more; applyMore(); } });
  put('change', el('div', { class: 'pk-sec' }, [typeLabel, tabs, types, simple ? moreBtn : null]));
  function renderTabs() {
    tabs.textContent = '';
    GROUPS.forEach(g => tabs.append(el('button', { class: 'pk-tab' + (g.id === st.group ? ' pk-on' : ''), role: 'tab', 'aria-selected': g.id === st.group ? 'true' : 'false', text: g.name, onclick: () => { st.group = g.id; renderTabs(); renderTypes(); refresh(); } })));
    const on = tabs.querySelector('.pk-on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function renderTypes() {
    types.textContent = '';
    (simple && !st.more ? simple.map(id => Q[id]) : QUALITIES.filter(q => q.group === st.group)).forEach(q => {
      types.append(el('button', { class: 'pk-type', 'data-q': q.id, onclick: () => { st.q = q.id; refresh(); audition(); } }, [
        el('span', { class: 'pk-type-sym', text: noteName(st.root, st.acc) + q.sym }), el('span', { class: 'pk-type-nm', text: q.name }),
      ]));
    });
    types.animate([{ opacity: 0.3, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: EASE });
  }

  // bass
  const bass = el('div', { class: 'pk-chips pk-bass' });
  const bassSec = el('div', { class: 'pk-sec' }, [el('div', { class: 'pk-label' }, [el('span', { text: 'Bass note' }), el('span', { class: 'pk-hint', text: 'a different lowest note (slash chord)' })]), bass]);
  put('change', bassSec);
  function applyMore() {
    tabs.hidden = !st.more; typeLabel.hidden = !!st.more; bassSec.hidden = !st.more;
    moreBtn.textContent = st.more ? 'Show fewer options' : 'More chord types and bass notes';
    renderTabs(); renderTypes(); refresh();
  }
  function renderBass() {
    bass.textContent = '';
    bass.append(el('button', { class: 'pk-chip', 'data-bass': 'none', text: 'Root', onclick: () => { st.bass = null; refresh(); audition(); } }));
    for (let pc = 0; pc < 12; pc++) bass.append(el('button', { class: 'pk-chip', 'data-bass': pc, text: noteName(pc, st.acc), onclick: () => { st.bass = pc === st.root ? null : pc; refresh(); audition(); } }));
  }

  if (o.mode === 'edit' && o.onDelete) put('change', el('button', { class: 'pk-delete', html: ICON.trash + '<span>Remove chord</span>', onclick: () => { o.onDelete(); S.close('deleted'); } }));

  function refresh() {
    const shape = st.root + ':' + st.q + ':' + st.bass;
    if (shape !== lastShape) { st.v = 0; lastShape = shape; }
    const s = spec();
    if (o.renderExtra) o.renderExtra(s, extraBox, v => { st.v = v; refresh(); audio.chord(spec()); }, p => { Object.assign(st, p); st.group = Q[st.q].group; renderTabs(); renderTypes(); refresh(); audio.chord(spec()); });
    pName.textContent = chordName(s);
    pQual.textContent = qualityName(s);
    const a = analyze(s, key);
    pRn.textContent = key ? a.rn + (a.tag ? ' · ' + a.fnLabel.toLowerCase() : '') : '';
    pRn.className = 'pk-rn pk-fn-' + a.fn;
    pNotes.textContent = '';
    chordNotes(s).forEach(n => pNotes.append(el('span', { class: 'pk-note', text: n })));
    sevBtns.forEach((b, i) => b.classList.toggle('pk-on', !!i === st.sev));
    accBtns.forEach(b => b.classList.toggle('pk-on', (b.textContent === '♯') === (st.acc === '#')));
    roots.querySelectorAll('.pk-key').forEach(b => b.classList.toggle('pk-on', +b.dataset.pc === st.root));
    types.querySelectorAll('.pk-type').forEach(b => b.classList.toggle('pk-on', b.dataset.q === st.q));
    bass.querySelectorAll('.pk-chip').forEach(b => b.classList.toggle('pk-on', b.dataset.bass === 'none' ? st.bass == null : +b.dataset.bass === st.bass));
    sugChips.forEach(b => b.classList.toggle('pk-on', b._c.root === st.root && b._c.q === st.q && (b._c.bass == null ? st.bass == null : b._c.bass === st.bass)));
    if (fitChips) fitChips.querySelectorAll('.pk-fit').forEach(b => b.classList.toggle('pk-on', +b.dataset.root === st.root && b.dataset.q === st.q && st.bass == null));
  }
  function bump(node) { node.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }, { transform: 'scale(1)' }], { duration: 220, easing: EASE }); }
  function audition() { audio.chord(spec()); pName.animate([{ transform: 'scale(0.96)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: EASE }); }

  okBtn.addEventListener('click', () => { o.onSubmit && o.onSubmit(spec()); S.close('ok'); });
  if (panes) {
    TAB_ORDER.forEach(([k]) => { tabBtns[k].hidden = !panes[k].children.length; });
    const ideasFix = panes.ideas.querySelector('.pk-sec-fix');
    if (ideasFix) tabBtns.ideas.append(el('span', { class: 'pk-ptab-dot', 'aria-label': 'has fixes', text: '!' }));
    let first = o.tabs.initial;
    if (!first || !panes[first] || !panes[first].children.length) first = TAB_ORDER.map(t => t[0]).find(k => panes[k].children.length);
    showTab(first);
  }

  renderFit(); renderRoots(); renderBass(); applyMore();
  return { close: S.close };
}

/* Presets sheet */
function presets(host, opts) {
  const o = Object.assign({ onPick: null }, opts || {});
  const S = sheet(host, { label: 'Example progressions', className: 'pk-presets' });
  const body = el('div', { class: 'pk-body' });
  S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'Examples' }), el('span', { class: 'pk-spacer' })]), body);
  PRESETS.forEach(p => {
    body.append(el('button', { class: 'pk-preset', onclick: () => { store.loadPreset(p); o.onPick && o.onPick(p); S.close('ok'); } }, [
      el('span', { class: 'pk-preset-top' }, [el('span', { class: 'pk-preset-name', text: p.name }), el('span', { class: 'pk-preset-rn', text: p.rn })]),
      el('span', { class: 'pk-preset-chords', text: p.list.map(chordName).join('  ') }),
    ]));
  });
  return S;
}

/* Base CSS — themed by each view through --pk-* and --tt-* variables */
const CSS = `
.cx-noselect, .cx-noselect * { -webkit-user-select: none !important; user-select: none !important; }
.cx-dragging { touch-action: none; }
.cx-ghost { will-change: transform, left, top; }
.pk-layer { position: absolute; inset: 0; z-index: 900; pointer-events: none; font-family: var(--pk-font, system-ui, sans-serif); }
.pk-scrim { position: absolute; inset: 0; background: var(--pk-scrim, rgba(10,12,16,.38)); opacity: 0; transition: opacity .3s ease; pointer-events: auto; }
.pk-sheet { position: absolute; left: 0; right: 0; bottom: 0; max-height: calc(100% - 28px); display: flex; flex-direction: column;
  background: var(--pk-bg, #fff); color: var(--pk-fg, #111); border-radius: var(--pk-radius, 24px) var(--pk-radius, 24px) 0 0;
  box-shadow: 0 -12px 40px rgba(0,0,0,.22); transform: translateY(105%); transition: transform .42s cubic-bezier(.2,.9,.25,1); pointer-events: auto; outline: none;
  padding-bottom: env(safe-area-inset-bottom, 0px); }
.pk-open .pk-scrim { opacity: 1; }
.pk-open .pk-sheet { transform: translateY(0); }
.pk-grab { display: flex; justify-content: center; padding: 8px 0 2px; touch-action: none; cursor: grab; }
.pk-grab span { width: 38px; height: 5px; border-radius: 3px; background: var(--pk-line, #ddd); }
.pk-head { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 4px 20px 10px; touch-action: none; }
.pk-head button { font: inherit; border: 0; background: none; cursor: pointer; padding: 8px 0; min-height: 40px; }
.pk-cancel { justify-self: start; color: var(--pk-muted, #666); font-size: 17px; }
.pk-title { font-weight: 700; font-size: 17px; }
.pk-ok { justify-self: end; color: var(--pk-accent, #111); font-weight: 700; font-size: 17px; }
.pk-spacer { justify-self: end; }
.pk-body { overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
.pk-body button { font: inherit; cursor: pointer; }
.pk-preview { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pk-pv-text { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.pk-name { font-family: var(--pk-display, inherit); font-size: 40px; font-weight: var(--pk-display-weight, 800); letter-spacing: -0.02em; line-height: 1.05; overflow-wrap: anywhere; }
.pk-sub { display: flex; gap: 8px; align-items: baseline; font-size: 16px; color: var(--pk-muted, #666); flex-wrap: wrap; }
.pk-rn { font-weight: 700; color: var(--pk-accent, #111); }
.pk-notes { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
.pk-note { font-size: 15px; font-weight: 600; padding: 3px 8px; border-radius: 7px; background: var(--pk-chip, #f1f1f1); }
.pk-hear { flex: none; width: 52px; height: 52px; border-radius: 50%; border: 1.5px solid var(--pk-line, #ddd); background: var(--pk-bg, #fff); color: var(--pk-fg, #111); display: flex; align-items: center; justify-content: center; }
.pk-sec { display: flex; flex-direction: column; gap: 8px; }
.pk-label { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--pk-muted, #666); }
.pk-hint { text-transform: none; letter-spacing: 0; font-weight: 500; font-size: 14px; }
.pk-seg { display: flex; border: 1px solid var(--pk-line, #ddd); border-radius: 9px; overflow: hidden; }
.pk-segbtn { border: 0; background: transparent; color: var(--pk-fg, #111); padding: 4px 11px; font-size: 15px; font-weight: 600; letter-spacing: 0; text-transform: none; min-height: 28px; }
.pk-segbtn.pk-on { background: var(--pk-sel-bg, #111); color: var(--pk-sel-fg, #fff); }
.pk-chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; margin: 0 -20px; padding-left: 20px; padding-right: 20px; }
.pk-chips::-webkit-scrollbar { display: none; }
.pk-chip { flex: none; min-height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--pk-line, #ddd); background: var(--pk-bg, #fff); color: var(--pk-fg, #111); font-size: 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: background .15s, color .15s, border-color .15s; }
.pk-chip.pk-on { background: var(--pk-sel-bg, #111); color: var(--pk-sel-fg, #fff); border-color: var(--pk-sel-bg, #111); }
.pk-sug { flex-direction: column; align-items: flex-start; justify-content: center; gap: 0; min-height: 46px; border-radius: 14px; padding: 4px 14px; }
.pk-sug-tag { font-size: 13px; font-weight: 500; color: var(--pk-muted, #666); line-height: 1.2; }
.pk-sug.pk-on .pk-sug-tag { color: inherit; opacity: .75; }
.pk-sug-fix { border-color: var(--pk-warn, #B45309); }
.pk-noteline { display: flex; gap: 8px; align-items: flex-start; font-size: 16px; line-height: 1.4; padding: 10px 12px; border-radius: 12px; background: #F6EEFB; color: #5B2283; }
.pk-noteline.pk-note-off { background: #FDF3E7; color: #8A3F06; }
.pk-note-dot { flex: none; width: 18px; height: 18px; border-radius: 50%; background: #8E3FC7; color: #fff; font: 700 13px/18px system-ui, sans-serif; text-align: center; margin-top: 1px; }
.pk-note-off .pk-note-dot { background: #B45309; }
.pk-chip-rn { font-size: 14px; font-weight: 700; color: var(--pk-accent, #111); }
.pk-chip.pk-on .pk-chip-rn { color: inherit; opacity: .75; }
.pk-roots-piano { position: relative; display: flex; height: 92px; }
.pk-roots-piano .pk-white { flex: 1; border: 1px solid var(--pk-line, #ccc); border-left-width: 0; background: var(--pk-key-white, #fff); color: var(--pk-muted, #666); border-radius: 0 0 9px 9px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 7px; font-size: 15px; font-weight: 600; transition: background .15s, color .15s; }
.pk-roots-piano .pk-white:first-child { border-left-width: 1px; }
.pk-roots-piano .pk-black { position: absolute; top: 0; width: 12%; height: 56px; border: 0; background: var(--pk-key-black, #222); color: var(--pk-key-black-fg, #bbb); border-radius: 0 0 7px 7px; font-size: 13px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; z-index: 1; transition: background .15s; }
.pk-roots-piano .pk-key.pk-on { background: var(--pk-sel-bg, #111); color: var(--pk-sel-fg, #fff); }
.pk-roots-piano .pk-black.pk-on { background: var(--pk-accent, #111); color: var(--pk-accent-fg, #fff); }
.pk-roots-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
.pk-roots-pads { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
.pk-roots-grid .pk-key, .pk-roots-pads .pk-key { min-height: 44px; border-radius: 12px; border: 1px solid var(--pk-line, #ddd); background: var(--pk-bg, #fff); color: var(--pk-fg, #111); font-size: 16px; font-weight: 700; transition: background .15s, color .15s, transform .1s; }
.pk-roots-pads .pk-key { aspect-ratio: 1; min-height: 0; border-radius: 10px; }
.pk-roots-grid .pk-acc, .pk-roots-pads .pk-acc { background: var(--pk-chip, #f2f2f2); }
.pk-roots-grid .pk-key.pk-on, .pk-roots-pads .pk-key.pk-on { background: var(--pk-sel-bg, #111); color: var(--pk-sel-fg, #fff); border-color: var(--pk-sel-bg, #111); }
.pk-key:active, .pk-type:active, .pk-chip:active { transform: scale(.96); }
.pk-tabs { display: flex; gap: 18px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--pk-line, #eee); margin: 0 -20px; padding: 0 20px; }
.pk-tabs::-webkit-scrollbar { display: none; }
.pk-tab { flex: none; border: 0; background: none; padding: 6px 0 10px; font-size: 16px; color: var(--pk-muted, #666); box-shadow: inset 0 0 0 transparent; transition: color .15s, box-shadow .2s; }
.pk-tab.pk-on { color: var(--pk-fg, #111); font-weight: 700; box-shadow: inset 0 -2px 0 var(--pk-accent, #111); }
.pk-types { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.pk-type { min-height: 56px; border-radius: 13px; border: 1px solid var(--pk-line, #ddd); background: var(--pk-bg, #fff); color: var(--pk-fg, #111); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 6px 4px; transition: background .15s, border-color .15s; }
.pk-type-sym { font-family: var(--pk-display, inherit); font-size: 18px; font-weight: 700; line-height: 1.1; }
.pk-type-nm { font-size: 13px; color: var(--pk-muted, #666); line-height: 1.2; text-align: center; }
.pk-type.pk-on { border: 2px solid var(--pk-sel-bg, #111); background: var(--pk-chip, #f4f4f4); }
.pk-ptabs { position: sticky; top: 0; z-index: 3; display: flex; gap: 4px; padding: 4px; margin: 0 0 -4px; background: var(--pk-chip, #f1f1f1); border-radius: 14px; box-shadow: 0 6px 10px -8px rgba(0,0,0,.18); }
.pk-ptab { flex: 1; min-height: 44px; border: 0; border-radius: 11px; background: transparent; color: var(--pk-muted, #666); font-weight: 700; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: background .2s, color .2s, box-shadow .2s; }
.pk-ptab.pk-on { background: var(--pk-bg, #fff); color: var(--pk-fg, #111); box-shadow: 0 1px 3px rgba(0,0,0,.14); }
.pk-ptab-dot { width: 18px; height: 18px; border-radius: 50%; background: var(--pk-warn, #B45309); color: #fff; font-size: 12px; line-height: 18px; text-align: center; }
.pk-pane { display: flex; flex-direction: column; gap: 22px; padding-top: 4px; }
.pk-sheet.pk-tall { height: calc(100% - 28px); }
.pk-more { align-self: flex-start; min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px dashed var(--pk-line, #ccc); background: transparent; color: var(--pk-accent, #111); font-weight: 700; font-size: 15px; }
.pk-delete { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; border-radius: 14px; border: 1px solid var(--pk-line, #ddd); background: transparent; color: var(--pk-danger, #D92D20); font-size: 16px; font-weight: 600; }
.pk-preset { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--pk-line, #ddd); background: var(--pk-bg, #fff); color: var(--pk-fg, #111); transition: transform .12s; }
.pk-preset:active { transform: scale(.98); }
.pk-preset-top { display: flex; justify-content: space-between; width: 100%; gap: 10px; align-items: baseline; }
.pk-preset-name { font-weight: 700; font-size: 17px; }
.pk-preset-rn { font-size: 14px; color: var(--pk-accent, #111); font-weight: 600; text-align: right; }
.pk-preset-chords { font-family: var(--pk-display, inherit); font-size: 16px; color: var(--pk-muted, #666); }
.pk-fn-tonic { --fn: var(--fn-tonic); } .pk-fn-predominant { --fn: var(--fn-pre); } .pk-fn-dominant { --fn: var(--fn-dom); } .pk-fn-outside { --fn: var(--fn-out); }
.pk-rn.pk-fn-tonic, .pk-rn.pk-fn-predominant, .pk-rn.pk-fn-dominant, .pk-rn.pk-fn-outside { color: var(--fn, var(--pk-accent)); }
.cx-toast { position: absolute; left: 50%; bottom: var(--tt-bottom, 110px); transform: translate(-50%, 16px); opacity: 0; z-index: 850; display: flex; align-items: center; gap: 14px;
  background: var(--tt-bg, #111); color: var(--tt-fg, #fff); padding: 10px 10px 10px 18px; border-radius: 999px; font-family: var(--pk-font, system-ui); font-size: 16px; font-weight: 500;
  box-shadow: 0 10px 30px rgba(0,0,0,.25); transition: transform .3s cubic-bezier(.2,.9,.25,1), opacity .25s; max-width: calc(100% - 40px); white-space: nowrap; }
.cx-toast.cx-in { transform: translate(-50%, 0); opacity: 1; }
.cx-toast-msg { overflow: hidden; text-overflow: ellipsis; }
.cx-toast-btn { font: inherit; font-weight: 700; border: 0; border-radius: 999px; padding: 7px 14px; background: var(--tt-btn-bg, rgba(255,255,255,.16)); color: var(--tt-btn-fg, #fff); cursor: pointer; }
@media (prefers-reduced-motion: reduce) { .pk-sheet, .pk-scrim, .cx-toast { transition-duration: .01s !important; } }
`;
const styleEl = document.createElement('style');
styleEl.textContent = CSS;
document.head.appendChild(styleEl);

/* ───────────────────────── VIEWS REGISTRY ───────────────────────── */
const views = (function () {
  const list = [];
  return {
    list,
    register(v) { list.push(v); },
    get(id) { return list.find(v => v.id === id); },
  };
})();

const ui = { el, flip, reorder, toast, sheet, picker, presets, ICON, EASE, reduceMotion };

window.Changes = { theory, store, player, audio, ui, views, PRESETS };
})();
