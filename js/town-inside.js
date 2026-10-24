/* Dino Town: inside a building (Fallout Shelter style). Floors of rooms; build new rooms, upgrade them, add floors. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const TD = () => global.TownData;
  const App = () => global.App;
  const noEmoji = (s) => String(s).replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').trim();
  const OPEN_AIR = { park: { wall: '#a5e08a', roof: '#6cbf55' }, pool: { wall: '#bfeaff', roof: '#4fb3e8' } };

  const st = { lot: -1, fresh: -1, pick: '' };

  const building = () => global.Town.buildingAt(st.lot);
  const roomAt = (b, slot) => b.rooms.find((r) => r.slot === slot) || null;

  function spend(cost) {
    const A = App();
    if (A.state.dna < cost) {
      A.toast(`צָרִיךְ עוֹד ${cost - A.state.dna} דנ״א. קִרְאִי סִפּוּר אוֹ פִּתְרִי חִידוֹת! 📖🧩`);
      return false;
    }
    A.state.dna -= cost;
    A.refreshHud();
    return true;
  }

  function addStar() {
    global.Town.state().stars += 1;
  }

  function roomHtml(r, extra) {
    const def = TD().ROOMS[r.type];
    const act = TD().ACTS[def.act];
    const items = def.stuff.slice(0, r.lvl + 1).map((e, i) => `<i class="it${i}">${e}</i>`).join('');
    return `<span class="ti-plaque">${def.name}</span><span class="ti-stuff">${items}</span><span class="ti-act">${act.e}</span><span class="ti-lvl">${'⭐'.repeat(r.lvl)}</span>${extra || ''}`;
  }

  function colors(b) {
    const info = TD().BY_ID[b.type];
    return OPEN_AIR[b.type] || { wall: info.look.wall, roof: info.look.roof };
  }

  function render() {
    const b = building();
    if (!b) return close();
    const info = TD().BY_ID[b.type];
    const c = colors(b);
    const openAir = !!OPEN_AIR[b.type];
    let floors = '';
    for (let f = b.floors - 1; f >= 0; f--) {
      const cells = [f * 2, f * 2 + 1].map((slot) => {
        const r = roomAt(b, slot);
        const fresh = slot === st.fresh ? ' fresh' : '';
        if (!r) return `<button class="ti-empty${fresh}" data-slot="${slot}"><b>+</b><small>חֶדֶר חָדָשׁ</small></button>`;
        const act = TD().ACTS[TD().ROOMS[r.type].act];
        return `<button class="ti-room lvl${r.lvl}${fresh}" data-slot="${slot}" style="--rw:${act.wall}">${roomHtml(r)}</button>`;
      }).join('');
      floors += `<div class="ti-floor">${cells}</div>`;
    }
    const more = b.floors < TD().MAX_FLOORS
      ? `<button class="btn small gold ti-addfloor" data-floor>➕ ${openAir ? 'עוֹד אֵזוֹר' : 'קוֹמָה חֲדָשָׁה'} · 🧬 ${TD().FLOOR_COST[b.floors]}</button>`
      : '';
    $('town-in').innerHTML = `
      <div class="ti-head">
        <button class="ti-btn" data-x aria-label="סְגִירָה">✖</button>
        <h2>${info.look.sign} ${info.name}</h2>
        <button class="ti-btn" data-say aria-label="הַקְרֵא לִי">🔊</button>
        <span class="ti-dna">🧬 <b>${App().state.dna}</b></span>
      </div>
      <div class="ti-body" id="ti-body">
        <div class="ti-bld" style="--wall:${c.wall};--roof:${c.roof}">
          ${more}
          <div class="ti-roof"><span>${info.look.sign}</span></div>
          ${floors}
          <div class="ti-ground"><span>🚪</span></div>
        </div>
        <p class="ti-tip">לוֹחֲצִים עַל ➕ כְּדֵי לִבְנוֹת חֶדֶר, וְעַל חֶדֶר כְּדֵי לְשַׁדְרֵג אוֹתוֹ ⭐</p>
      </div>`;
    st.fresh = -1;
  }

  function open(lot) {
    let el = $('town-in');
    if (!el) {
      el = document.createElement('div');
      el.id = 'town-in';
      el.className = 'ti';
      document.body.appendChild(el);
      el.addEventListener('click', onClick);
    }
    st.lot = lot;
    st.fresh = -1;
    el.hidden = false;
    document.body.classList.add('ti-open');
    render();
  }

  function close() {
    const el = $('town-in');
    if (el) el.hidden = true;
    document.body.classList.remove('ti-open');
    st.lot = -1;
  }

  function onClick(e) {
    const A = App();
    if (e.target.closest('[data-x]')) return close();
    const b = building();
    if (!b) return;
    const info = TD().BY_ID[b.type];
    if (e.target.closest('[data-say]')) return A.speak(`${noEmoji(info.name)}. ${noEmoji(info.desc)}`);
    if (e.target.closest('[data-floor]')) return addFloor(b);
    const cell = e.target.closest('[data-slot]');
    if (!cell) return;
    const slot = Number(cell.dataset.slot);
    if (roomAt(b, slot)) openRoom(b, slot);
    else openPicker(b, slot);
  }

  function addFloor(b) {
    const A = App();
    if (b.rooms.length < b.floors * 2) return A.toast('קֹדֶם מְמַלְּאִים אֶת כָּל הַחֲדָרִים 🙂');
    if (!spend(TD().FLOOR_COST[b.floors])) return;
    b.floors += 1;
    addStar();
    A.save();
    st.fresh = (b.floors - 1) * 2;
    render();
    $('ti-body').scrollTop = 0;
    A.toast('🏗️ יֵשׁ קוֹמָה חֲדָשָׁה!');
  }

  /* ---------- new room picker ---------- */
  function openPicker(b, slot) {
    const A = App();
    const list = TD().ROOMS_OF[b.type];
    st.pick = list.find((id) => !b.rooms.some((r) => r.type === id)) || list[0];
    const draw = () => {
      const def = TD().ROOMS[st.pick];
      const cards = list.map((id) => {
        const d = TD().ROOMS[id];
        const act = TD().ACTS[d.act];
        const have = b.rooms.filter((r) => r.type === id).length;
        return `<button class="tr-card${id === st.pick ? ' on' : ''}${A.state.dna < d.cost ? ' poor' : ''}" data-room="${id}" style="--rw:${act.wall}">
          <span class="tr-e">${d.e}</span><b>${d.name}</b><small>${act.e} ${act.name}</small><em>🧬 ${d.cost}</em>${have ? '<i class="tc-have">✔</i>' : ''}</button>`;
      }).join('');
      $('modal-card').innerHTML = `
        <h2>🔨 אֵיזֶה חֶדֶר לִבְנוֹת?</h2>
        <div class="tc-dna">🧬 <b>${A.state.dna}</b></div>
        <div class="tr-grid">${cards}</div>
        <div class="row">
          <button class="btn small" data-say>🔊</button>
          <button class="btn gold" data-build>לִבְנוֹת ${def.name} · 🧬 ${def.cost}</button>
        </div>
        <div class="row"><button class="btn ghost small" data-close>בִּטּוּל</button></div>`;
    };
    A.openModal('', () => { $('modal-card').onclick = null; });
    draw();
    $('modal-card').onclick = (e) => {
      const card = e.target.closest('[data-room]');
      if (card) {
        st.pick = card.dataset.room;
        A.speak(noEmoji(TD().ROOMS[st.pick].name));
        return draw();
      }
      if (e.target.closest('[data-say]')) return A.speak(noEmoji(TD().ROOMS[st.pick].name));
      if (!e.target.closest('[data-build]')) return;
      const def = TD().ROOMS[st.pick];
      if (roomAt(b, slot) || !spend(def.cost)) return;
      b.rooms.push({ slot, type: st.pick, lvl: 1 });
      addStar();
      A.save();
      A.closeModal();
      st.fresh = slot;
      render();
      A.toast('🎉 הַחֶדֶר מוּכָן!');
    };
  }

  /* ---------- one room: read its sign, see what it is for, upgrade it ---------- */
  function openRoom(b, slot) {
    const A = App();
    const draw = () => {
      const r = roomAt(b, slot);
      const def = TD().ROOMS[r.type];
      const act = TD().ACTS[def.act];
      const up = TD().upgradeCost(r.type, r.lvl);
      const room = `<div class="ti-room big lvl${r.lvl}" style="--rw:${act.wall}">${roomHtml(r)}</div>`;
      $('modal-card').innerHTML = `
        <h2>${def.e} ${def.name}</h2>
        ${room}
        <p class="tr-line">מָה עוֹשִׂים כָּאן? <b>${act.e} ${act.name}</b></p>
        <p class="tr-line">${'⭐'.repeat(r.lvl)}${'☆'.repeat(3 - r.lvl)} · ${r.lvl === 1 ? 'מָקוֹם לְדִינוֹזָאוּר אֶחָד' : `מָקוֹם לְ-${r.lvl} דִּינוֹזָאוּרִים`}</p>
        <p class="muted tr-soon">בְּקָרוֹב אֶפְשָׁר יִהְיֶה לְהַכְנִיס לְכָאן דִּינוֹזָאוּרִים! 🦖</p>
        <div class="row">
          <button class="btn small" data-say>🔊 הַקְרֵא לִי</button>
          ${r.lvl < 3 ? `<button class="btn gold" data-up>⬆️ לְשַׁדְרֵג · 🧬 ${up}</button>` : '<span class="tr-done">הַחֶדֶר מֻשְׁלָם! 🌟</span>'}
        </div>
        <div class="row"><button class="btn ghost small" data-close>סְגִירָה</button></div>`;
    };
    A.openModal('', () => { $('modal-card').onclick = null; });
    draw();
    $('modal-card').onclick = (e) => {
      const r = roomAt(b, slot);
      const def = TD().ROOMS[r.type];
      if (e.target.closest('[data-say]')) return A.speak(`${noEmoji(def.name)}. ${noEmoji(TD().ACTS[def.act].name)}`);
      if (!e.target.closest('[data-up]') || r.lvl >= 3) return;
      if (!spend(TD().upgradeCost(r.type, r.lvl))) return;
      r.lvl += 1;
      addStar();
      A.save();
      st.fresh = slot;
      render();
      draw();
      A.toast('✨ הַחֶדֶר שֻׁדְרַג!');
    };
  }

  global.TownInside = { open, close, isOpen: () => st.lot >= 0 };
})(window);
