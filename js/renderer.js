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
    stego: { name: 'סְטֶגוֹזָאוּרוּס', short: 'סְטֶגוֹזָאוּר', trait: 'armor', cost: 55,
      legendName: 'סְטֶגוֹזָאוּר הַיַּהֲלוֹם' },
    anky: { name: 'אַנְקִילוֹזָאוּרוּס', short: 'אַנְקִילוֹזָאוּר', trait: 'armor', cost: 60,
      legendName: 'אַנְקִילוֹזָאוּר הַבַּרְזֶל' },
    raptor: { name: 'וֵלוֹצִירַפְּטוֹר', short: 'וֵלוֹצִירַפְּטוֹר', trait: 'speed', cost: 65,
      legendName: 'וֵלוֹצִירַפְּטוֹר הַבָּרָק' },
    para: { name: 'פַּרַסוֹרוֹלוֹפוּס', short: 'פַּרַסוֹרוֹלוֹפוּס', trait: 'roar', cost: 70,
      legendName: 'פַּרַסוֹרוֹלוֹפוּס הַקֶּשֶׁת' },
    spino: { name: 'סְפִּינוֹזָאוּרוּס', short: 'סְפִּינוֹזָאוּר', trait: 'swim', cost: 80,
      legendName: 'סְפִּינוֹזָאוּר הַלַּבָּה' },
    plesio: { name: 'פְּלֶסִיוֹזָאוּר', short: 'פְּלֶסִיוֹזָאוּר', trait: 'swim', cost: 90,
      legendName: 'פְּלֶסִיוֹזָאוּר הַכּוֹכָבִים' },
    compy: { name: 'קוֹמְפְּסוֹגְנָתוּס', short: 'קוֹמְפְּסוֹגְנָתוּס', trait: 'speed', cost: 50,
      legendName: 'קוֹמְפְּסוֹגְנָתוּס הַזּוֹהֵר' },
    igua: { name: 'אִיגוּאָנוֹדוֹן', short: 'אִיגוּאָנוֹדוֹן', trait: 'armor', cost: 60,
      legendName: 'אִיגוּאָנוֹדוֹן הַסַּפִּיר' },
    diplo: { name: 'דִּיפְּלוֹדוֹקוּס', short: 'דִּיפְּלוֹדוֹקוּס', trait: 'neck', cost: 70,
      legendName: 'דִּיפְּלוֹדוֹקוּס הַבָּרֶקֶת' },
    dilo: { name: 'דִּילוֹפוֹזָאוּרוּס', short: 'דִּילוֹפוֹזָאוּר', trait: 'roar', cost: 75,
      legendName: 'דִּילוֹפוֹזָאוּר הַקֶּסֶם' },
    pachy: { name: 'פַּכִיצֶפָלוֹזָאוּרוּס', short: 'פַּכִיצֶפָלוֹזָאוּר', trait: 'horn', cost: 85,
      legendName: 'פַּכִיצֶפָלוֹזָאוּר הַשֶּׁלֶג' },
  };

  const TRAITS = {
    bite: { icon: '🦷', name: 'נְשִׁיכָה חֲזָקָה' },
    neck: { icon: '🦒', name: 'צַוָּאר אָרֹךְ' },
    horn: { icon: '🦏', name: 'קֶרֶן חֲזָקָה' },
    fly: { icon: '🕊️', name: 'טִיסָה' },
    armor: { icon: '🛡️', name: 'שִׁרְיוֹן חָזָק' },
    speed: { icon: '⚡', name: 'מְהִירוּת בָּרָק' },
    swim: { icon: '🏊', name: 'שְׂחִיָּה' },
    roar: { icon: '📣', name: 'שְׁאָגָה אַדִּירָה' },
  };

  const TINTS = [
    { body: '#5cc46a', dark: '#3a9a4a', belly: '#e4f8c6' },
    { body: '#5aa9e6', dark: '#3a7fc0', belly: '#d9eeff' },
    { body: '#a77be0', dark: '#7d54b8', belly: '#eadcff' },
    { body: '#ff9f5a', dark: '#d97a2b', belly: '#ffe6c8' },
    { body: '#ff7eb6', dark: '#d9548f', belly: '#ffdcec' },
    { body: '#3cc9b5', dark: '#22978a', belly: '#cef6ef' },
    { body: '#ef6a6a', dark: '#c24444', belly: '#ffd9d9' },
    { body: '#a8d84a', dark: '#7aa82a', belly: '#f1ffcf' },
    { body: '#c9955a', dark: '#9a6a38', belly: '#f4e2c8' },
    { body: '#f2c94c', dark: '#c9a02a', belly: '#fff4c9' },
  ];

  const LEGEND_PALETTE = {
    trex: { body: '#ffd23f', dark: '#d99a00', belly: '#fff3b0' },
    brachio: { body: '#7fe3ff', dark: '#37a8d6', belly: '#e6fbff' },
    trike: { body: '#ff6a3d', dark: '#c93a12', belly: '#ffd0a8' },
    ptero: { body: '#8a5cff', dark: '#4b2fb8', belly: '#e1d6ff' },
    stego: { body: '#ff9ad5', dark: '#c4569a', belly: '#ffe0f2' },
    anky: { body: '#b8c4d6', dark: '#6d7c96', belly: '#eef2f8' },
    raptor: { body: '#4df0b0', dark: '#14a36f', belly: '#d7fff0' },
    para: { body: '#b6e84a', dark: '#6ea81f', belly: '#f0ffc9' },
    spino: { body: '#ff4d4d', dark: '#a81414', belly: '#ffc9a8' },
    plesio: { body: '#5a5fe0', dark: '#2a2d8a', belly: '#c9ccff' },
    compy: { body: '#2de0d0', dark: '#0f8f86', belly: '#d2fffb' },
    igua: { body: '#3d6bff', dark: '#1b3aa8', belly: '#d1dcff' },
    diplo: { body: '#3ddc84', dark: '#168a4a', belly: '#d6ffe6' },
    dilo: { body: '#ff7ad9', dark: '#b03a94', belly: '#ffd6f2' },
    pachy: { body: '#e8eef5', dark: '#8ea3b8', belly: '#ffffff' },
  };

  const HORN_AT = {
    trex: [236, 58], brachio: [250, 18], trike: [212, 76], ptero: [196, 42],
    stego: [236, 134], anky: [244, 132], raptor: [240, 50], spino: [228, 64], para: [236, 50], plesio: [230, 38],
    compy: [214, 74], igua: [228, 52], diplo: [268, 34], dilo: [276, 52], pachy: [232, 34],
  };

  // eye centre + radius, used for the closed-eye lid shown while sleeping
  const EYE_AT = {
    trex: [250, 70, 7], brachio: [258, 27, 5.5], trike: [254, 118, 6], ptero: [230, 74, 6],
    stego: [246, 148, 5.5], anky: [252, 150, 5.5], raptor: [240, 58, 6], spino: [234, 76, 6], para: [232, 62, 6],
    plesio: [236, 44, 5], compy: [216, 94, 8], igua: [240, 66, 6.5], diplo: [274, 41, 4.5], dilo: [240, 58, 6], pachy: [250, 70, 6],
  };

  const EMPTY_WEAR = { hat: '', face: '', neck: '', clothes: '', back0: '', back1: '', tail: '', lid: '' };

  const topOf = (cx, cy, rx, ry, x) => cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));

  function eye(x, y, r) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 1.5}" cy="${y}" r="${r * 0.5}" fill="#222"/>`;
  }

  function spots(p, pts) {
    return pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.dark}" opacity=".45"/>`).join('');
  }

  const BUILDERS = {
    trex(p, w) {
      return `
        <g class="rig-tail"><path d="M96 108 Q46 112 6 160 Q52 150 102 142 Z" fill="${p.body}"/>${w.tail}</g>
        <g transform="translate(-4,0)"><g class="rig-leg a"><path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${p.dark}"/></g></g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="150" cy="122" rx="64" ry="44" fill="${p.body}"/>
          <ellipse cx="160" cy="140" rx="44" ry="26" fill="${p.belly}"/>
          ${spots(p, [[120, 100, 7], [146, 92, 5], [100, 126, 6]])}
          ${w.clothes}${w.back1}${w.neck}
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
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    brachio(p, w) {
      const leg = (x, c) => `<rect x="${x}" y="150" width="26" height="50" rx="12" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M78 122 Q34 138 4 176 Q52 162 90 152 Z" fill="${p.body}"/>${w.tail}</g>
        <g class="rig-leg a">${leg(88, p.dark)}</g>
        <g class="rig-leg b">${leg(116, p.dark)}</g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="148" cy="128" rx="72" ry="42" fill="${p.body}"/>
          <ellipse cx="152" cy="146" rx="50" ry="22" fill="${p.belly}"/>
          ${spots(p, [[116, 108, 8], [148, 100, 6], [176, 112, 7]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g class="rig-leg a">${leg(168, p.body)}</g>
        <g class="rig-leg b">${leg(198, p.body)}</g>
        <g class="rig-head">
          <path d="M186 112 Q216 92 222 46 L246 46 Q248 104 214 142 Z" fill="${p.body}"/>
          <ellipse cx="250" cy="32" rx="22" ry="15" fill="${p.body}"/>
          ${eye(258, 27, 5.5)}
          <path d="M252 40 q8 5 16 -1" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    trike(p, w) {
      const leg = (x, c) => `<rect x="${x}" y="150" width="28" height="50" rx="12" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M84 138 Q52 148 26 174 Q66 168 94 160 Z" fill="${p.body}"/>${w.tail}</g>
        <g class="rig-leg a">${leg(96, p.dark)}</g>
        <g class="rig-leg b">${leg(124, p.dark)}</g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="150" cy="134" rx="68" ry="42" fill="${p.body}"/>
          <ellipse cx="156" cy="150" rx="46" ry="22" fill="${p.belly}"/>
          ${spots(p, [[118, 112, 7], [150, 104, 6], [180, 118, 7]])}
          ${w.clothes}${w.back1}${w.neck}
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
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    ptero(p, w) {
      return `
        <ellipse class="rig-shadow" cx="150" cy="204" rx="60" ry="7" fill="#000" opacity=".12"/>
        <g class="rig-float">
          <g class="rig-tail"><path d="M118 120 L48 150 L124 136 Z" fill="${p.dark}"/>${w.tail}</g>
          <g class="rig-leg a"><path d="M138 140 L130 176 M130 176 l-10 4 M130 176 l8 6" stroke="${p.dark}" stroke-width="6" stroke-linecap="round" fill="none"/></g>
          <g class="rig-leg b"><path d="M162 140 L168 176 M168 176 l-10 4 M168 176 l8 6" stroke="${p.dark}" stroke-width="6" stroke-linecap="round" fill="none"/></g>
          <g class="rig-wing far"><path d="M150 104 Q96 14 22 28 Q62 52 56 72 Q96 70 86 98 Q116 94 126 112 Z" fill="${p.dark}" opacity=".7"/></g>
          ${w.back0}
          <g class="rig-body">
            <ellipse cx="158" cy="120" rx="40" ry="24" fill="${p.body}"/>
            <ellipse cx="164" cy="130" rx="26" ry="12" fill="${p.belly}"/>
            ${w.clothes}${w.back1}${w.neck}
          </g>
          <g class="rig-wing"><path d="M156 104 Q116 6 28 18 Q76 46 66 70 Q108 68 98 98 Q130 94 140 114 Z" fill="${p.body}" stroke="${p.dark}" stroke-width="3" stroke-linejoin="round"/></g>
          <g class="rig-head">
            <path d="M186 110 L216 80 L230 92 L202 126 Z" fill="${p.body}"/>
            <path d="M212 70 Q240 56 292 70 L298 77 L240 92 L220 94 Z" fill="${p.body}"/>
            <path d="M212 72 Q196 40 168 48 Q196 56 214 82 Z" fill="${p.dark}"/>
            ${eye(230, 74, 6)}
            ${w.hat}${w.face}${w.lid}
          </g>
        </g>`;
    },

    stego(p, w) {
      const leg = (x, c) => `<rect x="${x}" y="150" width="26" height="50" rx="12" fill="${c}"/>`;
      const plate = (x, s) => {
        const y = topOf(150, 128, 72, 40, x) + 6;
        return `<path d="M${x - 10 * s} ${y} L${x} ${y - 30 * s} L${x + 10 * s} ${y} Z" fill="#ffb347" stroke="#d9842b" stroke-width="2" stroke-linejoin="round"/>`;
      };
      return `
        <g class="rig-tail"><path d="M82 118 Q40 118 6 150 Q50 160 96 150 Z" fill="${p.body}"/>
          <path d="M30 140 l-4 -18 l12 12 z M48 134 l-2 -18 l12 14 z" fill="#ffe6b0" stroke="#d9a44a" stroke-width="1.5" stroke-linejoin="round"/>${w.tail}</g>
        <g class="rig-leg a">${leg(94, p.dark)}</g>
        <g class="rig-leg b">${leg(120, p.dark)}</g>
        <g class="rig-body">
          ${w.back0}
          ${[[102, .7], [124, .95], [148, 1.1], [172, 1], [194, .75]].map(([x, s]) => plate(x, s)).join('')}
          <ellipse cx="150" cy="128" rx="72" ry="40" fill="${p.body}"/>
          <ellipse cx="156" cy="146" rx="50" ry="22" fill="${p.belly}"/>
          ${spots(p, [[116, 112, 7], [146, 104, 5], [176, 112, 6]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g class="rig-leg a">${leg(170, p.body)}</g>
        <g class="rig-leg b">${leg(198, p.body)}</g>
        <g class="rig-head">
          <path d="M184 106 Q214 108 228 138 L224 168 Q196 152 180 146 Z" fill="${p.body}"/>
          <path d="M214 140 Q246 130 278 150 Q284 164 266 168 L224 168 Q206 158 214 140 Z" fill="${p.body}"/>
          <path d="M228 160 q18 8 36 0" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          ${eye(246, 148, 5.5)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    anky(p, w) {
      const leg = (x, c) => `<rect x="${x}" y="158" width="28" height="42" rx="12" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M84 136 Q50 144 24 156 L28 174 Q56 170 92 158 Z" fill="${p.body}"/>
          <circle cx="18" cy="166" r="16" fill="${p.dark}"/>
          <path d="M6 156 l-4 -10 l12 5 z M24 152 l2 -10 l7 9 z" fill="#fff3d6" stroke="#e6cf9c" stroke-width="1.5" stroke-linejoin="round"/>${w.tail}</g>
        <g class="rig-leg a">${leg(96, p.dark)}</g>
        <g class="rig-leg b">${leg(124, p.dark)}</g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="150" cy="140" rx="78" ry="36" fill="${p.body}"/>
          <ellipse cx="156" cy="156" rx="52" ry="18" fill="${p.belly}"/>
          ${[96, 122, 150, 178, 204].map((x, i) => `<ellipse cx="${x}" cy="${topOf(150, 140, 78, 36, x) + 6}" rx="${9 + (i === 2 ? 3 : 0)}" ry="8" fill="${p.dark}"/><circle cx="${x}" cy="${topOf(150, 140, 78, 36, x) + 4}" r="3" fill="#fff3d6"/>`).join('')}
          <path d="M80 128 l-12 -6 l8 14 z M220 128 l12 -6 l-8 14 z" fill="#fff3d6" stroke="#e6cf9c" stroke-width="1.5" stroke-linejoin="round"/>
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g class="rig-leg a">${leg(172, p.body)}</g>
        <g class="rig-leg b">${leg(200, p.body)}</g>
        <g class="rig-head">
          <path d="M214 142 Q250 130 284 150 Q288 166 268 170 L226 170 Q206 160 214 142 Z" fill="${p.body}"/>
          <path d="M216 138 L204 118 L230 132 Z M232 134 L228 114 L246 130 Z" fill="#fff3d6" stroke="#e6cf9c" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M232 162 q18 7 36 0" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          ${eye(252, 150, 5.5)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    raptor(p, w) {
      const leg = (c) => `<path d="M126 124 Q104 160 124 186 L108 196 L148 198 Q146 188 140 182 Q148 156 154 128 Z" fill="${c}"/><path d="M108 196 q-4 -6 2 -9" stroke="#fff3d6" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return `
        <g class="rig-tail"><path d="M100 108 Q44 92 4 124 Q50 114 102 130 Z" fill="${p.body}"/>
          <path d="M46 104 l6 12 M68 102 l5 14 M26 112 l7 10" stroke="${p.dark}" stroke-width="4" stroke-linecap="round"/>${w.tail}</g>
        <g transform="translate(-6,0)"><g class="rig-leg a">${leg(p.dark)}</g></g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="148" cy="112" rx="54" ry="32" fill="${p.body}"/>
          <ellipse cx="156" cy="126" rx="38" ry="18" fill="${p.belly}"/>
          <path d="M112 90 q10 -8 20 0 M138 84 q10 -8 20 0 M164 90 q10 -8 20 0" stroke="${p.dark}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g transform="translate(20,0)"><g class="rig-leg b">${leg(p.body)}</g></g>
        <path d="M188 116 q14 2 20 14 M196 110 q12 0 18 10" stroke="${p.dark}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <g class="rig-head">
          <path d="M182 100 Q206 90 214 62 L242 66 Q236 100 206 126 Z" fill="${p.body}"/>
          <path d="M212 52 Q248 38 288 58 Q294 72 278 78 L224 82 Q202 72 212 52 Z" fill="${p.body}"/>
          <path d="M224 80 L278 78 Q276 90 262 90 L228 90 Z" fill="${p.dark}"/>
          <path d="M234 80 l4 8 l4 -8 M250 79 l4 8 l4 -8" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
          <path d="M214 54 l-14 -14 l10 2 l-4 -14 l14 14 z" fill="${p.dark}"/>
          ${eye(240, 58, 6)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    spino(p, w) {
      const leg = (c) => `<path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M90 108 Q44 110 6 150 Q52 148 100 140 Z" fill="${p.body}"/>${w.tail}</g>
        <g transform="translate(-8,0)"><g class="rig-leg a">${leg(p.dark)}</g></g>
        <g class="rig-body">
          ${w.back0}
          <path d="M94 112 Q96 34 144 24 Q192 36 198 112 Z" fill="${p.dark}"/>
          <path d="M118 108 L116 52 M144 108 L144 36 M170 108 L172 52" stroke="${p.body}" stroke-width="3" opacity=".65" stroke-linecap="round"/>
          <ellipse cx="146" cy="124" rx="60" ry="38" fill="${p.body}"/>
          <ellipse cx="154" cy="142" rx="40" ry="22" fill="${p.belly}"/>
          ${spots(p, [[118, 108, 6], [100, 130, 5]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g transform="translate(26,0)"><g class="rig-leg b">${leg(p.body)}</g></g>
        <g class="rig-head">
          <path d="M176 110 Q202 96 214 76 L238 96 L224 126 Z" fill="${p.body}"/>
          <path d="M204 66 Q248 52 296 82 Q302 94 290 98 L228 100 Q196 90 204 66 Z" fill="${p.body}"/>
          <path d="M226 98 L288 96 Q286 110 268 110 L232 108 Z" fill="${p.dark}"/>
          <path d="M240 98 l4 7 l4 -7 M258 97 l4 7 l4 -7" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
          <path d="M214 62 Q226 44 244 58 Z" fill="${p.dark}"/>
          ${eye(234, 76, 6)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    para(p, w) {
      const leg = (c) => `<path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M96 112 Q46 112 6 152 Q54 148 104 140 Z" fill="${p.body}"/>${w.tail}</g>
        <g transform="translate(-8,0)"><g class="rig-leg a">${leg(p.dark)}</g></g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="150" cy="124" rx="62" ry="40" fill="${p.body}"/>
          <ellipse cx="158" cy="140" rx="42" ry="22" fill="${p.belly}"/>
          ${spots(p, [[124, 104, 6], [150, 98, 5], [104, 126, 5]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g transform="translate(26,0)"><g class="rig-leg b">${leg(p.body)}</g></g>
        <g class="rig-head">
          <path d="M180 108 Q204 90 210 64 L238 70 Q232 106 204 134 Z" fill="${p.body}"/>
          <path d="M212 50 Q196 26 150 18 Q122 18 116 36 Q124 32 148 34 Q184 40 206 68 Z" fill="${p.dark}"/>
          <path d="M140 28 Q176 32 200 56 M130 34 Q170 40 194 66" stroke="${p.body}" stroke-width="2.5" fill="none" opacity=".7"/>
          <path d="M206 52 Q238 40 270 58 Q282 66 276 78 Q262 84 240 82 Q208 80 206 52 Z" fill="${p.body}"/>
          <path d="M252 62 Q276 62 278 74 Q268 84 254 80 Z" fill="${p.belly}"/>
          ${eye(232, 62, 6)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    plesio(p, w) {
      return `
        <g class="rig-float">
          <g class="rig-tail"><path d="M92 158 Q50 146 14 168 Q52 178 96 172 Z" fill="${p.body}"/>${w.tail}</g>
          <g class="rig-leg a"><path d="M122 176 Q100 206 68 200 Q92 186 110 168 Z" fill="${p.dark}"/></g>
          <g class="rig-body">
            ${w.back0}
            <ellipse cx="146" cy="158" rx="60" ry="30" fill="${p.body}"/>
            <ellipse cx="152" cy="170" rx="40" ry="14" fill="${p.belly}"/>
            ${spots(p, [[118, 146, 6], [146, 140, 5], [172, 148, 6]])}
            ${w.clothes}${w.back1}${w.neck}
          </g>
          <g class="rig-leg b"><path d="M170 178 Q158 210 126 210 Q148 192 156 170 Z" fill="${p.dark}"/></g>
          <g class="rig-head">
            <path d="M176 144 C212 136 198 84 206 58 L234 60 C226 94 240 134 202 176 Z" fill="${p.body}"/>
            <ellipse cx="228" cy="50" rx="26" ry="15" fill="${p.body}"/>
            <path d="M242 44 Q272 44 276 56 Q266 66 244 60 Z" fill="${p.body}"/>
            <path d="M248 58 q10 4 22 -1" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            ${eye(236, 44, 5)}
            ${w.hat}${w.face}${w.lid}
          </g>
        </g>
        <g class="rig-water">
          <ellipse cx="150" cy="188" rx="130" ry="20" fill="#4fb3e8" opacity=".6"/>
          <path d="M40 186 q14 -8 28 0 M110 194 q14 -8 28 0 M190 186 q14 -8 28 0 M236 196 q12 -6 24 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
        </g>`;
    },

    compy(p, w) {
      const leg = (c) => `<path d="M126 168 Q116 188 126 196 L150 198 Q152 190 142 186 Q144 176 146 170 Z" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M114 148 Q70 146 36 176 Q76 178 118 166 Z" fill="${p.body}"/>${w.tail}</g>
        <g transform="translate(-6,0)"><g class="rig-leg a">${leg(p.dark)}</g></g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="146" cy="152" rx="38" ry="26" fill="${p.body}"/>
          <ellipse cx="152" cy="162" rx="26" ry="14" fill="${p.belly}"/>
          ${spots(p, [[130, 140, 5], [148, 134, 4], [122, 156, 4]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g transform="translate(16,0)"><g class="rig-leg b">${leg(p.body)}</g></g>
        <path d="M176 160 q10 2 12 10 M170 156 q8 0 10 8" stroke="${p.dark}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <g class="rig-head">
          <path d="M170 142 Q188 130 194 110 L214 114 Q210 142 190 158 Z" fill="${p.body}"/>
          <ellipse cx="212" cy="98" rx="28" ry="24" fill="${p.body}"/>
          <path d="M226 94 Q258 94 262 108 Q256 119 232 117 Z" fill="${p.body}"/>
          <path d="M232 112 q14 5 26 -1" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M240 107 l3 6 l3 -6" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="226" cy="108" r="6" fill="#ff7eb6" opacity=".45"/>
          ${eye(216, 94, 8)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    igua(p, w) {
      return `
        <g class="rig-tail"><path d="M96 112 Q48 116 8 164 Q54 156 102 146 Z" fill="${p.body}"/>${w.tail}</g>
        <g transform="translate(-4,0)"><g class="rig-leg a"><path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${p.dark}"/></g></g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="150" cy="122" rx="62" ry="42" fill="${p.body}"/>
          <ellipse cx="158" cy="140" rx="42" ry="24" fill="${p.belly}"/>
          ${spots(p, [[118, 100, 7], [146, 92, 5], [100, 124, 6]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g transform="translate(30,0)"><g class="rig-leg b"><path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${p.body}"/></g></g>
        <path d="M192 128 q22 4 28 24" stroke="${p.dark}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path d="M216 148 l16 -10 l-4 18 z" fill="#fff3d6" stroke="#e6cf9c" stroke-width="1.5" stroke-linejoin="round"/>
        <g class="rig-head">
          <path d="M182 112 Q198 86 214 72 L240 80 Q230 112 204 128 Z" fill="${p.body}"/>
          <path d="M206 56 Q248 44 284 66 Q292 84 276 90 L230 92 Q200 84 206 56 Z" fill="${p.body}"/>
          <path d="M266 68 Q298 72 294 88 Q282 94 270 86 Z" fill="#f2d58a" stroke="#c9a24a" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M236 84 q16 6 32 0" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <circle cx="282" cy="72" r="2.2" fill="${p.dark}"/>
          ${eye(240, 66, 6.5)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    diplo(p, w) {
      const leg = (x, c) => `<rect x="${x}" y="152" width="24" height="48" rx="11" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M80 124 Q30 132 4 178 L2 194 Q44 172 92 152 Z" fill="${p.body}"/>${w.tail}</g>
        <g class="rig-leg a">${leg(90, p.dark)}</g>
        <g class="rig-leg b">${leg(116, p.dark)}</g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="148" cy="130" rx="68" ry="38" fill="${p.body}"/>
          <ellipse cx="152" cy="146" rx="46" ry="20" fill="${p.belly}"/>
          ${spots(p, [[116, 112, 7], [146, 104, 5], [174, 114, 6]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g class="rig-leg a">${leg(168, p.body)}</g>
        <g class="rig-leg b">${leg(196, p.body)}</g>
        <g class="rig-head">
          <path d="M180 120 Q226 106 246 52 L268 56 Q262 108 212 144 Z" fill="${p.body}"/>
          <ellipse cx="268" cy="44" rx="18" ry="11" fill="${p.body}"/>
          <path d="M270 52 q8 3 14 -1" stroke="${p.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="284" cy="42" r="1.8" fill="${p.dark}"/>
          ${eye(274, 41, 4.5)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    dilo(p, w) {
      const leg = (c) => `<path d="M126 124 Q104 160 124 186 L108 196 L148 198 Q146 188 140 182 Q148 156 154 128 Z" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M100 110 Q44 96 4 128 Q50 118 102 132 Z" fill="${p.body}"/>${w.tail}</g>
        <g transform="translate(-6,0)"><g class="rig-leg a">${leg(p.dark)}</g></g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="148" cy="112" rx="54" ry="32" fill="${p.body}"/>
          <ellipse cx="156" cy="126" rx="38" ry="18" fill="${p.belly}"/>
          ${spots(p, [[112, 96, 6], [138, 90, 5], [124, 118, 5]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g transform="translate(20,0)"><g class="rig-leg b">${leg(p.body)}</g></g>
        <path d="M188 116 q14 2 20 14 M196 110 q12 0 18 10" stroke="${p.dark}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <g class="rig-head">
          <path d="M184 92 Q170 66 194 52 Q196 76 214 86 Z" fill="#ffd23f" stroke="#d99a00" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M182 100 Q206 90 214 62 L242 66 Q236 100 206 126 Z" fill="${p.body}"/>
          <path d="M212 52 Q248 38 288 58 Q294 72 278 78 L224 82 Q202 72 212 52 Z" fill="${p.body}"/>
          <path d="M224 80 L278 78 Q276 90 262 90 L228 90 Z" fill="${p.dark}"/>
          <path d="M234 80 l4 8 l4 -8 M250 79 l4 8 l4 -8" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
          <path d="M220 52 Q222 20 250 26 L244 46 Z" fill="#ff7a59" stroke="#c4482a" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M236 46 Q238 16 268 24 L258 46 Z" fill="#ff9a59" stroke="#c4482a" stroke-width="1.5" stroke-linejoin="round"/>
          ${eye(240, 58, 6)}
          ${w.hat}${w.face}${w.lid}
        </g>`;
    },

    pachy(p, w) {
      const leg = (c) => `<path d="M112 138 Q100 176 112 196 L148 200 Q150 190 134 186 Q138 164 146 138 Z" fill="${c}"/>`;
      return `
        <g class="rig-tail"><path d="M92 110 Q44 112 6 156 Q52 152 100 142 Z" fill="${p.body}"/>${w.tail}</g>
        <g transform="translate(-6,0)"><g class="rig-leg a">${leg(p.dark)}</g></g>
        <g class="rig-body">
          ${w.back0}
          <ellipse cx="148" cy="124" rx="58" ry="40" fill="${p.body}"/>
          <ellipse cx="156" cy="140" rx="40" ry="22" fill="${p.belly}"/>
          ${spots(p, [[118, 104, 7], [146, 96, 5], [102, 128, 6]])}
          ${w.clothes}${w.back1}${w.neck}
        </g>
        <g transform="translate(28,0)"><g class="rig-leg b">${leg(p.body)}</g></g>
        <path d="M190 130 q16 4 20 18" stroke="${p.dark}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <g class="rig-head">
          <path d="M180 112 Q200 92 212 70 L238 78 Q230 108 204 128 Z" fill="${p.body}"/>
          <path d="M240 62 Q284 62 290 82 Q284 94 262 92 L238 88 Z" fill="${p.body}"/>
          <path d="M246 88 q16 6 34 -2" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <ellipse cx="232" cy="52" rx="26" ry="22" fill="${p.dark}"/>
          <ellipse cx="230" cy="48" rx="19" ry="15" fill="${p.belly}" opacity=".6"/>
          ${[[206, 62], [208, 78], [216, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff3d6" stroke="#c9b48a" stroke-width="1"/>`).join('')}
          ${eye(250, 70, 6)}
          ${w.hat}${w.face}${w.lid}
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

  function lid(species, p) {
    const [x, y, r] = EYE_AT[species];
    return `<g class="rig-lid"><circle cx="${x + 1}" cy="${y}" r="${r + 1.5}" fill="${p.body}"/><path d="M${x - r} ${y + 1} Q${x + 1} ${y + r * 0.9} ${x + r + 2} ${y + 1}" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
  }

  let evoCount = 0;

  /* Baby look: big shiny eyes and rosy cheeks drawn over the parent's face, and a broken eggshell under the feet. */
  function babyFace(species) {
    const [x, y, r] = EYE_AT[species];
    return `<g class="baby-face"><ellipse cx="${(x - r * 0.4).toFixed(1)}" cy="${(y + r * 2.5).toFixed(1)}" rx="${(r * 1.3).toFixed(1)}" ry="${(r * 0.8).toFixed(1)}" fill="#ff7eb6" opacity=".5"/>
      <circle cx="${x + 1}" cy="${y}" r="${(r * 1.65).toFixed(1)}" fill="#fff" stroke="#23323a" stroke-width="1.2"/>
      <circle cx="${x + 2.5}" cy="${y + 0.5}" r="${r.toFixed(1)}" fill="#23323a"/>
      <circle cx="${(x + 0.5).toFixed(1)}" cy="${(y - r * 0.45).toFixed(1)}" r="${(r * 0.38).toFixed(1)}" fill="#fff"/></g>`;
  }

  const SHELL = '<path d="M100 208 Q150 232 200 208 L194 195 L182 204 L170 190 L158 204 L146 188 L134 204 L122 190 L110 204 Z" fill="#fff8e8" stroke="#d9c79a" stroke-width="2.5" stroke-linejoin="round"/>';

  /* Mega form: a glowing aura behind the dino and sparkles orbiting it. The dino itself is drawn slightly bigger. */
  function evoBack() {
    const id = `evo${++evoCount}`;
    return `<defs><radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6a8" stop-opacity="0"/><stop offset=".6" stop-color="#ffe066" stop-opacity=".38"/><stop offset="1" stop-color="#ff7eb6" stop-opacity="0"/></radialGradient></defs>
      <g class="evo-aura"><ellipse cx="150" cy="118" rx="172" ry="128" fill="url(#${id})"/></g>`;
  }

  const EVO_SPARKS = [[-10, 118], [310, 118], [150, -26], [150, 262], [40, 20], [260, 216]].map(([x, y], i) =>
    `<path class="sparkle" style="animation-delay:${i * 0.3}s" d="M${x} ${y - 11} L${x + 4} ${y - 4} L${x + 11} ${y} L${x + 4} ${y + 4} L${x} ${y + 11} L${x - 4} ${y + 4} L${x - 11} ${y} L${x - 4} ${y - 4} Z" fill="#fff6a8" stroke="#ff9ad5" stroke-width="1.2"/>`
  ).join('');

  /**
   * @param {string} species trex|brachio|trike|ptero|stego|anky|raptor|para|spino|plesio|compy|igua|diplo|dilo|pachy
   * @param {{tint?:number,legendary?:boolean,horns?:number,eggs?:number,outfit?:object,evolved?:boolean,baby?:boolean}} opts
   */
  function dino(species, opts) {
    const o = Object.assign({ tint: 0, legendary: false, horns: 0, eggs: 0, outfit: null, evolved: false, baby: false }, opts);
    const p = o.legendary ? LEGEND_PALETTE[species] : TINTS[o.tint % TINTS.length];
    const w = Object.assign({}, EMPTY_WEAR, global.Wardrobe ? global.Wardrobe.wear(species, o.outfit) : null, { lid: lid(species, p) });
    if (o.baby) w.face = babyFace(species) + w.face;
    const body = `<g class="rig-root">${BUILDERS[species](p, w)}${horns(species, o.horns, p)}</g>`;
    return `<svg class="dino-svg sp-${species}${o.legendary ? ' legendary' : ''}${o.evolved ? ' evolved' : ''}${o.baby ? ' baby' : ''}" viewBox="0 0 300 220" role="img" aria-label="${SPECIES[species].short}">
      ${o.evolved ? evoBack() : ''}
      ${o.baby ? SHELL : ''}
      ${o.evolved ? `<g transform="translate(150 205) scale(1.1) translate(-150 -205)">${body}</g>` : body}
      ${eggs(o.eggs)}${o.legendary ? SPARKLES : ''}${o.evolved ? `<g class="evo-orbit">${EVO_SPARKS}</g>` : ''}
    </svg>`;
  }

  function silhouette(species) {
    return `<div class="silhouette">${dino(species, { tint: 0 })}</div>`;
  }

  global.Renderer = { SPECIES, TRAITS, TINTS, dino, silhouette };
})(window);
