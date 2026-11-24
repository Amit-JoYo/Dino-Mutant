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
    ['map', 'book', 'words', 'quests', 'play'].forEach((s) => ($(`screen-${s}`).hidden = s !== name));
    $('tabbar').hidden = name === 'play';
    document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
    if (name !== 'play') S.stop();
    if (name === 'map') global.World.enter();
    else global.World.leave();
    if (name === 'book') renderBook();
    if (name === 'words') renderWords();
    if (name === 'quests') global.Quests.renderBoard($('quests-list'));
    refreshHud();
  }

  function refreshHud() {
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

  /* the play screen is shared by wild encounters and trainer duels; a duel puts her fighter in front and a bar over each creature */
  function resetScene() {
    $('scene').classList.remove('battle');
    $('mine').hidden = true;
    $('hp-opp').hidden = true;
    $('hp-me').hidden = true;
    $('hearts').hidden = false;
  }

  function startEncounter(zoneId) {
    const zone = ZONES.find((z) => z.id === zoneId);
    enc = { id: Date.now(), zone, mon: pickWild(zone), hearts: 0, correct: 0, recent: [], retry: [], q: null, missed: false, busy: false, tpl: shuffle(zone.prompts.map((_, i) => i)), qn: 0 };
    show('play');
    resetScene();
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

  const pick = (a) => a[rnd(a.length)];

  /* wrong answers: like the right one, so she has to listen to all of it. Upstairs words carry tags (colour, shape): one wrong
     answer shares the first tag and one shares the second. Otherwise they are other words of the same kind. */
  function distractors(zone, w) {
    const same = zone.words.filter((x) => x.id !== w.id && x.kind === w.kind);
    const pool = same.length >= 2 ? same : zone.words.filter((x) => x.id !== w.id);
    if (!w.tags) return shuffle(pool).slice(0, 2);
    const out = [];
    w.tags.forEach((t, i) => {
      const hit = shuffle(pool.filter((x) => x.tags && x.tags[i] === t && !out.includes(x) && x.tags[1 - i] !== w.tags[1 - i]));
      if (hit[0]) out.push(hit[0]);
    });
    shuffle(pool).forEach((x) => { if (out.length < 2 && !out.includes(x)) out.push(x); });
    return out.slice(0, 2);
  }

  function nextQuestion() {
    if (!enc) return;
    const w = pickWord();
    // each of the three questions of a fight asks in a different way; the "hear it, pick the Hebrew" kind joins in once a word is known
    const type = wordState(w.id).box >= 2 && Math.random() < 0.4 ? 'he' : 'pic';
    const prompt = enc.zone.prompts[enc.tpl[enc.qn++ % enc.tpl.length]];
    const others = distractors(enc.zone, w);
    // upstairs words are asked as a little question ("What do we use to eat soup?") instead of by name
    const spoken = type === 'he' ? w.w : w.clue ? pick(w.clue) : prompt(w);
    enc.q = { w, type, options: shuffle([w].concat(others)), spoken };
    enc.missed = false;
    enc.busy = false;
    enc.recent.unshift(w.id);
    $('cards').innerHTML = enc.q.options
      .map((o) => `<button class="card" data-id="${esc(o.id)}">${type === 'pic' ? face(o) : `<span class="face-he">${esc(o.he)}</span>`}</button>`)
      .join('');
    $('bubble-text').textContent = type === 'pic' ? enc.q.spoken : '👂 ?';
    $('wild').classList.remove('happy', 'sad');
    S.say(enc.q.spoken);
  }

  function setMood(mood) {
    if (enc.battle) return;
    const el = $('wild');
    el.classList.remove('happy', 'sad', 'hop');
    void el.offsetWidth;
    el.innerHTML = C.draw(enc.mon, { stage: 1, mood });
    el.classList.add(mood === 'happy' ? 'hop' : 'sad');
  }

  /* ---------- trainer duels ---------- */
  const fighters = () => Object.keys(state.mons)
    .map((id) => ({ id, xp: state.mons[id].xp, stage: stageOf(state.mons[id].xp), level: levelOf(state.mons[id].xp), name: C.nameAt(id, stageOf(state.mons[id].xp)), fainted: !!state.mons[id].fainted }))
    .sort((a, b) => b.xp - a.xp);

  /** the nurse makes every tired friend better; returns who she healed */
  function healAll() {
    const healed = Object.keys(state.mons).filter((id) => state.mons[id].fainted);
    healed.forEach((id) => { state.mons[id].fainted = false; });
    save();
    return healed;
  }

  // a bigger form is tougher: more hearts, and every right answer hits harder
  const heartsFor = (stage) => 3 + stage * 2;

  function renderBars() {
    const b = enc.battle;
    const bar = (name, hp, max) => {
      const pct = Math.round((hp / max) * 100);
      return `<b dir="ltr">${esc(name)}</b><span class="hp"><i class="${pct > 50 ? '' : pct > 25 ? 'mid' : 'low'}" style="width:${pct}%"></i></span><small>${hp}/${max} ❤️</small>`;
    };
    $('hp-opp').innerHTML = bar(C.nameAt(enc.mon, b.oppStage), b.oppHp, b.oppMax);
    $('hp-me').innerHTML = bar(C.nameAt(b.me, b.myStage), b.myHp, b.myMax);
  }

  function flash(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function floatText(text, left, top) {
    const d = document.createElement('div');
    d.className = 'dmg';
    d.textContent = text;
    d.style.left = left;
    d.style.top = top;
    $('scene').appendChild(d);
    setTimeout(() => d.remove(), 950);
  }

  function startBattle(trainer, fighterId) {
    const zone = ZONES.find((z) => z.id === trainer.zone);
    const me = state.mons[fighterId] ? fighterId : state.buddy;
    const myStage = stageOf(state.mons[me].xp);
    enc = {
      id: Date.now(), zone, mon: trainer.mon, hearts: 0, correct: 0, recent: [], retry: [], q: null, missed: false, busy: false, tpl: shuffle(zone.prompts.map((_, i) => i)), qn: 0,
      battle: { trainer, me, myStage, oppStage: trainer.stage, myMax: heartsFor(myStage), myHp: heartsFor(myStage), oppMax: trainer.hp, oppHp: trainer.hp, dmg: myStage },
    };
    show('play');
    resetScene();
    $('scene').classList.add('battle');
    $('scene').style.setProperty('--sky-a', zone.sky[0]);
    $('scene').style.setProperty('--sky-b', zone.sky[1]);
    $('scene').style.setProperty('--ground', zone.ground);
    $('zone-title').textContent = `⚔️ ${trainer.name}`;
    $('result').hidden = true;
    $('ball').hidden = true;
    $('hearts').hidden = true;
    $('wild').className = 'wild enter';
    $('wild').innerHTML = C.draw(trainer.mon, { stage: trainer.stage });
    $('mine').hidden = false;
    $('mine').className = 'mine enter';
    $('mine').innerHTML = C.draw(me, { stage: myStage });
    $('hp-opp').hidden = false;
    $('hp-me').hidden = false;
    renderBars();
    $('cards').innerHTML = '';
    $('bubble-text').textContent = '⚔️';
    S.sayAll([{ text: `${trainer.name} wants to duel!`, lang: 'en' }]);
    setTimeout(() => enc && nextQuestion(), 1400);
  }

  async function onBattleAnswer(btn, q, ws, myEnc) {
    const b = enc.battle;
    const alive = () => enc && enc.id === myEnc;
    if (btn.dataset.id === q.w.id) {
      enc.busy = true;
      S.sfx.ok();
      btn.classList.add('correct');
      document.querySelectorAll('#cards .card').forEach((c) => (c.disabled = true));
      $('bubble-text').textContent = `${q.w.w} = ${q.w.he}`;
      if (!enc.missed) {
        ws.right++;
        ws.box = Math.min(4, ws.box + 1);
        enc.correct++;
        // her creature attacks
        flash($('mine'), 'lunge');
        await wait(260);
        if (!alive()) return;
        b.oppHp = Math.max(0, b.oppHp - b.dmg);
        flash($('wild'), 'hurt');
        floatText(`-${b.dmg}`, '68%', '70px');
        renderBars();
      }
      save();
      setTimeout(() => alive() && S.say(q.w.w), 350);
      await wait(1900);
      if (!alive()) return;
      if (b.oppHp <= 0) winBattle();
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
        // the other creature hits back
        b.myHp = Math.max(0, b.myHp - 1);
        flash($('mine'), 'hurt');
        floatText('-1', '26%', '170px');
        renderBars();
        save();
        if (b.myHp <= 0) {
          enc.busy = true;
          await wait(1300);
          if (alive()) loseBattle();
          return;
        }
      }
      const target = [...document.querySelectorAll('#cards .card')].find((c) => c.dataset.id === q.w.id);
      setTimeout(() => target && target.classList.add('hint'), 900);
      S.say(byId[btn.dataset.id].w);
      setTimeout(() => alive() && S.say(q.spoken), 2600);
    }
  }

  async function evolveAnim(el, id, from, to) {
    el.classList.add('evolving');
    el.innerHTML = C.draw(id, { stage: from });
    S.sfx.level();
    await wait(1500);
    el.classList.remove('evolving');
    el.innerHTML = C.draw(id, { stage: to, mood: 'happy' });
    flash(el, 'hop');
  }

  async function winBattle() {
    const myEnc = enc.id;
    const alive = () => enc && enc.id === myEnc;
    const b = enc.battle;
    const t = b.trainer;
    enc.busy = true;
    $('cards').innerHTML = '';
    $('wild').classList.add('faint');
    S.sfx.caught();
    await wait(1000);
    if (!alive()) return;
    const T = global.Trainers;
    const badgesBefore = T.badgeIds();
    const rec = state.trainers && state.trainers[t.id];
    const first = !(rec && rec.won);
    T.record(t.id, true);
    const coins = first ? t.reward : 2;
    state.coins += coins;
    const mine = state.mons[b.me];
    const oldStage = stageOf(mine.xp);
    const oldLevel = levelOf(mine.xp);
    mine.xp += first ? 5 : 2;
    const stage = stageOf(mine.xp);
    const level = levelOf(mine.xp);
    save();
    refreshHud();
    const badgesNow = T.badgeIds().filter((x) => !badgesBefore.includes(x));
    const nm = C.nameAt(b.me, stage);
    const oldNm = C.nameAt(b.me, oldStage);
    const lines = [
      `🏆 נִצַּחְתְּ אֶת ${t.he}!`,
      `+${coins} ⭐`,
      stage > oldStage ? `✨ ${oldNm} הִתְפַּתֵּחַ! עַכְשָׁיו קוֹרְאִים לוֹ ${nm}` : level > oldLevel ? `⬆️ ${nm} עָלָה לְרָמָה ${level}!` : `💪 ${nm} הִתְחַזֵּק!`,
    ];
    badgesNow.forEach((id) => lines.push(`🏅 ${T.BADGES.find((x) => x.id === id).emoji} תָּג חָדָשׁ: ${T.BADGES.find((x) => x.id === id).he}!`));
    if (badgesNow.length && T.champion()) lines.push('🏆✨ אַתְּ הָאַלּוּפָה שֶׁל הַכְּפָר!');
    $('result').innerHTML = `<h2 dir="ltr">You won!</h2>${lines.map((l) => `<p>${l}</p>`).join('')}
      <div class="row"><button class="btn big" id="btn-home">🚶 מַמְשִׁיכִים לָלֶכֶת</button></div>`;
    $('result').hidden = false;
    S.sayAll([{ text: t.lose[0], lang: 'en' }, { text: t.lose[1], lang: 'he' }]);
    if (stage > oldStage) {
      $('btn-home').disabled = true;
      await evolveAnim($('mine'), b.me, oldStage, stage);
      if (alive()) $('btn-home').disabled = false;
    }
  }

  function loseBattle() {
    const b = enc.battle;
    S.sfx.bad();
    global.Trainers.record(b.trainer.id, false);
    const mine = state.mons[b.me];
    mine.fainted = true;
    save();
    const nm = C.nameAt(b.me, b.myStage);
    $('mine').classList.add('faint');
    $('cards').innerHTML = '';
    const another = fighters().some((f) => !f.fainted);
    $('result').innerHTML = `<h2 dir="ltr">${esc(nm)} is too tired!</h2>
      <p>😵 ${esc(nm)} נִרְדַּם מֵעֵיפוּת. צָרִיךְ לָקַחַת אוֹתוֹ לְבֵית הַחוֹלִים 🏥</p>
      <p class="muted">${another ? 'אֶפְשָׁר לְנַסּוֹת שׁוּב עִם חָבֵר אַחֵר.' : 'כָּל הַחֲבֵרִים עֲיֵפִים. הַאָחוֹת תַּעֲזֹר לָהֶם!'}</p>
      <div class="row">${another ? '<button class="btn big" id="btn-again">🔁 עִם חָבֵר אַחֵר</button>' : ''}<button class="btn ${another ? 'ghost' : 'big'}" id="btn-home">🚶 לַמַּפָּה</button></div>`;
    $('result').hidden = false;
    S.sayAll([{ text: `${nm} is too tired. Let's go to the hospital!`, lang: 'en' }, { text: 'צָרִיךְ לָלֶכֶת לְבֵית הַחוֹלִים!', lang: 'he' }]);
  }

  async function onAnswer(btn) {
    if (!enc || enc.busy || !enc.q) return;
    const myEnc = enc.id;
    const q = enc.q;
    const ws = wordState(q.w.id);
    if (enc.battle) {
      onBattleAnswer(btn, q, ws, myEnc);
      return;
    }
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
    const sp = C.BY_ID[id];
    const evolved = before && stage > oldStage;
    if (evolved) {
      // she watches the old form glow white and turn into the new one
      wild.className = 'wild evolving';
      wild.innerHTML = C.draw(id, { stage: oldStage });
      S.sfx.level();
      await wait(1500);
      if (!alive()) return;
    }
    wild.className = 'wild hop';
    wild.innerHTML = C.draw(id, { stage, mood: 'happy' });
    const nm = C.nameAt(id, stage);
    const oldNm = C.nameAt(id, oldStage || 1);
    const title = !before ? `You caught ${nm}!` : evolved ? `${oldNm} evolved into ${nm}!` : level > oldLevel ? `${nm} is level ${level}!` : `${nm} is happy!`;
    const lines = [
      !before ? `🎉 תָּפַסְתְּ אֶת ${nm}! חָדָשׁ בָּאוֹסֶף` : evolved ? `✨ ${oldNm} הִתְפַּתֵּחַ! עַכְשָׁיו קוֹרְאִים לוֹ ${nm}` : level > oldLevel ? `⬆️ ${nm} עָלָה לְרָמָה ${level}!` : `💖 ${nm} שָׂמֵחַ!`,
      `+${coins} ⭐`,
    ];
    const r = $('result');
    r.innerHTML = `<h2 dir="ltr">${esc(title)}</h2>${lines.map((l) => `<p>${l}</p>`).join('')}
      <div class="row"><button class="btn big" id="btn-home">🚶 מַמְשִׁיכִים לָלֶכֶת</button></div>`;
    r.hidden = false;
    S.sayAll([
      { text: nm, lang: 'en' },
      { text: !before ? 'תָּפַסְתְּ יְצוּר חָדָשׁ!' : evolved ? 'הוּא הִתְפַּתֵּחַ וְהִשְׁתַּנָּה!' : level > oldLevel ? `הוּא עָלָה לְרָמָה ${level}!` : 'הוּא שָׂמֵחַ!', lang: 'he' },
    ]);
    refreshHud();
    global.Quests.event('catch', { zone: enc.zone.id, evolved: !!evolved });
  }

  function leaveEncounter() {
    enc = null;
    show('map');
  }

  /* ---------- book ---------- */
  function renderBook() {
    $('book-grid').innerHTML = C.SPECIES.map((sp) => {
      const rec = state.mons[sp.id];
      const stage = rec ? stageOf(rec.xp) : 1;
      return rec
        ? `<button class="mon${rec.fainted ? ' fainted' : ''}" data-mon="${sp.id}">${C.draw(sp.id, { stage })}<b dir="ltr">${C.nameAt(sp.id, stage)}</b><small>${rec.fainted ? '💤 עָיֵף' : `רָמָה ${levelOf(rec.xp)}`}</small></button>`
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
    const nm = C.nameAt(id, stage);
    // the three forms: the ones she has reached in colour, the ones still to come as shadows
    const chain = [1, 2, 3].map((s) => `<div class="evo-step${s > stage ? ' locked' : ''}${s === stage ? ' now' : ''}">${C.draw(id, { stage: s })}<small dir="ltr">${s > stage ? '???' : esc(C.nameAt(id, s))}</small></div>`).join('<span class="evo-arrow">›</span>');
    $('modal-card').innerHTML = `<div class="mon-big">${C.draw(id, { stage, mood: 'happy' })}</div>
      <h2 dir="ltr">${esc(nm)} ${sp.element}</h2>
      <p>רָמָה ${lvl}${next ? ` · הִתְפַּתְּחוּת בְּרָמָה ${next}` : ' · מְפֻתָּח לַגַּמְרֵי ✨'}</p>
      ${rec.fainted ? '<p class="tired">💤 הוּא עָיֵף. לְכִי אִתּוֹ לְבֵית הַחוֹלִים 🏥</p>' : ''}
      <div class="meter big"><i style="width:${Math.round((into / XP_PER_LEVEL) * 100)}%"></i></div>
      <div class="evo-chain" dir="ltr">${chain}</div>
      <p class="muted">נִתְפַּס ${rec.n} ${rec.n === 1 ? 'פַּעַם' : 'פְּעָמִים'}</p>
      <button class="btn alt" id="btn-say-name">🔊 ${esc(nm)}</button>
      <button class="btn ghost" id="btn-buddy">${state.buddy === id ? '🚶 הוּא הוֹלֵךְ אִתִּי' : '🚶 שֶׁיֵּלֵךְ אִתִּי'}</button>
      <button class="btn big" data-close>סְגִירָה</button>`;
    $('modal').hidden = false;
    $('btn-say-name').onclick = () => S.say(nm);
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
      else if (e.target.closest('#btn-again') && enc && enc.battle) global.Trainers.challenge(enc.battle.trainer.id);
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

  /* what the walking world and the quests need from the game */
  global.Game = {
    startEncounter,
    startBattle,
    fighters,
    caught: caughtCount,
    state: () => state,
    save,
    known: (zoneId) => known(ZONES.find((z) => z.id === zoneId)),
    buddy: () => (state.buddy && state.mons[state.buddy] ? { id: state.buddy, stage: stageOf(state.mons[state.buddy].xp), fainted: !!state.mons[state.buddy].fainted } : null),
    healAll,
    face,
    wordState,
    refreshHud,
    shuffle,
    addCoins: (n) => {
      state.coins += n;
      save();
      refreshHud();
    },
  };

  document.addEventListener('DOMContentLoaded', init);
})(window);
