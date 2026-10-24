/* Eggs and baby dinos: each dino can have up to 3 eggs. An egg hatches after an hour (real time) into a baby of the same species.
   Babies look like the parent's previous form (its colour before the last mutation) and can be dressed one by one.
   When all 3 babies of a dino have hatched, that dino evolves into its Mega form. */
(function (global) {
  'use strict';

  const HATCH_MS = 60 * 60 * 1000;
  const MAX = 3;
  const $ = (id) => document.getElementById(id);
  const R = () => global.Renderer;
  const esc = (s) => global.Puzzles.escapeHtml(s);

  const babies = (d) => d.babies || (d.babies = []);
  const eggCount = (d) => (d.babies || []).filter((b) => !b.hatched).length;
  const hatchedCount = (d) => (d.babies || []).filter((b) => b.hatched).length;
  const hasRoom = (d) => (d.babies || []).length < MAX;

  /* The baby wears the parent's previous colour; a dino that never mutated has a baby of the same colour. */
  const babyTint = (d) => (Number.isFinite(d.prevTint) ? d.prevTint : d.tint);

  function addEgg(d, now) {
    if (!hasRoom(d)) return false;
    babies(d).push({ hatchAt: (now || Date.now()) + HATCH_MS, hatched: false, outfit: {} });
    global.App.save();
    return true;
  }

  /* Who gets a new egg: the story's legendary dino, then any dino of that species, then the selected dino, then anyone with room. */
  function pickTarget(species) {
    const App = global.App;
    const pool = App.state.dinos.filter(hasRoom);
    return pool.find((d) => d.species === species && d.legendary)
      || pool.find((d) => d.species === species)
      || pool.find((d) => d.uid === App.state.active)
      || pool[0]
      || null;
  }

  function babyHtml(d, b, extra) {
    return R().dino(d.species, Object.assign({ tint: babyTint(d), legendary: d.legendary, outfit: b.outfit, baby: true }, extra));
  }

  /* Old saves had a decorative "eggs" counter. Those eggs become real ones that hatch an hour after the update. */
  function migrate(state) {
    const now = Date.now();
    state.dinos.forEach((d) => {
      const old = Number(d.eggs) || 0;
      const list = Array.isArray(d.babies) ? d.babies : [];
      d.babies = list
        .filter((b) => b && typeof b === 'object')
        .slice(0, MAX)
        .map((b) => ({
          hatched: b.hatched === true,
          hatchAt: Number.isFinite(b.hatchAt) ? b.hatchAt : now + HATCH_MS,
          outfit: b.outfit && typeof b.outfit === 'object' ? b.outfit : {},
          ...(b.fast ? { fast: true } : {}), // already sped up in the town's egg room
        }));
      for (let i = 0; i < old && d.babies.length < MAX; i++) d.babies.push({ hatched: false, hatchAt: now + HATCH_MS, outfit: {} });
      delete d.eggs;
      if (d.prevTint !== undefined && !Number.isFinite(d.prevTint)) delete d.prevTint;
    });
  }

  function remainingText(b, now) {
    const ms = b.hatchAt - now;
    if (ms <= 60000) return 'בְּעוֹד פָּחוֹת מִדַּקָּה';
    const min = Math.ceil(ms / 60000);
    if (min === 1) return 'בְּעוֹד דַּקָּה';
    if (min < 60) return `בְּעוֹד ${min} דַּקּוֹת`;
    return 'בְּעוֹד שָׁעָה';
  }

  const EGG_SVG = '<svg class="egg-svg" viewBox="0 0 40 52" aria-hidden="true"><g class="rig-egg"><ellipse cx="20" cy="30" rx="16" ry="21" fill="#fff6e0" stroke="#d9c79a" stroke-width="2.5"/><circle cx="14" cy="24" r="3" fill="#e8b4a0"/><circle cx="25" cy="34" r="3" fill="#a0c8e8"/><circle cx="22" cy="20" r="2" fill="#b7e4a0"/></g></svg>';

  function refreshViews() {
    const App = global.App;
    const visible = (id) => !$(id).hidden;
    if (visible('screen-lab')) App.renderLabDino();
    if (visible('screen-zoo')) App.renderZoo();
    if (visible('screen-world') && global.World.isOn()) global.World.enter();
  }

  /* Hatches at most one egg per call and tells the child; the next one follows when the pop-up is closed. */
  function processHatching() {
    const App = global.App;
    if (!App || !App.state || !$('modal').hidden) return;
    const now = Date.now();
    for (const d of App.state.dinos) {
      const b = babies(d).find((x) => !x.hatched && x.hatchAt <= now);
      if (!b) continue;
      b.hatched = true;
      const name = App.dinoName(d);
      const all = hatchedCount(d) >= MAX;
      const evolve = all && !d.evolved;
      if (evolve) {
        d.evolved = true;
        App.addDna(30);
      }
      App.save();
      App.celebrate({
        title: 'בֵּיצָה בָּקְעָה! 🐣',
        lines: [`נוֹלַד תִּינוֹק שֶׁל ${esc(name)}!`, all ? 'כׇּל שְׁלוֹשֶׁת הַתִּינוֹקוֹת בָּקְעוּ! 🎉' : 'אֶפְשָׁר לְהַלְבִּישׁ אוֹתוֹ בַּמַּעְבָּדָה 👗'],
        dinoHtml: babyHtml(d, b),
        onClose: () => {
          refreshViews();
          if (!evolve) return processHatching();
          App.celebrate({
            title: 'הַדִּינוֹ הִתְפַּתֵּחַ! 🌈',
            lines: ['+30 נְקֻדּוֹת דנ״א', `עַכְשָׁיו הוּא ${esc(App.dinoName(d))}!`],
            dinoHtml: App.dinoHtml(d),
            onClose: () => {
              refreshViews();
              processHatching();
            },
          });
          return undefined;
        },
      });
      return;
    }
  }

  /* The nursery strip in the lab: three slots for the selected dino (egg with a countdown, baby to dress, or empty). */
  function render(el, d) {
    const App = global.App;
    const now = Date.now();
    const list = babies(d);
    const slots = [0, 1, 2].map((i) => {
      const b = list[i];
      if (!b) return '<div class="nslot empty"><span class="nslot-ico">🥚</span><small>מָקוֹם לְתִינוֹק</small></div>';
      if (!b.hatched) return `<div class="nslot egg">${EGG_SVG}<small>${remainingText(b, now)}</small></div>`;
      return `<button class="nslot baby" data-baby="${i}"><span class="mini">${babyHtml(d, b)}</span><small>👗 הַלְבָּשָׁה</small></button>`;
    }).join('');
    el.innerHTML = `
      <div class="nursery-head"><b>🐣 תִּינוֹקוֹת (${hatchedCount(d)}/${MAX})</b><small>בֵּיצָה בּוֹקַעַת אַחֲרֵי שָׁעָה</small></div>
      <div class="nslots">${slots}</div>
      <small class="muted">בֵּיצָה חֲדָשָׁה מַקְבְּלִים מִקְּרִיאָה בַּסִּפּוּרִים. כְּשֶׁשְּׁלוֹשָׁה תִּינוֹקוֹת בּוֹקְעִים הַדִּינוֹ מִתְפַּתֵּחַ 🌈</small>`;
  }

  function tick() {
    const App = global.App;
    if (!App || !App.state) return;
    processHatching();
    if (!$('screen-lab').hidden && $('modal').hidden) render($('lab-nursery'), App.activeDino());
  }

  function init() {
    $('lab-nursery').addEventListener('click', (e) => {
      const b = e.target.closest('[data-baby]');
      if (!b) return;
      const d = global.App.activeDino();
      global.World.openWardrobe(d.uid, null, () => render($('lab-nursery'), d), Number(b.dataset.baby));
    });
    setInterval(tick, 20000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    setTimeout(tick, 1500);
  }

  global.Nursery = { MAX, HATCH_MS, init, render, migrate, addEgg, pickTarget, babyHtml, babyTint, eggCount, hatchedCount, hasRoom, processHatching, tick };
})(window);
