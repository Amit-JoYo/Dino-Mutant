/* Wordlings: a wild creature appears and asks for something in English. She listens, taps the right picture (or the Hebrew word),
   and after three right answers the creature joins her collection. Words come back until she knows them; creatures level up and evolve. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const { ZONES, byId } = global.Words;
  const C = global.Creatures;
  const S = global.Sound;

  const KEY = 'wordlings-v1';
  const NEED = 3; // right answers to win an encounter
  const XP_PER_LEVEL = 8;

  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- saved progress ---------- */
  let state = { coins: 0, mons: {}, words: {}, muted: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === 'object') state = Object.assign(state, saved);
  } catch (e) { /* first run */ }
  S.setMuted(state.muted);
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

  const wordState = (id) => state.words[id] || (state.words[id] = { box: 0, right: 0, wrong: 0 });
  const levelOf = (xp) => 1 + Math.floor(xp / XP_PER_LEVEL);
  const stageOf = (xp) => (levelOf(xp) >= 6 ? 3 : levelOf(xp) >= 3 ? 2 : 1);
  const caughtCount = () => Object.keys(state.mons).length;
  const known = (zone) => zone.words.filter((w) => (state.words[w.id] ? state.words[w.id].box : 0) >= 3).length;

  /* ---------- screens ---------- */
  let screen = 'map';
  function show(name) {
    screen = name;
    ['map', 'book', 'words', 'play'].forEach((s) => ($(`screen-${s}`).hidden = s !== name));
    $('tabbar').hidden = name === 'play';
    document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
    if (name !== 'play') S.stop();
    if (name === 'map') global.World.enter();
    else global.World.leave();
    if (name === 'book') renderBook();
    if (name === 'words') renderWords();
    $('hud-coins').textContent = state.coins;
    $('hud-mons').textContent = `${caughtCount()}/${C.SPECIES.length}`;
  }

  function face(w) {
    if (w.colour) return `<span class="face-swatch" style="background:${w.colour}"></span>`;
    if (w.num) return `<span class="face-num"><b>${w.num}</b><i>${'●'.repeat(w.num)}</i></span>`;
    return `<span class="face-pic">${w.pic}</span>`;
  }

  /* ---------- encounter ---------- */
  let enc = null;

  function pickWild(zone) {
    const pool = [];
    zone.species.forEach((id) => {
      const copies = state.mons[id] ? 1 : 3;
      for (let i = 0; i < copies; i++) pool.push(id);
    });
    return pool[rnd(pool.length)];
  }

  function startEncounter(zoneId) {
    const zone = ZONES.find((z) => z.id === zoneId);
    enc = { id: Date.now(), zone, mon: pickWild(zone), hearts: 0, correct: 0, recent: [], retry: [], q: null, missed: false, busy: false };
    show('play');
    $('scene').style.setProperty('--sky-a', zone.sky[0]);
    $('scene').style.setProperty('--sky-b', zone.sky[1]);
    $('scene').style.setProperty('--ground', zone.ground);
    $('zone-title').textContent = zone.name;
    $('result').hidden = true;
    $('ball').hidden = true;
    $('wild').className = 'wild enter';
    $('wild').innerHTML = C.draw(enc.mon, { stage: 1 });
    renderHearts();
    $('cards').innerHTML = '';
    $('bubble-text').textContent = '…';
    setTimeout(() => enc && nextQuestion(), 700);
  }

  function renderHearts() {
    $('hearts').innerHTML = Array.from({ length: NEED }, (_, i) => `<span class="${i < enc.hearts ? 'full' : ''}">${i < enc.hearts ? '💖' : '🤍'}</span>`).join('');
  }

  function pickWord() {
    const zone = enc.zone;
    if (enc.retry.length && enc.recent.length >= 1 && enc.recent[0] !== enc.retry[0].id) return enc.retry.shift();
    const pool = zone.words.filter((w) => !enc.recent.slice(0, 3).includes(w.id));
    const weighted = [];
    pool.forEach((w) => {
      const copies = 6 - Math.min(5, wordState(w.id).box);
      for (let i = 0; i < copies; i++) weighted.push(w);
    });
    return weighted[rnd(weighted.length)];
  }

  function nextQuestion() {
    if (!enc) return;
    const w = pickWord();
    const type = wordState(w.id).box >= 2 && Math.random() < 0.5 ? 'he' : 'pic';
    const same = enc.zone.words.filter((x) => x.id !== w.id && x.kind === w.kind);
    const others = shuffle(same.length >= 2 ? same : enc.zone.words.filter((x) => x.id !== w.id)).slice(0, 2);
    enc.q = { w, type, options: shuffle([w].concat(others)), spoken: type === 'pic' ? enc.zone.prompt(w) : w.w };
    enc.missed = false;
    enc.busy = false;
    enc.recent.unshift(w.id);
    $('cards').innerHTML = enc.q.options
      .map((o) => `<button class="card" data-id="${esc(o.id)}">${type === 'pic' ? face(o) : `<span class="face-he">${esc(o.he)}</span>`}</button>`)
      .join('');
    $('bubble-text').textContent = type === 'pic' ? enc.q.spoken : '🇮🇱 ?';
    $('wild').classList.remove('happy', 'sad');
    S.say(enc.q.spoken);
  }

  function setMood(mood) {
    const el = $('wild');
    el.classList.remove('happy', 'sad', 'hop');
    void el.offsetWidth;
    el.innerHTML = C.draw(enc.mon, { stage: 1, mood });
    el.classList.add(mood === 'happy' ? 'hop' : 'sad');
  }

  async function onAnswer(btn) {
    if (!enc || enc.busy || !enc.q) return;
    const myEnc = enc.id;
    const q = enc.q;
    const ws = wordState(q.w.id);
    if (btn.dataset.id === q.w.id) {
      enc.busy = true;
      S.sfx.ok();
      btn.classList.add('correct');
      document.querySelectorAll('#cards .card').forEach((b) => (b.disabled = true));
      $('bubble-text').textContent = `${q.w.w} = ${q.w.he}`;
      setMood('happy');
      if (!enc.missed) {
        ws.right++;
        ws.box = Math.min(4, ws.box + 1);
        enc.hearts++;
        enc.correct++;
        state.coins++;
        renderHearts();
      }
      save();
      $('hud-coins').textContent = state.coins;
      setTimeout(() => enc && enc.id === myEnc && S.say(q.w.w), 350);
      await wait(2100);
      if (!enc || enc.id !== myEnc) return;
      if (enc.hearts >= NEED) catchIt();
      else nextQuestion();
    } else {
      S.sfx.bad();
      btn.classList.add('wrong');
      btn.disabled = true;
      if (!enc.missed) {
        enc.missed = true;
        ws.wrong++;
        ws.box = Math.max(0, ws.box - 1);
        enc.retry.push(q.w);
        save();
      }
      setMood('sad');
      const target = [...document.querySelectorAll('#cards .card')].find((b) => b.dataset.id === q.w.id);
      setTimeout(() => target && target.classList.add('hint'), 900);
      // She hears what she tapped, then the word she was asked for.
      const said = byId[btn.dataset.id];
      S.say(`${said.w}`);
      setTimeout(() => enc && enc.id === myEnc && S.say(q.spoken), 2600);
    }
  }

  async function catchIt() {
    const myEnc = enc.id;
    const alive = () => enc && enc.id === myEnc;
    enc.busy = true;
    $('cards').innerHTML = '';
    $('bubble-text').textContent = '🎯';
    const ball = $('ball');
    const wild = $('wild');
    ball.hidden = false;
    ball.className = 'ball throw';
    S.sfx.throw();
    await wait(700);
    if (!alive()) return;
    wild.classList.add('captured');
    ball.className = 'ball wobble';
    for (let i = 0; i < 3; i++) {
      S.sfx.wobble();
      await wait(650);
      if (!alive()) return;
    }
    const id = enc.mon;
    const before = state.mons[id];
    const oldStage = before ? stageOf(before.xp) : 0;
    const oldLevel = before ? levelOf(before.xp) : 0;
    const rec = before || (state.mons[id] = { xp: 0, n: 0 });
    if (!state.buddy) state.buddy = id;
    rec.n++;
    rec.xp += enc.correct + (before ? 2 : 0);
    const coins = before ? 3 : 8;
    state.coins += coins;
    save();
    ball.className = 'ball pop';
    S.sfx.caught();
    await wait(600);
    if (!alive()) return;
    ball.hidden = true;
    wild.classList.remove('captured');
    const stage = stageOf(rec.xp);
    const level = levelOf(rec.xp);
    wild.className = 'wild hop';
    wild.innerHTML = C.draw(id, { stage, mood: 'happy' });
    const sp = C.BY_ID[id];
    const title = !before ? `You caught ${sp.name}!` : stage > oldStage ? `${sp.name} evolved!` : level > oldLevel ? `${sp.name} is level ${level}!` : `${sp.name} is happy!`;
    if (stage > oldStage && before) S.sfx.level();
    const lines = [
      !before ? `🎉 תָּפַסְתְּ אֶת ${sp.name}! חָדָשׁ בָּאוֹסֶף` : stage > oldStage ? `✨ ${sp.name} הִתְפַּתֵּחַ!` : level > oldLevel ? `⬆️ ${sp.name} עָלָה לְרָמָה ${level}!` : `💖 ${sp.name} שָׂמֵחַ!`,
      `+${coins} ⭐`,
    ];
    const r = $('result');
    r.innerHTML = `<h2 dir="ltr">${esc(title)}</h2>${lines.map((l) => `<p>${l}</p>`).join('')}
      <div class="row"><button class="btn big" id="btn-home">🚶 מַמְשִׁיכִים לָלֶכֶת</button></div>`;
    r.hidden = false;
    S.sayAll([
      { text: sp.name, lang: 'en' },
      { text: !before ? 'תָּפַסְתְּ יְצוּר חָדָשׁ!' : stage > oldStage ? 'הוּא הִתְפַּתֵּחַ!' : level > oldLevel ? `הוּא עָלָה לְרָמָה ${level}!` : 'הוּא שָׂמֵחַ!', lang: 'he' },
    ]);
    $('hud-coins').textContent = state.coins;
  }

  function leaveEncounter() {
    enc = null;
    show('map');
  }

  /* ---------- book ---------- */
  function renderBook() {
    $('book-grid').innerHTML = C.SPECIES.map((sp) => {
      const rec = state.mons[sp.id];
      return rec
        ? `<button class="mon" data-mon="${sp.id}">${C.draw(sp.id, { stage: stageOf(rec.xp) })}<b dir="ltr">${sp.name}</b><small>רָמָה ${levelOf(rec.xp)}</small></button>`
        : `<div class="mon unknown">${C.silhouette(sp.id)}<b>?</b></div>`;
    }).join('');
  }

  function openMon(id) {
    const sp = C.BY_ID[id];
    const rec = state.mons[id];
    const lvl = levelOf(rec.xp);
    const into = rec.xp % XP_PER_LEVEL;
    const stage = stageOf(rec.xp);
    const next = stage === 1 ? 3 : stage === 2 ? 6 : 0;
    $('modal-card').innerHTML = `<div class="mon-big">${C.draw(id, { stage, mood: 'happy' })}</div>
      <h2 dir="ltr">${sp.name} ${sp.element}</h2>
      <p>רָמָה ${lvl}${next ? ` · הִתְפַּתְּחוּת בְּרָמָה ${next}` : ' · מְפֻתָּח לַגַּמְרֵי ✨'}</p>
      <div class="meter big"><i style="width:${Math.round((into / XP_PER_LEVEL) * 100)}%"></i></div>
      <p class="muted">נִתְפַּס ${rec.n} ${rec.n === 1 ? 'פַּעַם' : 'פְּעָמִים'}</p>
      <button class="btn alt" id="btn-say-name">🔊 ${esc(sp.name)}</button>
      <button class="btn ghost" id="btn-buddy">${state.buddy === id ? '🚶 הוּא הוֹלֵךְ אִתִּי' : '🚶 שֶׁיֵּלֵךְ אִתִּי'}</button>
      <button class="btn big" data-close>סְגִירָה</button>`;
    $('modal').hidden = false;
    $('btn-say-name').onclick = () => S.say(sp.name);
    $('btn-buddy').onclick = () => {
      state.buddy = id;
      save();
      $('btn-buddy').textContent = '🚶 הוּא הוֹלֵךְ אִתִּי';
    };
  }

  /* ---------- words ---------- */
  function stars(box) {
    const n = box >= 4 ? 3 : box >= 2 ? 2 : box >= 1 ? 1 : 0;
    return '⭐'.repeat(n) + '☆'.repeat(3 - n);
  }

  function renderWords() {
    $('words-list').innerHTML = ZONES.map((z) => `<section class="wzone"><h3><span>${z.emoji}</span> <b dir="ltr">${z.name}</b> <small>${known(z)}/${z.words.length}</small></h3>
      <div class="wgrid">${z.words.map((w) => `<button class="wcell" data-w="${esc(w.id)}">${face(w)}<b dir="ltr">${esc(w.w)}</b><small>${stars(wordState(w.id).box)}</small></button>`).join('')}</div></section>`).join('');
    $('btn-mute').textContent = state.muted ? '🔇 הַקּוֹל כָּבוּי' : '🔊 הַקּוֹל פָּעִיל';
    $('voice-note').textContent = S.hasHebrew() ? '✅ יֵשׁ קוֹל עִבְרִי בַּמַּכְשִׁיר' : '⚠️ הַדַּפְדְּפָן לֹא מוֹצֵא קוֹל עִבְרִי, אִם לֹא שׁוֹמְעִים עִבְרִית אֶפְשָׁר לְהַתְקִין אוֹתוֹ בְּהַגְדָּרוֹת הַדִּבּוּר (טֶקְסְט לְדִבּוּר) שֶׁל הַמַּכְשִׁיר.';
  }

  function openWord(id) {
    const w = byId[id];
    S.say(w.w);
    $('word-tip').textContent = `${w.w} = ${w.he}`;
    $('word-tip').hidden = false;
  }

  /* ---------- wiring ---------- */
  function init() {
    S.warmUp();
    document.querySelectorAll('#tabbar button').forEach((b) => b.addEventListener('click', () => { S.sfx.tap(); show(b.dataset.tab); }));
    $('cards').addEventListener('click', (e) => {
      const b = e.target.closest('.card');
      if (b) onAnswer(b);
    });
    $('btn-hear').addEventListener('click', () => enc && enc.q && S.say(enc.q.spoken));
    $('btn-leave').addEventListener('click', leaveEncounter);
    $('result').addEventListener('click', (e) => {
      if (e.target.closest('#btn-home')) leaveEncounter();
    });
    $('book-grid').addEventListener('click', (e) => {
      const m = e.target.closest('[data-mon]');
      if (m) openMon(m.dataset.mon);
    });
    $('words-list').addEventListener('click', (e) => {
      const w = e.target.closest('[data-w]');
      if (w) openWord(w.dataset.w);
    });
    $('modal').addEventListener('click', (e) => {
      if (e.target.closest('[data-close]') || e.target === $('modal')) $('modal').hidden = true;
    });
    $('btn-mute').addEventListener('click', () => {
      state.muted = !state.muted;
      S.setMuted(state.muted);
      save();
      renderWords();
    });
    $('btn-reset').addEventListener('click', () => {
      if (confirm('לִמְחֹק אֶת כָּל הַהִתְקַדְּמוּת?')) {
        state = { coins: 0, mons: {}, words: {}, muted: state.muted };
        save();
        global.World.reset();
        show('map');
      }
    });
    show('map');
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  /* what the walking world needs from the game */
  global.Game = {
    startEncounter,
    caught: caughtCount,
    state: () => state,
    save,
    known: (zoneId) => known(ZONES.find((z) => z.id === zoneId)),
    buddy: () => (state.buddy && state.mons[state.buddy] ? { id: state.buddy, stage: stageOf(state.mons[state.buddy].xp) } : null),
  };

  document.addEventListener('DOMContentLoaded', init);
})(window);
