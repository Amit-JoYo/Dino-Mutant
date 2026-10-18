/* Modular animated SVG dinosaur rigs: root / tail / neck-head / wings / legs. */
(function (global) {
  'use strict';

  const SPECIES = {
    trex: { name: 'טִירָנוֹזָאוּרוּס רֶקְס', short: 'טִי-רֶקְס', trait: 'bite', cost: 0,
      legendName: 'רֶקְס הַזָּהָב' },
    brachio: { name: 'בְּרַכְיוֹזָאוּר', short: 'בְּרַכְיוֹזָאוּר', trait: 'neck', cost: 30,
      legendName: 'בְּרַכְיוֹזָאוּר הַקְּרִיסְטָל' },
    trike: { name: 'טְרִיצֶרָטוֹפְּס', short: 'טְרִיצֶרָטוֹפְּס', trait: 'horn', cost: 40,
      legendName: 'טְרִיצֶרָטוֹפְּס הָאֵשׁ' },
    ptero: { name: 'פְּטֵרוֹדַקְטִיל', short: 'פְּטֵרוֹדַקְטִיל', trait: 'fly', cost: 50,
      legendName: 'פְּטֵרוֹדַקְטִיל הַגָּלַקְסְיָה' },
  };

  const TRAITS = {
    bite: { icon: '🦷', name: 'נְשִׁיכָה חֲזָקָה' },
    neck: { icon: '🦒', name: 'צַוָּאר אָרֹךְ' },
    horn: { icon: '🦏', name: 'קֶרֶן חֲזָקָה' },
    fly: { icon: '🕊️', name: 'טִיסָה' },
  };

  const TINTS = [
    { body: '#5cc46a', dark: '#3a9a4a', belly: '#e4f8c6' },
    { body: '#5aa9e6', dark: '#3a7fc0', belly: '#d9eeff' },
    { body: '#a77be0', dark: '#7d54b8', belly: '#eadcff' },
    { body: '#ff9f5a', dark: '#d97a2b', belly: '#ffe6c8' },
    { body: '#ff7eb6', dark: '#d9548f', belly: '#ffdcec' },
    { body: '#3cc9b5', dark: '#22978a', belly: '#cef6ef' },
  ];

  const LEGEND_PALETTE = {
    trex: { body: '#ffd23f', dark: '#d99a00', belly: '#fff3b0' },
    brachio: { body: '#7fe3ff', dark: '#37a8d6', belly: '#e6fbff' },
    trike: { body: '#ff6a3d', dark: '#c93a12', belly: '#ffd0a8' },
    ptero: { body: '#8a5cff', dark: '#4b2fb8', belly: '#e1d6ff' },
  };

  const HORN_AT = {
    trex: [236, 58], brachio: [250, 18], trike: [212, 76], ptero: [196, 42],
  };

  function eye(x, y, r) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 1.5}" cy="${y}" r="${r * 0.5}" fill="#222"/>`;
  }

  function spots(p, pts) {
    return pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.dark}" opacity=".45"/>`).join('');
  }

  const BUILDERS = {
    trex(p) {
      return `
        <g class="rig-tail"><path d="M96 108 Q46 112 6 160 Q52 150 102 142 Z" fill="${p.body}"/></g>
        <g transform="translate(-4,0)"><g class="rig-leg a"><path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${p.dark}"/></g></g>
        <g class="rig-body">
          <ellipse cx="150" cy="122" rx="64" ry="44" fill="${p.body}"/>
          <ellipse cx="160" cy="140" rx="44" ry="26" fill="${p.belly}"/>
          ${spots(p, [[120, 100, 7], [146, 92, 5], [100, 126, 6]])}
        </g>
        <g transform="translate(32,0)"><g class="rig-leg b"><path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${p.body}"/></g></g>
        <path d="M198 130 q18 4 20 18" stroke="${p.dark}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <g class="rig-head">
          <path d="M186 112 Q202 82 226 72 L230 108 Z" fill="${p.body}"/>
          <path d="M204 60 Q250 48 290 70 Q296 88 284 96 L214 100 Q194 84 204 60 Z" fill="${p.body}"/>
          <path d="M214 98 L282 96 Q284 112 268 114 L220 112 Z" fill="${p.dark}"/>
          <path d="M226 98 l5 9 l5 -9 M242 97 l5 9 l5 -9 M258 96 l5 9 l5 -9" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
          ${eye(250, 70, 7)}
          <circle cx="285" cy="76" r="2.5" fill="${p.dark}"/>
        </g>`;
    },

    brachio(p) {
      const leg = (x, c) => `<rect x="${x}" y="150" width="26" height="50" rx="12" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M78 122 Q34 138 4 176 Q52 162 90 152 Z" fill="${p.body}"/></g>
        <g class="rig-leg a">${leg(88, p.dark)}</g>
        <g class="rig-leg b">${leg(116, p.dark)}</g>
        <g class="rig-body">
          <ellipse cx="148" cy="128" rx="72" ry="42" fill="${p.body}"/>
          <ellipse cx="152" cy="146" rx="50" ry="22" fill="${p.belly}"/>
          ${spots(p, [[116, 108, 8], [148, 100, 6], [176, 112, 7]])}
        </g>
        <g class="rig-leg a">${leg(168, p.body)}</g>
        <g class="rig-leg b">${leg(198, p.body)}</g>
        <g class="rig-head">
          <path d="M186 112 Q216 92 222 46 L246 46 Q248 104 214 142 Z" fill="${p.body}"/>
          <ellipse cx="250" cy="32" rx="22" ry="15" fill="${p.body}"/>
          ${eye(258, 27, 5.5)}
          <path d="M252 40 q8 5 16 -1" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </g>`;
    },

    trike(p) {
      const leg = (x, c) => `<rect x="${x}" y="150" width="28" height="50" rx="12" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M84 138 Q52 148 26 174 Q66 168 94 160 Z" fill="${p.body}"/></g>
        <g class="rig-leg a">${leg(96, p.dark)}</g>
        <g class="rig-leg b">${leg(124, p.dark)}</g>
        <g class="rig-body">
          <ellipse cx="150" cy="134" rx="68" ry="42" fill="${p.body}"/>
          <ellipse cx="156" cy="150" rx="46" ry="22" fill="${p.belly}"/>
          ${spots(p, [[118, 112, 7], [150, 104, 6], [180, 118, 7]])}
        </g>
        <g class="rig-leg a">${leg(172, p.body)}</g>
        <g class="rig-leg b">${leg(202, p.body)}</g>
        <g class="rig-head">
          <circle cx="212" cy="116" r="46" fill="${p.dark}"/>
          <circle cx="212" cy="116" r="34" fill="${p.belly}" opacity=".55"/>
          ${[[184, 92], [212, 78], [240, 92], [180, 124]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff3d6"/>`).join('')}
          <ellipse cx="250" cy="130" rx="36" ry="25" fill="${p.body}"/>
          <path d="M236 110 L262 66 L256 114 Z" fill="#fff3d6" stroke="#e6cf9c" stroke-width="1.5"/>
          <path d="M222 112 L232 70 L242 114 Z" fill="#fff3d6" stroke="#e6cf9c" stroke-width="1.5"/>
          <path d="M276 128 L296 112 L290 140 Z" fill="#fff3d6" stroke="#e6cf9c" stroke-width="1.5"/>
          ${eye(254, 118, 6)}
          <path d="M240 142 q14 7 28 0" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </g>`;
    },

    ptero(p) {
      return `
        <ellipse class="rig-shadow" cx="150" cy="204" rx="60" ry="7" fill="#000" opacity=".12"/>
        <g class="rig-float">
          <g class="rig-tail"><path d="M118 120 L48 150 L124 136 Z" fill="${p.dark}"/></g>
          <g class="rig-leg a"><path d="M138 140 L130 176 M130 176 l-10 4 M130 176 l8 6" stroke="${p.dark}" stroke-width="6" stroke-linecap="round" fill="none"/></g>
          <g class="rig-leg b"><path d="M162 140 L168 176 M168 176 l-10 4 M168 176 l8 6" stroke="${p.dark}" stroke-width="6" stroke-linecap="round" fill="none"/></g>
          <g class="rig-wing far"><path d="M150 104 Q96 14 22 28 Q62 52 56 72 Q96 70 86 98 Q116 94 126 112 Z" fill="${p.dark}" opacity=".7"/></g>
          <g class="rig-body">
            <ellipse cx="158" cy="120" rx="40" ry="24" fill="${p.body}"/>
            <ellipse cx="164" cy="130" rx="26" ry="12" fill="${p.belly}"/>
          </g>
          <g class="rig-wing"><path d="M156 104 Q116 6 28 18 Q76 46 66 70 Q108 68 98 98 Q130 94 140 114 Z" fill="${p.body}" stroke="${p.dark}" stroke-width="3" stroke-linejoin="round"/></g>
          <g class="rig-head">
            <path d="M186 110 L216 80 L230 92 L202 126 Z" fill="${p.body}"/>
            <path d="M212 70 Q240 56 292 70 L298 77 L240 92 L220 94 Z" fill="${p.body}"/>
            <path d="M212 72 Q196 40 168 48 Q196 56 214 82 Z" fill="${p.dark}"/>
            ${eye(230, 74, 6)}
          </g>
        </g>`;
    },
  };

  function horns(species, n, p) {
    if (!n) return '';
    const [x, y] = HORN_AT[species];
    let out = '';
    for (let i = 0; i < n; i++) {
      const dx = (i - (n - 1) / 2) * 13;
      const h = 14 + i * 2;
      out += `<path d="M${x + dx - 6} ${y + 6} L${x + dx} ${y - h} L${x + dx + 6} ${y + 6} Z" fill="#ffe066" stroke="#d9a400" stroke-width="1.5" stroke-linejoin="round"/>`;
    }
    return `<g class="rig-minihorn">${out}</g>`;
  }

  function eggs(n) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = 22 + i * 26;
      out += `<g class="rig-egg" style="animation-delay:${i * 0.4}s">
        <ellipse cx="${x}" cy="190" rx="10" ry="13" fill="#fff6e0" stroke="#d9c79a" stroke-width="2"/>
        <circle cx="${x - 3}" cy="186" r="2" fill="#e8b4a0"/><circle cx="${x + 3}" cy="193" r="2" fill="#a0c8e8"/></g>`;
    }
    return out;
  }

  const SPARKLES = [[40, 40], [270, 30], [150, 12], [280, 150]].map(([x, y], i) =>
    `<path class="sparkle" style="animation-delay:${i * 0.45}s" d="M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z" fill="#fff6a8" stroke="#ffd23f" stroke-width="1"/>`
  ).join('');

  /**
   * @param {string} species trex|brachio|trike|ptero
   * @param {{tint?:number,legendary?:boolean,horns?:number,eggs?:number}} opts
   */
  function dino(species, opts) {
    const o = Object.assign({ tint: 0, legendary: false, horns: 0, eggs: 0 }, opts);
    const p = o.legendary ? LEGEND_PALETTE[species] : TINTS[o.tint % TINTS.length];
    return `<svg class="dino-svg sp-${species}${o.legendary ? ' legendary' : ''}" viewBox="0 0 300 220" role="img" aria-label="${SPECIES[species].short}">
      <g class="rig-root">${BUILDERS[species](p)}${horns(species, o.horns, p)}</g>
      ${eggs(o.eggs)}${o.legendary ? SPARKLES : ''}
    </svg>`;
  }

  function silhouette(species) {
    return `<div class="silhouette">${dino(species, { tint: 0 })}</div>`;
  }

  global.Renderer = { SPECIES, TRAITS, TINTS, dino, silhouette };
})(window);
