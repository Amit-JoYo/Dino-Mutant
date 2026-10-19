/* Optional class sharing through Firebase (anonymous auth + Firestore). The SDK loads lazily, so the game works offline without it. */
(function (global) {
  'use strict';

  const SDK_VERSION = '10.12.2';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => global.Puzzles.escapeHtml(s);
  const MAX_SHOWCASE = 3;

  let db = null;
  let auth = null;
  let booting = null;
  let lastCheck = 0;

  const configured = () => !!global.FIREBASE_CONFIG;
  const cfg = () => global.App.state.cloud;
  const fail = (code) => Object.assign(new Error(code), { code });
  const stamp = () => global.firebase.firestore.FieldValue.serverTimestamp();

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('network'));
      document.head.appendChild(s);
    });
  }

  function boot() {
    if (!configured()) return Promise.reject(fail('not-configured'));
    if (!booting) {
      booting = (async () => {
        for (const n of ['app', 'auth', 'firestore']) {
          await loadScript(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-${n}-compat.js`);
        }
        if (!global.firebase.apps.length) global.firebase.initializeApp(global.FIREBASE_CONFIG);
        auth = global.firebase.auth();
        db = global.firebase.firestore();
        db.settings({ experimentalForceLongPolling: true });
        await auth.signInAnonymously();
      })().catch((e) => {
        booting = null;
        throw e;
      });
    }
    return booting;
  }

  // Letters (any language), nikud, spaces, apostrophe and hyphen only; at most 12 characters.
  function cleanName(s) {
    return String(s || '')
      .replace(/[^\p{L}\p{M}\s'’-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12);
  }

  function showcasePayload() {
    const ids = new Set(cfg().showcase);
    return global.App.state.dinos
      .filter((d) => ids.has(d.uid))
      .slice(0, MAX_SHOWCASE)
      .map((d) => ({
        species: d.species,
        tint: d.tint || 0,
        legendary: !!d.legendary,
        horns: d.horns || 0,
        outfit: Object.assign({}, d.outfit || {}),
        name: d.name ? String(d.name).slice(0, 14) : '',
      }));
  }

  const memberRef = (code) => db.doc(`classes/${code}/members/${auth.currentUser.uid}`);

  async function join(rawCode, rawName) {
    const code = String(rawCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const name = cleanName(rawName);
    if (code.length < 6) throw fail('code');
    if (name.length < 2) throw fail('name');
    await boot();
    const cls = await db.doc(`classes/${code}`).get();
    if (!cls.exists || !cls.data().active) throw fail('class');
    const c = cfg();
    if (!c.showcase.length) c.showcase = global.App.state.dinos.slice(0, MAX_SHOWCASE).map((d) => d.uid);
    const ref = memberRef(code);
    const mine = await ref.get();
    if (mine.exists) {
      await ref.update({ dinos: showcasePayload(), updatedAt: stamp() });
      c.name = mine.data().name;
      c.locked = !!mine.data().locked;
    } else {
      await ref.set({ name, locked: false, dinos: showcasePayload(), updatedAt: stamp() });
      c.name = name;
      c.locked = false;
    }
    c.code = code;
    c.className = String(cls.data().name || '');
    global.App.save();
  }

  /* Pushes the showcase and pulls back any rename or lock the owner applied. */
  async function sync() {
    const c = cfg();
    if (!c.on || !c.code || !configured()) return;
    await boot();
    const ref = memberRef(c.code);
    const snap = await ref.get();
    if (!snap.exists) {
      c.code = '';
      c.className = '';
      global.App.save();
      return;
    }
    c.name = snap.data().name;
    c.locked = !!snap.data().locked;
    await ref.update({ dinos: showcasePayload(), updatedAt: stamp() });
    global.App.save();
  }

  async function rename(rawName) {
    const c = cfg();
    const name = cleanName(rawName);
    if (name.length < 2) throw fail('name');
    await boot();
    await memberRef(c.code).update({ name, dinos: showcasePayload(), updatedAt: stamp() });
    c.name = name;
    global.App.save();
  }

  function clearLocal() {
    const c = cfg();
    c.code = '';
    c.className = '';
    c.name = '';
    c.locked = false;
    c.seen = 0;
    global.App.save();
  }

  /* Names of classmates by member id, filled whenever the member list is read. Never trusted from reaction/gift documents. */
  const nameCache = {};
  const REACTIONS = { wave: '👋', heart: '❤️', party: '🎉', star: '⭐' };
  const today = () => new Date().toISOString().slice(0, 10);

  async function purgeMine(c) {
    for (const sub of ['reactions', 'gifts']) {
      try {
        const snap = await db.collection(`classes/${c.code}/members/${auth.currentUser.uid}/${sub}`).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete()));
      } catch (e) { /* best effort */ }
    }
  }

  async function leave() {
    const c = cfg();
    if (c.code) {
      await boot();
      await purgeMine(c);
      await memberRef(c.code).delete();
    }
    clearLocal();
  }

  /* Removes the member record and the anonymous account itself. */
  async function deleteAll() {
    const c = cfg();
    if (!configured()) {
      clearLocal();
      c.on = false;
      global.App.save();
      return;
    }
    await boot();
    if (c.code) {
      await purgeMine(c);
      await memberRef(c.code).delete();
    }
    try {
      await auth.currentUser.delete();
    } catch (e) { /* the member record is already gone */ }
    clearLocal();
    c.on = false;
    c.showcase = [];
    global.App.save();
  }

  async function sendReaction(targetId, kind) {
    const c = cfg();
    if (!REACTIONS[kind] || !c.code) throw fail('reaction');
    await boot();
    await db.doc(`classes/${c.code}/members/${targetId}/reactions/${auth.currentUser.uid}`).set({ kind, at: stamp() });
  }

  async function sendGift(targetId, dino) {
    const c = cfg();
    if (!c.code) throw fail('gift');
    if (c.lastGiftDay === today()) throw fail('gift-limit');
    await boot();
    const tint = Number.isFinite(dino.tint) ? Math.abs(Math.floor(dino.tint)) % 20 : 0;
    await db.doc(`classes/${c.code}/members/${targetId}/gifts/${auth.currentUser.uid}`).set({ species: dino.species, tint, at: stamp() });
    c.lastGiftDay = today();
    global.App.save();
  }

  /* Reactions received since the last check, with the sender's current name. */
  async function incomingReactions() {
    const c = cfg();
    if (!inClass()) return [];
    await boot();
    const snap = await db.collection(`classes/${c.code}/members/${auth.currentUser.uid}/reactions`).get();
    const seen = c.seen || 0;
    let max = seen;
    const fresh = [];
    snap.docs.forEach((doc) => {
      const d = doc.data();
      const t = d.at && d.at.toMillis ? d.at.toMillis() : 0;
      max = Math.max(max, t);
      if (t > seen && REACTIONS[d.kind]) fresh.push({ from: doc.id, emoji: REACTIONS[d.kind] });
    });
    if (!fresh.length) return [];
    if (fresh.some((r) => !nameCache[r.from])) await classmates();
    c.seen = max;
    global.App.save();
    return fresh.map((r) => ({ emoji: r.emoji, name: nameCache[r.from] || '' }));
  }

  async function pendingGifts() {
    const c = cfg();
    if (!inClass()) return [];
    await boot();
    const snap = await db.collection(`classes/${c.code}/members/${auth.currentUser.uid}/gifts`).get();
    const species = global.Renderer.SPECIES;
    const list = snap.docs
      .map((doc) => ({ from: doc.id, species: doc.data().species, tint: doc.data().tint }))
      .filter((g) => species[g.species] && g.species !== 'trex');
    if (list.some((g) => !nameCache[g.from])) await classmates();
    return list.map((g) => ({
      from: g.from,
      species: g.species,
      tint: Number.isFinite(g.tint) ? Math.abs(Math.floor(g.tint)) % 20 : 0,
      name: nameCache[g.from] || '',
    }));
  }

  /* Deleting the gift document is what claims it, so a gift can be accepted only once. */
  async function claimGift(from) {
    const c = cfg();
    await boot();
    await db.doc(`classes/${c.code}/members/${auth.currentUser.uid}/gifts/${from}`).delete();
  }

  const canGiftToday = () => cfg().lastGiftDay !== today();

  /* Classmates' showcased dinos. Everything from the server is treated as untrusted and re-validated. */
  async function classmates() {
    const c = cfg();
    if (!c.on || !c.code || !configured()) return [];
    await boot();
    const snap = await db.collection(`classes/${c.code}/members`).get();
    const species = global.Renderer.SPECIES;
    const out = [];
    snap.docs.forEach((doc) => {
      if (doc.id === auth.currentUser.uid) return;
      const m = doc.data();
      const name = cleanName(m.name);
      if (!name) return;
      nameCache[doc.id] = name;
      const dinos = (Array.isArray(m.dinos) ? m.dinos : [])
        .slice(0, MAX_SHOWCASE)
        .filter((d) => d && species[d.species])
        .map((d) => {
          const outfit = {};
          if (d.outfit && typeof d.outfit === 'object') {
            Object.keys(d.outfit).forEach((k) => { if (typeof d.outfit[k] === 'string') outfit[k] = d.outfit[k]; });
          }
          return {
            species: d.species,
            tint: Number.isFinite(d.tint) ? Math.abs(Math.floor(d.tint)) % 20 : 0,
            legendary: d.legendary === true,
            horns: Number.isFinite(d.horns) ? Math.min(3, Math.max(0, Math.floor(d.horns))) : 0,
            outfit,
            name: cleanName(d.name),
          };
        });
      if (dinos.length) out.push({ id: doc.id, name, dinos });
    });
    return out;
  }

  const inClass = () => configured() && !!cfg().on && !!cfg().code;

  function autoSync() {
    const c = cfg();
    if (!c.on || !c.code) return;
    setTimeout(() => sync().catch(() => {}), 4000);
  }

  function errorText(e) {
    switch (e && (e.code || e.message)) {
      case 'code': return 'קוֹד הַכִּתָּה קָצָר מִדַּי';
      case 'name': return 'צָרִיךְ שֵׁם פְּרָטִי (2 עַד 12 אוֹתִיּוֹת)';
      case 'class': return 'הַכִּתָּה לֹא נִמְצֵאת אוֹ שֶׁהִיא לֹא פְּעִילָה';
      case 'not-configured': return 'הַשִּׁתּוּף בַּכִּתָּה עֲדַיִן לֹא פָּעִיל';
      case 'permission-denied': return 'אֵין הַרְשָׁאָה. אוּלַי הַשֵּׁם נָעוּל אוֹ שֶׁהַכִּתָּה כְּבָר לֹא פְּעִילָה';
      case 'gift-limit': return 'אֶפְשָׁר לִשְׁלֹחַ מַתָּנָה אַחַת בְּיוֹם. נִסּוּ מָחָר 🎁';
      default: {
        if (e) console.warn('cloud error', e);
        const code = e && (e.code || e.message);
        return `אֵין חִבּוּר לָאִינְטֶרְנֶט. נַסּוּ שׁוּב${code ? ` (${String(code).slice(0, 40)})` : ''}`;
      }
    }
  }

  /* ---- parent menu section ---- */
  function mountParent(el) {
    const App = global.App;
    const c = cfg();

    const run = async (fn, okMsg) => {
      try {
        await fn();
        if (okMsg) App.toast(okMsg);
      } catch (e) {
        App.toast(errorText(e));
      }
      mountParent(el);
    };

    if (!configured()) {
      el.innerHTML = '<p class="muted">הַשִּׁתּוּף בַּכִּתָּה עֲדַיִן לֹא פָּעִיל.</p>';
      return;
    }

    if (!c.on) {
      el.innerHTML = `
        <p class="muted">בְּשִׁתּוּף בַּכִּתָּה יוֹפִיעוּ לַחֲבֵרִים בַּכִּתָּה רַק: הַשֵּׁם הַפְּרָטִי וְעַד שְׁלוֹשָׁה דִּינוֹזָאוּרִים שֶׁנִּבְחַר לְהַצִּיג. אֵין צַ׳אט, אֵין תְּמוּנוֹת וְאֵין פְּרָטִים אִישִׁיִּים. אֶפְשָׁר לַעֲזֹב וְלִמְחֹק אֶת הַמֵּידָע בְּכׇל עֵת.</p>
        <label class="pc-check"><input type="checkbox" id="pc-agree"> קָרָאתִי וַאֲנִי מַסְכִּים/ה</label>
        <button class="btn" id="pc-on" disabled>הַפְעָלַת שִׁתּוּף בַּכִּתָּה</button>`;
      $('pc-agree').onchange = (e) => { $('pc-on').disabled = !e.target.checked; };
      $('pc-on').onclick = () => {
        c.on = true;
        App.save();
        mountParent(el);
      };
      return;
    }

    if (!c.code) {
      el.innerHTML = `
        <p class="muted">הַקּוֹד שֶׁל הַכִּתָּה מְפֻרְסָם בִּקְבוּצַת הַהוֹרִים.</p>
        <input id="pc-code" class="input" placeholder="קוֹד הַכִּתָּה" maxlength="12" autocomplete="off" dir="ltr">
        <input id="pc-name" class="input" placeholder="שֵׁם פְּרָטִי" maxlength="12" autocomplete="off">
        <div class="row"><button class="btn" id="pc-join">הַצְטָרְפוּת</button><button class="btn ghost" id="pc-off">כִּבּוּי</button></div>`;
      $('pc-join').onclick = () => run(() => join($('pc-code').value, $('pc-name').value), 'הִצְטָרַפְתֶּם לַכִּתָּה! 🎉');
      $('pc-off').onclick = () => {
        c.on = false;
        App.save();
        mountParent(el);
      };
      return;
    }

    const picks = App.state.dinos.map((d) =>
      `<label class="pc-check"><input type="checkbox" data-show="${d.uid}" ${c.showcase.includes(d.uid) ? 'checked' : ''}> ${esc(App.dinoName(d))}</label>`
    ).join('');
    el.innerHTML = `
      <p><b>🏫 ${esc(c.className || 'הַכִּתָּה')}</b></p>
      <input id="pc-name" class="input" maxlength="12" value="${esc(c.name)}" ${c.locked ? 'disabled' : ''}>
      ${c.locked ? '<p class="muted">🔒 הַשֵּׁם ננעל עַל־יְדֵי הַמַּנְהֵל.</p>' : '<button class="btn small alt" id="pc-rename">שְׁמִירַת שֵׁם</button>'}
      <p class="muted">אֵלּוּ יוֹפִיעוּ לַכִּתָּה (עַד ${MAX_SHOWCASE}):</p>
      <div id="pc-picks">${picks}</div>
      <div class="row"><button class="btn small" id="pc-sync">עִדְכּוּן עַכְשָׁיו</button><button class="btn small ghost" id="pc-leave">עֲזִיבַת הַכִּתָּה</button></div>
      <button class="btn small danger" id="pc-del">מְחִיקַת כׇּל הַמֵּידָע מֵהָאִינְטֶרְנֶט</button>`;
    if ($('pc-rename')) $('pc-rename').onclick = () => run(() => rename($('pc-name').value), 'הַשֵּׁם נִשְׁמַר ✔');
    if (Date.now() - lastCheck > 10000) {
      lastCheck = Date.now();
      const before = `${c.code}|${c.name}|${c.locked}`;
      sync().then(() => {
        if (`${c.code}|${c.name}|${c.locked}` !== before && $('p-cloud') === el) mountParent(el);
      }).catch(() => {});
    }
    $('pc-picks').onchange = (e) => {
      const box = e.target.closest('[data-show]');
      if (!box) return;
      const uid = Number(box.dataset.show);
      const set = new Set(c.showcase);
      if (box.checked) {
        if (set.size >= MAX_SHOWCASE) {
          box.checked = false;
          return App.toast(`אֶפְשָׁר לְהַצִּיג עַד ${MAX_SHOWCASE}`);
        }
        set.add(uid);
      } else {
        set.delete(uid);
      }
      c.showcase = [...set];
      App.save();
      sync().catch((err) => App.toast(errorText(err)));
    };
    $('pc-sync').onclick = () => run(sync, 'עֻדְכַּן ✔');
    $('pc-leave').onclick = () => {
      if (global.confirm('לַעֲזֹב אֶת הַכִּתָּה?')) run(leave, 'עֲזַבְתֶּם אֶת הַכִּתָּה');
    };
    $('pc-del').onclick = () => {
      if (global.confirm('לִמְחֹק אֶת כׇּל הַמֵּידָע מֵהָאִינְטֶרְנֶט?')) run(deleteAll, 'הַמֵּידָע נִמְחַק');
    };
  }

  global.Cloud = { configured, inClass, classmates, mountParent, autoSync, deleteAll, cleanName, errorText, REACTIONS, sendReaction, sendGift, canGiftToday, incomingReactions, pendingGifts, claimGift };
})(window);
