/* Picture cards to post in WhatsApp: a dino card and a progress card, drawn on a canvas and shared as a PNG. */
(function (global) {
  'use strict';

  const SITE = 'https://amit-joyo.github.io/Dino-Mutant/';
  const FONT = "Rubik, 'Varela Round', Arial, sans-serif";
  const SIZE = 1080;
  const $ = (id) => document.getElementById(id);
  const R = () => global.Renderer;

  // The rigs are styled by the page CSS, so a standalone picture needs its own tiny stylesheet and a wider viewBox for hats and wings.
  function standalone(html, w) {
    const h = Math.round((w * 330) / 380);
    return html
      .replace('viewBox="0 0 300 220"', 'viewBox="-40 -80 380 330"')
      .replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `)
      .replace(/(<svg[^>]*>)/, '$1<style>.rig-lid{opacity:0}</style>');
  }

  const loadImage = (src) => new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('image'));
    i.src = src;
  });

  const dinoImage = (d, w) => loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(standalone(global.App.dinoHtml(d), w))}`);

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, str, x, y, size, color, weight, dir) {
    ctx.font = `${weight || 700} ${size}px ${FONT}`;
    ctx.fillStyle = color || '#23323a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = dir || 'rtl';
    ctx.fillText(str, x, y);
  }

  function background(ctx, title) {
    const sky = ctx.createLinearGradient(0, 0, 0, SIZE);
    sky.addColorStop(0, '#8fd3ff');
    sky.addColorStop(0.62, '#e4f6ff');
    sky.addColorStop(0.62, '#9bd87d');
    sky.addColorStop(1, '#6cbf55');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#2e7d4f';
    ctx.fillRect(0, 0, SIZE, 120);
    text(ctx, title, SIZE / 2, 62, 58, '#fff');
    text(ctx, 'אֶפְשָׁר לְשַׂחֵק גַּם אַתֶּם!', SIZE / 2, SIZE - 74, 34, '#14391f');
    text(ctx, SITE.replace('https://', ''), SIZE / 2, SIZE - 30, 30, '#14391f', 500, 'ltr');
  }

  async function fontsReady() {
    try {
      await Promise.race([document.fonts.load(`700 40px Rubik`), new Promise((r) => setTimeout(r, 1200))]);
    } catch (e) { /* the fallback font is fine */ }
  }

  async function dinoCard(d) {
    await fontsReady();
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    background(ctx, '🧬 דִּינוֹ-מוּטַנְט');
    const img = await dinoImage(d, 880);
    ctx.drawImage(img, (SIZE - 880) / 2, 150);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    roundRect(ctx, 150, 800, 780, 110, 55);
    ctx.fill();
    const name = global.App.dinoName(d);
    text(ctx, name, SIZE / 2, 855, 64, '#23323a');
    const sp = R().SPECIES[d.species];
    const bits = [d.legendary ? '🌟 אַגָּדִי' : `${R().TRAITS[sp.trait].icon} ${R().TRAITS[sp.trait].name}`];
    if (d.pet && global.World) bits.push(`❤️ ${global.World.Pets.hearts(d)}`);
    text(ctx, bits.join('   '), SIZE / 2, 950, 40, '#14391f');
    return canvas;
  }

  async function progressCard() {
    await fontsReady();
    const App = global.App;
    const st = App.state;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    background(ctx, '🦖 הַגַּן שֶׁלִּי');
    const species = Object.keys(R().SPECIES);
    const owned = new Set(st.dinos.map((d) => d.species));
    const legends = new Set(st.dinos.filter((d) => d.legendary).map((d) => d.species));
    const stories = Object.values(st.progress || {}).filter((p) => p && p.done).length;

    const stats = [
      [`${owned.size}/${species.length}`, '🦖 דִּינוֹזָאוּרִים'],
      [`${legends.size}/${species.length}`, '🌟 אַגָּדִיִּים'],
      [`${stories}`, '📖 סִפּוּרִים'],
    ];
    stats.forEach(([big, label], i) => {
      const x = 90 + i * 300;
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      roundRect(ctx, x, 150, 270, 150, 30);
      ctx.fill();
      text(ctx, big, x + 135, 205, 70, '#2e7d4f');
      text(ctx, label, x + 135, 265, 30, '#23323a', 500);
    });

    const cols = 5;
    const cellW = 200;
    const gx = (SIZE - cols * cellW) / 2;
    const imgs = await Promise.all(species.map((sp) => {
      const mine = st.dinos.filter((d) => d.species === sp);
      const pick = mine.find((d) => d.legendary) || mine[0];
      return pick ? dinoImage(pick, 190) : null;
    }));
    species.forEach((sp, i) => {
      const x = gx + (i % cols) * cellW;
      const y = 340 + Math.floor(i / cols) * 230;
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      roundRect(ctx, x + 4, y, cellW - 8, 210, 24);
      ctx.fill();
      if (imgs[i]) ctx.drawImage(imgs[i], x + 5, y + 20);
      else text(ctx, '?', x + cellW / 2, y + 105, 90, 'rgba(35,50,58,.3)');
    });
    return canvas;
  }

  async function present(makeCanvas, fileName, caption) {
    const App = global.App;
    App.toast('מְכִינִים כַּרְטִיס...');
    let canvas;
    try {
      canvas = await makeCanvas();
    } catch (e) {
      return App.toast('לֹא הִצְלַחְנוּ לְהָכִין אֶת הַכַּרְטִיס');
    }
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return App.toast('לֹא הִצְלַחְנוּ לְהָכִין אֶת הַכַּרְטִיס');
    const url = URL.createObjectURL(blob);
    const file = new File([blob], fileName, { type: 'image/png' });
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    App.openModal(`
      <h2>📤 כַּרְטִיס לְשִׁתּוּף</h2>
      <img class="share-prev" alt="" src="${url}">
      <div class="row">
        ${canShare ? '<button class="btn" id="sh-go">📤 שִׁתּוּף</button>' : ''}
        <a class="btn alt" id="sh-save" href="${url}" download="${fileName}">💾 שְׁמִירָה</a>
        <button class="btn ghost" data-close>סְגִירָה</button>
      </div>`, () => URL.revokeObjectURL(url));
    if (canShare) {
      $('sh-go').onclick = () => navigator.share({ files: [file], text: `${caption} ${SITE}` }).catch(() => {});
    }
    return undefined;
  }

  const shareDino = (d) => present(() => dinoCard(d), 'dino.png', 'הַדִּינוֹזָאוּר שֶׁלִּי בְּדִּינוֹ-מוּטַנְט! 🦖');
  const shareProgress = () => present(progressCard, 'my-park.png', 'הַגַּן שֶׁלִּי בְּדִּינוֹ-מוּטַנְט! 🦖');

  function init() {
    const b = $('btn-share-progress');
    if (b) b.addEventListener('click', shareProgress);
  }

  global.Share = { init, shareDino, shareProgress, dinoCard, progressCard };
})(window);
