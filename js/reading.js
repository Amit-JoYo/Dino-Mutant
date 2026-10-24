/* Karaoke word-by-word school reading mode. */
(function (global) {
  'use strict';

  const esc = (s) => global.Puzzles.escapeHtml(s);

  const DEFAULT_STORIES = [
    {
      id: 'sample-dino',
      title: 'הַדִּינוֹזָאוּר הַקָּטָן',
      text: [
        'בְּיַעַר גָּדוֹל חַי דִּינוֹזָאוּר קָטָן. שְׁמוֹ הָיָה דִּינוֹ.',
        'יוֹם אֶחָד דִּינוֹ מָצָא בֵּיצָה גְּדוֹלָה עַל הָאֲדָמָה. הוּא שָׁמַר עָלֶיהָ כָּל הַיּוֹם.',
        'בַּלַּיְלָה הַבֵּיצָה נִסְדְּקָה, וְדִינוֹזָאוּר קָטָן יָצָא מִמֶּנָּה. דִּינוֹ חִיֵּךְ וְאָמַר: שָׁלוֹם, חָבֵר חָדָשׁ!',
      ].join('\n'),
    },
    {
      id: 'sample-space',
      title: 'מַסָּע לֶחָלָל',
      text: [
        'הַלַּיְלָה הַיַּלְדָּה הִבִּיטָה בַּכּוֹכָבִים. הִיא רָאֲתָה רַקֶּטָה קְטַנָּה בַּשָּׁמַיִם.',
        'הָרַקֶּטָה נָחֲתָה עַל הַיָּרֵחַ. אַסְטְרוֹנָאוּט קָטָן יָצָא מִמֶּנָּה וְנִפְנֵף לָהּ.',
        'הַיַּלְדָּה חָלְמָה עַל חָלָל גָּדוֹל וְעַל חֲבֵרִים חֲדָשִׁים.',
      ].join('\n'),
    },
  ];

  let story = null;
  let paragraphs = [];
  let parIdx = 0;
  let wordIdx = 0;
  let words = [];
  const $ = (id) => document.getElementById(id);

  function parse(text) {
    return String(text)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  /* ---------- voice mode: listen to the child and advance when the word is read ---------- */
  const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
  const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  let rec = null;
  let listening = false;
  let consumed = {};

  const norm = (s) => (global.Puzzles.stripNikud(s).match(/[א-ת]/g) || []).map((c) => FINALS[c] || c).join('');
  const skeleton = (s) => s.replace(/[וי]/g, '');

  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // Recognizers return unpointed text with free spelling, so compare letters only, ignoring ו/י and allowing one typo in longer words.
  function matches(expected, spoken) {
    const a = norm(expected);
    const b = norm(spoken);
    if (!a) return true;
    if (!b) return false;
    if (a === b) return true;
    const sa = skeleton(a);
    const sb = skeleton(b);
    if (!sa || !sb) return false;
    return sa === sb || (sa.length >= 4 && lev(sa, sb) <= 1);
  }

  function setMicUi() {
    const b = $('btn-mic');
    b.classList.toggle('listening', listening);
    b.textContent = listening ? '⏹ מַקְשִׁיב... (לַחֲצִי לַעֲצֹר)' : '🎤 קְרִיאָה בְּקוֹל — הַמִּלָּה תִּתְקַדֵּם לְבַד';
    $('reader-heard').hidden = !listening;
    if (!listening) $('reader-heard').textContent = '';
  }

  function stopListening() {
    listening = false;
    if (rec) {
      rec.onend = null;
      try { rec.abort(); } catch (e) { /* already stopped */ }
      rec = null;
    }
    setMicUi();
  }

  function startListening() {
    if (!SR) return global.App.toast('הַדַּפְדְּפָן הַזֶּה לֹא תּוֹמֵךְ בְּזִהוּי דִּבּוּר. אֶפְשָׁר לְהִשְׁתַּמֵּשׁ בְּכַּפְתּוֹר ➔');
    if (global.speechSynthesis) global.speechSynthesis.cancel();
    consumed = {};
    rec = new SR();
    rec.lang = 'he-IL';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = onHeard;
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        stopListening();
        global.App.toast('צָרִיךְ לְאַשֵּׁר גִּישָׁה לַמִּיקְרוֹפוֹן');
      } else if (e.error === 'network') {
        stopListening();
        global.App.toast('זִהוּי דִּבּוּר צָרִיךְ חִבּוּר לָאִינְטֶרְנֶט. אֶפְשָׁר לְהַמְשִׁיךְ עִם הַכַּפְתּוֹר ➔');
      } else if (e.error === 'language-not-supported') {
        stopListening();
        global.App.toast('זִהוּי דִּבּוּר בְּעִבְרִית לֹא זָמִין בַּמַּכְשִׁיר');
      }
    };
    // The browser ends sessions on its own after silence; keep listening until the child stops it.
    rec.onend = () => {
      if (!listening) return;
      consumed = {};
      setTimeout(() => {
        if (listening && rec) try { rec.start(); } catch (e) { /* already running */ }
      }, 250);
    };
    listening = true;
    setMicUi();
    try { rec.start(); } catch (e) { stopListening(); }
  }

  function onHeard(e) {
    if (!story || !$('modal').hidden || (global.speechSynthesis && global.speechSynthesis.speaking)) return;
    const i = e.results.length - 1;
    const text = e.results[i][0].transcript;
    $('reader-heard').textContent = '🎤 ' + text;
    const spoken = text.trim().split(/\s+/).filter(Boolean);
    let moved = false;
    for (let k = consumed[i] || 0; k < spoken.length; k++) {
      while (wordIdx < words.length - 1 && !norm(words[wordIdx])) wordIdx++;
      if (!matches(words[wordIdx], spoken[k])) continue;
      consumed[i] = k + 1;
      if (wordIdx === words.length - 1) {
        updateWords();
        return finishParagraph();
      }
      wordIdx++;
      moved = true;
    }
    if (moved) updateWords();
  }

  function progressOf(id) {
    const st = global.App.state;
    if (!st.progress[id]) st.progress[id] = { par: 0, rewarded: 0, done: false };
    return st.progress[id];
  }

  // Local calendar day, so "once a day" follows the family's clock rather than UTC.
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  let rereadDna = 0;

  /* Re-reading a finished story: +1 DNA per paragraph and, at the end, +10 DNA and an egg for one of her dinos
     (the story's own dino first). Once per story per day. */
  function rereadBonus(pr, lastPar) {
    const App = global.App;
    const day = todayKey();
    const out = { open: pr.bonusDay !== day, dna: 0, finished: false, egg: null };
    if (!out.open) return out;
    if (pr.rrDay !== day) {
      pr.rrDay = day;
      pr.rrN = 0;
    }
    if (pr.rrN < paragraphs.length) {
      pr.rrN++;
      out.dna += 1;
    }
    if (lastPar) {
      pr.bonusDay = day;
      pr.reads = (pr.reads || 0) + 1;
      out.finished = true;
      out.dna += 10;
      const target = global.Nursery.pickTarget(story.legend);
      if (target && global.Nursery.addEgg(target)) out.egg = target;
    }
    if (out.dna) {
      App.addDna(out.dna);
      rereadDna += out.dna;
    }
    return out;
  }

  function renderLibrary() {
    const stories = global.App.allStories();
    $('read-reader').hidden = true;
    $('read-library').hidden = false;
    const list = $('story-list');
    stopListening();
    if (!stories.length) {
      list.innerHTML = '<p class="muted">אֵין סִפּוּרִים עֲדַיִן. הוֹרִים יְכוֹלִים לְהוֹסִיף טֶקְסְט בְּ"מַצַּב הוֹרִים" 🔒</p>';
      return;
    }
    list.innerHTML = stories
      .map((s) => {
        const pr = progressOf(s.id);
        const total = parse(s.text).length;
        const status = pr.done
          ? `⭐ הוּשְׁלַם${pr.bonusDay !== todayKey() ? ' · 🥚 בּוֹנוּס' : ''}`
          : pr.par > 0 ? `פִּסְקָה ${pr.par + 1} מִתּוֹךְ ${total}` : `${total} פִּסְקָאוֹת`;
        const R = global.Renderer;
        let prize = '';
        if (s.legend && R.SPECIES[s.legend]) {
          const got = global.App.state.dinos.some((d) => d.legendary && d.species === s.legend);
          prize = `<span class="story-prize${got ? ' got' : ''}" title="${esc(R.SPECIES[s.legend].legendName)}">${got ? R.dino(s.legend, { legendary: true }) : R.silhouette(s.legend)}</span>`;
        }
        return `<button class="story-card${pr.done ? ' done' : ''}" data-id="${esc(s.id)}">
          <span class="story-ico">${pr.done ? '🏆' : '📖'}</span>
          <span class="story-meta"><b>${esc(s.title)}</b><small>${status}</small></span>
          ${prize}
        </button>`;
      })
      .join('');
  }

  function open(id) {
    const s = global.App.allStories().find((x) => x.id === id);
    if (!s) return;
    const pars = parse(s.text);
    if (!pars.length) return global.App.toast('הַסִּפּוּר רֵיק');
    story = s;
    rereadDna = 0;
    paragraphs = pars;
    const pr = progressOf(id);
    parIdx = pr.done || pr.par >= paragraphs.length ? 0 : pr.par;
    $('read-library').hidden = true;
    $('read-reader').hidden = false;
    $('reader-title').textContent = s.title;
    showParagraph();
    if (pr.done && pr.bonusDay !== todayKey()) {
      global.App.toast('קְרִיאָה חוֹזֶרֶת: +1 דנ״א לְכָל פִּסְקָה, וּבַסּוֹף +10 וּבֵיצָה לְדִינוֹ 🥚');
    }
  }

  function showParagraph() {
    words = paragraphs[parIdx].split(/\s+/);
    wordIdx = 0;
    $('reader-count').textContent = `פִּסְקָה ${parIdx + 1} מִתּוֹךְ ${paragraphs.length}`;
    $('reader-bar').style.width = `${(parIdx / paragraphs.length) * 100}%`;
    $('reader-text').innerHTML = words
      .map((w, i) => `<span class="w" data-i="${i}">${esc(w)}</span>`)
      .join(' ');
    updateWords();
  }

  function updateWords() {
    const spans = $('reader-text').children;
    for (let i = 0; i < spans.length; i++) {
      spans[i].classList.toggle('karaoke-active', i === wordIdx);
      spans[i].classList.toggle('karaoke-read', i < wordIdx);
    }
    const last = wordIdx === words.length - 1;
    $('btn-advance').textContent = last
      ? 'סִיַּמְתִּי אֶת הַפִּסְקָה ✔'
      : 'קָרָאתִי (הַמְשֵׁךְ לַמִּלָּה הַבָּאָה) ➔';
    $('btn-advance').classList.toggle('finish', last);
    if (spans[wordIdx]) spans[wordIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function advance() {
    if (!story) return;
    if (wordIdx < words.length - 1) {
      wordIdx++;
      updateWords();
    } else {
      finishParagraph();
    }
  }

  function finishParagraph() {
    const App = global.App;
    const listened = global.Town ? global.Town.onRead() : 0;
    if (listened) App.toast(`📚 ${listened === 1 ? 'דִּינוֹזָאוּר אֶחָד הִקְשִׁיב' : `${listened} דִּינוֹזָאוּרִים הִקְשִׁיבוּ`} בַּסִּפְרִיָּה ❤️`);
    const pr = progressOf(story.id);
    const rereading = pr.done;
    const lastPar = parIdx === paragraphs.length - 1;
    const first = !pr.done && parIdx >= pr.rewarded;
    const dnaGain = first ? 10 : 0;
    let update = null;
    let reread = null;

    if (first) {
      pr.rewarded = parIdx + 1;
      update = App.applyReadingUpdate();
      App.addDna(dnaGain);
    }
    if (rereading) reread = rereadBonus(pr, lastPar);
    pr.par = lastPar ? 0 : parIdx + 1;

    let legendary = null;
    let bonus = 0;
    if (lastPar && !pr.done) {
      pr.done = true;
      const res = App.unlockLegendary(story.legend);
      legendary = res.dino;
      bonus = res.bonusDna;
    }
    App.save();
    App.refreshHud();

    if (lastPar && reread) {
      const prize = reread.egg || App.state.dinos.find((d) => d.legendary && d.species === story.legend) || App.activeDino();
      const onClose = () => {
        story = null;
        renderLibrary();
      };
      if (reread.finished) {
        App.celebrate({
          title: 'קָרָאתְּ שׁוּב! 🥚',
          lines: [
            `+${rereadDna} נְקֻדּוֹת דנ״א`,
            reread.egg
              ? `בֵּיצָה חֲדָשָׁה אֵצֶל ${esc(App.dinoName(reread.egg))}! הִיא תִּבְקַע בְּעוֹד שָׁעָה 🐣`
              : 'לְכׇל הַדִּינוֹזָאוּרִים כְּבָר יֵשׁ שָׁלוֹשׁ בֵּיצִים אוֹ תִּינוֹקוֹת! 🐣',
          ],
          dinoHtml: App.dinoHtml(prize),
          onClose,
        });
      } else {
        App.celebrate({
          title: 'סִיַּמְתְּ שׁוּב! 🏆',
          lines: ['כְּבָר קִבַּלְתְּ אֶת בּוֹנוּס הַקְּרִיאָה שֶׁל הַיּוֹם. מָחָר אֶפְשָׁר לְקַבֵּל בֵּיצָה נוֹסֶפֶת! 🌅'],
          dinoHtml: App.dinoHtml(prize),
          onClose,
        });
      }
    } else if (lastPar) {
      const lines = [];
      if (dnaGain) lines.push(`+${dnaGain} נְקֻדּוֹת דנ״א`);
      if (update) lines.push(update.text);
      if (legendary) lines.push(`בַּגַּן שֶׁלָּךְ מְחַכֶּה: ${global.Renderer.SPECIES[legendary.species].legendName}`);
      else if (bonus) lines.push(`כָּל הָאַגָּדִיִּים כְּבָר אֶצְלֵךְ! בּוֹנוּס: +${bonus} דנ״א`);
      else lines.push('סִיַּמְתְּ אֶת הַסִּפּוּר!');
      App.celebrate({
        title: legendary ? 'דִּינוֹזָאוּר אַגָּדִי נִפְתַּח! 🌟' : 'סִיַּמְתְּ אֶת כׇּל הַסִּפּוּר! 🏆',
        lines,
        dinoHtml: legendary
          ? global.Renderer.dino(legendary.species, { legendary: true })
          : App.dinoHtml(update ? update.dino : App.activeDino()),
        onClose: () => {
          story = null;
          renderLibrary();
        },
      });
    } else if (first) {
      App.celebrate({
        title: 'כׇּל הַכָּבוֹד! סִיַּמְתְּ פִּסְקָה 🎉',
        lines: [`+${dnaGain} נְקֻדּוֹת דנ״א`, update.text],
        dinoHtml: App.dinoHtml(update.dino),
        onClose: () => {
          parIdx++;
          showParagraph();
        },
      });
    } else {
      parIdx++;
      showParagraph();
    }
  }

  function init() {
    $('story-list').addEventListener('click', (e) => {
      const card = e.target.closest('.story-card');
      if (card) open(card.dataset.id);
    });
    $('reader-text').addEventListener('click', advance);
    $('btn-advance').addEventListener('click', advance);
    $('btn-speak-word').addEventListener('click', () => global.App.speak(words[wordIdx]));
    $('btn-speak-par').addEventListener('click', () => global.App.speak(paragraphs[parIdx]));
    $('btn-reader-back').addEventListener('click', () => {
      if (global.speechSynthesis) global.speechSynthesis.cancel();
      stopListening();
      story = null;
      renderLibrary();
    });
    $('btn-mic').hidden = !SR;
    $('btn-mic').addEventListener('click', () => (listening ? stopListening() : startListening()));
    renderLibrary();
  }

  global.Reading = { DEFAULT_STORIES, init, renderLibrary, parse, stopListening, matches };
})(window);
