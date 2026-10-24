/* Dino Town: what makes each building special. School lessons, the library, shop tills (paying the exact price),
   the egg room, farm goods for the restaurant, fire rescues and the museum. Shown on a room's card. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const TD = () => global.TownData;
  const T = () => global.Town;
  const App = () => global.App;
  const P = () => global.World.Pets;
  const esc = (s) => global.Puzzles.escapeHtml(s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  const LESSON = ['classroom', 'artroom'];
  const LIBRARY = ['reading', 'storytime'];
  const RESCUE_MS = 60 * 60 * 1000;
  const COINS = [1, 2, 5, 10];
  const COSTS = { m: 'עוֹלֶה', f: 'עוֹלָה', p: 'עוֹלוֹת' };
  const SCENES = [
    { place: '🌳', who: '🐱', text: 'חָתוּל תָּקוּעַ עַל הָעֵץ!' },
    { place: '🏠', who: '🐈', text: 'חֲתַלְתּוּל תָּקוּעַ עַל הַגַּג!' },
    { place: '🌲', who: '🐥', text: 'אֶפְרוֹחַ תָּקוּעַ עַל הָעֵץ!' },
  ];

  let mode = null; // the mini-game currently shown in the room card, if any

  const occupants = (lot, r) => T().occupants(lot, r.slot);
  const faces = (list) => list.map((d) => `<span class="tf-face">${App().dinoHtml(d)}</span>`).join('');
  const love = (list, n) => list.forEach((d) => { P().ensure(d).love += n; });

  function pantryLine() {
    const p = T().state().pantry;
    return `<p class="tf-pantry">בַּמַּחְסָן: ${Object.values(TD().GOODS).map((g) => `${g.e} <b>${p[g.id] || 0}</b>`).join(' · ')}</p>`;
  }

  /* ---------- the extra part of a room card ---------- */
  function cardHtml(b, r, lot) {
    const occ = occupants(lot, r);
    const need = (text) => (occ.length ? '' : `<small class="tf-need">${text}</small>`);
    const box = (inner) => `<div class="tf-box">${inner}</div>`;
    if (LESSON.includes(r.type)) {
      return box(`<button class="btn" data-fun="lesson"${occ.length ? '' : ' disabled'}>📝 שִׁעוּר: פּוֹתְרִים חִידָה</button>${need('צָרִיךְ תַּלְמִיד בַּכִּתָּה 🦖')}<small>תְּשׁוּבָה נְכוֹנָה = 🧬 לָךְ וְ-❤️ לַתַּלְמִידִים</small>`);
    }
    if (LIBRARY.includes(r.type)) {
      return box(`<small>כְּשֶׁקּוֹרְאִים סִפּוּר, הַדִּינוֹזָאוּרִים כָּאן מַקְשִׁיבִים וּמְקַבְּלִים ❤️</small><button class="btn" data-fun="read">📖 לִקְרֹא לָהֶם סִפּוּר</button>`);
    }
    if (TD().SHOP[r.type]) {
      return box(`<button class="btn" data-fun="shop"${occ.length ? '' : ' disabled'}>🪙 לְשַׂחֵק בַּקֻּפָּה</button>${need('צָרִיךְ מוֹכֵר בַּחֲנוּת 🦖')}<small>מְשַׁלְּמִים בְּדִיּוּק אֶת הַמְּחִיר</small>`);
    }
    if (r.type === 'eggroom') {
      const now = Date.now();
      const eggs = occ.flatMap((d) => (d.babies || []).filter((x) => !x.hatched).map((x) => `<li>🥚 ${esc(App().dinoName(d))}: עוֹד ${Math.max(1, Math.ceil((x.hatchAt - now) / 60000))} דַּקּוֹת</li>`));
      return box(`<small>כְּשֶׁדִּינוֹזָאוּר נִכְנָס לְכָאן, הַבֵּיצִים שֶׁלּוֹ בּוֹקְעוֹת מַהֵר יוֹתֵר! 🐣</small>${eggs.length ? `<ul class="tf-eggs">${eggs.join('')}</ul>` : ''}`);
    }
    const g = TD().GOODS[r.type];
    if (g) {
      const ready = Math.floor(T().produce(lot, r.slot).goods);
      return box(`<p class="tf-ready">מוּכָן לְאִסּוּף: ${g.e} <b>${ready}</b></p><button class="btn" data-fun="collect"${ready ? '' : ' disabled'}>🧺 לֶאֱסֹף</button>${need('צָרִיךְ חַוַּאי 🦖')}${pantryLine()}<small>אֶת מָה שֶׁאוֹסְפִים מְבַשְּׁלִים בַּמִּסְעָדָה 🍕</small>`);
    }
    if (r.type === 'dining') {
      const can = occ.length && T().pantryTotal();
      return box(`${pantryLine()}<button class="btn" data-fun="meal"${can ? '' : ' disabled'}>🍳 אֲרוּחַת חַוָּה</button><small>${occ.length ? 'כָּל סוֹעֵד מְקַבֵּל מָנָה מֵהַחַוָּה: 🍎 +30 ❤️' : 'צָרִיךְ סוֹעֲדִים בַּחֶדֶר 🦖'}</small>`);
    }
    if (r.type === 'rescue') {
      const wait = Math.ceil((b.lastRescue + RESCUE_MS - Date.now()) / 60000);
      if (wait > 0) return box(`<small>הַכַּבָּאִים נָחִים. עוֹד ${wait} דַּקּוֹת 😴</small>`);
      return box(`<button class="btn" data-fun="rescue"${occ.length ? '' : ' disabled'}>🚨 יוֹצְאִים לְהַצָּלָה!</button>${need('צָרִיךְ כַּבַּאי בַּחֶדֶר 🦖')}`);
    }
    if (r.type === 'fossils') return box('<button class="btn" data-fun="facts">📜 עֻבְדּוֹת עַל הַדִּינוֹזָאוּרִים שֶׁלִּי</button>');
    if (r.type === 'legends') return box('<button class="btn" data-fun="legends">🏆 הַדִּינוֹזָאוּרִים הָאַגָּדִיִּים שֶׁלִּי</button>');
    return '';
  }

  /* ---------- clicks: returns true when handled ---------- */
  function onClick(e, b, r, lot, back) {
    const A = App();
    if (mode) {
      if (e.target.closest('[data-fun-back]')) {
        if (mode.pz) mode.pz.destroy();
        mode = null;
        back();
        return true;
      }
      mode.click(e);
      return true;
    }
    const f = e.target.closest('[data-fun]');
    if (!f) return false;
    const occ = occupants(lot, r);
    const kind = f.dataset.fun;
    if (kind === 'lesson') lesson(r, occ);
    else if (kind === 'read') {
      A.closeModal();
      global.TownInside.close();
      A.showTab('read');
    } else if (kind === 'shop') shop(r, occ);
    else if (kind === 'collect') {
      const n = T().collect(lot, r.slot);
      const g = TD().GOODS[r.type];
      A.toast(n ? `🧺 אָסַפְתְּ ${n} ${g.e}` : 'עוֹד אֵין מָה לֶאֱסֹף 🐔');
      back();
    } else if (kind === 'meal') {
      meal(occ);
      back();
    } else if (kind === 'rescue') rescue(b, occ);
    else if (kind === 'facts') facts();
    else if (kind === 'legends') legends();
    return true;
  }

  const backRow = '<div class="row"><button class="btn ghost small" data-fun-back>➔ חֲזָרָה לַחֶדֶר</button></div>';

  /* School: one Lab puzzle per lesson. Same DNA as the lab, plus a heart for every student. */
  function lesson(r, occ) {
    const A = App();
    $('modal-card').innerHTML = `
      <h2>📝 שִׁעוּר!</h2>
      <div class="tf-faces">${faces(occ)}</div>
      <div id="tf-pz"></div>
      <div class="row"><button class="btn" data-fun-next hidden>📝 עוֹד שְׁאֵלָה</button></div>
      ${backRow}`;
    mode = {
      pz: global.Puzzles.mount($('tf-pz'), {
        kind: 'mix',
        onSolved: (p, wrong) => {
          const gain = wrong === 0 ? 5 : 3;
          A.state.solved++;
          A.addDna(gain);
          love(occ, 5);
          A.save();
          A.toast(`+${gain} 🧬 · ❤️ לַתַּלְמִידִים`);
          $('modal-card').querySelector('[data-fun-next]').hidden = false;
        },
      }),
      click(e) {
        if (!e.target.closest('[data-fun-next]')) return;
        e.target.closest('[data-fun-next]').hidden = true;
        mode.pz.next();
      },
    };
  }

  /* Shop till: the customer's item costs 3-20 ₪; she taps coins until they add up to exactly that. */
  function shop(r, occ) {
    const A = App();
    const items = TD().SHOP[r.type];
    const game = { item: null, price: 0, paid: [], done: false, msg: '' };
    const newCustomer = () => {
      game.item = pick(items);
      game.price = rnd(3, 20);
      game.paid = [];
      game.done = false;
      game.msg = '';
    };
    const say = () => A.speak(`${game.item[1]} ${COSTS[game.item[2] || 'm']} ${game.price} שְׁקָלִים`);
    const draw = () => {
      const sum = game.paid.reduce((a, c) => a + c, 0);
      $('modal-card').innerHTML = `
        <h2>🪙 הַקֻּפָּה</h2>
        <div class="tf-faces">${faces(occ)}</div>
        <div class="tf-item">${game.item[0]}</div>
        <p class="tr-line">${game.item[1]} ${COSTS[game.item[2] || 'm']} <b class="tf-price">${game.price} ₪</b> <button class="btn small" data-fun-say>🔊</button></p>
        <div class="tf-paid">${game.paid.length ? game.paid.map((c) => `<span class="tf-coin c${c}">${c}</span>`).join('') : '<small>שִׂימִי כָּאן מַטְבְּעוֹת</small>'}</div>
        <p class="tr-line">שַׂמְתְּ: <b>${sum}</b> ₪</p>
        <div class="tf-coins">${COINS.map((c) => `<button class="tf-coin c${c}" data-coin="${c}"${game.done ? ' disabled' : ''}>${c}</button>`).join('')}</div>
        <p class="tf-msg${game.done ? ' good' : ''}">${game.msg}</p>
        <div class="row">
          ${game.done ? '<button class="btn" data-fun-next>🛒 לָקוֹחַ הַבָּא</button>' : '<button class="btn ghost small" data-fun-reset>↩️ מֵחָדָשׁ</button>'}
        </div>
        ${backRow}`;
    };
    newCustomer();
    draw();
    say();
    mode = {
      click(e) {
        if (e.target.closest('[data-fun-say]')) return say();
        if (e.target.closest('[data-fun-next]')) {
          newCustomer();
          draw();
          return say();
        }
        if (e.target.closest('[data-fun-reset]')) {
          game.paid = [];
          game.msg = '';
          return draw();
        }
        const coin = e.target.closest('[data-coin]');
        if (!coin || game.done) return;
        game.paid.push(Number(coin.dataset.coin));
        const sum = game.paid.reduce((a, c) => a + c, 0);
        if (sum === game.price) {
          game.done = true;
          game.msg = `מְצֻיָּן! בְּדִיּוּק ${game.price} ₪ 🎉`;
          A.state.solved++;
          A.addDna(3);
          love(occ, 2);
          A.save();
          A.toast('+3 🧬');
        } else if (sum > game.price) {
          game.msg = `יוֹתֵר מִדַּי! ${sum} זֶה יוֹתֵר מִ-${game.price}. נַסִּי שׁוּב 💪`;
          game.paid = [];
        } else {
          game.msg = `חָסֵר עוֹד ${game.price - sum} ₪`;
        }
        draw();
      },
    };
  }

  /* Restaurant: every diner gets one farm item from the store room. */
  function meal(occ) {
    const A = App();
    let served = 0;
    occ.forEach((d) => {
      const g = T().takeFood();
      if (!g) return;
      const p = P().decay(d);
      p.food = Math.min(100, p.food + 30);
      p.love += 1;
      served++;
    });
    A.save();
    A.toast(served ? `😋 ${served === 1 ? 'דִּינוֹזָאוּר אֶחָד אָכַל' : `${served} דִּינוֹזָאוּרִים אָכְלוּ`} אֲרוּחַת חַוָּה!` : 'הַמַּחְסָן רֵיק. אוֹסְפִים בַּחַוָּה 🧺');
  }

  /* Fire station: tap the ladder, then the animal. Once an hour per station. */
  function rescue(b, occ) {
    const A = App();
    const sc = pick(SCENES);
    let step = 0;
    const msgs = [`${sc.text} לוֹחֲצִים עַל הַסֻּלָּם 🪜`, `עַכְשָׁיו לוֹחֲצִים עַל ${sc.who}`, 'הוּא נִצַּל! תּוֹדָה, כַּבָּאִים! 💖'];
    const draw = () => {
      $('modal-card').innerHTML = `
        <h2>🚨 הַצָּלָה!</h2>
        <p class="tr-line">${msgs[step]}</p>
        <div class="tf-scene s${step}">
          <span class="tf-place">${sc.place}</span>
          <button class="tf-who" data-who>${sc.who}</button>
          <button class="tf-ladder" data-ladder>🪜</button>
          <span class="tf-ff">${occ[0] ? App().dinoHtml(occ[0]) : ''}</span>
          ${step === 2 ? '<span class="tf-heart">💖</span>' : ''}
        </div>
        ${backRow}`;
    };
    draw();
    mode = {
      click(e) {
        if (step === 0 && e.target.closest('[data-ladder]')) step = 1;
        else if (step === 1 && e.target.closest('[data-who]')) {
          step = 2;
          b.lastRescue = Date.now();
          love(occ, 5);
          A.save();
          A.toast('❤️ לַכַּבָּאִים');
        } else return;
        draw();
      },
    };
  }

  /* Museum: a fact card for every species she owns. */
  function facts() {
    const A = App();
    const seen = new Set();
    const rows = A.state.dinos.filter((d) => !seen.has(d.species) && seen.add(d.species)).map((d) => {
      const sp = global.Renderer.SPECIES[d.species];
      return `<div class="tf-fact"><span class="tf-face">${A.dinoHtml(d)}</span><div><b>${sp.short}</b><p>${TD().FACTS[d.species] || ''}</p></div><button class="btn small" data-fact="${d.species}">🔊</button></div>`;
    }).join('');
    $('modal-card').innerHTML = `<h2>📜 עֻבְדּוֹת עַל דִּינוֹזָאוּרִים</h2><div class="tf-facts">${rows}</div>${backRow}`;
    mode = {
      click(e) {
        const f = e.target.closest('[data-fact]');
        if (f) A.speak(`${global.Renderer.SPECIES[f.dataset.fact].short}. ${TD().FACTS[f.dataset.fact]}`);
      },
    };
  }

  function legends() {
    const A = App();
    const list = A.state.dinos.filter((d) => d.legendary);
    $('modal-card').innerHTML = `
      <h2>🏆 הָאַגָּדִיִּים שֶׁלִּי</h2>
      ${list.length
        ? `<div class="tp-grid">${list.map((d) => `<div class="tp-card"><span class="tr-face">${A.dinoHtml(d)}</span><b>${esc(A.dinoName(d))}</b></div>`).join('')}</div>`
        : '<p class="tr-line">עוֹד אֵין לָךְ דִּינוֹזָאוּר אַגָּדִי. מְסַיְּמִים סִפּוּר כְּדֵי לְקַבֵּל! 📖</p>'}
      ${backRow}`;
    mode = { click() {} };
  }

  global.TownFun = { cardHtml, onClick, reset: () => { if (mode && mode.pz) mode.pz.destroy(); mode = null; } };
})(window);
