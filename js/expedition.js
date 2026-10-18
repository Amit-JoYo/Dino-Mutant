/* Side-scrolling expedition: 3 checkpoints cleared by matching traits or by solving puzzles. */
(function (global) {
  'use strict';

  const OBSTACLES = [
    { id: 'log', emoji: '🪵', need: 'bite', title: 'גֶּזַע עֵץ חוֹסֵם אֶת הַדֶּרֶךְ', tip: 'צָרִיךְ לִנְשֹׁךְ אוֹתוֹ וּלְפַצֵּל' },
    { id: 'nest', emoji: '🪺', need: 'neck', title: 'קֵן עִם בֵּיצִים נוֹצְצוֹת תָּלוּי עַל עֵץ גָּבוֹהַּ', tip: 'צָרִיךְ צַוָּאר אָרֹךְ כְּדֵי לְהַגִּיעַ' },
    { id: 'rock', emoji: '🪨', need: 'horn', title: 'סֶלַע עֲנָק חוֹסֵם אֶת הַשְּׁבִיל', tip: 'צָרִיךְ קֶרֶן חֲזָקָה כְּדֵי לִדְחֹף אוֹתוֹ' },
    { id: 'river', emoji: '🌊', need: 'fly', title: 'נָהָר רָחָב חוֹסֵם אֶת הַדֶּרֶךְ', tip: 'צָרִיךְ לָעוּף מֵעַל הַמַּיִם' },
  ];

  const $ = (id) => document.getElementById(id);
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  let token = 0;

  function shuffled(a) {
    return a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  }

  function hasTrait(dino, trait) {
    if (dino.legendary) return true;
    if (global.Renderer.SPECIES[dino.species].trait === trait) return true;
    return trait === 'horn' && dino.horns > 0;
  }

  function renderIntro() {
    const App = global.App;
    $('trail-run').hidden = true;
    $('trail-intro').hidden = false;
    const d = App.activeDino();
    const sp = global.Renderer.SPECIES[d.species];
    const t = global.Renderer.TRAITS[sp.trait];
    $('trail-pick').innerHTML = App.state.dinos
      .map((x) => `<button class="pick${x.uid === d.uid ? ' on' : ''}" data-uid="${x.uid}">
          <span class="mini">${App.dinoHtml(x)}</span><small>${App.dinoName(x)}</small></button>`)
      .join('');
    const extra = d.legendary ? ' ✨ דִּינוֹזָאוּר אַגָּדִי — מַצְלִיחַ בְּכׇל מִכְשׁוֹל!' : d.horns > 0 ? ' + קֶרֶן קְטַנָּה 🦏' : '';
    $('trail-traits').textContent = `הַיְּכֹלֶת שֶׁל ${App.dinoName(d)}: ${t.icon} ${t.name}${extra}`;
  }

  function setProgress(done) {
    document.querySelectorAll('#trail-flags .flag').forEach((f, i) => {
      f.classList.toggle('done', i < done);
      f.classList.toggle('current', i === done);
    });
  }

  async function start() {
    const App = global.App;
    const my = ++token;
    const dino = App.activeDino();
    const picks = shuffled(OBSTACLES).slice(0, 3);
    $('trail-intro').hidden = true;
    $('trail-run').hidden = false;
    $('stage-dino').innerHTML = App.dinoHtml(dino);
    $('trail-panel').innerHTML = '';
    const obs = $('stage-obs');
    const stage = $('stage');
    let totalDna = 0;

    for (let i = 0; i < picks.length; i++) {
      setProgress(i);
      const o = picks[i];
      obs.className = 'stage-obstacle';
      obs.textContent = o.emoji;
      obs.style.transition = 'none';
      obs.style.left = '110%';
      void obs.offsetWidth;
      stage.classList.add('walking');
      obs.style.transition = 'left 2.2s ease-out';
      obs.style.left = '58%';
      await delay(2300);
      if (my !== token) return;
      stage.classList.remove('walking');

      const gained = await checkpoint(o, dino, my);
      if (my !== token) return;
      totalDna += gained;
      obs.classList.add('cleared');
      $('stage-dino').classList.add('jump');
      App.addDna(gained);
      await delay(900);
      if (my !== token) return;
      $('stage-dino').classList.remove('jump');
    }

    setProgress(3);
    obs.className = 'stage-obstacle';
    obs.style.left = '110%';
    stage.classList.add('walking');
    await delay(1200);
    if (my !== token) return;
    stage.classList.remove('walking');
    App.addDna(15);
    totalDna += 15;
    App.state.trips = (App.state.trips || 0) + 1;
    App.save();
    App.celebrate({
      title: 'הַמַּסָּע הוּשְׁלַם! 🏝️',
      lines: ['עָבַרְתְּ אֶת כׇּל שְׁלוֹשֶׁת הַמִּכְשׁוֹלִים', `+${totalDna} נְקֻדּוֹת דנ״א בַּסַּךְ הַכֹּל`],
      dinoHtml: App.dinoHtml(dino),
      onClose: renderIntro,
    });
  }

  /* Resolves with the DNA reward once the obstacle is cleared. */
  function checkpoint(o, dino, my) {
    return new Promise((resolve) => {
      const panel = $('trail-panel');
      const ok = hasTrait(dino, o.need);
      const trait = global.Renderer.TRAITS[o.need];
      panel.innerHTML = `
        <div class="obs-title">${o.emoji} ${o.title}</div>
        <div class="obs-tip">${o.tip} (${trait.icon} ${trait.name})</div>
        <div class="obs-actions">
          <button class="btn big" id="btn-ability" ${ok ? '' : 'disabled'}>✨ לְהִשְׁתַּמֵּשׁ בַּיְּכֹלֶת</button>
          <button class="btn big alt" id="btn-puzzle">🧩 לִפְתֹּר חִידָה (+8 דנ״א)</button>
        </div>
        ${ok ? '' : '<p class="muted">לַדִּינוֹ הַזֶּה אֵין אֶת הַיְּכֹלֶת הַזֹּאת, אֲבָל חִידָה תִּבְנֶה לוֹ דֶּרֶךְ!</p>'}
        <div id="trail-puzzle"></div>`;
      $('btn-ability').onclick = () => {
        if (my !== token) return;
        panel.innerHTML = `<div class="obs-title good">${trait.icon} הַיְּכֹלֶת עָבְדָה! (+4 דנ״א)</div>`;
        resolve(4);
      };
      $('btn-puzzle').onclick = () => {
        $('btn-puzzle').disabled = true;
        const box = $('trail-puzzle');
        global.Puzzles.mount(box, {
          kind: 'mix',
          onSolved: () => {
            setTimeout(() => {
              if (my !== token) return;
              panel.innerHTML = '<div class="obs-title good">🧩 הַחִידָה פְּתְרָה אֶת הַמִּכְשׁוֹל! (+8 דנ״א)</div>';
              resolve(8);
            }, 1100);
          },
        });
      };
    });
  }

  function stop() {
    token++;
    $('stage').classList.remove('walking');
  }

  function init() {
    $('trail-pick').addEventListener('click', (e) => {
      const b = e.target.closest('.pick');
      if (!b) return;
      global.App.setActive(Number(b.dataset.uid));
      renderIntro();
    });
    $('btn-trail-start').addEventListener('click', start);
    $('btn-trail-quit').addEventListener('click', () => {
      stop();
      renderIntro();
    });
    renderIntro();
  }

  global.Expedition = { init, renderIntro, stop };
})(window);
