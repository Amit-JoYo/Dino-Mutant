/* Wordlings: original collectible creatures drawn as SVG. Each species has a look (body shape, ears, tail, crest on its head);
   two evolutions add a bigger crest, an aura and sparkles. Everything is drawn in a 200x200 box with the feet at y=178. */
(function (global) {
  'use strict';

  const r1 = (n) => Math.round(n * 10) / 10;

  const SHAPES = {
    round: { cy: 122, rx: 58, ry: 54 },
    tall: { cy: 118, rx: 50, ry: 60 },
    wide: { cy: 132, rx: 68, ry: 46 },
  };

  const SPECIES = [
    { id: 'sproutle', name: 'Sproutle', element: '🌱', c: ['#7bd36f', '#4aa04a', '#e9f9c9'], shape: 'round', ears: 'leaf', tail: 'leaf', crest: 'sprout' },
    { id: 'mossu', name: 'Mossu', element: '🍄', c: ['#a9b86a', '#7a8a3c', '#eef0cd'], shape: 'wide', ears: 'round', tail: 'none', crest: 'mushroom' },
    { id: 'bloomie', name: 'Bloomie', element: '🌸', c: ['#ff9ec4', '#d9648f', '#ffe6f0'], shape: 'round', ears: 'bunny', tail: 'puff', crest: 'petals' },
    { id: 'embero', name: 'Embero', element: '🔥', c: ['#ff9a5a', '#d9692a', '#ffe3c4'], shape: 'round', ears: 'round', tail: 'flame', crest: 'flame' },
    { id: 'berrimp', name: 'Berrimp', element: '🍓', c: ['#c77be0', '#9249b3', '#f0d9fa'], shape: 'tall', ears: 'cat', tail: 'puff', crest: 'berry' },
    { id: 'puffy', name: 'Puffy', element: '☁️', c: ['#bfe3ff', '#7fb4e6', '#ffffff'], shape: 'wide', ears: 'none', tail: 'puff', crest: 'cloud' },
    { id: 'pebbo', name: 'Pebbo', element: '💎', c: ['#b79c84', '#876b55', '#efe2d3'], shape: 'wide', ears: 'round', tail: 'none', crest: 'crystal' },
    { id: 'shadlet', name: 'Shadlet', element: '🌙', c: ['#7a67dc', '#4a3ca3', '#d4ccf7'], shape: 'tall', ears: 'cat', tail: 'curl', crest: 'moon' },
    { id: 'zappo', name: 'Zappo', element: '⚡', c: ['#f28bd8', '#c256a8', '#ffdcf5'], shape: 'round', ears: 'round', tail: 'zig', crest: 'bolt' },
    { id: 'dribbo', name: 'Dribbo', element: '💧', c: ['#6fb7ff', '#3c85d6', '#dff0ff'], shape: 'round', ears: 'fin', tail: 'curl', crest: 'drop' },
    { id: 'frostle', name: 'Frostle', element: '❄️', c: ['#9fe8ee', '#4cb7c4', '#f0ffff'], shape: 'tall', ears: 'round', tail: 'puff', crest: 'snow' },
    { id: 'glimmy', name: 'Glimmy', element: '⭐', c: ['#ffe27a', '#d9a620', '#fff6cf'], shape: 'round', ears: 'none', tail: 'puff', crest: 'star' },
  ];

  const BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

  /* ---- parts ---- */
  function crest(kind, x, y, s, c, stage) {
    const k = stage >= 2 ? 1.3 : 1;
    const t = (inner) => `<g class="wl-crest" transform="translate(${x} ${y}) scale(${r1(k * s)})">${inner}</g>`;
    switch (kind) {
      case 'sprout':
        return t(`<path d="M0 4 Q-2 -14 2 -26" stroke="#3f9a45" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M2 -24 Q-22 -34 -26 -14 Q-6 -10 2 -24 Z" fill="#6fd26a" stroke="#3f9a45" stroke-width="2"/>
          <path d="M2 -24 Q26 -36 28 -16 Q8 -10 2 -24 Z" fill="#8fe483" stroke="#3f9a45" stroke-width="2"/>`);
      case 'flame':
        return t(`<path d="M-16 4 Q-24 -16 -10 -34 Q-8 -20 -2 -16 Q-4 -34 8 -46 Q10 -26 18 -18 Q26 -6 16 4 Z" fill="#ff8a2a"/>
          <path d="M-6 4 Q-12 -8 -2 -20 Q0 -10 6 -8 Q10 -2 6 4 Z" fill="#ffd34d"/>`);
      case 'drop':
        return t(`<path d="M0 -42 Q-22 -14 -16 0 Q-10 8 0 8 Q10 8 16 0 Q22 -14 0 -42 Z" fill="#5aa9f5" stroke="#2f78c8" stroke-width="2.5"/>
          <ellipse cx="-6" cy="-8" rx="3.5" ry="7" fill="#fff" opacity=".7" transform="rotate(20 -6 -8)"/>`);
      case 'cloud':
        return t(`<circle cx="-14" cy="-6" r="13" fill="#fff"/><circle cx="2" cy="-16" r="16" fill="#fff"/><circle cx="18" cy="-6" r="12" fill="#fff"/>
          <circle cx="2" cy="-4" r="14" fill="#fff"/><circle cx="-14" cy="-6" r="13" fill="none" stroke="#cfe6fa" stroke-width="2" opacity=".6"/>`);
      case 'crystal':
        return t(`<path d="M-16 6 L-12 -22 L-4 6 Z" fill="#9be6ff" stroke="#4fb4d6" stroke-width="2" stroke-linejoin="round"/>
          <path d="M-6 6 L2 -38 L12 6 Z" fill="#c6f1ff" stroke="#4fb4d6" stroke-width="2" stroke-linejoin="round"/>
          <path d="M8 6 L18 -20 L24 6 Z" fill="#9be6ff" stroke="#4fb4d6" stroke-width="2" stroke-linejoin="round"/>`);
      case 'berry':
        return t(`<circle cx="0" cy="-12" r="15" fill="#ef4d6b" stroke="#b92b49" stroke-width="2"/>
          <circle cx="-5" cy="-14" r="1.8" fill="#ffd0d8"/><circle cx="5" cy="-8" r="1.8" fill="#ffd0d8"/><circle cx="2" cy="-18" r="1.8" fill="#ffd0d8"/>
          <path d="M-10 -24 Q0 -34 10 -24 Q0 -20 -10 -24 Z" fill="#59b84e" stroke="#2f7f2c" stroke-width="1.5"/>`);
      case 'snow':
        return t(`<g stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M0 -36 V0 M-17 -27 L17 -9 M17 -27 L-17 -9"/></g>
          <g stroke="#6fd0e0" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M0 -36 V0 M-17 -27 L17 -9 M17 -27 L-17 -9"/></g>
          <circle cx="0" cy="-18" r="5" fill="#fff" stroke="#6fd0e0" stroke-width="1.6"/>`);
      case 'moon':
        return t(`<path d="M10 -36 A22 22 0 1 0 10 6 A17 17 0 1 1 10 -36 Z" fill="#ffe27a" stroke="#d9a620" stroke-width="2"/>
          <circle cx="22" cy="-30" r="3" fill="#ffe27a"/>`);
      case 'petals': {
        const petals = [0, 72, 144, 216, 288]
          .map((a) => `<ellipse cx="0" cy="-17" rx="8" ry="12" fill="#ffd0e4" stroke="#e58bb4" stroke-width="1.6" transform="rotate(${a} 0 -8)"/>`)
          .join('');
        return t(`${petals}<circle cx="0" cy="-8" r="7" fill="#ffd34d" stroke="#d9a620" stroke-width="1.6"/>`);
      }
      case 'star':
        return t(`<path d="M0 -40 L7 -22 L26 -22 L11 -11 L17 8 L0 -3 L-17 8 L-11 -11 L-26 -22 L-7 -22 Z" fill="#ff9f1c" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/>`);
      case 'mushroom':
        return t(`<path d="M-30 2 Q-30 -30 0 -32 Q30 -30 30 2 Q0 -6 -30 2 Z" fill="#ef6a5b" stroke="#b83b2d" stroke-width="2"/>
          <circle cx="-14" cy="-14" r="5" fill="#fff"/><circle cx="8" cy="-20" r="4" fill="#fff"/><circle cx="18" cy="-8" r="3.5" fill="#fff"/>`);
      case 'bolt':
        return t(`<path d="M6 -42 L-14 -14 L-2 -14 L-8 6 L16 -20 L3 -20 Z" fill="#ffd93d" stroke="#d99a00" stroke-width="2.2" stroke-linejoin="round"/>`);
      default:
        return '';
    }
  }

  function ears(kind, topY, rx, c) {
    const dx = rx * 0.62;
    const y = topY + 12;
    const two = (fn) => fn(-1) + fn(1);
    switch (kind) {
      case 'leaf':
        return two((s) => `<path d="M${100 + s * dx} ${y + 6} Q${100 + s * (dx + 34)} ${y - 30} ${100 + s * (dx + 6)} ${y - 26} Q${100 + s * (dx - 8)} ${y - 8} ${100 + s * dx} ${y + 6} Z" fill="#6fd26a" stroke="#3f9a45" stroke-width="2.5"/>`);
      case 'round':
        return two((s) => `<circle cx="${100 + s * dx}" cy="${y}" r="16" fill="${c[0]}" stroke="${c[1]}" stroke-width="2.5"/><circle cx="${100 + s * dx}" cy="${y + 2}" r="8" fill="${c[2]}"/>`);
      case 'cat':
        return two((s) => `<path d="M${100 + s * (dx - 16)} ${y + 14} L${100 + s * (dx + 4)} ${y - 26} L${100 + s * (dx + 22)} ${y + 12} Z" fill="${c[0]}" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M${100 + s * (dx - 6)} ${y + 8} L${100 + s * (dx + 4)} ${y - 12} L${100 + s * (dx + 14)} ${y + 8} Z" fill="${c[2]}"/>`);
      case 'bunny':
        return two((s) => `<ellipse cx="${100 + s * dx * 0.9}" cy="${y - 18}" rx="11" ry="30" fill="${c[0]}" stroke="${c[1]}" stroke-width="2.5" transform="rotate(${s * 12} ${100 + s * dx * 0.9} ${y})"/>
          <ellipse cx="${100 + s * dx * 0.9}" cy="${y - 16}" rx="5" ry="20" fill="${c[2]}" transform="rotate(${s * 12} ${100 + s * dx * 0.9} ${y})"/>`);
      case 'fin':
        return two((s) => `<path d="M${100 + s * (dx + 4)} ${y + 10} Q${100 + s * (dx + 40)} ${y - 6} ${100 + s * (dx + 30)} ${y + 30} Q${100 + s * (dx + 18)} ${y + 24} ${100 + s * (dx + 4)} ${y + 24} Z" fill="#9fd4ff" stroke="${c[1]}" stroke-width="2.5" stroke-linejoin="round"/>`);
      default:
        return '';
    }
  }

  function tail(kind, rx, cy, ry, c) {
    const x = 100 - rx + 6;
    const y = cy + ry * 0.35;
    switch (kind) {
      case 'leaf':
        return `<path d="M${x} ${y} Q${x - 40} ${y - 30} ${x - 34} ${y - 4} Q${x - 22} ${y + 14} ${x} ${y} Z" fill="#6fd26a" stroke="#3f9a45" stroke-width="2.5"/>`;
      case 'flame':
        return `<g class="wl-flick"><path d="M${x} ${y + 6} Q${x - 36} ${y + 8} ${x - 26} ${y - 22} Q${x - 18} ${y - 6} ${x - 8} ${y - 14} Q${x - 6} ${y - 2} ${x} ${y - 6} Z" fill="#ff8a2a"/>
          <path d="M${x - 2} ${y + 4} Q${x - 22} ${y + 4} ${x - 16} ${y - 12} Q${x - 10} ${y - 2} ${x - 4} ${y - 4} Z" fill="#ffd34d"/></g>`;
      case 'puff':
        return `<circle cx="${x - 12}" cy="${y}" r="14" fill="#fff" stroke="${c[1]}" stroke-width="2" opacity=".95"/>`;
      case 'zig':
        return `<path d="M${x + 2} ${y + 4} L${x - 20} ${y + 2} L${x - 12} ${y - 10} L${x - 34} ${y - 14} L${x - 20} ${y - 30} L${x - 8} ${y - 18} L${x - 2} ${y - 22} Z" fill="#ffd93d" stroke="#d99a00" stroke-width="2.2" stroke-linejoin="round"/>`;
      case 'curl':
        return `<path d="M${x + 2} ${y + 6} Q${x - 36} ${y + 14} ${x - 30} ${y - 12} Q${x - 26} ${y - 26} ${x - 12} ${y - 20}" stroke="${c[1]}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      default:
        return '';
    }
  }

  /**
   * @param {string} id species id
   * @param {{stage?:number, mood?:'happy'|'sad'|'idle', size?:number}} o stage 1-3
   */
  function draw(id, o) {
    const sp = BY_ID[id];
    if (!sp) return '';
    const opt = Object.assign({ stage: 1, mood: 'idle' }, o);
    const sh = SHAPES[sp.shape];
    const { cy, rx, ry } = sh;
    const top = cy - ry;
    const [b, d, bl] = sp.c;
    const ey = top + ry * 0.62;
    const ex = rx * 0.38;
    const grow = opt.stage === 3 ? 1.1 : opt.stage === 2 ? 1.05 : 1;
    const aura = opt.stage >= 2
      ? `<circle class="wl-aura" cx="100" cy="116" r="${opt.stage === 3 ? 96 : 84}" fill="url(#wl-aura-${sp.id})"/>`
      : '';
    const defs = opt.stage >= 2
      ? `<defs><radialGradient id="wl-aura-${sp.id}"><stop offset="0" stop-color="#fff6a8" stop-opacity=".15"/><stop offset=".6" stop-color="#ffe066" stop-opacity=".7"/><stop offset="1" stop-color="#ff9ad5" stop-opacity="0"/></radialGradient></defs>`
      : '';
    const sparks = opt.stage >= 2
      ? [[22, 40], [178, 52], [100, 8], [176, 150], [26, 150]]
          .slice(0, opt.stage === 3 ? 5 : 3)
          .map(([x, y], i) => `<path class="wl-spark" style="animation-delay:${i * 0.35}s" d="M${x} ${y - 8} L${x + 3} ${y - 3} L${x + 8} ${y} L${x + 3} ${y + 3} L${x} ${y + 8} L${x - 3} ${y + 3} L${x - 8} ${y} L${x - 3} ${y - 3} Z" fill="#fff6a8" stroke="#ffb703" stroke-width="1"/>`)
          .join('')
      : '';
    const mouth = opt.mood === 'sad'
      ? `<path d="M${100 - 9} ${ey + 24} Q100 ${ey + 15} ${100 + 9} ${ey + 24}" stroke="${d}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : opt.mood === 'happy'
        ? `<path d="M${100 - 12} ${ey + 14} Q100 ${ey + 34} ${100 + 12} ${ey + 14} Z" fill="#7a2f3b" stroke="${d}" stroke-width="2" stroke-linejoin="round"/><path d="M${100 - 6} ${ey + 22} Q100 ${ey + 30} ${100 + 6} ${ey + 22}" fill="#ff8aa0"/>`
        : `<path d="M${100 - 10} ${ey + 15} Q100 ${ey + 27} ${100 + 10} ${ey + 15}" stroke="${d}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const eye = (s) => `<g class="wl-eye"><ellipse cx="${100 + s * ex}" cy="${ey}" rx="10" ry="11.5" fill="#fff" stroke="#2d3340" stroke-width="2"/>
      <circle cx="${100 + s * ex + 1}" cy="${ey + 1}" r="6.4" fill="#2d3340"/><circle cx="${100 + s * ex - 1.4}" cy="${ey - 2.2}" r="2.4" fill="#fff"/></g>`;

    return `<svg class="wl-svg wl-st${opt.stage}${opt.mood !== 'idle' ? ` wl-${opt.mood}` : ''}" viewBox="-14 -14 228 228" role="img" aria-label="${sp.name}">
      ${defs}${aura}${sparks}
      <ellipse cx="100" cy="182" rx="${r1(rx * 0.8)}" ry="7" fill="#000" opacity=".12"/>
      <g class="wl-body" transform="translate(100 178) scale(${grow}) translate(-100 -178)">
        ${tail(sp.tail, rx, cy, ry, sp.c)}
        ${ears(sp.ears, top, rx, sp.c)}
        <ellipse cx="${r1(100 - rx * 0.45)}" cy="176" rx="17" ry="9" fill="${d}"/><ellipse cx="${r1(100 + rx * 0.45)}" cy="176" rx="17" ry="9" fill="${d}"/>
        <ellipse cx="${r1(100 - rx * 0.97)}" cy="${r1(cy + ry * 0.18)}" rx="9" ry="14" fill="${d}" transform="rotate(25 ${r1(100 - rx * 0.97)} ${r1(cy + ry * 0.18)})"/>
        <ellipse cx="${r1(100 + rx * 0.97)}" cy="${r1(cy + ry * 0.18)}" rx="9" ry="14" fill="${d}" transform="rotate(-25 ${r1(100 + rx * 0.97)} ${r1(cy + ry * 0.18)})"/>
        <ellipse cx="100" cy="${cy}" rx="${rx}" ry="${ry}" fill="${b}" stroke="${d}" stroke-width="3"/>
        <ellipse cx="100" cy="${r1(cy + ry * 0.38)}" rx="${r1(rx * 0.6)}" ry="${r1(ry * 0.5)}" fill="${bl}"/>
        <ellipse cx="${r1(100 - rx * 0.62)}" cy="${r1(ey + 13)}" rx="8" ry="5" fill="#ff7eb6" opacity=".45"/><ellipse cx="${r1(100 + rx * 0.62)}" cy="${r1(ey + 13)}" rx="8" ry="5" fill="#ff7eb6" opacity=".45"/>
        ${eye(-1)}${eye(1)}${mouth}
        ${crest(sp.crest, 100, top + 6, 1, sp.c, opt.stage)}
      </g>
    </svg>`;
  }

  function silhouette(id) {
    return `<div class="wl-silhouette">${draw(id)}</div>`;
  }

  global.Creatures = { SPECIES, BY_ID, draw, silhouette };
})(window);
