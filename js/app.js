/* Main controller: state, tabs, lab, sanctuary, parent menu, shared helpers. */
(function (global) {
  'use strict';

  const KEY = 'dinoMutant.v1';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => global.Puzzles.escapeHtml(s);
  const R = () => global.Renderer;

  const LEGEND_ORDER = ['trex', 'brachio', 'trike', 'ptero', 'stego', 'anky', 'raptor', 'para', 'spino', 'plesio'];
  const MUTATE_COST = 10;

  function defaults() {
    return {
      dna: 0,
      dinos: [{ uid: 1, species: 'trex', legendary: false, tint: 0, horns: 0, eggs: 0 }],
      active: 1,
      nextUid: 2,
      stories: [],
      seeded: false,
      progress: {},
      words: [],
      updates: 0,
      streak: 0,
      solved: 0,
      trips: 0,
      wardrobe: [],
      cloud: { on: false, code: '', className: '', name: '', locked: false, showcase: [] },
    };
  }

  function load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {
      saved = null;
    }
    const s = Object.assign(defaults(), saved || {});
    if (!Array.isArray(s.dinos) || !s.dinos.length) s.dinos = defaults().dinos;
    if (!s.dinos.some((d) => d.uid === s.active)) s.active = s.dinos[0].uid;
    s.dinos = s.dinos.filter((d) => global.Renderer.SPECIES[d.species]);
    s.wardrobe = Array.from(new Set((Array.isArray(s.wardrobe) ? s.wardrobe : []).concat(global.Wardrobe.STARTERS)));
    s.cloud = Object.assign(defaults().cloud, s.cloud || {});
    if (!Array.isArray(s.cloud.showcase)) s.cloud.showcase = [];
    s.seeded = true; // sample stories now come from stories.json, not local storage
    return s;
  }

  // stories.json entries may use "paragraphs": [...] instead of a single "text" with line breaks.
  function normalizeStories(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((s) => s && s.id && s.title && (s.text || (Array.isArray(s.paragraphs) && s.paragraphs.length)))
      .map((s) => ({
        id: String(s.id),
        title: String(s.title),
        text: Array.isArray(s.paragraphs) ? s.paragraphs.join('\n') : String(s.text),
        shared: true,
      }));
  }

  const App = {
    state: null,
    shared: [],

    /* Stories from the repo's stories.json first, then the ones a parent pasted on this device. */
    allStories() {
      const sharedIds = new Set(App.shared.map((s) => s.id));
      return App.shared.concat(App.state.stories.filter((s) => !sharedIds.has(s.id)));
    },

    async loadShared() {
      try {
        const res = await fetch('stories.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        App.shared = normalizeStories(await res.json());
      } catch (e) {
        App.shared = normalizeStories(global.Reading.DEFAULT_STORIES);
      }
    },

    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(App.state));
      } catch (e) {
        App.toast('לֹא הִצְלַחְנוּ לִשְׁמֹר');
      }
    },

    getWords() {
      return App.state.words;
    },

    activeDino() {
      return App.state.dinos.find((d) => d.uid === App.state.active) || App.state.dinos[0];
    },

    setActive(uid) {
      App.state.active = uid;
      App.save();
    },

    dinoHtml(d, extra) {
      return R().dino(d.species, Object.assign({ tint: d.tint, legendary: d.legendary, horns: d.horns, eggs: d.eggs, outfit: d.outfit }, extra));
    },

    dinoName(d) {
      if (d.name) return d.name;
      const sp = R().SPECIES[d.species];
      return d.legendary ? sp.legendName : sp.short;
    },

    addDna(n) {
      App.state.dna += n;
      App.save();
      App.refreshHud();
    },

    refreshHud() {
      const el = $('dna-count');
      el.textContent = App.state.dna;
      el.parentElement.classList.remove('pop');
      void el.parentElement.offsetWidth;
      el.parentElement.classList.add('pop');
    },

    speak(text) {
      const synth = global.speechSynthesis;
      if (!synth) return App.toast('הַמַּכְשִׁיר לֹא תּוֹמֵךְ בְּהַקְרָאָה');
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]*>/g, ''));
      u.lang = 'he-IL';
      u.rate = 0.8;
      const voices = synth.getVoices();
      const v = voices.find((x) => /^he/i.test(x.lang) || /^iw/i.test(x.lang));
      if (v) u.voice = v;
      else if (voices.length) App.toast('אֵין קוֹל עִבְרִי בַּמַּכְשִׁיר. אֶפְשָׁר לְהַתְקִין בְּהַגְדָּרוֹת הַדִּבּוּר');
      synth.speak(u);
    },

    toast(msg) {
      const t = $('toast');
      t.textContent = msg;
      t.hidden = false;
      clearTimeout(App._toastTimer);
      App._toastTimer = setTimeout(() => (t.hidden = true), 2800);
    },

    /* ---- modal + celebration ---- */
    openModal(html, onClose) {
      $('modal-card').innerHTML = html;
      $('modal').hidden = false;
      App._modalClose = onClose || null;
    },

    closeModal() {
      $('modal').hidden = true;
      $('modal-card').innerHTML = '';
      const cb = App._modalClose;
      App._modalClose = null;
      if (cb) cb();
    },

    celebrate({ title, lines, dinoHtml, onClose }) {
      const confetti = Array.from({ length: 28 }, (_, i) => {
        const e = ['🎉', '⭐', '✨', '🧬', '🥚'][i % 5];
        return `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 1.2).toFixed(2)}s">${e}</i>`;
      }).join('');
      App.openModal(
        `<div class="confetti" aria-hidden="true">${confetti}</div>
         <h2>${title}</h2>
         <div class="celebrate-dino">${dinoHtml || ''}</div>
         ${(lines || []).map((l) => `<p class="reward-line">${l}</p>`).join('')}
         <button class="btn big" data-close>יוֹפִי! ➔</button>`,
        onClose
      );
    },

    /* ---- mutations ---- */
    applyReadingUpdate() {
      const st = App.state;
      let d = App.activeDino();
      if (d.legendary) d = st.dinos.find((x) => !x.legendary) || d;
      let kind = ['horn', 'tint', 'egg'][st.updates % 3];
      st.updates++;
      if (kind === 'horn' && d.horns >= 3) kind = 'tint';
      if (kind === 'egg' && d.eggs >= 3) kind = 'tint';
      let text;
      if (kind === 'horn') {
        d.horns++;
        text = 'צָמְחָה לַדִּינוֹ קֶרֶן קְטַנָּה! 🦄';
      } else if (kind === 'egg') {
        d.eggs++;
        text = 'בֵּיצָה קְטַנָּה הִתְגַּלְּתָה לְיַד הַדִּינוֹ! 🥚';
      } else {
        d.tint = (d.tint + 1) % R().TINTS.length;
        text = 'צֶבַע הַדִּינוֹ הִשְׁתַּנָּה! 🎨';
      }
      App.save();
      return { text, dino: d };
    },

    unlockLegendary() {
      const st = App.state;
      const owned = new Set(st.dinos.filter((d) => d.legendary).map((d) => d.species));
      const species = LEGEND_ORDER.find((s) => !owned.has(s));
      if (!species) {
        App.addDna(50);
        return { dino: null, bonusDna: 50 };
      }
      const dino = { uid: st.nextUid++, species, legendary: true, tint: 0, horns: 0, eggs: 0 };
      st.dinos.push(dino);
      App.save();
      return { dino, bonusDna: 0 };
    },

    /* ---- tabs ---- */
    showTab(name) {
      if (global.speechSynthesis) global.speechSynthesis.cancel();
      document.querySelectorAll('.screen').forEach((s) => (s.hidden = s.id !== `screen-${name}`));
      document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
      if (name !== 'trail') global.Expedition.stop();
      if (name !== 'read') global.Reading.stopListening();
      if (name !== 'world') global.World.leave();
      if (name === 'lab') App.renderLabDino();
      if (name === 'world') global.World.enter();
      if (name === 'zoo') App.renderZoo();
      if (name === 'trail') global.Expedition.renderIntro();
      if (name === 'read') global.Reading.renderLibrary();
    },

    /* ---- lab ---- */
    renderLabDino() {
      const d = App.activeDino();
      $('lab-dino').innerHTML = App.dinoHtml(d);
      $('lab-name').textContent = App.dinoName(d);
      const b = $('btn-mutate');
      b.disabled = d.legendary;
      b.textContent = d.legendary ? '✨ אַגָּדִי' : `🧬 מוּטַצְיָה (${MUTATE_COST} דנ״א)`;
    },

    mountLabPuzzle() {
      if (App._lab) App._lab.destroy();
      $('btn-next-puzzle').hidden = true;
      App._lab = global.Puzzles.mount($('lab-puzzle'), {
        kind: App._labKind,
        onSolved: (p, wrong) => {
          const st = App.state;
          st.solved++;
          let gain = wrong === 0 ? 5 : 3;
          st.streak = wrong === 0 ? st.streak + 1 : 0;
          if (st.streak > 0 && st.streak % 5 === 0) {
            gain += 5;
            App.toast('🔥 חָמֵשׁ נְכוֹנוֹת בְּרֶצֶף! בּוֹנוּס +5');
          }
          App.addDna(gain);
          $('lab-dino').classList.add('jump');
          setTimeout(() => $('lab-dino').classList.remove('jump'), 900);
          $('btn-next-puzzle').hidden = false;
        },
        onWrong: () => {
          App.state.streak = 0;
        },
      });
    },

    mutate() {
      const d = App.activeDino();
      if (d.legendary) return;
      if (App.state.dna < MUTATE_COST) return App.toast(`צָרִיךְ עוֹד ${MUTATE_COST - App.state.dna} דנ״א. פִּתְרִי חִידוֹת! 🧩`);
      App.state.dna -= MUTATE_COST;
      d.tint = (d.tint + 1) % R().TINTS.length;
      App.save();
      App.refreshHud();
      App.renderLabDino();
      $('lab-dino').classList.add('jump');
      setTimeout(() => $('lab-dino').classList.remove('jump'), 900);
    },

    /* ---- sanctuary ---- */
    renderZoo() {
      const st = App.state;
      $('zoo-grid').innerHTML = st.dinos
        .map(
          (d) => `<div class="zoo-card${d.uid === st.active ? ' on' : ''}${d.legendary ? ' legend' : ''}">
            <div class="mini">${App.dinoHtml(d)}</div>
            <b>${App.dinoName(d)}</b>
            ${d.legendary ? '<small>🌟 אַגָּדִי</small>' : `<small>${R().TRAITS[R().SPECIES[d.species].trait].icon} ${R().TRAITS[R().SPECIES[d.species].trait].name}</small>`}
            <button class="btn small" data-active="${d.uid}" ${d.uid === st.active ? 'disabled' : ''}>${d.uid === st.active ? '✔ בַּחוּר' : 'בַּחֲרִי'}</button>
          </div>`
        )
        .join('');

      const ownedReg = new Set(st.dinos.filter((d) => !d.legendary).map((d) => d.species));
      $('zoo-shop').innerHTML = Object.keys(R().SPECIES)
        .filter((s) => !ownedReg.has(s))
        .map((s) => {
          const sp = R().SPECIES[s];
          return `<button class="shop-item" data-buy="${s}"><span class="mini">${R().dino(s, { tint: 1 })}</span><b>${sp.short}</b><small>🧬 ${sp.cost} דנ״א</small></button>`;
        })
        .join('') || '<p class="muted">אָסַפְתְּ אֶת כׇּל הַדִּינוֹזָאוּרִים! 🎉</p>';

      const ownedLeg = new Set(st.dinos.filter((d) => d.legendary).map((d) => d.species));
      $('zoo-legends').innerHTML = LEGEND_ORDER.map((s) =>
        ownedLeg.has(s)
          ? `<div class="legend-slot got"><span class="mini">${R().dino(s, { legendary: true })}</span><small>${R().SPECIES[s].legendName}</small></div>`
          : `<div class="legend-slot"><span class="mini">${R().silhouette(s)}</span><small>🔒 קוֹרְאִים סִפּוּר שָׁלֵם</small></div>`
      ).join('');
    },

    buy(species) {
      const st = App.state;
      const sp = R().SPECIES[species];
      if (st.dna < sp.cost) return App.toast(`צָרִיךְ עוֹד ${sp.cost - st.dna} דנ״א`);
      st.dna -= sp.cost;
      const d = { uid: st.nextUid++, species, legendary: false, tint: 0, horns: 0, eggs: 0 };
      st.dinos.push(d);
      st.active = d.uid;
      App.save();
      App.refreshHud();
      App.renderZoo();
      App.celebrate({ title: 'דִּינוֹזָאוּר חָדָשׁ בַּגַּן! 🥚➔🦖', lines: [sp.name], dinoHtml: App.dinoHtml(d) });
    },

    /* ---- parent menu ---- */
    openParent() {
      const a = 6 + Math.floor(Math.random() * 4);
      const b = 6 + Math.floor(Math.random() * 4);
      App.openModal(`
        <h2>🔒 מַצַּב הוֹרִים</h2>
        <p>כְּדֵי לִכְנֹס, פִּתְרוּ: <b dir="ltr">${a} × ${b} = ?</b></p>
        <input id="gate-input" class="input" inputmode="numeric" autocomplete="off" dir="ltr">
        <div class="row"><button class="btn" id="gate-ok">כְּנִיסָה</button><button class="btn ghost" data-close>סְגִירָה</button></div>`);
      const tryEnter = () => {
        if (Number($('gate-input').value) === a * b) App.renderParent();
        else {
          $('gate-input').value = '';
          App.toast('תְּשׁוּבָה לֹא נְכוֹנָה');
        }
      };
      $('gate-ok').onclick = tryEnter;
      $('gate-input').onkeydown = (e) => {
        if (e.key === 'Enter') tryEnter();
      };
      $('gate-input').focus();
    },

    renderParent() {
      const st = App.state;
      const editing = App._editId ? st.stories.find((s) => s.id === App._editId) : null;
      if (!editing) App._editId = null;
      App.openModal(`
        <h2>⚙️ מַצַּב הוֹרִים</h2>
        <h3>${editing ? '✏️ עֲרִיכַת סִפּוּר' : '➕ טֶקְסְט חָדָשׁ מֵהַכִּתָּה'}</h3>
        <p class="muted">הַדְבִּיקוּ טֶקְסְט עִם נִקּוּד. כָּל שׁוּרָה הִיא פִּסְקָה.</p>
        <input id="p-title" class="input" placeholder="כּוֹתֶרֶת הַסִּפּוּר" maxlength="60">
        <textarea id="p-text" class="input" rows="6" placeholder="הַדְבִּיקוּ כָּאן אֶת הַטֶּקְסְט..."></textarea>
        <div class="row"><button class="btn" id="p-add">${editing ? 'שְׁמִירַת שִׁנּוּיִים' : 'שְׁמִירַת הַסִּפּוּר'}</button>${editing ? '<button class="btn ghost" id="p-cancel">בִּטּוּל</button>' : ''}</div>
        <h3>📚 הַסִּפּוּרִים</h3>
        <div id="p-stories">${App.shared.map((s) => `<div class="p-row"><span>📌 ${esc(s.title)}</span><small class="muted">מִן הַמַּאְגָּר</small></div>`).join('')}${st.stories.filter((s) => !App.shared.some((x) => x.id === s.id)).map((s) => `<div class="p-row"><span>${esc(s.title)}</span><span class="p-btns"><button class="btn small alt" data-edit="${esc(s.id)}">עֲרִיכָה</button><button class="btn small danger" data-del="${esc(s.id)}">מְחִיקָה</button></span></div>`).join('') || (App.shared.length ? '' : '<p class="muted">אֵין סִפּוּרִים</p>')}</div>
        <h3>🔤 מִילִּים לְתִרְגּוּל</h3>
        <p class="muted">מִלָּה אַחַת בְּכָל שׁוּרָה, אוֹ מוּפְרָדוֹת בְּפְסִיקִים (לְפָחוֹת 3).</p>
        <textarea id="p-words" class="input" rows="3">${esc(st.words.join('\n'))}</textarea>
        <button class="btn" id="p-words-save">שְׁמִירַת מִלִּים</button>
        <h3>🏫 שִׁתּוּף בַּכִּתָּה</h3>
        <div id="p-cloud"></div>
        <h3>🧹 אִתְחוּל</h3>
        <button class="btn small danger" id="p-reset">מְחִיקַת כׇּל הַהִתְקַדְּמוּת</button>
        <div class="row"><button class="btn ghost" data-close>סְגִירָה</button></div>`);

      if (editing) {
        $('p-title').value = editing.title;
        $('p-text').value = editing.text;
      }
      global.Cloud.mountParent($('p-cloud'));
      $('p-add').onclick = () => {
        const title = $('p-title').value.trim() || 'סִפּוּר חָדָשׁ';
        const text = $('p-text').value.trim();
        const count = global.Reading.parse(text).length;
        if (!count) return App.toast('הַטֶּקְסְט רֵיק');
        if (editing) {
          editing.title = title;
          editing.text = text;
          // keep progress, but never beyond the new length
          const pr = st.progress[editing.id];
          if (pr) {
            pr.rewarded = Math.min(pr.rewarded, count);
            if (pr.par >= count) pr.par = 0;
          }
          App._editId = null;
        } else {
          st.stories.push({ id: 'u' + Date.now(), title, text });
        }
        App.save();
        App.toast('נִשְׁמַר! ✔');
        App.renderParent();
      };
      if ($('p-cancel')) {
        $('p-cancel').onclick = () => {
          App._editId = null;
          App.renderParent();
        };
      }
      $('p-stories').onclick = (e) => {
        const ed = e.target.closest('[data-edit]');
        if (ed) {
          App._editId = ed.dataset.edit;
          App.renderParent();
          const m = $('modal-card');
          if (m) m.scrollTop = 0;
          return;
        }
        const b = e.target.closest('[data-del]');
        if (!b || !global.confirm('לִמְחֹק אֶת הַסִּפּוּר?')) return;
        if (App._editId === b.dataset.del) App._editId = null;
        st.stories = st.stories.filter((s) => s.id !== b.dataset.del);
        delete st.progress[b.dataset.del];
        App.save();
        App.renderParent();
      };
      $('p-words-save').onclick = () => {
        st.words = $('p-words').value.split(/[\n,]+/).map((w) => w.trim()).filter(Boolean);
        App.save();
        App.toast(st.words.length >= 3 ? 'הַמִּלִּים נִשְׁמְרוּ ✔' : 'נִשְׁמַר. צָרִיךְ לְפָחוֹת 3 מִלִּים כְּדֵי שֶׁיֻשְׁתַּמְּשׁוּ בָּהֶן');
      };
      $('p-reset').onclick = async () => {
        if (!global.confirm('לִמְחֹק אֶת כׇּל הַהִתְקַדְּמוּת וְהַדִּינוֹזָאוּרִים?')) return;
        try {
          await global.Cloud.deleteAll();
        } catch (e) { /* offline: the owner can remove the stale member */ }
        localStorage.removeItem(KEY);
        global.location.reload();
      };
    },

    init() {
      App.state = load();
      App.save();

      document.querySelectorAll('.tabbar button').forEach((b) => b.addEventListener('click', () => App.showTab(b.dataset.tab)));
      $('btn-parent').addEventListener('click', App.openParent);
      $('modal').addEventListener('click', (e) => {
        if (e.target.closest('[data-close]') || e.target.id === 'modal') App.closeModal();
      });
      $('lab-dino').addEventListener('click', () => {
        $('lab-dino').classList.add('jump');
        setTimeout(() => $('lab-dino').classList.remove('jump'), 900);
      });
      $('btn-mutate').addEventListener('click', App.mutate);
      $('btn-dress').addEventListener('click', () => global.World.openWardrobe(App.activeDino().uid, null, App.renderLabDino));
      $('btn-next-puzzle').addEventListener('click', App.mountLabPuzzle);
      $('zoo-grid').addEventListener('click', (e) => {
        const b = e.target.closest('[data-active]');
        if (b) {
          App.setActive(Number(b.dataset.active));
          App.renderZoo();
        }
      });
      $('zoo-shop').addEventListener('click', (e) => {
        const b = e.target.closest('[data-buy]');
        if (b) App.buy(b.dataset.buy);
      });

      App._labKind = 'mix';
      $('kind-chips').innerHTML = global.Puzzles.KINDS.map(
        (k) => `<button class="chip${k.id === 'mix' ? ' on' : ''}" data-kind="${k.id}">${k.label}</button>`
      ).join('');
      $('kind-chips').addEventListener('click', (e) => {
        const b = e.target.closest('.chip');
        if (!b) return;
        App._labKind = b.dataset.kind;
        document.querySelectorAll('#kind-chips .chip').forEach((c) => c.classList.toggle('on', c === b));
        App.mountLabPuzzle();
      });

      global.Reading.init();
      global.Expedition.init();
      global.World.init();
      global.Cloud.autoSync();
      App.refreshHud();
      App.mountLabPuzzle();
      App.showTab('lab');
      App.loadShared().then(() => {
        if ($('read-reader').hidden) global.Reading.renderLibrary();
      });

      if (global.speechSynthesis) global.speechSynthesis.getVoices();
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
    },
  };

  global.App = App;
  document.addEventListener('DOMContentLoaded', App.init);
})(window);
