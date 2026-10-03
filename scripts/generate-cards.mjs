import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'src', 'assets', 'cards');

const SYM = { s: '&#9824;', h: '&#9829;', d: '&#9830;', c: '&#9827;' };
const CLR = (s) => (s === 'h' || s === 'd') ? '#96382C' : '#22201F';
const BG = '#F5F0E8';
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['s', 'h', 'd', 'c'];

const PIP_LAYOUTS = {
  A:  [{ x: 100, y: 140, sz: 82 }],
  '2': [{ x: 100, y: 68 },            { x: 100, y: 212, flip: true }],
  '3': [{ x: 100, y: 68 },            { x: 100, y: 140 },            { x: 100, y: 212, flip: true }],
  '4': [{ x: 56,  y: 64 },            { x: 144, y: 64 },             { x: 56,  y: 216, flip: true },  { x: 144, y: 216, flip: true }],
  '5': [{ x: 56,  y: 64 },            { x: 144, y: 64 },             { x: 100, y: 140 },              { x: 56,  y: 216, flip: true },  { x: 144, y: 216, flip: true }],
  '6': [{ x: 56,  y: 62 },            { x: 144, y: 62 },             { x: 56,  y: 140 },              { x: 144, y: 140 },              { x: 56,  y: 218, flip: true },  { x: 144, y: 218, flip: true }],
  '7': [{ x: 56,  y: 58 },            { x: 144, y: 58 },             { x: 100, y: 100 },              { x: 56,  y: 140 },              { x: 144, y: 140 },              { x: 56,  y: 218, flip: true },  { x: 144, y: 218, flip: true }],
  '8': [{ x: 56,  y: 52 },            { x: 144, y: 52 },             { x: 56,  y: 108 },              { x: 144, y: 108 },              { x: 56,  y: 172, flip: true },  { x: 144, y: 172, flip: true },  { x: 56,  y: 228, flip: true },  { x: 144, y: 228, flip: true }],
  '9': [{ x: 56,  y: 50 },            { x: 144, y: 50 },             { x: 56,  y: 104 },              { x: 144, y: 104 },              { x: 100, y: 142 },              { x: 56,  y: 178, flip: true },  { x: 144, y: 178, flip: true },  { x: 56,  y: 232, flip: true },  { x: 144, y: 232, flip: true }],
  '10': [{ x: 56, y: 44 },             { x: 144, y: 44 },             { x: 100, y: 94 },               { x: 56,  y: 100 },              { x: 144, y: 100 },              { x: 56,  y: 180, flip: true },  { x: 144, y: 180, flip: true },  { x: 100, y: 186, flip: true },  { x: 56,  y: 236, flip: true },  { x: 144, y: 236, flip: true }],
};

const FONT = 'system-ui,Inter,Helvetica,Arial,sans-serif';

function textAttr(fill, sz, opts = '') {
  return `text-anchor="middle" font-family="${FONT}" font-size="${sz}" fill="${fill}"${opts}`;
}

function makePips(rank, color, sym) {
  if (rank === 'A') {
    const p = PIP_LAYOUTS.A[0];
    return `<text x="${p.x}" y="${p.y}" ${textAttr(color, p.sz)} dominant-baseline="central">${sym}</text>`;
  }
  if (!PIP_LAYOUTS[rank]) return '';
  return PIP_LAYOUTS[rank].map((p) => {
    const attr = `${textAttr(color, '20')} dominant-baseline="central"`;
    return p.flip
      ? `<g transform="translate(${p.x},${p.y}) rotate(180)"><text x="0" y="0" ${attr}>${sym}</text></g>`
      : `<text x="${p.x}" y="${p.y}" ${attr}>${sym}</text>`;
  }).join('\n    ');
}

function figureCenter(rank, color, sym) {
  return `<g transform="translate(100, 136)">
    <line x1="-28" y1="-48" x2="28" y2="-48" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
    <text x="0" y="-12" ${textAttr(color, '50', ' font-weight="700"')} dominant-baseline="central">${rank}</text>
    <text x="0" y="28" ${textAttr(color, '17')} dominant-baseline="central">${sym}</text>
    <line x1="-28" y1="48" x2="28" y2="48" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
  </g>`;
}

function cornerTL(rank, sym, color) {
  return `<g transform="translate(20, 20)">
    <text x="0" y="0" ${textAttr(color, '26', ' font-weight="700"')} dominant-baseline="hanging">${rank}</text>
    <text x="0" y="25" ${textAttr(color, '15')} dominant-baseline="hanging">${sym}</text>
  </g>`;
}

function cornerBR(rank, sym, color) {
  return `<g transform="translate(180, 260) rotate(180)">
    <text x="0" y="0" ${textAttr(color, '26', ' font-weight="700"')} dominant-baseline="hanging">${rank}</text>
    <text x="0" y="25" ${textAttr(color, '15')} dominant-baseline="hanging">${sym}</text>
  </g>`;
}

function makeCard(rank, suit) {
  const sym = SYM[suit];
  const color = CLR(suit);
  const fig = ['J', 'Q', 'K'].includes(rank);
  const center = fig ? figureCenter(rank, color, sym) : makePips(rank, color, sym);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">
  <defs><clipPath id="c"><rect width="200" height="280" rx="10"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect width="200" height="280" rx="10" fill="${BG}"/>
    ${cornerTL(rank, sym, color)}
    ${cornerBR(rank, sym, color)}
    ${center}
  </g>
</svg>
`;
}

function makeBack() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">
  <defs><clipPath id="c"><rect width="200" height="280" rx="10"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect width="200" height="280" rx="10" fill="#1A1817"/>
    <rect x="30" y="38" width="140" height="204" rx="3" fill="none" stroke="rgba(205,197,183,0.12)" stroke-width="1"/>
    <rect x="40" y="48" width="120" height="184" rx="2" fill="none" stroke="rgba(205,197,183,0.2)" stroke-width="1.5"/>
    <g transform="translate(100, 140)">
      <rect x="-22" y="-22" width="10" height="10" fill="none" stroke="rgba(205,197,183,0.2)" stroke-width="1"/>
      <rect x="12" y="-22" width="10" height="10" fill="none" stroke="rgba(205,197,183,0.2)" stroke-width="1"/>
      <rect x="-22" y="12" width="10" height="10" fill="none" stroke="rgba(205,197,183,0.2)" stroke-width="1"/>
      <rect x="12" y="12" width="10" height="10" fill="none" stroke="rgba(205,197,183,0.2)" stroke-width="1"/>
      <rect x="-10" y="-10" width="4" height="4" fill="rgba(205,197,183,0.18)"/>
      <rect x="6" y="-10" width="4" height="4" fill="rgba(205,197,183,0.18)"/>
      <rect x="-10" y="6" width="4" height="4" fill="rgba(205,197,183,0.18)"/>
      <rect x="6" y="6" width="4" height="4" fill="rgba(205,197,183,0.18)"/>
    </g>
  </g>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });

for (const suit of SUITS) {
  for (const rank of RANKS) {
    const svg = makeCard(rank, suit);
    fs.writeFileSync(path.join(OUT, `${rank}${suit.toUpperCase()}.svg`), svg);
  }
}

fs.writeFileSync(path.join(OUT, 'back.svg'), makeBack());

console.log(`Generated ${RANKS.length * SUITS.length} card SVGs + back.svg in ${OUT}`);
