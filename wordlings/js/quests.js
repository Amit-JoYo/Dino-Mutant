/* Wordlings quests: people in the village and in the buildings who ask her for help.
   Each person has a short chain of quests, one at a time:
   order    a listening game: they ask for two or three things in a sentence, she taps them (this is where the English is)
   befriend make new friends (catch creatures) in the place where the person lives
   evolve   help a creature to grow into its next form
   read     read a sign or an object out loud by pressing A in front of it, then tell the person
   Progress is kept in the main save (state.quests), so resetting the game resets the quests too. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const look = (shirt, hair, hat, skin) => ({ skin: skin || '#f5c9a0', hair, shirt, pants: '#4a5a8a', hat });
  const rnd = (n) => Math.floor(Math.random() * n);
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  /* x, y: where she stands; the world moves it to the nearest free tile */
  const NPCS = [
    { id: 'nurse', map: 'hospital', x: 6, y: 2, emoji: '👩‍⚕️', name: 'Nurse Noa', he: 'הָאָחוֹת נוֹעָה', where: 'בֵּית הַחוֹלִים', healer: true, look: look('#8fd0ee', '#6b3a1a', '#ffffff'),
      hi: ['Welcome to the hospital! I help tired creatures feel better.', 'בְּרוּכָה הַבָּאָה לְבֵית הַחוֹלִים! אֲנִי עוֹזֶרֶת לִיצוּרִים עֲיֵפִים לְהַרְגִּישׁ טוֹב.'],
      done: ['Thank you for all your help. You are a great friend!', 'תּוֹדָה עַל כָּל הָעֶזְרָה. אַתְּ חָבֵרָה נֶהֱדֶרֶת!'] },
    { id: 'fay', map: 'outside', x: 7, y: 39, emoji: '🧑‍🌾', name: 'Farmer Fay', he: 'פֵּיי הַחַקְלָאִית', where: 'בַּחוּץ, לְיַד הַהַתְחָלָה', look: look('#5aa83c', '#8a4b22', '#e8c35a'),
      hi: ['Hello! I am Farmer Fay. I love the animals and the flowers!', 'שָׁלוֹם! אֲנִי פֵּיי הַחַקְלָאִית. אֲנִי אוֹהֶבֶת אֶת הַחַיּוֹת וְאֶת הַפְּרָחִים!'],
      done: ['You are the best helper in the whole village!', 'אַתְּ הָעוֹזֶרֶת הֲכִי טוֹבָה בַּכְּפָר כֻּלּוֹ!'] },
    { id: 'ben', map: 'bakery', x: 3, y: 2, emoji: '🧑‍🍳', name: 'Baker Ben', he: 'בֶּן הָאוֹפֶה', where: 'הַמַּאֲפִיָּה', look: look('#ffffff', '#3a2a1a', '#ffffff'),
      hi: ['Welcome to my bakery! It smells so good in here!', 'בְּרוּכָה הַבָּאָה לַמַּאֲפִיָּה שֶׁלִּי! יֵשׁ כָּאן רֵיחַ כָּל כָּךְ טוֹב!'],
      done: ['Thank you, my friend! Take a cookie any time.', 'תּוֹדָה, חֲבֵרָה שֶׁלִּי! תִּקְחִי עוּגִיָּה מָתַי שֶׁתִּרְצִי.'] },
    { id: 'gran', map: 'house', x: 3, y: 2, emoji: '👵', name: 'Granny Gil', he: 'סַבְתָּא גִּיל', where: 'הַבַּיִת', look: look('#9a6ad8', '#d4d4dc', null),
      hi: ['Come in, come in! Make yourself at home.', 'תִּכָּנְסִי, תִּכָּנְסִי! תַּרְגִּישִׁי בַּבַּיִת.'],
      done: ['What a clever girl you are!', 'אֵיזוֹ יַלְדָּה חֲכָמָה אַתְּ!'] },
    { id: 'rina', map: 'shop', x: 3, y: 2, emoji: '🧑‍🎨', name: 'Rainbow Rina', he: 'רִינָה הַקֶּשֶׁת', where: 'חֲנוּת הַקֶּשֶׁת', look: look('#e2579a', '#c0392b', '#8f6bff'),
      hi: ['Welcome to my Rainbow Shop! I love colours!', 'בְּרוּכָה הַבָּאָה לַחֲנוּת הַקֶּשֶׁת! אֲנִי אוֹהֶבֶת צְבָעִים!'],
      done: ['Now you know all my colours. Wonderful!', 'עַכְשָׁיו אַתְּ מַכִּירָה אֶת כָּל הַצְּבָעִים שֶׁלִּי. נִפְלָא!'] },
    { id: 'sue', map: 'bakery2', x: 3, y: 2, emoji: '👩‍🍳', name: 'Sweet Sue', he: 'סוּ הַמְּתוּקָה', where: 'הַמַּאֲפִיָּה · קוֹמָה 2', look: look('#ff9ec4', '#6b3a1a', '#ffd1e3'),
      hi: ['Welcome upstairs! This is my sweet shop.', 'בְּרוּכָה הַבָּאָה לַקּוֹמָה הָעֶלְיוֹנָה! זוֹ חֲנוּת הַמַּמְתַּקִּים שֶׁלִּי.'],
      done: ['You are sweeter than my cupcakes!', 'אַתְּ מְתוּקָה יוֹתֵר מֵהַקַּפְּקֵיקִים שֶׁלִּי!'] },
    { id: 'charlie', map: 'bakery3', x: 3, y: 2, emoji: '👨‍🍳', name: 'Chef Charlie', he: 'הַשֵּׁף צֶ׳ארְלִי', where: 'הַמַּאֲפִיָּה · קוֹמָה 3', look: look('#e5484d', '#2a2a2a', '#ffffff'),
      hi: ['This is the chef kitchen. Be careful, it is hot!', 'זֶה הַמִּטְבָּח שֶׁל הַשֵּׁף. תִּזָּהֲרִי, חַם כָּאן!'],
      done: ['A real chef! I am so proud of you.', 'שֵׁף אֲמִתִּי! אֲנִי כָּל כָּךְ גֵּאֶה בָּךְ.'] },
    { id: 'tom', map: 'house2', x: 3, y: 2, emoji: '🧒', name: 'Toy Tom', he: 'טוֹם הַצַּעֲצוּעִים', where: 'הַבַּיִת · קוֹמָה 2', look: look('#3f8bd8', '#e0a030', '#e5484d'),
      hi: ['Welcome to the playroom! I love toys.', 'בְּרוּכָה הַבָּאָה לְחֶדֶר הַמִּשְׂחָקִים! אֲנִי אוֹהֵב צַעֲצוּעִים.'],
      done: ['Let us play together again soon!', 'בּוֹאִי נְשַׂחֵק יַחַד שׁוּב בְּקָרוֹב!'] },
    { id: 'ada', map: 'house3', x: 3, y: 2, emoji: '🧙‍♀️', name: 'Attic Ada', he: 'עֲדָה מֵעֲלִיַּת הַגָּג', where: 'הַבַּיִת · קוֹמָה 3', look: look('#6a4fd8', '#bdbdd0', '#4a35a8'),
      hi: ['Shh... this is a quiet old attic, full of secrets.', 'שששש... זוֹ עֲלִיַּת גָּג שְׁקֵטָה וִישָׁנָה, מְלֵאָה סוֹדוֹת.'],
      done: ['You found all my secrets. Magic!', 'מָצָאתְּ אֶת כָּל הַסּוֹדוֹת שֶׁלִּי. קֶסֶם!'] },
    { id: 'sam', map: 'shop2', x: 3, y: 2, emoji: '👷', name: 'Shape Sam', he: 'סֶם הַצּוּרוֹת', where: 'חֲנוּת הַקֶּשֶׁת · קוֹמָה 2', look: look('#ffd23f', '#5a3a22', '#2e86de'),
      hi: ['Circles, squares, hearts... I know all the shapes!', 'עִגּוּלִים, רִבּוּעִים, לִבּוֹת... אֲנִי מַכִּיר אֶת כָּל הַצּוּרוֹת!'],
      done: ['You are a shape master now!', 'עַכְשָׁיו אַתְּ מוּמְחִית לְצוּרוֹת!'] },
    { id: 'pip', map: 'shop3', x: 3, y: 2, emoji: '🧑‍🔬', name: 'Professor Pip', he: 'הַפְּרוֹפֶסוֹר פִּיפּ', where: 'חֲנוּת הַקֶּשֶׁת · קוֹמָה 3', look: look('#f5f5f5', '#9a9ab0', '#ec6aa6'),
      hi: ['Welcome to the gallery. Colours and numbers are magic!', 'בְּרוּכָה הַבָּאָה לַגָּלֶרְיָה. צְבָעִים וּמִסְפָּרִים הֵם קֶסֶם!'],
      done: ['Brilliant! You are a real professor!', 'מְצֻיָּן! אַתְּ פְּרוֹפֶסוֹרִית אֲמִתִּית!'] },
  ];

  const ORDER_TEXT = ['I need some help! Listen to me, and tap the things I ask for.', 'אֶפְשָׁר עֶזְרָה? הַקְשִׁיבִי לַבַּקָּשׁוֹת וְלַחֲצִי עַל מָה שֶׁמְּבַקְּשִׁים.'];
  const BIG_ORDER_TEXT = ['A big order! Listen very carefully now.', 'הַזְמָנָה גְּדוֹלָה! הַקְשִׁיבִי הֵיטֵב.'];
  const befriendText = (n, inside) => [
    `Creatures are hiding ${inside ? 'on the rugs in this room' : 'in the tall grass here'}. Can you make ${n} new friends?`,
    `יְצוּרִים מִתְחַבְּאִים ${inside ? 'עַל הַשְּׁטִיחִים בַּחֶדֶר הַזֶּה' : 'בָּעֵשֶׂב הַגָּבוֹהַּ'}. תִּתְחַבְּרִי עִם ${n === 1 ? 'יְצוּר אֶחָד' : `${n} יְצוּרִים`}?`,
  ];
  const EVOLVE_TEXT = ['Friends grow when you catch them again and again. Help one friend to evolve!', 'חֲבֵרִים גְּדֵלִים כְּשֶׁתּוֹפְסִים אוֹתָם שׁוּב וָשׁוּב. תַּעַזְרִי לְאֶחָד מֵהֶם לְהִתְפַּתֵּחַ!'];
  const THANKS = ['Thank you so much! Here are some stars for you!', 'תּוֹדָה רַבָּה! הִנֵּה כּוֹכָבִים בִּשְׁבִילֵךְ!'];

  const order = (id, npc, zone, items, rounds, reward, big) => ({ id, npc, kind: 'order', zone, items, rounds, reward, text: big ? BIG_ORDER_TEXT : ORDER_TEXT, n: rounds });
  const befriend = (id, npc, zone, n, reward, inside) => ({ id, npc, kind: 'befriend', zone, n, reward, text: befriendText(n, inside !== false) });
  const evolve = (id, npc, reward) => ({ id, npc, kind: 'evolve', n: 1, reward, text: EVOLVE_TEXT });
  const read = (id, npc, target, reward, en, he) => ({ id, npc, kind: 'read', target, n: 1, reward, text: [en, he] });

  const QUESTS = [
    order('nurse1', 'nurse', 'hospital', 2, 2, 6),
    befriend('nurse2', 'nurse', 'hospital', 2, 8),
    order('nurse3', 'nurse', 'hospital', 3, 3, 12, true),
    order('fay1', 'fay', 'forest', 2, 2, 5),
    befriend('fay2', 'fay', 'forest', 2, 8, false),
    read('fay3', 'fay', 'The Bakery', 10, 'Can you read the sign of the Bakery for me? Walk down the road, then press A in front of the sign.', 'תּוּכְלִי לִקְרֹא לִי אֶת הַשֶּׁלֶט שֶׁל הַמַּאֲפִיָּה? לְכִי בַּדֶּרֶךְ וְלַחֲצִי A מוּל הַשֶּׁלֶט.'),
    order('ben1', 'ben', 'kitchen', 2, 2, 6),
    befriend('ben2', 'ben', 'kitchen', 2, 8),
    evolve('ben3', 'ben', 12),
    order('gran1', 'gran', 'home', 2, 2, 6),
    befriend('gran2', 'gran', 'home', 2, 8),
    read('gran3', 'gran', 'clock', 10, 'Can you read the clock in my house for me? Stand in front of it and press A.', 'תּוּכְלִי לִקְרֹא לִי אֶת הַשָּׁעוֹן שֶׁבַּבַּיִת שֶׁלִּי? עִמְדִי מוּלוֹ וְלַחֲצִי A.'),
    order('rina1', 'rina', 'colours', 2, 2, 6),
    befriend('rina2', 'rina', 'colours', 2, 8),
    read('rina3', 'rina', 'shelves', 10, 'Can you read my shelves for me? Stand in front of them and press A.', 'תּוּכְלִי לִקְרֹא אֶת הַמַּדָּפִים שֶׁלִּי? עִמְדִי מוּלָם וְלַחֲצִי A.'),
    order('sue1', 'sue', 'kitchen2', 3, 2, 10),
    befriend('sue2', 'sue', 'kitchen2', 2, 12),
    order('charlie1', 'charlie', 'kitchen3', 3, 2, 12),
    befriend('charlie2', 'charlie', 'kitchen3', 2, 14),
    order('charlie3', 'charlie', 'kitchen3', 3, 3, 18, true),
    order('tom1', 'tom', 'home2', 3, 2, 10),
    befriend('tom2', 'tom', 'home2', 2, 12),
    order('ada1', 'ada', 'home3', 3, 2, 12),
    befriend('ada2', 'ada', 'home3', 2, 14),
    order('ada3', 'ada', 'home3', 3, 3, 18, true),
    order('sam1', 'sam', 'colours2', 3, 2, 10),
    befriend('sam2', 'sam', 'colours2', 2, 12),
    order('pip1', 'pip', 'colours2', 3, 3, 14, true),
    befriend('pip2', 'pip', 'colours3', 2, 14),
    evolve('pip3', 'pip', 20),
  ];

  /* ---------- progress ---------- */
  const st = () => {
    const g = global.Game.state();
    return g.quests || (g.quests = { done: {}, prog: {} });
  };
  const npcOf = (id) => NPCS.find((n) => n.id === id);
  const questsOf = (npcId) => QUESTS.filter((q) => q.npc === npcId);
  const current = (npcId) => questsOf(npcId).find((q) => !st().done[q.id]);
  const started = (q) => q.kind !== 'order' && st().prog[q.id] !== undefined;
  const ready = (q) => started(q) && st().prog[q.id] >= q.n;
  const save = () => global.Game.save();

  /** "!" when someone has a new quest for her, "?" when she has finished one and should go back; the nurse also waves when a friend is tired */
  const anyTired = () => Object.values(global.Game.state().mons).some((m) => m.fainted);

  function marker(npcId) {
    const npc = npcOf(npcId);
    if (npc && npc.healer && anyTired()) return '!';
    const q = current(npcId);
    if (!q) return '';
    if (ready(q)) return '?';
    return started(q) ? '' : '!';
  }

  /** things that happen in the game: a creature was caught (zone, evolved) or a sign was read (en) */
  function event(type, d) {
    let changed = false;
    QUESTS.forEach((q) => {
      if (st().done[q.id] || !started(q) || ready(q)) return;
      const p = st().prog[q.id];
      if (q.kind === 'befriend' && type === 'catch' && d.zone === q.zone) st().prog[q.id] = Math.min(q.n, p + 1);
      else if (q.kind === 'evolve' && type === 'catch' && d.evolved) st().prog[q.id] = Math.min(q.n, p + 1);
      else if (q.kind === 'read' && type === 'read' && d.en === q.target) st().prog[q.id] = q.n;
      else return;
      changed = true;
    });
    if (changed) save();
  }

  /* ---------- talking ---------- */
  const modalOpen = () => !$('modal').hidden;
  function closeModal() {
    $('modal').hidden = true;
    global.Sound.stop();
  }

  function dialog(npc, lines, extraHtml, buttons) {
    $('modal-card').innerHTML = `<div class="npc-dialog">
      <div class="npc-head"><span class="npc-face">${npc.emoji}</span><div><b dir="ltr">${esc(npc.name)}</b><small>${esc(npc.he)}</small></div></div>
      <div class="npc-say"><p dir="ltr">${esc(lines[0])}</p><p>${esc(lines[1])}</p></div>
      ${extraHtml || ''}
      <div class="npc-btns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-b="${i}">${b.label}</button>`).join('')}</div>
    </div>`;
    $('modal').hidden = false;
    $('modal-card').querySelectorAll('[data-b]').forEach((el) => {
      el.onclick = () => buttons[Number(el.dataset.b)].fn();
    });
    say(lines);
  }

  const say = (lines) => global.Sound.sayAll([{ text: lines[0], lang: 'en' }, { text: lines[1], lang: 'he' }]);
  const hearBtn = (lines) => ({ label: '🔊', cls: 'alt', fn: () => say(lines) });
  const closeBtn = (label) => ({ label: label || 'סְגִירָה', cls: 'ghost', fn: closeModal });

  const progressHtml = (q) => `<div class="npc-prog"><span>${st().prog[q.id] || 0}/${q.n}</span><div class="meter big"><i style="width:${Math.round(((st().prog[q.id] || 0) / q.n) * 100)}%"></i></div></div>`;

  function talk(npcId) {
    const npc = npcOf(npcId);
    if (!npc) return;
    if (npc.healer && anyTired()) {
      healTalk(npc);
      return;
    }
    const q = current(npcId);
    if (!q) {
      dialog(npc, npc.done, '', [closeBtn()]);
    } else if (ready(q)) {
      dialog(npc, ['You did it! You are amazing!', 'עָשִׂית אֶת זֶה! אַתְּ מַדְהִימָה!'], progressHtml(q), [{ label: `⭐ ${q.reward}`, cls: 'big', fn: () => reward(npc, q) }]);
    } else if (started(q)) {
      dialog(npc, q.text, progressHtml(q), [hearBtn(q.text), closeBtn('אַמְשִׁיךְ לְחַפֵּשׂ 🔍')]);
    } else {
      const first = questsOf(npcId).indexOf(q) === 0;
      const lines = first ? [`${npc.hi[0]} ${q.text[0]}`, `${npc.hi[1]} ${q.text[1]}`] : q.text;
      dialog(npc, lines, `<p class="npc-reward">⭐ ${q.reward}</p>`, [
        { label: '✅ בֶּאֱמֶת! אֲנִי עוֹזֶרֶת', cls: 'big', fn: () => accept(npc, q) },
        hearBtn(lines),
        closeBtn('לֹא עַכְשָׁיו'),
      ]);
    }
  }

  function accept(npc, q) {
    global.Sound.sfx.tap();
    if (q.kind === 'order') {
      playOrder(npc, q);
      return;
    }
    st().prog[q.id] = 0;
    save();
    dialog(npc, ['Great! Come back to me when you are done.', 'מְצֻיָּן! תַּחְזְרִי אֵלַי כְּשֶׁתַּסְיְמִי.'], '', [closeBtn('יוֹצְאִים לְדֶרֶךְ 🚶')]);
  }

  function reward(npc, q) {
    st().done[q.id] = Date.now();
    delete st().prog[q.id];
    global.Game.addCoins(q.reward);
    global.Sound.sfx.level();
    const left = questsOf(npc.id).filter((x) => !st().done[x.id]).length;
    dialog(npc, left ? THANKS : npc.done, `<p class="npc-reward big">+${q.reward} ⭐</p>${left ? '' : '<p class="npc-reward">🏆 ✨</p>'}`, [closeBtn(left ? 'תּוֹדָה!' : 'סְגִירָה')]);
  }

  /* ---------- the hospital ---------- */
  const chipsOf = (ids, mood) => `<div class="pick-row">${ids.map((id) => {
    const f = global.Game.fighters().find((x) => x.id === id);
    return `<span class="pick on">${global.Creatures.draw(id, { stage: f.stage, mood })}<small>${f.fainted ? '💤' : '💖'}</small></span>`;
  }).join('')}</div>`;

  function healTalk(npc) {
    const tired = Object.keys(global.Game.state().mons).filter((id) => global.Game.state().mons[id].fainted);
    const lines = ['Oh dear! Your friends look so tired. I will help them, but first I need some things. Listen!', 'אוֹי! הַחֲבֵרִים שֶׁלָּךְ נִרְאִים עֲיֵפִים. אֲנִי אֶעֱזֹר לָהֶם, אֲבָל קֹדֶם אֲנִי צְרִיכָה כַּמָּה דְּבָרִים. הַקְשִׁיבִי!'];
    dialog(npc, lines, chipsOf(tired), [
      { label: '🩹 בּוֹאִי נַעֲזֹר לָהֶם', cls: 'big', fn: () => playOrder(npc, { id: 'heal', kind: 'order', zone: 'hospital', items: 2, rounds: 1, onDone: healed }) },
      closeBtn('לֹא עַכְשָׁיו'),
    ]);
  }

  function healed(npc) {
    const ids = global.Game.healAll();
    global.Sound.sfx.level();
    dialog(npc, ['All better! Your friends are strong again. Come back any time!', 'הַכֹּל בְּסֵדֶר! הַחֲבֵרִים שֶׁלָּךְ חֲזָקִים שׁוּב. אֶפְשָׁר לַחְזֹר מָתַי שֶׁרוֹצִים!'], chipsOf(ids, 'happy'), [closeBtn('תּוֹדָה, אָחוֹת! 💖')]);
  }

  /* ---------- the ordering game ---------- */
  const SENTENCES = {
    2: [(a, b) => `I need ${a} and ${b}, please!`, (a, b) => `Can you give me ${a} and ${b}?`, (a, b) => `Please bring me ${a} and ${b}.`],
    3: [(a, b, c) => `I need ${a}, ${b} and ${c}, please!`, (a, b, c) => `Can you give me ${a}, ${b} and ${c}?`, (a, b, c) => `Please bring me ${a}, ${b} and ${c}.`],
  };

  function playOrder(npc, q, round) {
    const r = round || 0;
    const zone = global.Words.ZONES.find((z) => z.id === q.zone);
    // colours and numbers share a place; orders there are only for colours
    const pool = zone.words.filter((w) => w.kind !== 'number');
    const shuf = global.Game.shuffle;
    const targets = shuf(pool).slice(0, q.items);
    const rest = shuf(pool.filter((w) => !targets.includes(w))).slice(0, 6 - q.items);
    const cards = shuf(targets.concat(rest));
    const make = SENTENCES[q.items][r % SENTENCES[q.items].length];
    const en = make(...targets.map((w) => w.say));
    const left = new Set(targets.map((w) => w.id));
    const wrongNow = new Set();
    const dots = Array.from({ length: q.rounds }, (_, i) => (i < r ? '🟢' : i === r ? '🟡' : '⚪')).join(' ');

    $('modal-card').innerHTML = `<div class="npc-dialog">
      <div class="npc-head"><span class="npc-face">${npc.emoji}</span><div><b dir="ltr">${esc(npc.name)}</b><small>${esc(npc.he)}</small></div>
        <span class="order-dots">${dots}</span></div>
      <button class="btn alt order-hear" id="o-hear">🔊 ${q.items === 2 ? 'שְׁנַיִם' : 'שְׁלוֹשָׁה'}</button>
      <div class="order-grid">${cards.map((w) => `<button class="order-card" data-id="${esc(w.id)}">${global.Game.face(w)}</button>`).join('')}</div>
      <p class="order-msg" id="o-msg"></p>
      <button class="btn ghost small" data-close>✖</button>
    </div>`;
    $('modal').hidden = false;
    const speak = () => global.Sound.say(en);
    $('o-hear').onclick = speak;
    let busy = false;
    const wordIn = (id) => global.Words.byId[id];

    $('modal-card').querySelectorAll('.order-card').forEach((btn) => {
      btn.onclick = async () => {
        if (busy || btn.disabled) return;
        const id = btn.dataset.id;
        const ws = global.Game.wordState(id);
        if (left.has(id)) {
          left.delete(id);
          btn.classList.add('ok');
          btn.disabled = true;
          global.Sound.sfx.ok();
          if (!wrongNow.has(id)) {
            ws.right++;
            ws.box = Math.min(4, ws.box + 1);
          }
          global.Game.save();
          if (!left.size) {
            busy = true;
            $('o-msg').textContent = '👏';
            global.Sound.say('Thank you!');
            await wait(1400);
            if ($('modal').hidden) return;
            if (r + 1 >= q.rounds) {
              if (q.onDone) q.onDone(npc);
              else reward(npc, q);
            } else playOrder(npc, q, r + 1);
          } else {
            global.Sound.say(wordIn(id).w);
          }
        } else {
          btn.classList.add('bad');
          btn.disabled = true;
          global.Sound.sfx.bad();
          if (!wrongNow.has(id)) {
            ws.wrong++;
            ws.box = Math.max(0, ws.box - 1);
            wrongNow.add(id);
            global.Game.save();
          }
          global.Sound.say(wordIn(id).w);
          setTimeout(() => !$('modal').hidden && !busy && speak(), 2200);
        }
      };
    });
    setTimeout(() => !$('modal').hidden && speak(), 350);
  }

  /* ---------- the quest tab ---------- */
  function statusOf(q) {
    if (st().done[q.id]) return { icon: '✅', cls: 'done', note: '' };
    if (ready(q)) return { icon: '❓', cls: 'ready', note: 'חִזְרִי לְסַפֵּר!' };
    if (started(q)) return { icon: '🔄', cls: 'now', note: `${st().prog[q.id] || 0}/${q.n}` };
    return null;
  }

  const KIND_LABEL = { order: '👂 הַזְמָנָה', befriend: '🐾 חֲבֵרִים חֲדָשִׁים', evolve: '✨ הִתְפַּתְּחוּת', read: '👀 קְרִיאָה' };

  function renderBoard(el) {
    let total = 0;
    let finished = 0;
    el.innerHTML = NPCS.map((npc) => {
      const qs = questsOf(npc.id);
      const cur = current(npc.id);
      qs.forEach((q) => {
        total++;
        if (st().done[q.id]) finished++;
      });
      const rows = qs.map((q) => {
        const s = statusOf(q);
        const isNext = cur === q;
        const icon = s ? s.icon : isNext ? '❗' : '🔒';
        const cls = s ? s.cls : isNext ? 'next' : 'locked';
        return `<li class="q-${cls}"><span>${icon}</span><b>${KIND_LABEL[q.kind]}</b><i>${s && s.note ? s.note : ''}</i><em>⭐ ${q.reward}</em></li>`;
      }).join('');
      return `<section class="npc-card"><h3><span class="npc-face small">${npc.emoji}</span> <b dir="ltr">${esc(npc.name)}</b> <small>${npc.where}</small></h3><ul class="q-list">${rows}</ul></section>`;
    }).join('');
    const head = document.createElement('div');
    head.className = 'q-total';
    head.textContent = `✅ ${finished}/${total}`;
    el.prepend(head);
    if (global.Trainers) {
      el.insertAdjacentHTML('afterbegin', global.Trainers.badgesHtml());
      el.insertAdjacentHTML('beforeend', global.Trainers.listHtml());
    }
  }

  global.Quests = { NPCS, QUESTS, marker, talk, event, renderBoard, isOpen: modalOpen };
})(window);
