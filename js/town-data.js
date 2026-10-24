/* Dino Town catalog: buildings (name, cost, look) and the SVG front drawn on the map. */
(function (global) {
  'use strict';

  // f: the Hebrew name is feminine (for "new" in the celebration title).
  const BUILDINGS = [
    { id: 'home', name: 'בַּיִת', desc: 'מָקוֹם לִישֹׁן, לֶאֱכֹל וּלְשַׂחֵק', cost: 30, room: 'bedroom', look: { shape: 'tri', wall: '#ffd59e', roof: '#e5484d', door: '#8a5a2b', sign: '🏠' } },
    { id: 'park', name: 'פָּארְק', desc: 'מִתְקָנִים, פִּיקְנִיק וְכֵיף בַּחוּץ', cost: 50, room: 'playground', look: { shape: 'park', sign: '🎡' } },
    { id: 'cafe', name: 'מִסְעָדָה', f: true, desc: 'מְבַשְּׁלִים וְאוֹכְלִים יַחַד', cost: 60, room: 'dining', look: { shape: 'shop', wall: '#fff1d6', roof: '#ff8a3d', door: '#a0522d', sign: '🍕' } },
    { id: 'farm', name: 'חַוָּה', f: true, desc: 'תַּרְנְגוֹלוֹת, פָּרוֹת וִירָקוֹת', cost: 60, room: 'coop', look: { shape: 'barn', wall: '#d9473f', roof: '#8c2f2a', door: '#f4efe6', sign: '🌾' } },
    { id: 'pool', name: 'בְּרֵכָה', f: true, desc: 'שׂוֹחִים, קוֹפְצִים וּמִתְקָרְרִים', cost: 70, room: 'bigpool', look: { shape: 'pool', sign: '🏊' } },
    { id: 'school', name: 'בֵּית סֵפֶר', desc: 'לוֹמְדִים וּמְלַמְּדִים', cost: 80, room: 'classroom', look: { shape: 'tri', wall: '#ffe680', roof: '#4f7cd8', door: '#4f7cd8', sign: '🏫' } },
    { id: 'library', name: 'סִפְרִיָּה', f: true, desc: 'סְפָרִים וְסִפּוּרִים', cost: 80, room: 'reading', look: { shape: 'dome', wall: '#e8d7f7', roof: '#8a5cc7', door: '#6b3fa6', sign: '📚' } },
    { id: 'hospital', name: 'בֵּית חוֹלִים', desc: 'רוֹפְאִים וְגַם וֵטֶרִינָר 🐾', cost: 90, room: 'checkup', look: { shape: 'flat', wall: '#ffffff', roof: '#e5484d', door: '#9fd3ff', sign: '🏥' } },
    { id: 'mall', name: 'קַנְיוֹן', desc: 'חֲנֻיּוֹת בְּגָדִים, צַעֲצוּעִים וּגְלִידָה', cost: 100, room: 'clothes', look: { shape: 'shop', wall: '#ffd6ec', roof: '#d6408f', door: '#9fd3ff', sign: '🛍️' } },
    { id: 'cinema', name: 'קוֹלְנוֹעַ', desc: 'סְרָטִים וּפּוֹפְּקוֹרְן 🍿', cost: 110, room: 'screen', look: { shape: 'flat', wall: '#3d3f63', roof: '#ffcf3a', door: '#e5484d', sign: '🎬' } },
    { id: 'fire', name: 'תַּחֲנַת כַּבָּאִים', f: true, desc: 'כַּבָּאִים אַמִּיצִים שֶׁמַּצִּילִים', cost: 120, room: 'garage', look: { shape: 'flat', wall: '#e5484d', roof: '#9b1c1c', door: '#e8e8e8', sign: '🚒', garage: true } },
    { id: 'museum', name: 'מוּזֵיאוֹן', desc: 'עֲצָמוֹת וּמְאֻבָּנִים שֶׁל דִּינוֹזָאוּרִים', cost: 150, room: 'fossils', look: { shape: 'civic', wall: '#efe6d2', roof: '#b39b6e', door: '#7a5c32', sign: '🦴' } },
  ];
  const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

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

  global.TownData = { BUILDINGS, BY_ID, svg };
})(window);
