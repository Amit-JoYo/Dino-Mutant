/* Counting board: draggable dino eggs (ones / tens), place-value nests and a free table. */
(function (global) {
  'use strict';

  const MAX_TENS = 10;
  const MAX_ONES = 20;
  const MAX_FREE = 40;
  const TINTS = [
    ['#fff6e0', '#d9b36a'], ['#e3f4ff', '#6aaad9'], ['#ffe6f0', '#d96a9a'],
    ['#eaffd9', '#7bbd4f'], ['#f1e6ff', '#9a6ad9'],
  ];

  function eggSvg(kind, i) {
    if (kind === 'ten') {
      return `<svg viewBox="0 0 44 56" aria-hidden="true"><path d="M22 2C34 2 42 22 42 36C42 48 33 54 22 54C11 54 2 48 2 36C2 22 10 2 22 2Z" fill="#ffd23f" stroke="#d99a00" stroke-width="3"/><text x="22" y="40" text-anchor="middle" font-size="19" font-weight="700" fill="#7a5200" font-family="Rubik,Arial,sans-serif">10</text></svg>`;
    }
    const [f, s] = TINTS[i % TINTS.length];
    return `<svg viewBox="0 0 30 38" aria-hidden="true"><path d="M15 2C23 2 28 15 28 24C28 33 22 36 15 36C8 36 2 33 2 24C2 15 7 2 15 2Z" fill="${f}" stroke="${s}" stroke-width="2"/><circle cx="11" cy="21" r="2.2" fill="${s}" opacity=".5"/><circle cx="19" cy="27" r="2" fill="${s}" opacity=".5"/></svg>`;
  }

  const egg = (kind, src, i, extra) =>
    `<div class="egg ${kind}" data-t="${kind}" data-src="${src}"${extra || ''}>${eggSvg(kind, i)}</div>`;

  function mount(root, opts) {
    const nums = ((opts && opts.nums) || []).filter((n) => Number.isInteger(n) && n > 0 && n <= 99).slice(0, 3);
    const st = { tens: 0, ones: 0, free: [], nextId: 1 };
    let drag = null;
    const app = () => global.App;
    const toast = (m) => app() && app().toast(m);

    root.innerHTML = `
      <div class="mb">
        <div class="mb-total">
          <span>הַמִּסְפָּר בַּקִּנִּים:</span> <b class="mb-num" dir="ltr">0</b>
          <button class="btn small ghost" data-mb="say" aria-label="הַקְרֵא אֶת הַמִּסְפָּר">🔊</button>
        </div>
        <div class="mb-nests" dir="ltr">
          <div class="nest" data-kind="tens"><div class="nest-title"></div><div class="nest-eggs"></div></div>
          <div class="nest" data-kind="ones"><div class="nest-title"></div><div class="nest-eggs"></div></div>
        </div>
        <button class="btn small mb-exchange" data-mb="exchange" hidden>🔄 הַחֲלִיפִי 10 בֵּיצִים בְּבֵיצַת עֶשֶׂר</button>
        <div class="mb-table"><span class="mb-table-hint">שֻׁלְחָן חָפְשִׁי: גָּרְרִי לְכָאן בֵּיצִים כְּדֵי לִסְפֹּר</span></div>
        <div class="mb-tray" data-zone="tray">
          <div class="tray-item">${egg('ones', 'tray-ones', 0)}<small>1</small></div>
          <div class="tray-item">${egg('ten', 'tray-ten', 0)}<small>10</small></div>
          <div class="mb-btns">
            ${nums.map((n) => `<button class="btn small alt" data-mb="place" data-n="${n}">🪺 הַנִּיחִי ${n}</button>`).join('')}
            <button class="btn small ghost" data-mb="clear">🧹 נִקּוּי</button>
          </div>
        </div>
        <p class="muted mb-help">לוֹחֲצִים עַל בֵּיצָה בַּמַּחְסָן אוֹ גּוֹרְרִים אוֹתָהּ לַקֵּן. לוֹחֲצִים עַל בֵּיצַת עֶשֶׂר בַּקֵּן כְּדֵי לִשְׁבֹּר אוֹתָהּ ל-10 בֵּיצִים. גּוֹרְרִים בֵּיצָה אֶל הַמַּחְסָן כְּדֵי לְהָסִיר.</p>
      </div>`;

    const $q = (s) => root.querySelector(s);
    const nestTens = $q('.nest[data-kind=tens]');
    const nestOnes = $q('.nest[data-kind=ones]');
    const table = $q('.mb-table');

    function render() {
      nestTens.querySelector('.nest-title').textContent = `עֲשָׂרוֹת: ${st.tens} ← ${st.tens * 10}`;
      nestOnes.querySelector('.nest-title').textContent = `יְחִידוֹת: ${st.ones}`;
      nestTens.querySelector('.nest-eggs').innerHTML = Array.from({ length: st.tens }, (_, i) => egg('ten', 'nest-tens', i)).join('');
      nestOnes.querySelector('.nest-eggs').innerHTML = Array.from({ length: st.ones }, (_, i) => egg('ones', 'nest-ones', i)).join('');
      table.querySelectorAll('.egg').forEach((e) => e.remove());
      table.insertAdjacentHTML('beforeend', st.free.map((f, i) =>
        egg(f.kind, 'free', i, ` data-id="${f.id}" style="left:${f.x * 100}%;top:${f.y * 100}%"`)).join(''));
      $q('.mb-num').textContent = st.tens * 10 + st.ones;
      $q('.mb-exchange').hidden = st.ones < 10;
      nestOnes.classList.toggle('full', st.ones >= 10);
    }

    function addToNest(kind) {
      if (kind === 'ten') {
        if (st.tens >= MAX_TENS) return toast('קֵן הָעֲשָׂרוֹת מָלֵא'), false;
        st.tens++;
      } else {
        if (st.ones >= MAX_ONES) return toast('קֵן הַיְּחִידוֹת מָלֵא. אֶפְשָׁר לְהַחֲלִיף 10 בֵּיצִים בְּבֵיצַת עֶשֶׂר'), false;
        st.ones++;
      }
      return true;
    }

    function removeFromSource(d) {
      if (d.src === 'nest-tens') st.tens--;
      else if (d.src === 'nest-ones') st.ones--;
      else if (d.src === 'free') st.free = st.free.filter((f) => String(f.id) !== d.id);
    }

    function restoreSource(d) {
      if (d.src === 'nest-tens') st.tens++;
      else if (d.src === 'nest-ones') st.ones++;
      else if (d.src === 'free') st.free.push(d.snapshot);
    }

    function tap(d) {
      if (d.src === 'tray-ones') addToNest('ones');
      else if (d.src === 'tray-ten') addToNest('ten');
      else if (d.src === 'nest-ones') st.ones--;
      else if (d.src === 'nest-tens') {
        if (st.ones + 10 > MAX_ONES) return toast('אֵין מָקוֹם בְּקֵן הַיְּחִידוֹת. אֶפְשָׁר לְהָסִיר כַּמָּה בֵּיצִים'), render();
        st.tens--;
        st.ones += 10;
      }
      render();
    }

    function dropOn(d, e) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const zone = target && target.closest('.nest, .mb-table, .mb-tray');
      const fromTray = d.src.startsWith('tray');
      const kind = d.kind;
      if (!zone || !root.contains(zone)) return;

      if (zone.classList.contains('nest')) {
        const nestKind = zone.dataset.kind === 'tens' ? 'ten' : 'ones';
        if (nestKind !== kind) {
          zone.classList.add('shake');
          setTimeout(() => zone.classList.remove('shake'), 400);
          return toast(kind === 'ten' ? 'בֵּיצַת עֶשֶׂר שַׁיֶּכֶת לְקֵן הָעֲשָׂרוֹת' : 'בֵּיצָה רְגִילָה שַׁיֶּכֶת לְקֵן הַיְּחִידוֹת');
        }
        const sameNest = d.src === `nest-${zone.dataset.kind}`;
        if (sameNest) return;
        removeFromSource(d);
        if (!addToNest(kind)) restoreSource(d);
      } else if (zone.classList.contains('mb-table')) {
        removeFromSource(d);
        if (st.free.length >= MAX_FREE) {
          restoreSource(d);
          return toast('הַשֻּׁלְחָן מָלֵא');
        }
        const r = table.getBoundingClientRect();
        const x = Math.min(0.94, Math.max(0.06, (e.clientX - r.left) / r.width));
        const y = Math.min(0.9, Math.max(0.12, (e.clientY - r.top) / r.height));
        st.free.push({ id: st.nextId++, kind, x, y });
      } else if (zone.classList.contains('mb-tray')) {
        if (!fromTray) removeFromSource(d);
      }
    }

    function markOver(e) {
      root.querySelectorAll('.over').forEach((n) => n.classList.remove('over'));
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const z = t && t.closest('.nest, .mb-table, .mb-tray');
      if (z && root.contains(z)) z.classList.add('over');
    }

    function onMove(e) {
      if (!drag || e.pointerId !== drag.pid) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) {
        drag.moved = true;
        const g = document.createElement('div');
        g.className = `egg ${drag.kind} egg-ghost`;
        g.innerHTML = eggSvg(drag.kind, 0);
        document.body.appendChild(g);
        drag.ghost = g;
        if (!drag.src.startsWith('tray')) drag.el.classList.add('lifted');
      }
      if (drag.moved) {
        drag.ghost.style.left = `${e.clientX}px`;
        drag.ghost.style.top = `${e.clientY}px`;
        drag.ghost.style.display = 'none';
        markOver(e);
        drag.ghost.style.display = '';
      }
    }

    function onUp(e) {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      end();
      if (e.type === 'pointercancel') return render();
      if (!d.moved) return tap(d);
      d.ghost.style.display = 'none';
      dropOn(d, e);
      render();
    }

    function end() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (drag && drag.ghost) drag.ghost.remove();
      root.querySelectorAll('.over').forEach((n) => n.classList.remove('over'));
      drag = null;
    }

    root.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.egg');
      if (!el || drag || !root.contains(el) || e.button > 0) return;
      e.preventDefault();
      const d = { src: el.dataset.src, kind: el.dataset.t, id: el.dataset.id, el, sx: e.clientX, sy: e.clientY, moved: false, ghost: null, pid: e.pointerId };
      if (d.src === 'free') d.snapshot = st.free.find((f) => String(f.id) === d.id);
      drag = d;
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mb]');
      if (!b) return;
      e.stopPropagation();
      const act = b.dataset.mb;
      if (act === 'clear') {
        st.tens = 0; st.ones = 0; st.free = [];
      } else if (act === 'exchange') {
        if (st.tens >= MAX_TENS) return toast('קֵן הָעֲשָׂרוֹת מָלֵא');
        st.ones -= 10;
        st.tens++;
        nestTens.classList.add('pop');
        setTimeout(() => nestTens.classList.remove('pop'), 500);
      } else if (act === 'place') {
        const n = Number(b.dataset.n);
        const t = Math.floor(n / 10);
        const o = n % 10;
        if (st.tens + t > MAX_TENS || st.ones + o > MAX_ONES) return toast('אֵין מָקוֹם בַּקִּנִּים. אֶפְשָׁר לְנַקּוֹת אוֹ לְהַחֲלִיף');
        st.tens += t;
        st.ones += o;
      } else if (act === 'say') {
        return app() && app().speak(String(st.tens * 10 + st.ones));
      }
      render();
    });

    render();
    return { destroy: () => { end(); root.innerHTML = ''; } };
  }

  global.Manipulatives = { mount };
})(window);
