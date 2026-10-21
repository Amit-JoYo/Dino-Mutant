/* The dino world: the whole herd lives, plays and eats on one screen; tap a dino to look after it (Tamagotchi style). */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => global.Puzzles.escapeHtml(s);

  const STAT_FLOOR = 10; // dinos get sad but never "die"
  const DECAY_PER_HOUR = { food: 7, fun: 6, rest: 3.5, clean: 3 };
  const STATS = [
    { key: 'food', icon: '🍎', label: 'שֹׂבַע' },
    { key: 'fun', icon: '⚽', label: 'שִׂמְחָה' },
    { key: 'rest', icon: '😴', label: 'אֵנֶרְגְּיָה' },
    { key: 'clean', icon: '🫧', label: 'נִקָּיוֹן' },
  ];
  const NEED_TEXT = {
    food: 'אֲנִי רָעֵב! 🍎',
    fun: 'אֲנִי מִשְׁתַּעֲמֵם... בּוֹאִי נְשַׂחֵק! ⚽',
    rest: 'אֲנִי עָיֵף... 😴',
    clean: 'אֲנִי מְלֻכְלָךְ... 🛁',
  };

  const FOODS = [
    { id: 'apple', e: '🍎', name: 'תַּפּוּחַ', type: 'plant' },
    { id: 'leaf', e: '🥬', name: 'עָלִים', type: 'plant' },
    { id: 'berry', e: '🍓', name: 'תּוּתִים', type: 'plant' },
    { id: 'meat', e: '🍖', name: 'בָּשָׂר', type: 'meat' },
    { id: 'fish', e: '🐟', name: 'דָּג', type: 'meat' },
    { id: 'cake', e: '🍰', name: 'עוּגָה', type: 'treat' },
  ];
  const FAVORITE = {
    trex: 'meat', raptor: 'meat', spino: 'fish', plesio: 'fish', ptero: 'fish',
    brachio: 'leaf', trike: 'apple', stego: 'leaf', anky: 'berry', para: 'apple',
    compy: 'meat', igua: 'apple', diplo: 'leaf', dilo: 'meat', pachy: 'berry',
  };
  const SIZE = { brachio: 1.2, stego: 1.05, spino: 1.1, raptor: 0.9, diplo: 1.2, compy: 0.75, igua: 1.05, pachy: 0.95 };

  const POND = { x0: 63, x1: 87, y0: 66, y1: 71 }; // where swimmers stay (feet position, % of the stage)
  const FOOD_SPOTS = [{ x: 17, y: 79 }, { x: 36, y: 71 }];
  const PROPS = [
    { e: '🌋', x: 84, y: 47, k: 9, far: true },
    { e: '🌴', x: 6, y: 66, k: 12 },
    { e: '🌳', x: 26, y: 60, k: 13 },
    { e: '🌲', x: 47, y: 58, k: 11 },
    { e: '🍓', x: 12, y: 82, k: 7 },
    { e: '🌿', x: 36, y: 73, k: 7 },
    { e: '🌺', x: 30, y: 92, k: 5 },
    { e: '🍄', x: 58, y: 91, k: 4.5 },
    { e: '🪨', x: 50, y: 85, k: 6 },
    { e: '🌼', x: 78, y: 92, k: 5 },
  ];

  const state = { on: false, token: 0, sprites: new Map(), sel: null, interval: 0, refreshT: 0, incomingT: 0, lock: false, saveT: 0, mode: 'mine' };
  const MAX_VISITORS = 24;

  /* ------------------------------------------------------------------ pet stats */
  const Pets = {
    ensure(d) {
      if (!d.pet) d.pet = { food: 80, fun: 80, rest: 80, clean: 80, love: 0, t: Date.now() };
      return d.pet;
    },

    decay(d, now) {
      const p = Pets.ensure(d);
      now = now || Date.now();
      const hours = Math.min(48, (now - p.t) / 3600000);
      if (hours > 0) {
        Object.keys(DECAY_PER_HOUR).forEach((k) => {
          p[k] = Math.max(STAT_FLOOR, p[k] - DECAY_PER_HOUR[k] * hours);
        });
      }
      p.t = now;
      return p;
    },

    lowest(d) {
      const p = Pets.ensure(d);
      return STATS.reduce((a, b) => (p[b.key] < p[a.key] ? b : a));
    },

    mood(d) {
      const p = Pets.ensure(d);
      const avg = (p.food + p.fun + p.rest + p.clean) / 4;
      return avg >= 70 ? '😊' : avg >= 45 ? '🙂' : avg >= 25 ? '😟' : '😢';
    },

    hearts(d) {
      return Math.floor(Pets.ensure(d).love / 5);
    },

    /* Applies one care action. Returns what to say/animate; `dna` is the small reward for a real need. */
    care(d, kind, arg) {
      const p = Pets.decay(d);
      const add = (k, n) => { p[k] = clamp(p[k] + n, 0, 100); };
      const res = { text: '', anim: '', prop: '', ms: 0, dna: 0, after: '' };
      const effective = () => { p.love += 1; };

      if (kind === 'feed') {
        const f = FOODS.find((x) => x.id === arg) || FOODS[0];
        if (p.food >= 90) return Object.assign(res, { text: 'אֲנִי מָלֵא! אֲנִי לֹא רוֹצֶה עוֹד 🙈' });
        const fav = FAVORITE[d.species];
        const favFood = FOODS.find((x) => x.id === fav);
        let gain = 30;
        res.text = pick(['טָעִים! תּוֹדָה! 😋', 'מָה טָעִים! 🤤', 'יָם יָם יָם! 😋']);
        if (f.id === fav) {
          gain = 38;
          p.love += 1;
          res.text = 'זֶה הָאֹכֶל הָאָהוּב עָלַי! 💖';
        } else if (f.type === 'treat') {
          gain = 18;
          add('fun', 10);
          add('clean', -6);
          res.text = 'עוּגָה! כֵּיף! 🎉';
        } else if (f.type !== favFood.type) {
          gain = 14;
          res.text = 'הַמְמ... לֹא הָאֹכֶל הָאָהוּב עָלַי, אֲבָל תּוֹדָה 😅';
        }
        res.dna = p.food < 80 ? 1 : 0;
        add('food', gain);
        add('clean', -4);
        effective();
        Object.assign(res, { anim: 'eating', prop: f.e, ms: 2800 });
      } else if (kind === 'play') {
        if (p.rest < 20) return Object.assign(res, { text: 'אֲנִי עָיֵף מִדַּי... בּוֹאִי נֵלֵךְ לִישֹׁן 😴' });
        if (p.fun >= 90) return Object.assign(res, { text: 'אֲנִי כְּבָר מְאֹד שָׂמֵחַ! 😄' });
        res.dna = p.fun < 80 ? 1 : 0;
        add('fun', 35);
        add('rest', -12);
        add('food', -6);
        add('clean', -5);
        effective();
        Object.assign(res, { text: pick(['יָאהוּ! כֵּיף! ⚽', 'וִי! עוֹד פַּעַם! 🎉']), anim: 'playing', prop: '⚽', ms: 3200 });
      } else if (kind === 'sleep') {
        if (p.rest >= 85) return Object.assign(res, { text: 'אֲנִי לֹא עָיֵף עַכְשָׁיו 😊' });
        res.dna = p.rest < 80 ? 1 : 0;
        add('rest', 50);
        add('food', -5);
        effective();
        Object.assign(res, { text: 'לַיְלָה טוֹב... 🌙', anim: 'sleeping', prop: '💤', ms: 4500, after: 'הִתְעוֹרַרְתִּי רַעֲנָן! ☀️' });
      } else if (kind === 'wash') {
        if (p.clean >= 85) return Object.assign(res, { text: 'אֲנִי כְּבָר נָקִי וְרֵיחָנִי! ✨' });
        res.dna = p.clean < 80 ? 1 : 0;
        p.clean = 100;
        add('fun', 8);
        effective();
        Object.assign(res, { text: 'בּוּעוֹת! אֲנִי נָקִי! 🫧', anim: 'washing', prop: '🫧', ms: 2800 });
      } else if (kind === 'hug') {
        add('fun', 6);
        p.love += 0.5;
        Object.assign(res, { text: pick(['אֲנִי אוֹהֵב אוֹתָךְ! 💕', 'חִבּוּק! כַּמָּה נָעִים 🤗']), anim: 'hugging', prop: '❤️', ms: 2200 });
      }
      p.t = Date.now();
      return res;
    },
  };

  function saveSoon() {
    clearTimeout(state.saveT);
    state.saveT = setTimeout(() => global.App.save(), 600);
  }

  /* ------------------------------------------------------------------ world scene */
  const isNight = () => {
    if (state.forceNight !== undefined) return state.forceNight;
    const h = new Date().getHours();
    return h >= 20 || h < 6;
  };

  const stageW = () => $('world').clientWidth || 320;
  const alive = (my) => state.on && my === state.token;
  const ok = (s, my) => alive(my) && !s.busy;

  function widthFor(s, y) {
    const depth = clamp((y - 52) / 42, 0, 1);
    return stageW() * 0.24 * (0.7 + 0.4 * depth) * (SIZE[s.d.species] || 1) * (s.d.baby ? 0.5 : 1);
  }

  function landPoint() {
    for (let i = 0; i < 25; i++) {
      const x = rnd(8, 92);
      const y = rnd(60, 93);
      if (!(x > 50 && y < 76)) return { x, y };
    }
    return { x: 30, y: 85 };
  }

  const pondPoint = () => ({ x: rnd(POND.x0, POND.x1), y: rnd(POND.y0, POND.y1) });
  const isSwimmer = (s) => s.d.species === 'plesio';

  function buildScene() {
    const world = $('world');
    world.style.setProperty('--u', `${stageW() / 100}px`);
    world.classList.toggle('night', isNight());
    $('world-props').innerHTML = PROPS.map((p) =>
      `<span class="w-prop-item${p.far ? ' far' : ''}" style="left:${p.x}%;top:${p.y}%;font-size:calc(var(--u)*${p.k});z-index:${p.far ? 0 : Math.round(p.y * 10)}">${p.e}</span>`
    ).join('');
  }

  function makeSprite(d) {
    const el = document.createElement('div');
    el.className = 'w-dino';
    el.dataset.uid = d.uid;
    el.innerHTML = `<div class="w-shadow"></div><div class="w-flip">${global.App.dinoHtml(d)}</div><div class="w-prop"></div><div class="w-bubble"></div><div class="w-badge"></div><div class="w-name"></div>`;
    if (d.visitor) el.querySelector('.w-name').textContent = d.owner;
    const s = { d, el, x: 0, y: 0, busy: false, actId: 0, state: '' };
    const p = isSwimmer(s) ? pondPoint() : landPoint();
    s.x = p.x;
    s.y = p.y;
    el.style.left = `${p.x}%`;
    el.style.top = `${p.y}%`;
    el.style.width = `${widthFor(s, p.y)}px`;
    el.style.zIndex = Math.round(p.y * 10);
    if (Math.random() < 0.5) el.classList.add('left');
    return s;
  }

  function setState(s, st, prop) {
    ['eating', 'playing', 'sleeping', 'splashing', 'washing', 'hugging'].forEach((c) => s.el.classList.remove(c));
    s.state = st;
    if (st) s.el.classList.add(st);
    s.el.querySelector('.w-prop').textContent = prop || '';
  }

  function say(s, text, ms) {
    const b = s.el.querySelector('.w-bubble');
    b.textContent = text;
    b.classList.add('on');
    clearTimeout(s.sayT);
    s.sayT = setTimeout(() => b.classList.remove('on'), ms || 2200);
  }

  function updateBadge(s) {
    if (s.d.visitor || s.d.baby) return;
    const low = Pets.lowest(s.d);
    const b = s.el.querySelector('.w-badge');
    b.textContent = Pets.ensure(s.d)[low.key] < 30 ? low.icon : '';
  }

  function moveTo(s, x, y, o) {
    o = o || {};
    const my = state.token;
    const W = stageW();
    const H = $('world').clientHeight;
    const dx = ((x - s.x) / 100) * W;
    const dy = ((y - s.y) / 100) * H;
    const speed = o.speed || (o.air ? 60 : isSwimmer(s) ? 24 : 38);
    const dur = Math.max(0.3, Math.hypot(dx, dy) / speed);
    s.el.style.transitionDuration = `${dur}s`;
    s.el.style.left = `${x}%`;
    s.el.style.top = `${y}%`;
    s.el.style.width = `${widthFor(s, o.depthY === undefined ? y : o.depthY)}px`;
    s.el.style.zIndex = Math.round(y * 10);
    if (Math.abs(dx) > 3) s.el.classList.toggle('left', dx < 0);
    s.el.classList.toggle('flying', !!o.air);
    s.el.classList.add('walking');
    s.x = x;
    s.y = y;
    return wait(dur * 1000 + 60).then(() => {
      if (my === state.token && !s.busy) s.el.classList.remove('walking');
    });
  }

  /* Stop exactly where the sprite is right now (used when it is picked for care). */
  function freeze(s) {
    const r = s.el.getBoundingClientRect();
    const sr = $('world').getBoundingClientRect();
    if (sr.width) {
      s.x = ((r.left + r.width / 2 - sr.left) / sr.width) * 100;
      s.y = ((r.bottom - sr.top) / sr.height) * 100;
    }
    s.el.style.transitionDuration = '0s';
    s.el.style.left = `${s.x}%`;
    s.el.style.top = `${s.y}%`;
    s.el.classList.remove('walking');
    s.actId++;
  }

  const food = (s) => (FOODS.find((f) => f.id === FAVORITE[s.d.species]) || FOODS[0]).e;

  function nudge(s, key, n) {
    const p = Pets.ensure(s.d);
    p[key] = clamp(p[key] + n, 0, 100);
    updateBadge(s);
    saveSoon();
  }

  async function doing(s, my, id, st, prop, ms, stat, gain) {
    setState(s, st, prop);
    await wait(ms);
    if (!ok(s, my) || s.actId !== id) return;
    if (stat) nudge(s, stat, gain);
    setState(s, '', '');
  }

  const ACTS = {
    async wander(s, my) {
      const p = isSwimmer(s) ? pondPoint() : landPoint();
      await moveTo(s, p.x, p.y);
    },

    async fly(s, my) {
      await moveTo(s, rnd(10, 90), rnd(26, 50), { air: true, depthY: 66 });
      if (ok(s, my)) await wait(rnd(500, 1800));
    },

    async eat(s, my, id) {
      let p;
      if (isSwimmer(s)) p = pondPoint();
      else {
        const spot = pick(FOOD_SPOTS);
        p = { x: spot.x + rnd(-4, 7), y: spot.y + rnd(2, 6) };
      }
      await moveTo(s, p.x, p.y);
      if (ok(s, my)) await doing(s, my, id, 'eating', food(s), rnd(3500, 5500), 'food', 6);
    },

    async play(s, my, id) {
      const p = isSwimmer(s) ? pondPoint() : { x: clamp(s.x + rnd(-14, 14), 8, 92), y: clamp(s.y + rnd(-6, 6), 60, 93) };
      if (!isSwimmer(s) && p.x > 50 && p.y < 76) p.y = 80;
      await moveTo(s, p.x, p.y);
      if (ok(s, my)) await doing(s, my, id, 'playing', isSwimmer(s) ? '💦' : '⚽', rnd(4000, 6000), 'fun', 6);
    },

    async sleep(s, my, id) {
      if (s.el.classList.contains('flying')) await moveTo(s, s.x, rnd(70, 88));
      if (ok(s, my)) {
        say(s, '💤', 3000);
        await doing(s, my, id, 'sleeping', '💤', rnd(8000, 12000), 'rest', 8);
      }
    },

    async splash(s, my, id) {
      const p = isSwimmer(s) ? pondPoint() : { x: rnd(60, 88), y: rnd(76, 80) };
      await moveTo(s, p.x, p.y);
      if (ok(s, my)) await doing(s, my, id, 'splashing', '💦', rnd(3000, 4500), 'clean', 6);
    },

    async visit(s, my, id) {
      const others = [...state.sprites.values()].filter((o) => o !== s && !o.busy && !isSwimmer(o) && o.state !== 'sleeping');
      if (!others.length) return ACTS.wander(s, my);
      const o = pick(others);
      const side = o.x > 50 ? -1 : 1;
      await moveTo(s, clamp(o.x + side * 9, 8, 92), clamp(o.y + 1, 60, 93));
      if (!ok(s, my)) return;
      s.el.classList.toggle('left', side > 0);
      say(s, pick(['❤️', '😊', '💬']), 2400);
      if (!o.busy) say(o, pick(['❤️', '😊', '🎵']), 2400);
      await wait(2600);
    },
  };

  function choose(s) {
    const p = Pets.ensure(s.d);
    const species = s.d.species;
    const night = isNight();
    const w = { wander: 3, eat: 1 + (p.food < 40 ? 4 : 0), play: 1 + (p.fun < 40 ? 4 : 0), sleep: 0.4 + (p.rest < 35 ? 5 : 0) + (night ? 2.5 : 0), splash: 0.7 + (p.clean < 40 ? 4 : 0) };
    if (species === 'ptero') w.fly = 4;
    if (!isSwimmer(s) && state.sprites.size > 1) w.visit = 1.5;
    if (night) {
      w.wander = 1.5;
      w.play *= 0.5;
    }
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const k of Object.keys(w)) {
      r -= w[k];
      if (r <= 0) return k;
    }
    return 'wander';
  }

  /* Babies stay close to their parent: wander around it, hop about, and curl up when the parent sleeps. */
  function nearParent(par, s) {
    if (isSwimmer(s)) return { x: clamp(par.x + rnd(-6, 6), POND.x0, POND.x1), y: clamp(par.y + rnd(-1, 2), POND.y0, POND.y1) };
    const p = { x: clamp(par.x + rnd(-11, 11), 6, 94), y: clamp(par.y + rnd(-2, 5), 58, 94) };
    if (p.x > 50 && p.y < 76) p.y = 78;
    return p;
  }

  async function babyLife(s, my) {
    await wait(rnd(300, 1500));
    while (alive(my)) {
      if (s.busy) {
        await wait(400);
        continue;
      }
      const par = state.sprites.get(String(s.d.parentUid));
      if (!par) return;
      try {
        const r = Math.random();
        if (par.state === 'sleeping' && !isSwimmer(s)) {
          const p = nearParent(par, s);
          await moveTo(s, p.x, p.y);
          if (ok(s, my)) {
            setState(s, 'sleeping', '💤');
            await wait(rnd(3000, 5000));
            if (alive(my) && !s.busy) setState(s, '', '');
          }
        } else if (r < 0.3) {
          setState(s, 'playing', '');
          await wait(rnd(1500, 2600));
          if (alive(my) && !s.busy) setState(s, '', '');
        } else {
          const p = nearParent(par, s);
          await moveTo(s, p.x, p.y);
        }
      } catch (e) { /* keep going */ }
      if (alive(my) && !s.busy) await wait(rnd(500, 1600));
    }
  }

  async function life(s, my) {
    await wait(rnd(200, 2800));
    while (alive(my)) {
      if (s.busy) {
        await wait(400);
        continue;
      }
      const low = Pets.lowest(s.d);
      if (Pets.ensure(s.d)[low.key] < 30 && Math.random() < 0.5) say(s, low.icon, 2400);
      const act = choose(s);
      try {
        await ACTS[act](s, my, ++s.actId);
      } catch (e) { /* keep the herd going */ }
      if (alive(my) && !s.busy) await wait(rnd(500, 1800));
    }
  }

  /* ------------------------------------------------------------------ care panel */
  function bars(d) {
    const p = Pets.ensure(d);
    return STATS.map((st) => {
      const v = Math.round(p[st.key]);
      return `<div class="stat"><span class="stat-ico">${st.icon}</span><span class="stat-lbl">${st.label}</span><div class="bar${v < 30 ? ' low' : v < 55 ? ' mid' : ''}"><i style="width:${v}%"></i></div></div>`;
    }).join('');
  }

  function renderPanel() {
    const s = state.sel;
    const panel = $('pet-panel');
    if (!s) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }
    const d = s.d;
    const App = global.App;
    if (d.visitor) {
      panel.hidden = false;
      panel.innerHTML = `
        <div class="pet-head">
          <div class="pet-stage" id="pet-stage">
            <div class="pet-dino">${App.dinoHtml(d)}</div>
            <div class="pet-prop" id="pet-prop"></div>
          </div>
          <div class="pet-info">
            <div class="pet-name">🏫 <b id="pet-name"></b></div>
            <div class="pet-sub" id="pet-sub"></div>
            <p class="muted">הַדִּינוֹזָאוּר הוֹלֵךְ לְבַקֵּר. אֶפְשָׁר לְהַאֲכִיל וּלְשַׂחֵק, אֲבָל אִי אֶפְשָׁר לְשַׁנּוֹת אוֹתוֹ.</p>
          </div>
        </div>
        <p class="pet-msg" id="pet-msg">👋</p>
        <div class="pet-actions">
          <button class="btn pa" data-pet="feed"><span>🍎</span>לְהַאֲכִיל</button>
          <button class="btn pa alt" data-pet="play"><span>⚽</span>לְשַׂחֵק</button>
          <button class="btn pa pink" data-pet="hug"><span>🤗</span>חִבּוּק</button>
        </div>
        <div class="react-row">${Object.keys(global.Cloud.REACTIONS).map((k) => `<button class="react" data-react="${k}" aria-label="${k}">${global.Cloud.REACTIONS[k]}</button>`).join('')}<button class="btn small gold" data-gift="1">🎁 מַתָּנָה</button></div>
        <div class="food-row" id="food-row" hidden>${FOODS.map((f) => `<button class="food" data-food="${f.id}"><span>${f.e}</span><small>${f.name}</small></button>`).join('')}</div>
        <button class="btn ghost small" data-pet="close">סְגִירָה ✖</button>`;
      $('pet-name').textContent = d.owner;
      $('pet-sub').textContent = App.dinoName(d);
      return;
    }
    Pets.decay(d);
    panel.hidden = false;
    panel.innerHTML = `
      <div class="pet-head">
        <div class="pet-stage" id="pet-stage">
          <div class="pet-dino">${App.dinoHtml(d)}</div>
          <div class="pet-prop" id="pet-prop"></div>
        </div>
        <div class="pet-info">
          <div class="pet-name"><b id="pet-name">${esc(App.dinoName(d))}</b> <button class="icon-lite" data-pet="rename" aria-label="שִׁנּוּי שֵׁם">✏️</button></div>
          <div class="pet-sub"><span id="pet-mood">${Pets.mood(d)}</span> <span id="pet-hearts">❤️ ${Pets.hearts(d)}</span></div>
          <div id="pet-bars">${bars(d)}</div>
        </div>
      </div>
      <p class="pet-msg" id="pet-msg">${NEED_TEXT[Pets.lowest(d).key] && Pets.ensure(d)[Pets.lowest(d).key] < 30 ? NEED_TEXT[Pets.lowest(d).key] : 'אֲנִי מַרְגִּישׁ מְצֻיָּן! 😊'}</p>
      <div class="pet-actions">
        <button class="btn pa" data-pet="feed"><span>🍎</span>לְהַאֲכִיל</button>
        <button class="btn pa alt" data-pet="play"><span>⚽</span>לְשַׂחֵק</button>
        <button class="btn pa dark" data-pet="sleep"><span>😴</span>לִישֹׁן</button>
        <button class="btn pa aqua" data-pet="wash"><span>🛁</span>לִרְחֹץ</button>
        <button class="btn pa pink" data-pet="hug"><span>🤗</span>חִבּוּק</button>
        <button class="btn pa gold" data-pet="dress"><span>👗</span>לְהַלְבִּישׁ</button>
        <button class="btn pa aqua" data-pet="share"><span>📤</span>שִׁתּוּף</button>
      </div>
      <div class="food-row" id="food-row" hidden>${FOODS.map((f) => `<button class="food" data-food="${f.id}"><span>${f.e}</span><small>${f.name}</small></button>`).join('')}</div>
      <button class="btn ghost small" data-pet="close">סְגִירָה ✖</button>`;
  }

  function updatePanel() {
    const s = state.sel;
    if (!s || $('pet-panel').hidden || s.d.visitor) return;
    $('pet-bars').innerHTML = bars(s.d);
    $('pet-mood').textContent = Pets.mood(s.d);
    $('pet-hearts').textContent = `❤️ ${Pets.hearts(s.d)}`;
    $('pet-name').textContent = global.App.dinoName(s.d);
  }

  function panelSay(text) {
    const m = $('pet-msg');
    if (m) m.textContent = text;
  }

  function select(uid) {
    const s = state.sprites.get(uid);
    if (s && s.d.baby) {
      // Tapping a baby opens its own wardrobe.
      openWardrobe(s.d.parentUid, null, () => refreshSprite(s), s.d.babyIdx);
      return;
    }
    if (!s) return;
    if (state.sel && state.sel !== s) release(state.sel);
    state.sel = s;
    state.lock = false;
    s.busy = true;
    freeze(s);
    setState(s, '', '');
    s.el.classList.add('sel');
    renderPanel();
    $('pet-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function release(s) {
    s.busy = false;
    s.el.classList.remove('sel');
    setState(s, '', '');
  }

  function closePanel() {
    if (state.sel) release(state.sel);
    state.sel = null;
    state.lock = false;
    renderPanel();
  }

  function refreshSprite(s) {
    s.el.querySelector('.w-flip').innerHTML = global.App.dinoHtml(s.d);
  }

  /* Guest dinos only react: nothing is saved and no DNA is earned. */
  function visitorCare(s, kind, arg) {
    if (kind === 'feed') {
      const f = FOODS.find((x) => x.id === arg) || FOODS[0];
      const fav = f.id === FAVORITE[s.d.species];
      return { text: fav ? 'זֶה הָאֹכֶל הָאָהוּב עָלַי! 💖' : 'טָעִים! תּוֹדָה! 😋', anim: 'eating', prop: f.e, ms: 2800, dna: 0 };
    }
    if (kind === 'play') return { text: 'יָאהוּ! כֵּיף! ⚽', anim: 'playing', prop: '⚽', ms: 3200, dna: 0 };
    return { text: 'חִבּוּק! כַּמָּה נָעִים 🤗', anim: 'hugging', prop: '❤️', ms: 2200, dna: 0 };
  }

  async function doAction(kind, arg) {
    const s = state.sel;
    if (!s || state.lock) return;
    const App = global.App;
    const res = s.d.visitor ? visitorCare(s, kind, arg) : Pets.care(s.d, kind, arg);
    panelSay(res.text);
    if (res.dna) {
      App.addDna(res.dna);
      App.toast(`+${res.dna} 🧬`);
    }
    App.save();
    updatePanel();
    updateBadge(s);
    if (!res.anim) return;
    state.lock = true;
    const stage = $('pet-stage');
    stage.className = `pet-stage ${res.anim}`;
    $('pet-prop').textContent = res.prop;
    setState(s, res.anim, res.prop);
    await wait(res.ms);
    if (state.sel !== s) return;
    stage.className = 'pet-stage';
    $('pet-prop').textContent = '';
    setState(s, '', '');
    if (res.after) panelSay(res.after);
    state.lock = false;
  }

  function onPanelClick(e) {
    const f = e.target.closest('[data-food]');
    if (f) {
      $('food-row').hidden = true;
      doAction('feed', f.dataset.food);
      return;
    }
    const sel = state.sel;
    const r = e.target.closest('[data-react]');
    if (r && sel && sel.d.visitor) {
      global.Social.react(sel.d, r.dataset.react, panelSay);
      return;
    }
    if (e.target.closest('[data-gift]') && sel && sel.d.visitor) {
      global.Social.gift(sel.d);
      return;
    }
    const b = e.target.closest('[data-pet]');
    if (!b || !state.sel) return;
    const kind = b.dataset.pet;
    if (kind === 'feed') {
      if (!state.lock) $('food-row').hidden = !$('food-row').hidden;
    } else if (kind === 'close') {
      closePanel();
    } else if (kind === 'dress') {
      if (!state.lock) openWardrobe(state.sel.d.uid, null, () => { refreshSprite(state.sel); renderPanel(); });
    } else if (kind === 'rename') {
      renameDino(state.sel);
    } else if (kind === 'share') {
      global.Share.shareDino(state.sel.d);
    } else {
      doAction(kind);
    }
  }

  function renameDino(s) {
    const App = global.App;
    App.openModal(`
      <h2>✏️ שֵׁם לַדִּינוֹזָאוּר</h2>
      <input id="pet-name-input" class="input" maxlength="14" placeholder="${esc(App.dinoName(s.d))}" value="${esc(s.d.name || '')}">
      <div class="row"><button class="btn" id="pet-name-ok">שְׁמִירָה</button><button class="btn ghost" data-close>בִּטּוּל</button></div>`);
    const input = $('pet-name-input');
    const save = () => {
      s.d.name = input.value.trim().slice(0, 14) || undefined;
      App.save();
      App.closeModal();
      updatePanel();
    };
    $('pet-name-ok').onclick = save;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') save();
    };
    input.focus();
  }

  /* ------------------------------------------------------------------ wardrobe modal */
  /* Dresses a dino, or one of its babies when babyIdx is given. */
  function openWardrobe(uid, slot, onDone, babyIdx) {
    const App = global.App;
    const W = global.Wardrobe;
    const parent = App.state.dinos.find((x) => x.uid === uid);
    if (!parent) return;
    const isBaby = Number.isInteger(babyIdx);
    const d = isBaby ? (parent.babies || [])[babyIdx] : parent;
    if (!d) return;
    if (!d.outfit) d.outfit = {};
    let cur = slot || 'hat';

    const render = () => {
      const owned = new Set(App.state.wardrobe);
      const items = W.ITEMS[cur];
      const none = !d.outfit[cur];
      $('modal-card').innerHTML = `
        <div class="wd-top">
          <h2>👗 הַלְבָּשָׁה: ${isBaby ? 'תִּינוֹק שֶׁל ' : ''}${esc(App.dinoName(parent))}</h2>
          <div class="wd-dino">${isBaby ? global.Nursery.babyHtml(parent, d) : App.dinoHtml(d)}</div>
          <div class="wd-dna">🧬 <b>${App.state.dna}</b></div>
        </div>
        <div class="wd-tabs">${W.SLOTS.map((sl) => `<button class="wd-tab${sl.id === cur ? ' on' : ''}" data-slot="${sl.id}"><span>${sl.icon}</span>${sl.label}</button>`).join('')}</div>
        <div class="wd-grid">
          <button class="wd-item${none ? ' on' : ''}" data-wear=""><span class="wd-none">🚫</span><small>בְּלִי</small></button>
          ${items.map((it) => {
            const item = W.BY_ID[it.id];
            const has = owned.has(it.id);
            return `<button class="wd-item${d.outfit[cur] === it.id ? ' on' : ''}${has ? '' : ' locked'}" data-wear="${it.id}">${W.preview(item)}<small>${it.name}</small>${has ? '' : `<em>🧬 ${it.cost}</em>`}</button>`;
          }).join('')}
        </div>
        <div class="row"><button class="btn" data-close>סִיַּמְתִּי ✔</button></div>`;
    };

    App.openModal('', () => {
      $('modal-card').onclick = null;
      App.save();
      if (onDone) onDone();
    });
    render();
    $('modal-card').onclick = (e) => {
      const tab = e.target.closest('[data-slot]');
      if (tab) {
        cur = tab.dataset.slot;
        render();
        return;
      }
      const btn = e.target.closest('[data-wear]');
      if (!btn) return;
      const id = btn.dataset.wear;
      if (!id) {
        delete d.outfit[cur];
      } else {
        const it = W.BY_ID[id];
        if (!App.state.wardrobe.includes(id)) {
          if (App.state.dna < it.cost) return App.toast(`צָרִיךְ עוֹד ${it.cost - App.state.dna} דנ״א. פִּתְרִי חִידוֹת! 🧩`);
          App.state.dna -= it.cost;
          App.state.wardrobe.push(id);
          App.refreshHud();
          App.toast(`${it.name} שֶׁלָּךְ! 🎉`);
        }
        if (d.outfit[cur] === id) delete d.outfit[cur];
        else d.outfit[cur] = id;
      }
      App.save();
      render();
    };
  }

  /* ------------------------------------------------------------------ lifecycle */
  function layout() {
    if (!state.on) return;
    $('world').style.setProperty('--u', `${stageW() / 100}px`);
    state.sprites.forEach((s) => {
      if (!s.el.classList.contains('walking')) s.el.style.width = `${widthFor(s, s.el.classList.contains('flying') ? 66 : s.y)}px`;
    });
  }

  function periodic() {
    state.sprites.forEach((s) => {
      if (s.d.baby) return;
      Pets.decay(s.d);
      updateBadge(s);
    });
    $('world').classList.toggle('night', isNight());
    updatePanel();
    saveSoon();
  }

  function showTabs() {
    const Cloud = global.Cloud;
    const can = !!(Cloud && Cloud.inClass());
    if (!can) state.mode = 'mine';
    $('world-tabs').hidden = !can;
    document.querySelectorAll('#world-tabs [data-wm]').forEach((b) => b.classList.toggle('on', b.dataset.wm === state.mode));
  }

  function signature(list) {
    return JSON.stringify(list.map((m) => [m.id, m.name, m.dinos]));
  }

  // One dino per classmate first, then their second and third, so every friend is visible.
  function visitorDinos(list) {
    const out = [];
    for (let round = 0; out.length < MAX_VISITORS && round < 3; round++) {
      list.forEach((m) => {
        if (out.length < MAX_VISITORS && m.dinos[round]) out.push(Object.assign({}, m.dinos[round], { owner: m.name, ownerId: m.id, key: `${m.id}:${round}` }));
      });
    }
    return out;
  }

  function mountVisitors(list, my) {
    state.sprites.clear();
    $('world-herd').innerHTML = '';
    visitorDinos(list).forEach((v, i) => {
      const d = Object.assign({ uid: i + 1, visitor: true }, v);
      const s = makeSprite(d);
      state.sprites.set(String(d.uid), s);
      $('world-herd').appendChild(s.el);
    });
    $('world-count').textContent = list.length
      ? `${list.length} חֲבֵרִים בַּכִּתָּה`
      : 'עוֹד אַף אֶחָד מֵהַכִּתָּה לֹא כָּאן. 👋';
    state.sprites.forEach((s) => life(s, my));
  }

  async function enterClass(my) {
    const Cloud = global.Cloud;
    $('world-count').textContent = 'טוֹעֲנִים אֶת הַכִּתָּה…';
    let last = null;
    const load = async (first) => {
      try {
        const list = await Cloud.classmates();
        if (!alive(my) || state.mode !== 'class') return;
        const sig = signature(list);
        if (sig === last || (!first && state.sel)) return;
        last = sig;
        mountVisitors(list, my);
      } catch (e) {
        if (first && alive(my)) $('world-count').textContent = 'אֵין חִבּוּר. נַסּוּ שׁוּב בְּעוֹד רֶגַע';
      }
    };
    await load(true);
    if (alive(my)) state.refreshT = setInterval(() => load(false), 45000);
  }

  /* Reactions classmates sent since the last visit pop up above your dinos. */
  async function checkIncoming() {
    const Cloud = global.Cloud;
    if (!state.on || !Cloud || !Cloud.inClass()) return;
    try {
      const list = await Cloud.incomingReactions();
      if (!list.length || !state.on) return;
      const mine = state.mode === 'mine' ? [...state.sprites.values()] : [];
      list.forEach((r, i) => {
        if (mine.length) say(mine[i % mine.length], `${r.name || 'חָבֵר'} ${r.emoji}`, 5000);
      });
      global.App.toast(list.map((r) => `${r.name || 'חָבֵר'} ${r.emoji}`).join('   '));
    } catch (e) { /* offline: try again later */ }
  }

  function enter() {
    const App = global.App;
    leave();
    state.on = true;
    const my = ++state.token;
    state.sprites.clear();
    $('world-herd').innerHTML = '';
    buildScene();
    showTabs();
    $('pet-panel').hidden = true;
    state.sel = null;
    state.interval = setInterval(periodic, 30000);
    state.incomingT = setInterval(checkIncoming, 45000);
    setTimeout(() => {
      if (!alive(my)) return;
      checkIncoming();
      if (global.Social) global.Social.offerGifts();
    }, 1200);
    if (state.mode === 'class') {
      enterClass(my);
      return;
    }
    App.state.dinos.forEach((d) => {
      Pets.decay(d);
      const s = makeSprite(d);
      state.sprites.set(String(d.uid), s);
      $('world-herd').appendChild(s.el);
      updateBadge(s);
    });
    const parents = state.sprites.size;
    let babyCount = 0;
    App.state.dinos.forEach((d) => {
      (d.babies || []).forEach((b, i) => {
        if (!b.hatched) return;
        const par = state.sprites.get(String(d.uid));
        const bd = { uid: `b${d.uid}-${i}`, species: d.species, tint: global.Nursery.babyTint(d), legendary: d.legendary, outfit: b.outfit, baby: true, parentUid: d.uid, babyIdx: i };
        const s = makeSprite(bd);
        const p = nearParent(par, s);
        s.x = p.x;
        s.y = p.y;
        s.el.style.left = `${p.x}%`;
        s.el.style.top = `${p.y}%`;
        s.el.style.width = `${widthFor(s, p.y)}px`;
        s.el.style.zIndex = Math.round(p.y * 10);
        state.sprites.set(String(bd.uid), s);
        $('world-herd').appendChild(s.el);
        babyCount++;
      });
    });
    $('world-count').textContent = babyCount
      ? `${parents} דִּינוֹזָאוּרִים וְ-${babyCount} תִּינוֹקוֹת בָּעוֹלָם`
      : `${parents} דִּינוֹזָאוּרִים בָּעוֹלָם`;
    state.sprites.forEach((s) => (s.d.baby ? babyLife(s, my) : life(s, my)));
  }

  function leave() {
    state.on = false;
    state.token++;
    clearInterval(state.interval);
    clearInterval(state.refreshT);
    clearInterval(state.incomingT);
    state.sel = null;
    state.lock = false;
    if ($('pet-panel')) $('pet-panel').hidden = true;
  }

  function init() {
    $('world-herd').addEventListener('click', (e) => {
      const el = e.target.closest('.w-dino');
      if (el) select(el.dataset.uid);
    });
    $('world-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-wm]');
      if (!b || b.dataset.wm === state.mode) return;
      state.mode = b.dataset.wm;
      enter();
    });
    $('pet-panel').addEventListener('click', onPanelClick);
    window.addEventListener('resize', layout);
  }

  global.World = { init, enter, leave, openWardrobe, isOn: () => state.on, Pets, FOODS, setNight: (v) => { state.forceNight = v; if (state.on) $('world').classList.toggle('night', isNight()); } };
})(window);
