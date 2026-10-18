/* Procedural 2nd-grade math + parameterized Hebrew sentence engine, plus the puzzle UI widget. */
(function (global) {
  'use strict';

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[rnd(0, arr.length - 1)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const NIKUD_RE = /[\u0591-\u05C7]/g;
  const stripNikud = (s) => String(s).replace(NIKUD_RE, '');
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eq = (inner) => `<span class="eq" dir="ltr">${inner}</span>`;
  const blank = '<span class="blank">?</span>';

  const KINDS = [
    { id: 'mix', label: 'הַכֹּל' },
    { id: 'bridge', label: 'מַעֲבָר עֲשָׂרָה' },
    { id: 'tens', label: 'עֲשָׂרוֹת וִיחִידוֹת' },
    { id: 'missing', label: 'מִסְפָּר חָסֵר' },
    { id: 'story', label: 'סִפּוּרֵי חֶשְׁבּוֹן' },
    { id: 'words', label: 'מִילִּים' },
  ];

  function numberChoices(answer) {
    const set = new Set([answer]);
    const cands = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10];
    if (answer >= 10 && answer < 100) {
      cands.unshift(Number(String(answer).split('').reverse().join('')));
    }
    shuffle(cands).forEach((c) => {
      if (c >= 0 && set.size < 4) set.add(c);
    });
    let k = 3;
    while (set.size < 4) set.add(answer + k++);
    return shuffle([...set]).map((v) => ({ v, text: String(v) }));
  }

  /* ---------- 1. Bridging 10 ---------- */
  function bridge() {
    if (Math.random() < 0.5) {
      const a = rnd(2, 9);
      const b = rnd(Math.max(2, 11 - a), 9);
      const toTen = 10 - a;
      return {
        kind: 'bridge',
        label: 'מַעֲבָר עֲשָׂרָה',
        prompt: 'כַּמָּה זֶה?',
        equation: eq(`${a} + ${b} = ${blank}`),
        speak: `${a} ועוד ${b} שָׁוֶה כַּמָּה?`,
        answer: a + b,
        choices: numberChoices(a + b),
        hint: `קֹדֶם מַשְׁלִימִים לְ-10: ${a} + ${toTen} = 10. נִשְׁאֲרוּ עוֹד ${b - toTen}, אָז 10 + ${b - toTen} = ${a + b}.`,
      };
    }
    const a = rnd(11, 18);
    const b = rnd(Math.max(2, a - 9), 9);
    const down = a - 10;
    return {
      kind: 'bridge',
      label: 'מַעֲבָר עֲשָׂרָה',
      prompt: 'כַּמָּה זֶה?',
      equation: eq(`${a} - ${b} = ${blank}`),
      speak: `${a} פָּחוֹת ${b} שָׁוֶה כַּמָּה?`,
      answer: a - b,
      choices: numberChoices(a - b),
      hint: `קֹדֶם יוֹרְדִים לְ-10: ${a} - ${down} = 10. נִשְׁאֲרוּ עוֹד ${b - down} לְהוֹרִיד: 10 - ${b - down} = ${a - b}.`,
    };
  }

  /* ---------- 2. Tens & units ---------- */
  function tens() {
    const variant = rnd(1, 5);
    const t = rnd(1, 9);
    const u = rnd(1, 9);
    const n = t * 10 + u;
    const label = 'עֲשָׂרוֹת וִיחִידוֹת';
    if (variant === 1) {
      return {
        kind: 'tens', label, prompt: 'כַּמָּה זֶה?',
        equation: eq(`${t * 10} + ${u} = ${blank}`),
        speak: `${t * 10} ועוד ${u} שָׁוֶה כַּמָּה?`,
        answer: n, choices: numberChoices(n),
        hint: `${t * 10} הֵם ${t} עֲשָׂרוֹת, וְעוֹד ${u} יְחִידוֹת. מְחַבְּרִים: ${n}.`,
      };
    }
    if (variant === 2) {
      return {
        kind: 'tens', label,
        prompt: `${t} עֲשָׂרוֹת וְ-${u} יְחִידוֹת. אֵיזֶה מִסְפָּר זֶה?`,
        equation: '',
        nums: [],
        speak: `${t} עֲשָׂרוֹת וְ ${u} יְחִידוֹת. אֵיזֶה מִסְפָּר זֶה?`,
        answer: n, choices: numberChoices(n),
        hint: `עֶשֶׂר פְּעָמִים ${t} זֶה ${t * 10}. מוֹסִיפִים ${u}.`,
      };
    }
    if (variant === 3) {
      return {
        kind: 'tens', label,
        prompt: `כַּמָּה עֲשָׂרוֹת יֵשׁ בַּמִּסְפָּר ${n}?`,
        equation: '',
        speak: `כַּמָּה עֲשָׂרוֹת יֵשׁ בַּמִּסְפָּר ${n}?`,
        answer: t, choices: numberChoices(t),
        hint: `הַסִּפְרָה הָרִאשׁוֹנָה בַּמִּסְפָּר ${n} אוֹמֶרֶת כַּמָּה עֲשָׂרוֹת יֵשׁ.`,
      };
    }
    if (variant === 4) {
      const m = rnd(1, 8) * 10 + u;
      const add = Math.random() < 0.5;
      const r = add ? m + 10 : m - 10;
      return {
        kind: 'tens', label, prompt: 'כַּמָּה זֶה?',
        equation: eq(`${m} ${add ? '+' : '-'} 10 = ${blank}`),
        speak: `${m} ${add ? 'ועוד' : 'פָּחוֹת'} 10 שָׁוֶה כַּמָּה?`,
        answer: r, choices: numberChoices(r),
        hint: `מוֹסִיפִים אוֹ מוֹרִידִים עֲשָׂרָה אַחַת. סִפְרַת הַיְּחִידוֹת נִשְׁאֲרָת ${u}.`,
      };
    }
    return {
      kind: 'tens', label,
      prompt: `כַּמָּה יְחִידוֹת יֵשׁ בַּמִּסְפָּר ${n}?`,
      equation: '',
      speak: `כַּמָּה יְחִידוֹת יֵשׁ בַּמִּסְפָּר ${n}?`,
      answer: u, choices: numberChoices(u),
      hint: `הַסִּפְרָה הָאַחֲרוֹנָה בַּמִּסְפָּר ${n} אוֹמֶרֶת כַּמָּה יְחִידוֹת יֵשׁ.`,
    };
  }

  /* ---------- 3. Missing addend / inverse ---------- */
  function missing() {
    const label = 'מִסְפָּר חָסֵר';
    const prompt = 'אֵיזֶה מִסְפָּר חָסֵר?';
    if (Math.random() < 0.4) {
      const a = rnd(2, 8) * 10 + rnd(0, 5);
      const x = rnd(2, 9);
      const c = a + x;
      return {
        kind: 'missing', label, prompt,
        equation: eq(`${a} + ${blank} = ${c}`),
        speak: `${a} ועוד כַּמָּה שָׁוֶה ${c}?`,
        answer: x, choices: numberChoices(x),
        hint: `הֶפֶךְ הַחִבּוּר הוּא חִסּוּר: ${c} - ${a} = ${x}.`,
      };
    }
    const mode = rnd(1, 3);
    const a = rnd(3, 9);
    const c = rnd(Math.max(11, a + 2), Math.min(18, a + 9));
    const x = c - a;
    if (mode === 1) {
      return {
        kind: 'missing', label, prompt,
        equation: eq(`${a} + ${blank} = ${c}`),
        speak: `${a} ועוד כַּמָּה שָׁוֶה ${c}?`,
        answer: x, choices: numberChoices(x),
        hint: `הֶפֶךְ הַחִבּוּר הוּא חִסּוּר: ${c} - ${a} = ${x}.`,
      };
    }
    if (mode === 2) {
      return {
        kind: 'missing', label, prompt,
        equation: eq(`${blank} + ${a} = ${c}`),
        speak: `כַּמָּה ועוד ${a} שָׁוֶה ${c}?`,
        answer: x, choices: numberChoices(x),
        hint: `הֶפֶךְ הַחִבּוּר הוּא חִסּוּר: ${c} - ${a} = ${x}.`,
      };
    }
    return {
      kind: 'missing', label, prompt,
      equation: eq(`${c} - ${blank} = ${a}`),
      speak: `${c} פָּחוֹת כַּמָּה שָׁוֶה ${a}?`,
      answer: x, choices: numberChoices(x),
      hint: `בּוֹדְקִים אֶת הַתְּשׁוּבָה בְּחִבּוּר: ${a} + ${x} = ${c}.`,
    };
  }

  /* ---------- 4. Parameterized Hebrew word problems ---------- */
  const NAMES = [
    { n: 'דִּינָה', f: true }, { n: 'נוֹעָה', f: true }, { n: 'מָיָה', f: true },
    { n: 'אוֹרִי', f: false }, { n: 'רוֹרִי', f: false }, { n: 'עוֹמֶר', f: false },
  ];
  const ITEMS = ['בֵּיצִים', 'אֲבָנִים', 'עָלִים', 'פֵּרוֹת', 'גְּרָעִינִים', 'כּוֹכָבִים'];

  function story() {
    const who = pick(NAMES);
    const item = pick(ITEMS);
    const type = rnd(1, 3);
    const n = who.n;
    const label = 'סִפּוּר חֶשְׁבּוֹן';
    if (type === 1) {
      const a = rnd(3, 9);
      const b = rnd(Math.max(2, 11 - a), 9);
      const text = who.f
        ? `${n} אָסְפָה ${a} ${item}. אַחַר כָּךְ הִיא מָצְאָה עוֹד ${b}. כַּמָּה ${item} יֵשׁ לָהּ עַכְשָׁיו?`
        : `${n} אָסַף ${a} ${item}. אַחַר כָּךְ הוּא מָצָא עוֹד ${b}. כַּמָּה ${item} יֵשׁ לוֹ עַכְשָׁיו?`;
      return { kind: 'story', label, prompt: text, equation: '', speak: text, answer: a + b, choices: numberChoices(a + b), hint: `זֶה חִבּוּר: ${a} + ${b}.` };
    }
    if (type === 2) {
      const a = rnd(11, 18);
      const b = rnd(Math.max(2, a - 9), 9);
      const text = who.f
        ? `הָיוּ לְ${n} ${a} ${item}. הִיא נָתְנָה ${b} לַחֲבֵרָה. כַּמָּה ${item} נִשְׁאֲרוּ לָהּ?`
        : `הָיוּ לְ${n} ${a} ${item}. הוּא נָתַן ${b} לַחֲבֵרָה. כַּמָּה ${item} נִשְׁאֲרוּ לוֹ?`;
      return { kind: 'story', label, prompt: text, equation: '', speak: text, answer: a - b, choices: numberChoices(a - b), hint: `זֶה חִסּוּר: ${a} - ${b}.` };
    }
    const a = rnd(3, 9);
    const c = rnd(Math.max(11, a + 2), Math.min(18, a + 9));
    const text = who.f
      ? `לְ${n} יֵשׁ ${a} ${item}. הִיא רוֹצָה לְהַגִּיעַ לְ-${c}. כַּמָּה ${item} חֲסֵרִים לָהּ?`
      : `לְ${n} יֵשׁ ${a} ${item}. הוּא רוֹצֶה לְהַגִּיעַ לְ-${c}. כַּמָּה ${item} חֲסֵרִים לוֹ?`;
    return { kind: 'story', label, prompt: text, equation: '', speak: text, answer: c - a, choices: numberChoices(c - a), hint: `כַּמָּה מוֹסִיפִים לְ-${a} כְּדֵי לְהַגִּיעַ לְ-${c}? ${c} - ${a}.` };
  }

  /* ---------- 5. Word gates (uses the parent's custom words) ---------- */
  const DEFAULT_WORDS = ['דִּינוֹזָאוּר', 'בֵּיצָה', 'מַעְבָּדָה', 'כּוֹכָב', 'חָלָל', 'יַעַר', 'שֶׁמֶשׁ', 'סִפְרִיָּה'];

  function words(ctx) {
    const given = ctx && ctx.words ? [...new Set(ctx.words)] : [];
    const pool = given.length >= 3 ? given : DEFAULT_WORDS;
    const target = pick(pool);
    const canSpeak = !ctx || ctx.canSpeak !== false;
    if (canSpeak && Math.random() < 0.5) {
      const others = shuffle(pool.filter((w) => w !== target)).slice(0, 2);
      return {
        kind: 'words', label: 'מִילִּים',
        prompt: 'לַחֲצִי עַל 🔊, הַקְשִׁיבִי וּבַחֲרִי אֶת הַמִּלָּה שֶׁשָּׁמַעְתְּ',
        equation: '', speak: target,
        answer: target, choices: shuffle([target, ...others]).map((w) => ({ v: w, text: w, word: true })),
        hint: `הַמִּלָּה מַתְחִילָה בָּאוֹת ${stripNikud(target)[0]}.`,
      };
    }
    const letters = (stripNikud(target).match(/[א-ת]/g) || []).length;
    return {
      kind: 'words', label: 'מִילִּים',
      prompt: 'כַּמָּה אוֹתִיּוֹת יֵשׁ בַּמִּלָּה?',
      equation: `<span class="big-word">${escapeHtml(target)}</span>`,
      speak: target,
      answer: letters, choices: numberChoices(letters),
      hint: 'סוֹפְרִים רַק אוֹתִיּוֹת, לֹא נְקֻדּוֹת. אֶפְשָׁר לְסַמֵּן כָּל אוֹת בָּאֶצְבַּע.',
    };
  }

  const GENERATORS = { bridge, tens, missing, story, words };

  function generate(kind, ctx) {
    let k = kind;
    if (!k || k === 'mix') k = pick(['bridge', 'bridge', 'tens', 'tens', 'missing', 'story', 'words']);
    return GENERATORS[k](ctx || {});
  }

  /* Numbers worth offering as "place in the nests" shortcuts. */
  function numbersOf(p) {
    if (Array.isArray(p.nums)) return p.nums;
    const text = p.equation ? p.equation.replace(/<[^>]*>/g, ' ') : p.prompt;
    const found = (text.match(/\d+/g) || []).map(Number).filter((n) => n > 0 && n <= 99);
    return [...new Set(found)].slice(0, 3);
  }

  /* ---------- UI widget ---------- */
  let boardOpen = false; // stays open from one puzzle to the next
  function mount(container, opts) {
    const o = Object.assign({ kind: 'mix', onSolved: null, onWrong: null }, opts);
    let current = null;
    let wrong = 0;
    let solved = false;
    let board = null;
    const app = () => global.App;

    function openBoard() {
      const host = container.querySelector('.pz-board');
      if (!host || !global.Manipulatives) return;
      host.hidden = false;
      board = global.Manipulatives.mount(host, { nums: numbersOf(current) });
    }

    function toggleBoard() {
      boardOpen = !boardOpen;
      const btn = container.querySelector('[data-act=eggs]');
      if (btn) btn.classList.toggle('on', boardOpen);
      if (boardOpen) return openBoard();
      if (board) board.destroy();
      board = null;
      container.querySelector('.pz-board').hidden = true;
    }

    function render() {
      current = generate(o.kind, {
        words: app() ? app().getWords() : [],
        canSpeak: 'speechSynthesis' in global,
      });
      wrong = 0;
      solved = false;
      if (board) board.destroy();
      board = null;
      const p = current;
      container.innerHTML = `
        <div class="pz">
          <div class="pz-label">${p.label}</div>
          <div class="pz-prompt">${escapeHtml(p.prompt)}</div>
          ${p.equation ? `<div class="pz-eq">${p.equation}</div>` : ''}
          <div class="pz-tools">
            <button class="btn small" data-act="speak">🔊 הַקְרֵא לִי</button>
            <button class="btn small ghost" data-act="hint">💡 רֶמֶז</button>
            <button class="btn small alt${boardOpen ? ' on' : ''}" data-act="eggs">🥚 בֵּיצִים לִסְפִירָה</button>
          </div>
          <div class="pz-hint" hidden></div>
          <div class="pz-board" hidden></div>
          <div class="pz-choices">
            ${p.choices.map((c, i) => `<button class="choice${c.word ? ' word' : ''}" data-i="${i}">${escapeHtml(c.text)}</button>`).join('')}
          </div>
          <div class="pz-feedback" aria-live="polite"></div>
        </div>`;
      if (boardOpen) openBoard();
    }

    function showHint() {
      const h = container.querySelector('.pz-hint');
      h.textContent = current.hint;
      h.hidden = false;
    }

    container.onclick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.act === 'speak') return app() && app().speak(current.speak);
      if (btn.dataset.act === 'hint') return showHint();
      if (btn.dataset.act === 'eggs') return toggleBoard();
      if (solved || btn.dataset.i === undefined || btn.disabled) return;
      const choice = current.choices[Number(btn.dataset.i)];
      const fb = container.querySelector('.pz-feedback');
      if (choice.v === current.answer) {
        solved = true;
        btn.classList.add('correct');
        container.querySelectorAll('.choice').forEach((b) => (b.disabled = true));
        fb.textContent = pick(['כׇּל הַכָּבוֹד! 🌟', 'מְצֻיָּן! 🎉', 'יָפֶה מְאֹד! 🦖', 'נָכוֹן! ✨']);
        fb.className = 'pz-feedback good';
        if (o.onSolved) o.onSolved(current, wrong);
      } else {
        wrong++;
        btn.classList.add('wrong');
        btn.disabled = true;
        fb.textContent = 'כִּמְעַט! נַסִּי שׁוּב 💪';
        fb.className = 'pz-feedback bad';
        if (wrong >= 2) showHint();
        if (o.onWrong) o.onWrong(current, wrong);
      }
    };

    render();
    return { next: render, isSolved: () => solved, destroy: () => { if (board) board.destroy(); container.onclick = null; container.innerHTML = ''; } };
  }

  global.Puzzles = { KINDS, generate, mount, stripNikud, escapeHtml, numberChoices, DEFAULT_WORDS };
})(typeof window !== 'undefined' ? window : globalThis);
