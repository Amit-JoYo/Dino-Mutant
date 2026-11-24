/* Wordlings trainers: people who stand beside the road and in the rooms. When she walks into the line they are looking along they
   shout, walk up to her and ask for a friendly duel (the duel itself is in game.js: she answers questions, every right answer is an
   attack from her creature, every wrong one is a hit from theirs). Beating every trainer of a place gives a badge; four badges make
   her the champion of the village. A creature that loses a duel is too tired to fight again until the nurse at the hospital heals it. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const look = (shirt, hair, hat) => ({ skin: '#f5c9a0', hair, shirt, pants: '#4a5a8a', hat });

  const BADGES = [
    { id: 'forest', emoji: '🌳', he: 'הַיַּעַר' },
    { id: 'bakery', emoji: '🥖', he: 'הַמַּאֲפִיָּה' },
    { id: 'house', emoji: '🏠', he: 'הַבַּיִת' },
    { id: 'shop', emoji: '🎨', he: 'חֲנוּת הַקֶּשֶׁת' },
  ];

  const LOSE = ['Wow! You are very good! Well done!', 'וַאוּ! אַתְּ מְצֻיֶּנֶת! כָּל הַכָּבוֹד!'];

  /* x, y: where the trainer stands; dir: the way they look; sight: how many tiles they can see; zone: the words of the duel;
     mon, stage: their creature; hp: how many hits it takes. */
  const trainer = (id, map, x, y, dir, sight, badge, zone, mon, stage, hp, reward, emoji, name, he, shirt, hair, hat, quirkEn, quirkHe) => ({
    id, map, x, y, dir, sight, badge, zone, mon, stage, hp, reward, emoji, name, he, look: look(shirt, hair, hat),
    pre: [`Hi! I am ${name}. ${quirkEn} Let's have a friendly duel!`, `שָׁלוֹם! אֲנִי ${he}. ${quirkHe} בּוֹאִי נַעֲשֶׂה דּוּאֶל יְדִידוּתִי!`],
    lose: LOSE,
  });

  const TRAINERS = [
    trainer('tali', 'outside', 15, 25, 'left', 5, 'forest', 'forest', 'bloomie', 1, 3, 5, '👧', 'Trainer Tali', 'הַמְאַמֶּנֶת טָלִי', '#ec6aa6', '#7a3b1e', null, 'I love the tall grass.', 'אֲנִי אוֹהֶבֶת אֶת הָעֵשֶׂב הַגָּבוֹהַּ.'),
    trainer('roy', 'outside', 5, 28, 'right', 4, 'forest', 'forest', 'acorno', 2, 4, 6, '🧔', 'Ranger Roy', 'הַשּׁוֹמֵר רוֹי', '#3f7a3f', '#3a2a1a', '#3f7a3f', 'I know every tree in the forest.', 'אֲנִי מַכִּיר כָּל עֵץ בַּיַּעַר.'),
    trainer('coco', 'bakery', 9, 7, 'left', 4, 'bakery', 'kitchen', 'embero', 1, 4, 6, '🧒', 'Cookie Kid Coco', 'קוֹקוֹ מֵהָעוּגִיּוֹת', '#e0a85a', '#3a2a1a', null, 'My cookies are the best!', 'הָעוּגִיּוֹת שֶׁלִּי הֲכִי טוֹבוֹת!'),
    trainer('cora', 'bakery2', 9, 2, 'left', 3, 'bakery', 'kitchen2', 'donno', 2, 6, 9, '👧', 'Candy Cora', 'קוֹרָה הַמְּתוּקָה', '#ff9ec4', '#6b3a1a', '#ff9ec4', 'I only eat sweet things.', 'אֲנִי אוֹכֶלֶת רַק דְּבָרִים מְתוּקִים.'),
    trainer('chloe', 'bakery3', 6, 2, 'right', 4, 'bakery', 'kitchen3', 'chefo', 3, 8, 14, '👩‍🍳', 'Chef Chloe', 'הַשֵּׁפִית קְלוֹאֵי', '#ffffff', '#2a2a2a', '#ffffff', 'I am the best chef in town!', 'אֲנִי הַשֵּׁפִית הֲכִי טוֹבָה בָּעִיר!'),
    trainer('pia', 'house', 9, 9, 'left', 4, 'house', 'home', 'pillo', 1, 4, 6, '🧒', 'Pajama Pia', 'פִּיָּה בַּפִּיגָ׳מָה', '#8fb4ff', '#c0392b', null, 'I am still in my pajamas.', 'אֲנִי עֲדַיִן בַּפִּיגָ׳מָה.'),
    trainer('gus', 'house2', 9, 2, 'left', 3, 'house', 'home2', 'kitey', 2, 6, 9, '👦', 'Gamer Gus', 'גּוּס הַגֵּיימֶר', '#47a86a', '#2a2a2a', '#2e86de', 'I love to play all day.', 'אֲנִי אוֹהֵב לְשַׂחֵק כָּל הַיּוֹם.'),
    trainer('sid', 'house3', 6, 2, 'right', 4, 'house', 'home3', 'bubbo', 3, 8, 14, '🧛', 'Spooky Sid', 'סִיד הַמַּפְחִיד', '#4a35a8', '#1a1a1a', null, 'Boo! Did I scare you?', 'בּוּ! הִפְחַדְתִּי אוֹתָךְ?'),
    trainer('pete', 'shop', 9, 6, 'left', 4, 'shop', 'colours', 'rainbo', 1, 4, 6, '🧑‍🎨', 'Painter Pete', 'פִּיט הַצַּיָּר', '#e5484d', '#5a3a22', '#8f6bff', 'I paint with every colour.', 'אֲנִי מְצַיֵּר בְּכָל הַצְּבָעִים.'),
    trainer('shay', 'shop2', 9, 2, 'left', 3, 'shop', 'colours2', 'shapo', 2, 6, 9, '🧑‍🔧', 'Shape Shay', 'שֵׁי הַצּוּרוֹת', '#2e86de', '#8a4b22', null, 'I see shapes everywhere!', 'אֲנִי רוֹאֶה צוּרוֹת בְּכָל מָקוֹם!'),
    trainer('gina', 'shop3', 6, 2, 'right', 4, 'shop', 'colours3', 'palleto', 3, 8, 14, '🧑‍🎤', 'Gallery Gina', 'גִּינָה מֵהַגָּלֶרְיָה', '#e2579a', '#6a4fd8', '#ffd23f', 'Welcome to my gallery.', 'בְּרוּכָה הַבָּאָה לַגָּלֶרְיָה שֶׁלִּי.'),
  ];

  const st = () => {
    const g = global.Game.state();
    return g.trainers || (g.trainers = {});
  };
  const byId = (id) => TRAINERS.find((t) => t.id === id);
  const won = (id) => !!(st()[id] && st()[id].won);
  const badgeIds = () => BADGES.filter((b) => TRAINERS.filter((t) => t.badge === b.id).every((t) => won(t.id))).map((b) => b.id);
  const champion = () => badgeIds().length === BADGES.length;

  function record(id, didWin) {
    const r = st()[id] || (st()[id] = { won: 0, tried: 0 });
    r.tried++;
    if (didWin) r.won++;
    global.Game.save();
  }

  /* ---------- the talk before a duel ---------- */
  function closeModal() {
    $('modal').hidden = true;
    global.Sound.stop();
  }

  function dialog(t, lines, extra, buttons) {
    $('modal-card').innerHTML = `<div class="npc-dialog">
      <div class="npc-head"><span class="npc-face">${t.emoji}</span><div><b dir="ltr">${esc(t.name)}</b><small>${esc(t.he)}</small></div></div>
      <div class="npc-say"><p dir="ltr">${esc(lines[0])}</p><p>${esc(lines[1])}</p></div>
      ${extra || ''}
      <div class="npc-btns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-b="${i}">${b.label}</button>`).join('')}</div>
    </div>`;
    $('modal').hidden = false;
    $('modal-card').querySelectorAll('[data-b]').forEach((el) => {
      el.onclick = () => buttons[Number(el.dataset.b)].fn();
    });
    global.Sound.sayAll([{ text: lines[0], lang: 'en' }, { text: lines[1], lang: 'he' }]);
  }

  /** a trainer has walked up to her (or she pressed A in front of one who has already lost): choose a fighter and begin */
  function challenge(id) {
    const t = byId(id);
    const fighters = global.Game.fighters();
    const bail = () => { closeModal(); global.World.release(id); };
    if (!fighters.length) {
      dialog(t, ['Come back when you have a creature friend!', 'תַּחְזְרִי כְּשֶׁיִּהְיֶה לָךְ חָבֵר יְצוּר!'], '', [{ label: 'סְגִירָה', cls: 'ghost', fn: bail }]);
      return;
    }
    if (fighters.every((f) => f.fainted)) {
      dialog(t, ['Oh no, your friends are too tired. Take them to the hospital first!', 'אוֹי לֹא, הַחֲבֵרִים שֶׁלָּךְ עֲיֵפִים מִדַּי. קֹדֶם תִּקְחִי אוֹתָם לְבֵית הַחוֹלִים 🏥'], '', [{ label: 'סְגִירָה', cls: 'ghost', fn: bail }]);
      return;
    }
    const again = won(id);
    const lines = again ? ['Do you want a rematch? It is just for fun!', 'רוֹצָה רֶמַץ׳? זֶה רַק בִּשְׁבִיל הַכֵּיף!'] : t.pre;
    const buddy = global.Game.state().buddy;
    const firstReady = fighters.find((f) => !f.fainted).id;
    let pick = fighters.some((f) => f.id === buddy && !f.fainted) ? buddy : firstReady;
    const chips = () => fighters.map((f) => `<button class="pick${f.id === pick ? ' on' : ''}${f.fainted ? ' fainted' : ''}" data-f="${f.id}">${global.Creatures.draw(f.id, { stage: f.stage })}<small>${f.fainted ? '💤' : f.level}</small></button>`).join('');
    const stats = () => {
      const f = fighters.find((x) => x.id === pick);
      return `<b dir="ltr">${esc(f.name)}</b> · ${3 + f.stage * 2} ❤️ · ⚔️ ${f.stage}`;
    };
    dialog(t, lines, `<div class="pick-row" id="pick-row">${chips()}</div><p class="pick-info" id="pick-info">${stats()}</p>`, [
      { label: '⚔️ בּוֹאוּ נִלָּחֵם!', cls: 'big', fn: () => { closeModal(); global.Game.startBattle(t, pick); } },
      { label: 'לֹא עַכְשָׁיו', cls: 'ghost', fn: bail },
    ]);
    $('pick-row').onclick = (e) => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      if (fighters.find((x) => x.id === b.dataset.f).fainted) {
        global.Sound.sfx.bad();
        return;
      }
      pick = b.dataset.f;
      global.Sound.sfx.tap();
      $('pick-row').innerHTML = chips();
      $('pick-info').innerHTML = stats();
    };
  }

  /** she pressed A in front of a trainer */
  function talk(id) {
    challenge(id);
  }

  /* ---------- the quest tab ---------- */
  function badgesHtml() {
    const have = badgeIds();
    return `<div class="badges card"><h3>🏅 תָּגִים</h3><div class="badge-row">${BADGES.map((b) => `<span class="badge${have.includes(b.id) ? ' got' : ''}" title="${b.he}">${b.emoji}</span>`).join('')}<span class="badge${champion() ? ' got' : ''}">🏆</span></div></div>`;
  }

  function listHtml() {
    const rows = TRAINERS.map((t) => `<li class="q-${won(t.id) ? 'done' : 'next'}"><span>${won(t.id) ? '✅' : '⚔️'}</span><b dir="ltr">${esc(t.name)}</b><i>${esc(global.Words.ZONES.find((z) => z.id === t.zone).he)}</i><em>⭐ ${t.reward}</em></li>`).join('');
    return `<section class="npc-card"><h3><span class="npc-face small">⚔️</span> <b>מְאַמְּנִים</b> <small>${TRAINERS.filter((t) => won(t.id)).length}/${TRAINERS.length}</small></h3><ul class="q-list">${rows}</ul></section>`;
  }

  global.Trainers = { TRAINERS, BADGES, byId, won, badgeIds, champion, record, challenge, talk, badgesHtml, listHtml };
})(window);
