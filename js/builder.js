/* Dino Workshop: the prize for finishing a "builder" story. The child builds her own dino part by part
   (body, neck, head, legs, hands, tail, back, horns, pattern, colour). Each earned build makes one new dino;
   an existing custom dino can be rebuilt for free. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const R = () => global.Renderer;
  const esc = (s) => global.Puzzles.escapeHtml(s);

  let draft = null; // { uid|null, parts, tint, colors, colorFor, name }

  const builds = () => global.App.state.builds || 0;

  const abilityLine = (d) => `כּוֹחוֹת: ${R().traitsOf(d).map((t) => `${R().TRAITS[t].icon} ${R().TRAITS[t].name}`).join(' · ')}`;

  function preview() {
    return R().dino('custom', { tint: draft.tint, parts: draft.parts, colors: draft.colors });
  }

  // The colour a swatch row edits: the main colour for "all", or one part's own colour (which falls back to the main one).
  const shownTint = () => (draft.colorFor === 'all' ? draft.tint : draft.colors[draft.colorFor] ?? draft.tint);

  function refresh() {
    $('bw-preview').innerHTML = preview();
    $('bw-abilities').textContent = abilityLine({ species: 'custom', parts: draft.parts });
    document.querySelectorAll('#bw-form .bw-opt').forEach((b) => b.classList.toggle('on', draft.parts[b.dataset.k] === b.dataset.v));
    document.querySelectorAll('#bw-form .bw-cpart').forEach((b) => {
      b.classList.toggle('on', b.dataset.cp === draft.colorFor);
      const i = b.dataset.cp === 'all' ? draft.tint : draft.colors[b.dataset.cp] ?? draft.tint;
      b.querySelector('.bw-dot').style.background = R().TINTS[i].body;
    });
    document.querySelectorAll('#bw-form .bw-color').forEach((b) => b.classList.toggle('on', Number(b.dataset.tint) === shownTint()));
    $('bw-creset').hidden = draft.colorFor === 'all' || draft.colors[draft.colorFor] === undefined;
  }

  function groupHtml(g) {
    return `<div class="bw-group"><b>${g.label}</b><div class="bw-opts">${g.opts
      .map(([id, label, icon]) => `<button type="button" class="bw-opt" data-k="${g.key}" data-v="${id}"><span>${icon}</span>${label}</button>`)
      .join('')}</div></div>`;
  }

  /** uid: an existing custom dino to rebuild, or null to build a new one with an earned build. */
  function open(uid) {
    const App = global.App;
    const old = uid == null ? null : App.state.dinos.find((d) => d.uid === uid && d.species === 'custom');
    if (!old && builds() < 1) return App.toast('צָרִיךְ לִקְרֹא סִפּוּר מְיֻחָד כְּדֵי לִבְנוֹת דִּינוֹ חָדָשׁ 📖');
    draft = old
      ? { uid: old.uid, parts: R().cleanParts(old.parts), tint: old.tint, colors: R().cleanColors(old.colors), colorFor: 'all', name: old.name || '' }
      : { uid: null, parts: R().defaultParts(), tint: 0, colors: {}, colorFor: 'all', name: '' };
    App.openModal(`<div class="bw">
      <h2>🛠️ מִפְעַל הַדִּינוֹזָאוּרִים</h2>
      <div class="bw-preview" id="bw-preview"></div>
      <p class="bw-abilities" id="bw-abilities"></p>
      <div id="bw-form">
        ${R().CUSTOM_GROUPS.map(groupHtml).join('')}
        <div class="bw-group"><b>צֶבַע</b>
          <div class="bw-opts bw-cparts">${[['all', 'הַכֹּל', '🎨']].concat(R().COLOR_PARTS).map(([k, label, icon]) => `<button type="button" class="bw-opt bw-cpart" data-cp="${k}"><span>${icon}</span>${label}<i class="bw-dot"></i></button>`).join('')}</div>
          <div class="bw-opts bw-swatches">${R().TINTS.map((t, i) => `<button type="button" class="bw-color" data-tint="${i}" aria-label="צֶבַע ${i + 1}" style="background:${t.body};border-color:${t.dark}"></button>`).join('')}<button type="button" class="btn ghost small" id="bw-creset">↩️ כְּמוֹ הַצֶּבַע הָרָאשִׁי</button></div>
        </div>
        <div class="bw-group"><b>שֵׁם</b><input id="bw-name" class="input" maxlength="14" placeholder="מָה שֵׁם הַדִּינוֹ שֶׁלִּי?" value="${esc(draft.name)}"></div>
      </div>
      <div class="row">
        <button type="button" class="btn alt small" id="bw-random">🎲 הַפְתָּעָה</button>
        <button type="button" class="btn ghost small" data-close>סְגִירָה</button>
      </div>
      <button type="button" class="btn big" id="bw-save">${old ? '✅ שְׁמִירַת הַשִּׁנּוּיִים' : '🦖 מְסַיְּמִים! הַדִּינוֹ שֶׁלִּי'}</button></div>`);
    $('bw-form').onclick = (e) => {
      const o = e.target.closest('.bw-opt:not(.bw-cpart)');
      if (o) draft.parts[o.dataset.k] = o.dataset.v;
      const cp = e.target.closest('.bw-cpart');
      if (cp) draft.colorFor = cp.dataset.cp;
      const c = e.target.closest('.bw-color');
      if (c) {
        const i = Number(c.dataset.tint);
        if (draft.colorFor === 'all') {
          draft.tint = i;
          draft.colors = {};
        } else {
          draft.colors[draft.colorFor] = i;
        }
      }
      if (e.target.closest('#bw-creset')) delete draft.colors[draft.colorFor];
      if (o || cp || c || e.target.closest('#bw-creset')) refresh();
    };
    $('bw-name').oninput = () => { draft.name = $('bw-name').value.trim().slice(0, 14); };
    $('bw-random').onclick = () => {
      R().CUSTOM_GROUPS.forEach((g) => { draft.parts[g.key] = g.opts[Math.floor(Math.random() * g.opts.length)][0]; });
      const n = R().TINTS.length;
      draft.tint = Math.floor(Math.random() * n);
      draft.colors = {};
      R().COLOR_PARTS.forEach(([k]) => { if (Math.random() < 0.4) draft.colors[k] = Math.floor(Math.random() * n); });
      refresh();
    };
    $('bw-save').onclick = save;
    refresh();
  }

  function save() {
    const App = global.App;
    const st = App.state;
    const parts = R().cleanParts(draft.parts);
    const colors = R().cleanColors(draft.colors);
    const name = (draft.name || '').trim().slice(0, 14);
    let d = draft.uid == null ? null : st.dinos.find((x) => x.uid === draft.uid);
    if (d) {
      d.parts = parts;
      d.colors = colors;
      d.tint = draft.tint;
      d.name = name;
      delete d.prevTint;
    } else {
      if (builds() < 1) return;
      st.builds = builds() - 1;
      d = { uid: st.nextUid++, species: 'custom', legendary: false, tint: draft.tint, horns: 0, eggs: 0, parts, colors, name };
      st.dinos.push(d);
      st.active = d.uid;
    }
    App.save();
    App.refreshHud();
    const isNew = draft.uid == null;
    draft = null;
    App.celebrate({
      title: isNew ? 'הַדִּינוֹ שֶׁלָּךְ מוּכָן! 🎉' : 'הַדִּינוֹ שֶׁלָּךְ הִשְׁתַּנָּה! ✨',
      lines: [esc(App.dinoName(d)), abilityLine(d)],
      dinoHtml: App.dinoHtml(d),
      onClose: () => {
        if ($('screen-zoo') && !$('screen-zoo').hidden) App.renderZoo();
      },
    });
  }

  /* The Sanctuary card: how many builds are waiting, and a way back into any dino she already built. */
  function renderCard(el) {
    const App = global.App;
    const mine = App.state.dinos.filter((d) => d.species === 'custom');
    const n = builds();
    el.innerHTML = `
      <p class="bw-note">${n > 0
        ? `🎁 יֵשׁ לָךְ ${n === 1 ? 'בְּנִיָּה אַחַת' : `${n} בְּנִיּוֹת`} שֶׁל דִּינוֹ חָדָשׁ!`
        : '📖 מִי שֶׁמְּסַיֶּמֶת סִפּוּר מְיֻחָד, בּוֹנָה דִּינוֹ בְּעַצְמָהּ!'}</p>
      ${n > 0 ? '<button class="btn big" data-build="new">🛠️ בּוֹנִים דִּינוֹ חָדָשׁ</button>' : ''}
      ${mine.length ? `<div class="bw-mine">${mine.map((d) => `<button class="shop-item" data-build="${d.uid}"><span class="mini">${App.dinoHtml(d)}</span><b>${esc(App.dinoName(d))}</b><small>✏️ שִׁנּוּי</small></button>`).join('')}</div>` : ''}`;
    el.onclick = (e) => {
      const b = e.target.closest('[data-build]');
      if (b) open(b.dataset.build === 'new' ? null : Number(b.dataset.build));
    };
  }

  global.Builder = { open, renderCard };
})(window);
