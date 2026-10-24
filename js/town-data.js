/* Dino Town catalog: buildings (name, cost, look) and the SVG front drawn on the map. */
(function (global) {
  'use strict';

  // f: the Hebrew name is feminine (for "new" in the celebration title).
  const BUILDINGS = [
    { id: 'home', name: 'בַּיִת', desc: 'מָקוֹם לִישֹׁן, לֶאֱכֹל וּלְשַׂחֵק', cost: 30, look: { shape: 'tri', wall: '#ffd59e', roof: '#e5484d', door: '#8a5a2b', sign: '🏠' } },
    { id: 'park', name: 'פָּארְק', desc: 'מִתְקָנִים, פִּיקְנִיק וְכֵיף בַּחוּץ', cost: 50, look: { shape: 'park', sign: '🎡' } },
    { id: 'cafe', name: 'מִסְעָדָה', f: true, desc: 'מְבַשְּׁלִים וְאוֹכְלִים יַחַד', cost: 60, look: { shape: 'shop', wall: '#fff1d6', roof: '#ff8a3d', door: '#a0522d', sign: '🍕' } },
    { id: 'farm', name: 'חַוָּה', f: true, desc: 'תַּרְנְגוֹלוֹת, פָּרוֹת וִירָקוֹת', cost: 60, look: { shape: 'barn', wall: '#d9473f', roof: '#8c2f2a', door: '#f4efe6', sign: '🌾' } },
    { id: 'pool', name: 'בְּרֵכָה', f: true, desc: 'שׂוֹחִים, קוֹפְצִים וּמִתְקָרְרִים', cost: 70, look: { shape: 'pool', sign: '🏊' } },
    { id: 'school', name: 'בֵּית סֵפֶר', desc: 'לוֹמְדִים וּמְלַמְּדִים', cost: 80, look: { shape: 'tri', wall: '#ffe680', roof: '#4f7cd8', door: '#4f7cd8', sign: '🏫' } },
    { id: 'library', name: 'סִפְרִיָּה', f: true, desc: 'סְפָרִים וְסִפּוּרִים', cost: 80, look: { shape: 'dome', wall: '#e8d7f7', roof: '#8a5cc7', door: '#6b3fa6', sign: '📚' } },
    { id: 'hospital', name: 'בֵּית חוֹלִים', desc: 'רוֹפְאִים וְגַם וֵטֶרִינָר 🐾', cost: 90, look: { shape: 'flat', wall: '#ffffff', roof: '#e5484d', door: '#9fd3ff', sign: '🏥' } },
    { id: 'mall', name: 'קַנְיוֹן', desc: 'חֲנֻיּוֹת בְּגָדִים, צַעֲצוּעִים וּגְלִידָה', cost: 100, look: { shape: 'shop', wall: '#ffd6ec', roof: '#d6408f', door: '#9fd3ff', sign: '🛍️' } },
    { id: 'cinema', name: 'קוֹלְנוֹעַ', desc: 'סְרָטִים וּפּוֹפְּקוֹרְן 🍿', cost: 110, look: { shape: 'flat', wall: '#3d3f63', roof: '#ffcf3a', door: '#e5484d', sign: '🎬' } },
    { id: 'fire', name: 'תַּחֲנַת כַּבָּאִים', f: true, desc: 'כַּבָּאִים אַמִּיצִים שֶׁמַּצִּילִים', cost: 120, look: { shape: 'flat', wall: '#e5484d', roof: '#9b1c1c', door: '#e8e8e8', sign: '🚒', garage: true } },
    { id: 'museum', name: 'מוּזֵיאוֹן', desc: 'עֲצָמוֹת וּמְאֻבָּנִים שֶׁל דִּינוֹזָאוּרִים', cost: 150, look: { shape: 'civic', wall: '#efe6d2', roof: '#b39b6e', door: '#7a5c32', sign: '🦴' } },
  ];
  const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

  /* What a dino does in a room. Effects on needs come with jobs (phase 4). */
  const ACTS = {
    sleep: { e: '😴', name: 'שֵׁנָה', wall: '#cdd8ff' },
    eat: { e: '🍎', name: 'אֹכֶל', wall: '#ffe2b8' },
    cook: { e: '👩‍🍳', name: 'בִּשּׁוּל', wall: '#ffd3b5' },
    play: { e: '⚽', name: 'מִשְׂחָק', wall: '#d6f5c9' },
    wash: { e: '🫧', name: 'נִקָּיוֹן', wall: '#c9f0ff' },
    heal: { e: '🩺', name: 'טִפּוּל', wall: '#e3f1ff' },
    learn: { e: '📚', name: 'לְמִידָה', wall: '#fff3b0' },
    animals: { e: '🐾', name: 'טִפּוּל בְּחַיּוֹת', wall: '#ecdfc6' },
    work: { e: '💼', name: 'עֲבוֹדָה', wall: '#e6dcff' },
  };

  // stuff: furniture shown inside; a room shows 2 items at level 1, then one more per level.
  const ROOMS = {
    bedroom: { name: 'חֲדַר שֵׁנָה', e: '🛏️', act: 'sleep', cost: 20, stuff: ['🛏️', '🪴', '🧸', '🌙'] },
    kitchen: { name: 'מִטְבָּח', e: '🍳', act: 'eat', cost: 20, stuff: ['🍳', '🍎', '🥛', '🧁'] },
    bathroom: { name: 'אַמְבַּטְיָה', e: '🛁', act: 'wash', cost: 20, stuff: ['🛁', '🧼', '🦆', '🪥'] },
    playroom: { name: 'חֲדַר מִשְׂחָקִים', e: '🧸', act: 'play', cost: 25, stuff: ['🧸', '🪀', '🎲', '🪁'] },
    playground: { name: 'גַּן מִשְׂחָקִים', e: '🛝', act: 'play', cost: 20, stuff: ['🛝', '⚽', '🪁', '🎈'] },
    picnic: { name: 'פִּיקְנִיק', e: '🧺', act: 'eat', cost: 20, stuff: ['🧺', '🍉', '🥪', '🌳'] },
    carousel: { name: 'קָרוּסֶלָה', e: '🎠', act: 'play', cost: 30, stuff: ['🎠', '🎈', '🍭', '🎶'] },
    duckpond: { name: 'אֲגַם בַּרְוָזִים', e: '🦆', act: 'animals', cost: 25, stuff: ['🦆', '🪷', '🐸', '🐟'] },
    dining: { name: 'חֲדַר אֹכֶל', e: '🍽️', act: 'eat', cost: 20, stuff: ['🍽️', '🍕', '🥗', '🕯️'] },
    chefkitchen: { name: 'מִטְבַּח הַשֵּׁף', e: '👩‍🍳', act: 'cook', cost: 25, stuff: ['🍲', '🔪', '🥕', '🧂'] },
    bakery: { name: 'מַאֲפִיָּה', e: '🥐', act: 'cook', cost: 25, stuff: ['🥐', '🍞', '🥨', '🎂'] },
    icecream: { name: 'פִּנַּת גְּלִידָה', e: '🍦', act: 'eat', cost: 25, stuff: ['🍦', '🍨', '🍒', '🧇'] },
    coop: { name: 'לוּל', e: '🐔', act: 'animals', cost: 20, stuff: ['🐔', '🥚', '🐣', '🌾'] },
    cowbarn: { name: 'רֶפֶת', e: '🐄', act: 'animals', cost: 25, stuff: ['🐄', '🥛', '🌾', '🐮'] },
    veggies: { name: 'גִּנַּת יְרָקוֹת', e: '🥕', act: 'animals', cost: 20, stuff: ['🥕', '🥬', '🍅', '🌽'] },
    pony: { name: 'פִּנַּת פּוֹנִי', e: '🐴', act: 'animals', cost: 30, stuff: ['🐴', '🥕', '🎀', '🌾'] },
    bigpool: { name: 'בְּרֵכָה גְּדוֹלָה', e: '🏊', act: 'wash', cost: 20, stuff: ['🏊', '🛟', '🦆', '🌊'] },
    waterslide: { name: 'מַגְלֵשַׁת מַיִם', e: '💦', act: 'play', cost: 30, stuff: ['💦', '🛝', '🌊', '😎'] },
    showers: { name: 'מִקְלָחוֹת', e: '🚿', act: 'wash', cost: 20, stuff: ['🚿', '🧴', '🧼', '🩴'] },
    lifeguard: { name: 'מִגְדַּל מַצִּיל', e: '🛟', act: 'work', cost: 25, stuff: ['🛟', '📣', '🕶️', '⛱️'] },
    classroom: { name: 'כִּתָּה', e: '🧑‍🏫', act: 'learn', cost: 20, stuff: ['📝', '✏️', '🔢', '🌍'] },
    artroom: { name: 'חֲדַר אָמָנוּת', e: '🎨', act: 'learn', cost: 25, stuff: ['🎨', '🖍️', '🖼️', '✂️'] },
    musicroom: { name: 'חֲדַר מוּזִיקָה', e: '🎵', act: 'play', cost: 25, stuff: ['🎹', '🥁', '🎸', '🎵'] },
    gym: { name: 'אוּלַם סְפּוֹרְט', e: '🤸', act: 'play', cost: 25, stuff: ['🏀', '🤸', '🏐', '🥇'] },
    reading: { name: 'פִּנַּת קְרִיאָה', e: '📖', act: 'learn', cost: 20, stuff: ['📚', '🛋️', '📖', '💡'] },
    storytime: { name: 'שְׁעַת סִפּוּר', e: '🧚', act: 'learn', cost: 25, stuff: ['🧚', '📕', '🐉', '🏰'] },
    quietroom: { name: 'חֶדֶר שָׁקֵט', e: '🤫', act: 'sleep', cost: 20, stuff: ['🛋️', '🤫', '🪴', '🕯️'] },
    checkup: { name: 'חֲדַר רוֹפֵא', e: '🩺', act: 'heal', cost: 20, stuff: ['🩺', '🛏️', '🌡️', '🩹'] },
    vet: { name: 'וֵטֶרִינָר', e: '🐾', act: 'animals', cost: 25, stuff: ['🐾', '🐶', '🐱', '🩹'] },
    eggroom: { name: 'חֲדַר בֵּיצִים', e: '🥚', act: 'heal', cost: 30, stuff: ['🥚', '🪺', '💡', '🧸'] },
    pharmacy: { name: 'בֵּית מִרְקַחַת', e: '💊', act: 'work', cost: 20, stuff: ['💊', '🧴', '🩹', '🍯'] },
    clothes: { name: 'חֲנוּת בְּגָדִים', e: '👗', act: 'work', cost: 20, stuff: ['👗', '👒', '👟', '🪞'] },
    toyshop: { name: 'חֲנוּת צַעֲצוּעִים', e: '🪀', act: 'play', cost: 25, stuff: ['🧸', '🪀', '🚂', '🎁'] },
    icecart: { name: 'דּוּכַן גְּלִידָה', e: '🍨', act: 'eat', cost: 20, stuff: ['🍨', '🍦', '🍓', '🍫'] },
    checkout: { name: 'קֻפָּה', e: '🛒', act: 'work', cost: 25, stuff: ['🛒', '🪙', '🛍️', '🧾'] },
    screen: { name: 'אוּלַם סְרָטִים', e: '🎬', act: 'play', cost: 25, stuff: ['🎬', '💺', '🍿', '🌟'] },
    popcorn: { name: 'דּוּכַן פּוֹפְּקוֹרְן', e: '🍿', act: 'cook', cost: 20, stuff: ['🍿', '🥤', '🍬', '🎟️'] },
    garage: { name: 'מוּסָךְ', e: '🚒', act: 'work', cost: 20, stuff: ['🚒', '🧯', '⛑️', '🪜'] },
    climbing: { name: 'קִיר טִפּוּס', e: '🧗', act: 'play', cost: 25, stuff: ['🧗', '🪢', '🥇', '💪'] },
    rescue: { name: 'חֲדַר הַצָּלָה', e: '🐱', act: 'work', cost: 30, stuff: ['🐱', '🌳', '🪜', '🚨'] },
    fossils: { name: 'אוּלַם מְאֻבָּנִים', e: '🦴', act: 'learn', cost: 20, stuff: ['🦴', '🦕', '🪨', '🔍'] },
    legends: { name: 'אוּלַם הָאַגָּדוֹת', e: '🏆', act: 'learn', cost: 35, stuff: ['🏆', '🦖', '👑', '✨'] },
    digsite: { name: 'אֲתַר חֲפִירוֹת', e: '⛏️', act: 'work', cost: 30, stuff: ['⛏️', '🪣', '🦴', '🧭'] },
  };

  // Rooms each building can have; the first one is the starter that comes with the building.
  const ROOMS_OF = {
    home: ['bedroom', 'kitchen', 'bathroom', 'playroom'],
    park: ['playground', 'picnic', 'carousel', 'duckpond'],
    cafe: ['dining', 'chefkitchen', 'bakery', 'icecream'],
    farm: ['coop', 'cowbarn', 'veggies', 'pony'],
    pool: ['bigpool', 'waterslide', 'showers', 'lifeguard'],
    school: ['classroom', 'artroom', 'musicroom', 'gym'],
    library: ['reading', 'storytime', 'quietroom'],
    hospital: ['checkup', 'vet', 'eggroom', 'pharmacy'],
    mall: ['clothes', 'toyshop', 'icecart', 'checkout'],
    cinema: ['screen', 'popcorn'],
    fire: ['garage', 'climbing', 'rescue'],
    museum: ['fossils', 'legends', 'digsite'],
  };
  BUILDINGS.forEach((b) => { b.room = ROOMS_OF[b.id][0]; });

  const MAX_FLOORS = 3;
  const FLOOR_COST = [0, 25, 40]; // price of the 2nd and 3rd floor
  const upgradeCost = (roomId, lvl) => Math.round(ROOMS[roomId].cost * (lvl === 1 ? 1 : 1.6));

  const emoji = (e, x, y, size) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${e}</text>`;

  function windows(look) {
    const trim = look.shape === 'barn' ? '#ffffff' : 'rgba(0,0,0,.25)';
    return [16, 64].map((x) =>
      `<rect class="win" x="${x}" y="66" width="20" height="16" rx="2" fill="#bfe6ff" stroke="${trim}" stroke-width="2"/><path d="M${x + 10} 66 V82 M${x} 74 H${x + 20}" stroke="${trim}" stroke-width="1.5"/>`
    ).join('');
  }

  function door(look) {
    if (look.garage) {
      return `<rect x="26" y="80" width="48" height="36" rx="3" fill="${look.door}" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M26 89 H74 M26 98 H74 M26 107 H74" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`;
    }
    if (look.shape === 'barn') {
      return `<rect x="36" y="80" width="28" height="36" fill="${look.door}"/><path d="M36 80 L64 116 M64 80 L36 116" stroke="${look.wall}" stroke-width="3"/>`;
    }
    return `<rect x="40" y="84" width="20" height="32" rx="3" fill="${look.door}" stroke="rgba(0,0,0,.25)" stroke-width="2"/><circle cx="55" cy="101" r="1.6" fill="#ffd23f"/>`;
  }

  /* Front of a building as SVG, viewBox 100 x 120 with the ground line at the bottom. */
  function svg(id) {
    const b = BY_ID[id];
    if (!b) return '';
    const L = b.look;
    const shadow = '<ellipse cx="50" cy="117" rx="47" ry="4" fill="rgba(0,0,0,.15)"/>';
    let art = '';
    if (L.shape === 'park') {
      art = `<rect x="4" y="70" width="92" height="46" rx="6" fill="#a5e08a" stroke="#9b6b3a" stroke-width="3" stroke-dasharray="6 4"/>${emoji('🎡', 36, 84, 48)}${emoji('🌳', 80, 92, 24)}${emoji('🛝', 76, 108, 18)}${emoji('🌷', 14, 110, 10)}`;
    } else if (L.shape === 'pool') {
      art = `<rect x="4" y="72" width="92" height="44" rx="8" fill="#efe4cc"/><rect x="12" y="80" width="76" height="30" rx="6" fill="#5ec8f2" stroke="#fff" stroke-width="3"/><path d="M20 92 q6 -4 12 0 t12 0 M48 100 q6 -4 12 0 t12 0" stroke="#bff0ff" stroke-width="2" fill="none"/>${emoji('⛱️', 18, 70, 24)}${emoji('🛟', 74, 92, 14)}`;
    } else {
      const body = `<rect x="8" y="56" width="84" height="60" fill="${L.wall}" stroke="rgba(0,0,0,.2)" stroke-width="2"/>`;
      let roof = '';
      let extra = '';
      if (L.shape === 'tri') {
        roof = `<polygon points="0,58 50,16 100,58" fill="${L.roof}" stroke="rgba(0,0,0,.2)" stroke-width="2"/>${emoji(L.sign, 50, 44, 22)}`;
      } else if (L.shape === 'dome') {
        roof = `<path d="M10 58 Q50 -6 90 58 Z" fill="${L.roof}" stroke="rgba(0,0,0,.2)" stroke-width="2"/>${emoji(L.sign, 50, 42, 22)}`;
      } else if (L.shape === 'barn') {
        roof = `<polygon points="2,62 18,26 82,26 98,62" fill="${L.roof}" stroke="rgba(0,0,0,.2)" stroke-width="2"/>${emoji(L.sign, 50, 46, 20)}`;
      } else if (L.shape === 'civic') {
        roof = `<polygon points="2,58 50,28 98,58" fill="${L.roof}" stroke="rgba(0,0,0,.2)" stroke-width="2"/>${emoji(L.sign, 50, 47, 16)}`;
        extra = [14, 32, 58, 76].map((x) => `<rect x="${x}" y="60" width="10" height="50" fill="#fffaf0" stroke="rgba(0,0,0,.15)"/>`).join('') + '<rect x="4" y="110" width="92" height="7" fill="#d8ccb4"/>';
      } else {
        roof = `<rect x="4" y="46" width="92" height="12" rx="2" fill="${L.roof}"/><rect x="14" y="14" width="72" height="30" rx="6" fill="#fff" stroke="${L.roof}" stroke-width="3"/>${emoji(L.sign, 50, 30, 22)}`;
        if (L.shape === 'shop') {
          extra = Array.from({ length: 6 }, (_, i) => `<path d="M${8 + i * 14} 58 h14 v8 a7 7 0 0 1 -14 0 Z" fill="${i % 2 ? '#fff' : L.roof}"/>`).join('');
        }
      }
      const wins = L.shape === 'civic' ? '' : windows(L);
      art = L.shape === 'civic' ? `${body}${roof}${extra}${door(L)}` : `${body}${roof}${wins}${door(L)}${extra}`;
    }
    return `<svg class="bld-svg" viewBox="0 0 100 120" aria-hidden="true">${shadow}${art}</svg>`;
  }

  global.TownData = { BUILDINGS, BY_ID, ACTS, ROOMS, ROOMS_OF, MAX_FLOORS, FLOOR_COST, upgradeCost, svg };
})(window);
