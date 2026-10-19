/* Dress-up: hats, clothes, glasses, neck wear, back wear and tail wear drawn on top of the dino rigs. */
(function (global) {
  'use strict';

  const SLOTS = [
    { id: 'hat', icon: '🎩', label: 'כּוֹבָעִים' },
    { id: 'clothes', icon: '👗', label: 'בְּגָדִים' },
    { id: 'face', icon: '🕶️', label: 'מִשְׁקָפַיִם' },
    { id: 'neck', icon: '📿', label: 'צַוָּאר' },
    { id: 'back', icon: '🦋', label: 'גַּב' },
    { id: 'tail', icon: '🎀', label: 'זָנָב' },
  ];

  /* Where each slot attaches on each species: [x, y, scale, rotation] in the 300x220 rig space.
     hat: base of the hat on the head, face: centre of the visible eye, neck: throat/chest,
     body: centre of the torso (+ x/y scale), back: spine, tail: tip of the tail. */
  const ANCHORS = {
    trex: { hat: [238, 58, 0.9, 8], face: [250, 70, 0.75], neck: [194, 120, 1], body: [150, 124, 1.15, 1.2], back: [128, 88, 1], tail: [10, 156, 1] },
    brachio: { hat: [250, 18, 0.6, 0], face: [258, 27, 0.55], neck: [226, 92, 0.85], body: [148, 128, 1.25, 1.1], back: [124, 92, 1], tail: [8, 172, 1] },
    trike: { hat: [214, 74, 0.9, 0], face: [254, 118, 0.65], neck: [196, 138, 0.9], body: [150, 134, 1.2, 1.15], back: [126, 100, 1], tail: [28, 172, 0.9] },
    ptero: { hat: [258, 66, 0.6, -10], face: [230, 74, 0.6], neck: [190, 126, 0.7], body: [158, 120, 0.8, 0.7], back: [140, 100, 0.8], tail: [50, 148, 0.8] },
    stego: { hat: [238, 140, 0.55, 8], face: [246, 148, 0.55], neck: [206, 134, 0.8], body: [150, 128, 1.25, 1.1], back: [150, 90, 1], tail: [8, 150, 1] },
    anky: { hat: [246, 136, 0.6, 6], face: [252, 150, 0.55], neck: [210, 146, 0.8], body: [150, 140, 1.4, 1], back: [150, 106, 1], tail: [18, 166, 1] },
    raptor: { hat: [244, 50, 0.7, 8], face: [240, 58, 0.65], neck: [200, 106, 0.8], body: [148, 112, 0.95, 0.95], back: [130, 84, 0.9], tail: [6, 124, 0.9] },
    spino: { hat: [228, 62, 0.65, 0], face: [234, 76, 0.65], neck: [200, 106, 0.85], body: [146, 124, 1.05, 1.1], back: [146, 92, 1], tail: [8, 148, 1] },
    para: { hat: [244, 50, 0.6, 8], face: [232, 62, 0.65], neck: [200, 112, 0.8], body: [150, 124, 1.1, 1.1], back: [130, 90, 1], tail: [10, 150, 1] },
    plesio: { hat: [228, 37, 0.6, 0], face: [236, 44, 0.55], neck: [196, 110, 0.8], body: [146, 158, 1.05, 0.9], back: [140, 134, 1], tail: [14, 170, 0.9] },
  };

  const star = (cx, cy, r, fill, stroke) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"` : ''}/>`;
  };

  const beads = (colors, n, r, w) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * 2 - 1;
      out += `<circle cx="${(t * w).toFixed(1)}" cy="${(14 - 12 * t * t).toFixed(1)}" r="${r}" fill="${colors[i % colors.length]}" stroke="#0003" stroke-width="1"/>`;
    }
    return out;
  };

  const flower = (x, y, r, petal, mid) =>
    `<g>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * r).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * r).toFixed(1)}" r="${r * 0.8}" fill="${petal}"/>`).join('')}<circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="${mid}"/></g>`;

  // Body outline shared by shirts: designed for a torso of about 100 x 64 centred on 0,0.
  const TEE = 'M-44 -6 Q-30 -30 0 -30 Q30 -30 44 -6 L44 20 Q0 34 -44 20 Z';
  const SKIRT = 'M-40 -14 Q0 -34 40 -14 L52 28 Q26 40 0 32 Q-26 40 -52 28 Z';

  const ITEMS = {
    hat: [
      { id: 'beanie', name: 'כּוֹבַע גֶּרֶב', cost: 0, svg: '<path d="M-20 0 Q-22 -28 0 -28 Q22 -28 20 0 Z" fill="#3f8bd8" stroke="#2a65a6" stroke-width="2"/><rect x="-22" y="-8" width="44" height="9" rx="4" fill="#2a65a6"/><circle cx="0" cy="-33" r="6" fill="#fff" stroke="#cfd6db" stroke-width="1.5"/>' },
      { id: 'cap', name: 'כּוֹבַע מִצְחָה', cost: 6, svg: '<path d="M-20 0 Q-20 -26 0 -26 Q20 -26 20 0 Z" fill="#e5484d" stroke="#a52a2f" stroke-width="2"/><path d="M8 -2 Q40 -2 40 4 L8 4 Z" fill="#c43a3f" stroke="#a52a2f" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-27" r="3" fill="#a52a2f"/>' },
      { id: 'party', name: 'כּוֹבַע מְסִבָּה', cost: 8, svg: '<path d="M-16 0 L0 -44 L16 0 Z" fill="#ff7eb6" stroke="#d9548f" stroke-width="2" stroke-linejoin="round"/><path d="M-10 -14 L10 -14 M-6 -26 L6 -26" stroke="#fff" stroke-width="3"/><circle cx="0" cy="-46" r="5" fill="#ffd23f"/>' },
      { id: 'flower', name: 'פֶּרַח', cost: 8, svg: `<g transform="translate(0 -8)">${flower(0, 0, 9, '#ff7eb6', '#ffd23f')}</g><path d="M-14 4 Q-22 -4 -26 6 Q-18 10 -14 4 Z M14 4 Q22 -4 26 6 Q18 10 14 4 Z" fill="#5cc46a"/>` },
      { id: 'sun', name: 'כּוֹבַע קַשׁ', cost: 12, svg: '<ellipse cx="0" cy="-1" rx="36" ry="7" fill="#f2d58a" stroke="#c9a24a" stroke-width="2"/><path d="M-17 -2 Q-17 -24 0 -24 Q17 -24 17 -2 Z" fill="#f6e0a2" stroke="#c9a24a" stroke-width="2"/><rect x="-17" y="-10" width="34" height="6" fill="#ff7eb6"/>' },
      { id: 'cat', name: 'אָזְנֵי חָתוּל', cost: 12, svg: '<path d="M-22 0 L-24 -26 L-8 -10 Z M22 0 L24 -26 L8 -10 Z" fill="#8a6bd1" stroke="#5f45a3" stroke-width="2" stroke-linejoin="round"/><path d="M-20 -6 L-21 -18 L-13 -10 Z M20 -6 L21 -18 L13 -10 Z" fill="#ffb3d9"/><path d="M-24 0 Q0 -8 24 0" stroke="#5f45a3" stroke-width="4" fill="none"/>' },
      { id: 'bunny', name: 'אָזְנֵי אַרְנָב', cost: 12, svg: '<ellipse cx="-9" cy="-26" rx="6" ry="20" transform="rotate(-10 -9 -26)" fill="#fff" stroke="#cfd6db" stroke-width="2"/><ellipse cx="9" cy="-26" rx="6" ry="20" transform="rotate(10 9 -26)" fill="#fff" stroke="#cfd6db" stroke-width="2"/><ellipse cx="-9" cy="-26" rx="2.8" ry="14" transform="rotate(-10 -9 -26)" fill="#ffb3d9"/><ellipse cx="9" cy="-26" rx="2.8" ry="14" transform="rotate(10 9 -26)" fill="#ffb3d9"/>' },
      { id: 'chef', name: 'כּוֹבַע שֵׁף', cost: 12, svg: '<rect x="-18" y="-10" width="36" height="12" rx="2" fill="#fff" stroke="#cfd6db" stroke-width="2"/><circle cx="-12" cy="-18" r="10" fill="#fff" stroke="#cfd6db" stroke-width="2"/><circle cx="12" cy="-18" r="10" fill="#fff" stroke="#cfd6db" stroke-width="2"/><circle cx="0" cy="-26" r="12" fill="#fff" stroke="#cfd6db" stroke-width="2"/><rect x="-17" y="-9" width="34" height="9" fill="#fff"/>' },
      { id: 'propeller', name: 'כּוֹבַע מַדְחֵף', cost: 14, svg: '<path d="M-18 0 Q0 -22 18 0 Z" fill="#ffd23f" stroke="#c99400" stroke-width="2"/><rect x="-1.5" y="-28" width="3" height="9" fill="#555"/><g class="whirl"><ellipse cx="-12" cy="-29" rx="13" ry="3.5" fill="#e5484d"/><ellipse cx="12" cy="-29" rx="13" ry="3.5" fill="#3f8bd8"/></g>' },
      { id: 'tiara', name: 'כֶּתֶר קָטָן', cost: 14, svg: '<path d="M-18 0 L-14 -14 L-7 -5 L0 -18 L7 -5 L14 -14 L18 0 Z" fill="#eef0ff" stroke="#9aa5d6" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-9" r="3.5" fill="#ff7eb6"/><circle cx="-11" cy="-5" r="2" fill="#7fe3ff"/><circle cx="11" cy="-5" r="2" fill="#7fe3ff"/>' },
      { id: 'cowboy', name: 'כּוֹבַע בּוֹקְרִים', cost: 15, svg: '<ellipse cx="0" cy="-1" rx="32" ry="6" fill="#a9703a" stroke="#7a4a1c" stroke-width="2"/><path d="M-16 -2 Q-18 -26 -8 -26 Q0 -20 8 -26 Q18 -26 16 -2 Z" fill="#c98a4b" stroke="#7a4a1c" stroke-width="2" stroke-linejoin="round"/><rect x="-16" y="-10" width="32" height="5" fill="#7a4a1c"/>' },
      { id: 'pirate', name: 'כּוֹבַע שׁוֹדֵד יָם', cost: 16, svg: '<path d="M-32 2 Q-16 -34 0 -30 Q16 -34 32 2 Q0 -6 -32 2 Z" fill="#2b2b3a" stroke="#000" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-15" r="5.5" fill="#fff"/><path d="M-7 -8 L7 -2 M7 -8 L-7 -2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' },
      { id: 'tophat', name: 'צִלִּינְדֶּר', cost: 16, svg: '<ellipse cx="0" cy="-1" rx="27" ry="5" fill="#2b2b3a"/><rect x="-16" y="-36" width="32" height="35" rx="3" fill="#33334a"/><rect x="-16" y="-13" width="32" height="7" fill="#e5484d"/>' },
      { id: 'wizard', name: 'כּוֹבַע קוֹסֵם', cost: 18, svg: `<path d="M-24 0 L-4 -50 Q10 -42 6 -30 L24 0 Z" fill="#6a4fd1" stroke="#45309a" stroke-width="2" stroke-linejoin="round"/><ellipse cx="0" cy="0" rx="30" ry="5" fill="#5540b0" stroke="#45309a" stroke-width="2"/>${star(0, -18, 7, '#ffd23f', '#c99400')}` },
      { id: 'grad', name: 'כּוֹבַע סִיּוּם', cost: 18, svg: '<rect x="-14" y="-10" width="28" height="11" fill="#33334a"/><path d="M-32 -14 L0 -28 L32 -14 L0 -1 Z" fill="#2b2b3a" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><path d="M26 -14 L26 4" stroke="#ffd23f" stroke-width="2.5"/><circle cx="26" cy="6" r="3.5" fill="#ffd23f"/>' },
      { id: 'crown', name: 'כֶּתֶר זָהָב', cost: 22, svg: '<path d="M-20 0 L-24 -24 L-10 -13 L0 -30 L10 -13 L24 -24 L20 0 Z" fill="#ffd23f" stroke="#c99400" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-9" r="3.5" fill="#e5484d"/><circle cx="-12" cy="-6" r="2.5" fill="#3f8bd8"/><circle cx="12" cy="-6" r="2.5" fill="#3f8bd8"/>' },
      { id: 'unicorn', name: 'קֶרֶן חַד־קֶרֶן', cost: 24, svg: '<path d="M-7 0 L0 -44 L7 0 Z" fill="#fff" stroke="#e0b9ee" stroke-width="2" stroke-linejoin="round"/><path d="M-5 -11 L5 -15 M-4 -22 L4 -26 M-3 -33 L3 -36" stroke="#c77dff" stroke-width="2.5" stroke-linecap="round"/><path d="M8 -6 Q22 -8 20 4 Q12 2 8 -6 Z M-8 -6 Q-22 -8 -20 4 Q-12 2 -8 -6 Z" fill="#ff9ad5"/>' },
      { id: 'halo', name: 'הִלָּה', cost: 25, svg: '<g class="bobber"><ellipse cx="0" cy="-24" rx="19" ry="5.5" fill="none" stroke="#ffd23f" stroke-width="4.5"/><ellipse cx="0" cy="-24" rx="19" ry="5.5" fill="none" stroke="#fff6a8" stroke-width="1.5"/></g>' },
    ],

    clothes: [
      { id: 'tee', name: 'חֻלְצָה עִם כּוֹכָב', cost: 0, svg: `<path d="${TEE}" fill="#e5484d"/>${star(0, -4, 14, '#fff')}` },
      { id: 'stripes', name: 'חֻלְצַת פַּסִּים', cost: 8, svg: `<path d="${TEE}" fill="#fff"/><g stroke="#2a4d8f" stroke-width="6" stroke-linecap="round"><path d="M-34 -17 H34 M-40 -4 H40 M-40 9 H40 M-30 22 H30"/></g>` },
      { id: 'rainbow', name: 'חֻלְצַת קֶשֶׁת', cost: 10, svg: `<path d="${TEE}" fill="#fff"/><g fill="none" stroke-width="5" stroke-linecap="round"><path d="M-30 16 Q0 -22 30 16" stroke="#e5484d"/><path d="M-23 16 Q0 -12 23 16" stroke="#ff9f5a"/><path d="M-16 16 Q0 -3 16 16" stroke="#ffd23f"/><path d="M-9 16 Q0 5 9 16" stroke="#5cc46a"/></g>` },
      { id: 'sweater', name: 'סְוֶדֶר סָרוּג', cost: 10, svg: `<path d="${TEE}" fill="#ffb347"/><path d="M-38 -10 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 M-40 8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8" stroke="#fff3d6" stroke-width="3" fill="none" stroke-linejoin="round"/>` },
      { id: 'pajamas', name: 'פִּיגַ׳מָה', cost: 10, svg: `<path d="${TEE}" fill="#5b6bd6"/><path d="M-4 -22 a11 11 0 1 0 12 12 a8 8 0 1 1 -12 -12 Z" fill="#ffe066"/>${star(24, -12, 5, '#ffe066')}${star(-26, 6, 4.5, '#ffe066')}${star(18, 12, 4, '#ffe066')}` },
      { id: 'raincoat', name: 'מְעִיל גֶּשֶׁם', cost: 12, svg: `<path d="${TEE}" fill="#ffd23f" stroke="#d9a400" stroke-width="2"/><path d="M0 -30 L0 28" stroke="#d9a400" stroke-width="3"/><circle cx="-8" cy="-12" r="3.5" fill="#e5484d"/><circle cx="-8" cy="2" r="3.5" fill="#e5484d"/><circle cx="-8" cy="16" r="3.5" fill="#e5484d"/>` },
      { id: 'jersey', name: 'חֻלְצַת כַּדּוּרֶגֶל', cost: 12, svg: `<path d="${TEE}" fill="#2fb5a3"/><text x="0" y="14" text-anchor="middle" font-size="34" font-weight="700" font-family="Rubik, Arial, sans-serif" fill="#fff">7</text>` },
      { id: 'overalls', name: 'סִרְבָּל', cost: 14, svg: '<path d="M-42 4 L42 4 L46 22 Q0 36 -46 22 Z" fill="#3f6fc9"/><path d="M-24 6 L-18 -26 M24 6 L18 -26" stroke="#3f6fc9" stroke-width="8" stroke-linecap="round"/><circle cx="-18" cy="-2" r="3.5" fill="#ffd23f"/><circle cx="18" cy="-2" r="3.5" fill="#ffd23f"/><rect x="-12" y="12" width="24" height="12" rx="3" fill="#2f57a3"/>' },
      { id: 'tutu', name: 'טוּטוּ', cost: 16, svg: '<path d="M-26 -6 Q0 -22 26 -6 L24 8 Q0 16 -24 8 Z" fill="#ff7eb6"/><ellipse cx="0" cy="18" rx="54" ry="11" fill="#ffc2e0" stroke="#ff7eb6" stroke-width="2"/><ellipse cx="0" cy="12" rx="44" ry="9" fill="#ffd9ec" stroke="#ff9ac6" stroke-width="2"/><path d="M-8 -8 l8 6 l8 -6 l-8 -4 Z" fill="#fff"/>' },
      { id: 'labcoat', name: 'חָלוּק מַעְבָּדָה', cost: 16, svg: `<path d="${TEE}" fill="#fff" stroke="#cfd6db" stroke-width="2"/><path d="M0 -30 L-12 -10 L0 22 L12 -10 Z" fill="#e8f1f5"/><rect x="14" y="2" width="20" height="16" rx="2" fill="#fff" stroke="#cfd6db" stroke-width="2"/><path d="M20 2 L20 -6 M26 2 L26 -4" stroke="#3f8bd8" stroke-width="3" stroke-linecap="round"/>` },
      { id: 'dress', name: 'שִׂמְלָה וְרֻדָּה', cost: 20, svg: `<path d="${SKIRT}" fill="#ff7eb6"/><path d="M-40 -14 Q0 -34 40 -14 L36 -2 Q0 8 -36 -2 Z" fill="#ff5fa2"/><circle cx="-26" cy="14" r="3.5" fill="#fff"/><circle cx="-8" cy="22" r="3.5" fill="#fff"/><circle cx="12" cy="16" r="3.5" fill="#fff"/><circle cx="30" cy="22" r="3.5" fill="#fff"/><path d="M-36 6 Q0 16 36 6" stroke="#fff" stroke-width="4" fill="none"/>` },
      { id: 'flowerdress', name: 'שִׂמְלַת פְּרָחִים', cost: 22, svg: `<path d="${SKIRT}" fill="#c9b6ff"/><path d="M-40 -14 Q0 -34 40 -14 L36 -2 Q0 8 -36 -2 Z" fill="#a98bf0"/>${flower(-24, 14, 4, '#fff', '#ffd23f')}${flower(0, 22, 4, '#ffb3d9', '#ffd23f')}${flower(24, 14, 4, '#fff', '#ffd23f')}${flower(-4, 4, 3.5, '#ffb3d9', '#ffd23f')}` },
      { id: 'hero', name: 'תִּלְבֹּשֶׁת גִּבּוֹרָה', cost: 25, svg: `<path d="${TEE}" fill="#3f8bd8"/><path d="M-44 20 Q0 34 44 20 L44 12 Q0 26 -44 12 Z" fill="#e5484d"/><path d="M0 -22 L16 -8 L0 10 L-16 -8 Z" fill="#ffd23f" stroke="#e5484d" stroke-width="2.5" stroke-linejoin="round"/>${star(0, -6, 6, '#e5484d')}` },
      { id: 'tux', name: 'חֲלִיפָה', cost: 25, svg: `<path d="${TEE}" fill="#2b2b3a"/><path d="M-14 -30 L0 6 L14 -30 Z" fill="#fff"/><circle cx="0" cy="10" r="2.5" fill="#fff"/><circle cx="0" cy="20" r="2.5" fill="#fff"/>` },
    ],

    face: [
      { id: 'glasses', name: 'מִשְׁקָפַיִם עֲגֻלִּים', cost: 0, svg: '<circle r="13" fill="#fff" fill-opacity=".25" stroke="#2b2b3a" stroke-width="3"/><path d="M-13 -2 L-42 -8" stroke="#2b2b3a" stroke-width="3" stroke-linecap="round"/>' },
      { id: 'blush', name: 'לְחָיַיִם וְנַמְשִׁים', cost: 5, svg: '<circle cx="-2" cy="20" r="10" fill="#ff7eb6" opacity=".55"/><g fill="#a0522d" opacity=".7"><circle cx="-10" cy="12" r="1.6"/><circle cx="-3" cy="9" r="1.6"/><circle cx="4" cy="12" r="1.6"/></g>' },
      { id: 'sunglasses', name: 'מִשְׁקְפֵי שֶׁמֶשׁ', cost: 10, svg: '<ellipse rx="16" ry="12" fill="#1d1d28"/><path d="M-15 -3 L-44 -8" stroke="#1d1d28" stroke-width="4" stroke-linecap="round"/><path d="M-7 -6 L3 -9" stroke="#fff" opacity=".6" stroke-width="2.5" stroke-linecap="round"/>' },
      { id: 'heart', name: 'מִשְׁקְפֵי לֵב', cost: 12, svg: '<path d="M0 13 C-26 -2 -16 -20 0 -8 C16 -20 26 -2 0 13 Z" fill="#ff7eb6" fill-opacity=".85" stroke="#d9548f" stroke-width="2.5" stroke-linejoin="round"/><path d="M-14 -4 L-42 -10" stroke="#d9548f" stroke-width="3" stroke-linecap="round"/>' },
      { id: 'starglasses', name: 'מִשְׁקְפֵי כּוֹכָב', cost: 12, svg: `${star(0, 0, 19, '#ffd23f', '#e0a800')}<circle r="6" fill="#fff"/><circle cx="1.5" r="3.4" fill="#222"/><path d="M-12 -6 L-42 -10" stroke="#e0a800" stroke-width="3" stroke-linecap="round"/>` },
      { id: 'goggles', name: 'מִשְׁקְפֵי שְׂחִיָּה', cost: 12, svg: '<circle r="15" fill="#8fe3ff" fill-opacity=".55" stroke="#ff7a3d" stroke-width="5"/><path d="M-15 0 L-46 -6" stroke="#ff7a3d" stroke-width="5" stroke-linecap="round"/>' },
      { id: 'monocle', name: 'מִשְׁקָף חַד־עֵינִי', cost: 14, svg: '<circle r="13" fill="#fff" fill-opacity=".2" stroke="#d9a400" stroke-width="3"/><path d="M0 13 Q-6 30 -16 42" stroke="#d9a400" stroke-width="2" fill="none"/>' },
      { id: 'eyepatch', name: 'כִּסּוּי עַיִן', cost: 14, svg: '<ellipse rx="12" ry="10" fill="#222"/><path d="M-11 -4 L-44 -14 M10 -6 L30 -16" stroke="#222" stroke-width="3" stroke-linecap="round"/>' },
      { id: 'mask', name: 'מַסֵּכַת גִּבּוֹרָה', cost: 16, svg: '<path d="M-20 -8 Q0 -22 22 -8 L16 8 Q0 -2 -16 8 Z" fill="#e5484d" stroke="#a52a2f" stroke-width="2" stroke-linejoin="round"/><ellipse rx="9" ry="7" fill="#fff"/><circle cx="1.5" r="4" fill="#222"/><path d="M-18 -6 L-42 -10" stroke="#e5484d" stroke-width="4" stroke-linecap="round"/>' },
    ],

    neck: [
      { id: 'bowtie', name: 'עֲנִיבַת פַּרְפַּר', cost: 0, svg: '<path d="M0 0 L-17 -10 L-17 10 Z M0 0 L17 -10 L17 10 Z" fill="#e5484d" stroke="#a52a2f" stroke-width="2" stroke-linejoin="round"/><circle r="4.5" fill="#a52a2f"/>' },
      { id: 'beads', name: 'מַחְרֹזֶת צִבְעוֹנִית', cost: 6, svg: beads(['#ff7eb6', '#ffd23f', '#5aa9e6', '#5cc46a'], 9, 4.5, 24) },
      { id: 'bell', name: 'פַּעֲמוֹן', cost: 6, svg: '<path d="M-22 -4 Q0 10 22 -4" stroke="#e5484d" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="0" cy="10" r="6.5" fill="#ffd23f" stroke="#c99400" stroke-width="2"/><path d="M-3.5 11 H3.5" stroke="#c99400" stroke-width="2" stroke-linecap="round"/>' },
      { id: 'bandana', name: 'בַּנְדָּנָה', cost: 8, svg: '<path d="M-24 -6 Q0 6 24 -6 L0 30 Z" fill="#e5484d" stroke="#a52a2f" stroke-width="2" stroke-linejoin="round"/><circle cx="-8" cy="6" r="2.5" fill="#fff"/><circle cx="8" cy="6" r="2.5" fill="#fff"/><circle cx="0" cy="16" r="2.5" fill="#fff"/>' },
      { id: 'scarf', name: 'צָעִיף', cost: 10, svg: '<path d="M-24 -8 Q0 6 24 -8 L26 4 Q0 18 -26 4 Z" fill="#e5484d"/><path d="M8 8 L16 36 L3 32 L0 12 Z" fill="#c43a3f"/><path d="M-16 -2 l6 7 M-2 2 l6 7 M12 -3 l6 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' },
      { id: 'pearls', name: 'שַׁרְשֶׁרֶת פְּנִינִים', cost: 12, svg: beads(['#fff'], 11, 4.2, 24) },
      { id: 'tie', name: 'עֲנִיבָה', cost: 12, svg: '<path d="M-6 -4 L6 -4 L4 4 L10 30 L0 38 L-10 30 L-4 4 Z" fill="#3f8bd8" stroke="#2a65a6" stroke-width="2" stroke-linejoin="round"/><path d="M-4 14 H4 M-5 22 H5" stroke="#fff" stroke-width="3" opacity=".7"/>' },
      { id: 'lei', name: 'שַׁרְשֶׁרֶת פְּרָחִים', cost: 14, svg: `<g>${[-24, -12, 0, 12, 24].map((x, i) => flower(x, 12 - 12 * (x / 24) ** 2, 6, ['#ff7eb6', '#ffb347', '#fff', '#c77dff', '#ff7eb6'][i], '#ffd23f')).join('')}</g>` },
      { id: 'medal', name: 'מֶדַלְיָה', cost: 15, svg: '<path d="M-14 -8 L0 16 L14 -8" stroke="#3f8bd8" stroke-width="7" fill="none" stroke-linejoin="round"/><circle cy="22" r="11" fill="#ffd23f" stroke="#c99400" stroke-width="2.5"/><text y="27" text-anchor="middle" font-size="14" font-weight="700" font-family="Rubik, Arial, sans-serif" fill="#a06b00">1</text>' },
      { id: 'pendant', name: 'תַּלְיוֹן־לֵב', cost: 15, svg: '<path d="M-22 -6 Q0 8 22 -6" stroke="#d9a400" stroke-width="2.5" fill="none"/><path d="M0 28 C-16 16 -10 6 0 12 C10 6 16 16 0 28 Z" fill="#ff7eb6" stroke="#d9548f" stroke-width="2" stroke-linejoin="round"/>' },
    ],

    back: [
      { id: 'backpack', name: 'תִּיק גַּב', layer: 1, cost: 8, svg: '<rect x="-30" y="-8" width="26" height="36" rx="9" fill="#ff9f5a" stroke="#d97a2b" stroke-width="2"/><rect x="-26" y="8" width="18" height="13" rx="3" fill="#d97a2b"/><path d="M-4 0 Q12 16 6 34" stroke="#d97a2b" stroke-width="5" fill="none" stroke-linecap="round"/>' },
      { id: 'cape', name: 'גְּלִימָה אֲדֻמָּה', layer: 0, cost: 12, svg: '<path d="M10 -6 Q-30 6 -58 70 Q-20 62 14 44 Z" fill="#e5484d" stroke="#a52a2f" stroke-width="2" stroke-linejoin="round"/><path d="M-12 14 Q-30 30 -40 54" stroke="#c43a3f" stroke-width="3" fill="none"/>' },
      { id: 'wings-fairy', name: 'כַּנְפֵי פֵּיָה', layer: 0, cost: 15, svg: '<g class="flutter"><ellipse cx="-22" cy="-30" rx="13" ry="32" transform="rotate(-32 -22 -30)" fill="#bfeaff" fill-opacity=".75" stroke="#7fc8f0" stroke-width="2"/><ellipse cx="-4" cy="-22" rx="9" ry="22" transform="rotate(-8 -4 -22)" fill="#e6d4ff" fill-opacity=".8" stroke="#b79af0" stroke-width="2"/></g>' },
      { id: 'balloons', name: 'בָּלוֹנִים', layer: 1, cost: 15, svg: '<g class="bobber"><path d="M0 0 L-16 -42 M0 0 L6 -52 M0 0 L24 -40" stroke="#888" stroke-width="1.5" fill="none"/><ellipse cx="-16" cy="-54" rx="11" ry="14" fill="#e5484d"/><ellipse cx="6" cy="-64" rx="11" ry="14" fill="#ffd23f"/><ellipse cx="24" cy="-52" rx="11" ry="14" fill="#3f8bd8"/><path d="M-20 -60 q2 -4 6 -4 M2 -70 q2 -4 6 -4 M20 -58 q2 -4 6 -4" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/></g>' },
      { id: 'wings-butterfly', name: 'כַּנְפֵי פַּרְפַּר', layer: 0, cost: 18, svg: '<g class="flutter"><path d="M0 0 Q-34 -62 -62 -34 Q-52 -8 -4 6 Z" fill="#ffa24d" stroke="#d97a2b" stroke-width="2" stroke-linejoin="round"/><path d="M-2 6 Q-30 6 -48 34 Q-26 44 -2 14 Z" fill="#ff7eb6" stroke="#d9548f" stroke-width="2" stroke-linejoin="round"/><circle cx="-38" cy="-30" r="6" fill="#fff" opacity=".85"/><circle cx="-30" cy="22" r="4" fill="#fff" opacity=".85"/></g>' },
      { id: 'cape-star', name: 'גְּלִימַת כּוֹכָבִים', layer: 0, cost: 20, svg: `<path d="M10 -6 Q-30 6 -58 70 Q-20 62 14 44 Z" fill="#5b3fc0" stroke="#3a2790" stroke-width="2" stroke-linejoin="round"/>${star(-24, 30, 6, '#ffd23f')}${star(-8, 12, 4, '#ffd23f')}${star(-40, 54, 4.5, '#ffd23f')}` },
      { id: 'wings-angel', name: 'כַּנְפֵי מַלְאָךְ', layer: 0, cost: 22, svg: '<g class="flutter"><path d="M0 0 Q-20 -44 -58 -38 Q-44 -28 -56 -14 Q-38 -12 -42 2 Q-22 8 0 0 Z" fill="#fff" stroke="#cfe0ee" stroke-width="2" stroke-linejoin="round"/><path d="M-12 -8 Q-28 -22 -46 -26" stroke="#e1ecf5" stroke-width="2" fill="none"/></g>' },
      { id: 'jetpack', name: 'תַּרְמִיל רִחוּף', layer: 1, cost: 25, svg: '<rect x="-32" y="-8" width="13" height="34" rx="6" fill="#9aa5b1" stroke="#6b7785" stroke-width="2"/><rect x="-17" y="-8" width="13" height="34" rx="6" fill="#b4bec9" stroke="#6b7785" stroke-width="2"/><path class="flame" d="M-30 28 Q-26 52 -22 28 Z" fill="#ff7a3d"/><path class="flame" d="M-15 28 Q-11 52 -7 28 Z" fill="#ffb347"/><rect x="-32" y="2" width="28" height="4" fill="#e5484d"/>' },
    ],

    tail: [
      { id: 'ribbon', name: 'סֶרֶט', cost: 5, svg: '<path d="M0 0 L-20 -13 L-20 13 Z M0 0 L20 -13 L20 13 Z" fill="#ff7eb6" stroke="#d9548f" stroke-width="2" stroke-linejoin="round"/><circle r="4.5" fill="#d9548f"/>' },
      { id: 'tailflower', name: 'פֶּרַח', cost: 6, svg: `<g transform="translate(0 -6)">${flower(0, 0, 8, '#c77dff', '#ffd23f')}</g>` },
      { id: 'tailbell', name: 'פַּעֲמוֹן', cost: 6, svg: '<path d="M0 -8 L0 0" stroke="#e5484d" stroke-width="3"/><circle cx="0" cy="8" r="8" fill="#ffd23f" stroke="#c99400" stroke-width="2"/><path d="M-4 9 H4" stroke="#c99400" stroke-width="2" stroke-linecap="round"/>' },
      { id: 'flag', name: 'דֶּגֶל', cost: 10, svg: '<path d="M0 0 L0 -48" stroke="#7a4a1c" stroke-width="3" stroke-linecap="round"/><path d="M0 -48 L30 -38 L0 -26 Z" fill="#e5484d" stroke="#a52a2f" stroke-width="2" stroke-linejoin="round"/>' },
    ],
  };

  const BY_ID = {};
  SLOTS.forEach((s) => ITEMS[s.id].forEach((it) => { BY_ID[it.id] = Object.assign({ slot: s.id }, it); }));

  // Items every player owns from the start.
  const STARTERS = Object.values(BY_ID).filter((it) => it.cost === 0).map((it) => it.id);

  const n = (v) => (Math.round(v * 100) / 100);

  function place(a, svg, extra) {
    const [x, y, s, r] = a;
    return `<g class="wear" transform="translate(${x} ${y}) rotate(${r || 0}) scale(${s})${extra || ''}">${svg}</g>`;
  }

  /** SVG fragments for one dino's outfit, keyed by the slot the renderer injects them into. */
  function wear(species, outfit) {
    const out = { hat: '', face: '', neck: '', clothes: '', back0: '', back1: '', tail: '' };
    if (!outfit) return out;
    const A = ANCHORS[species];
    const get = (slot) => (outfit[slot] && BY_ID[outfit[slot]] && BY_ID[outfit[slot]].slot === slot ? BY_ID[outfit[slot]] : null);
    let it = get('hat');
    if (it) out.hat = place(A.hat, it.svg);
    it = get('face');
    if (it) out.face = place(A.face, it.svg);
    it = get('neck');
    if (it) out.neck = place([A.neck[0], A.neck[1], A.neck[2], 0], it.svg);
    it = get('clothes');
    if (it) out.clothes = `<g class="wear" transform="translate(${A.body[0]} ${A.body[1]}) scale(${n(A.body[2])} ${n(A.body[3])})">${it.svg}</g>`;
    it = get('back');
    if (it) out['back' + (it.layer || 0)] = place([A.back[0], A.back[1], A.back[2], 0], it.svg);
    it = get('tail');
    if (it) out.tail = place([A.tail[0], A.tail[1], A.tail[2], 0], it.svg);
    return out;
  }

  /** Small standalone picture of one item, for the wardrobe grid. */
  function preview(item) {
    const view = { hat: '-40 -56 80 70', clothes: '-60 -40 120 80', face: '-50 -24 80 56', neck: '-34 -16 68 56', back: '-70 -76 90 150', tail: '-34 -56 68 76' }[item.slot];
    const body = item.slot === 'clothes' ? '<ellipse cx="0" cy="0" rx="56" ry="36" fill="#9ad78a"/>' : '';
    return `<svg class="wd-prev" viewBox="${view}" aria-hidden="true">${body}<g class="wear">${item.svg}</g></svg>`;
  }

  function slotOf(id) {
    return BY_ID[id] ? BY_ID[id].slot : null;
  }

  global.Wardrobe = { SLOTS, ITEMS, BY_ID, STARTERS, ANCHORS, wear, preview, slotOf };
})(window);
