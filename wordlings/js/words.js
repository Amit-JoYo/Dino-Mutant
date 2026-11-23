/* The word bank. Every word has: w (English), he (Hebrew, with nikud), say (how it is said in a sentence),
   and a picture: pic (emoji), colour (a swatch) or num (a number with dots). */
(function (global) {
  'use strict';

  const n = (w, he, pic, say) => ({ w, he, pic, say: say || `a ${w}`, kind: 'noun' });
  const col = (w, he, colour) => ({ w, he, colour, say: w, kind: 'colour' });
  const num = (w, he, count) => ({ w, he, num: count, say: w, kind: 'number' });

  const ZONES = [
    {
      id: 'forest',
      name: 'Outside',
      he: 'בַּחוּץ',
      emoji: '🌳',
      sky: ['#bfe9ff', '#d8f5c9'],
      ground: '#7ec66f',
      species: ['sproutle', 'mossu', 'bloomie'],
      unlock: 0,
      prompt: (w) => `Look! I can see ${w.say}.`,
      words: [
        n('tree', 'עֵץ', '🌳'), n('flower', 'פֶּרַח', '🌸'), n('bird', 'צִפּוֹר', '🐦'), n('fish', 'דָּג', '🐟'),
        n('frog', 'צְפַרְדֵּעַ', '🐸'), n('butterfly', 'פַּרְפַּר', '🦋'), n('bee', 'דְּבוֹרָה', '🐝'), n('rabbit', 'אַרְנָב', '🐰'),
        n('sun', 'שֶׁמֶשׁ', '☀️', 'the sun'), n('moon', 'יָרֵחַ', '🌙', 'the moon'), n('star', 'כּוֹכָב', '⭐'), n('mushroom', 'פִּטְרִיָּה', '🍄'),
      ],
    },
    {
      id: 'kitchen',
      name: 'The Bakery',
      he: 'הַמַּאֲפִיָּה',
      emoji: '🥖',
      sky: ['#ffe9c7', '#ffd1a1'],
      ground: '#e8b274',
      species: ['embero', 'berrimp', 'puffy'],
      unlock: 2,
      prompt: (w) => `I'm hungry! I want ${w.say}, please.`,
      words: [
        n('apple', 'תַּפּוּחַ', '🍎', 'an apple'), n('banana', 'בָּנָנָה', '🍌'), n('bread', 'לֶחֶם', '🍞', 'some bread'), n('cheese', 'גְּבִינָה', '🧀', 'some cheese'),
        n('egg', 'בֵּיצָה', '🥚', 'an egg'), n('milk', 'חָלָב', '🥛', 'some milk'), n('pizza', 'פִּיצָה', '🍕'), n('cake', 'עוּגָה', '🍰'),
        n('ice cream', 'גְּלִידָה', '🍦', 'an ice cream'), n('carrot', 'גֶּזֶר', '🥕'), n('grapes', 'עֲנָבִים', '🍇', 'some grapes'), n('water', 'מַיִם', '💧', 'some water'),
      ],
    },
    {
      id: 'home',
      name: 'My House',
      he: 'הַבַּיִת שֶׁלִּי',
      emoji: '🏠',
      sky: ['#e4dcff', '#cfc4f5'],
      ground: '#b9a8e8',
      species: ['pebbo', 'shadlet', 'zappo'],
      unlock: 4,
      prompt: (w) => `Where is ${w.say}? Show me!`,
      words: [
        n('chair', 'כִּסֵּא', '🪑', 'the chair'), n('bed', 'מִטָּה', '🛏️', 'the bed'), n('book', 'סֵפֶר', '📖', 'the book'), n('ball', 'כַּדּוּר', '⚽', 'the ball'),
        n('TV', 'טֵלֵוִיזְיָה', '📺', 'the TV'), n('door', 'דֶּלֶת', '🚪', 'the door'), n('clock', 'שָׁעוֹן', '⏰', 'the clock'), n('key', 'מַפְתֵּחַ', '🔑', 'the key'),
        n('shoe', 'נַעַל', '👟', 'the shoe'), n('hat', 'כּוֹבַע', '🎩', 'the hat'), n('phone', 'טֶלֶפוֹן', '📱', 'the phone'), n('light', 'אוֹר', '💡', 'the light'),
      ],
    },
    {
      id: 'colours',
      name: 'The Rainbow Shop',
      he: 'חֲנוּת הַקֶּשֶׁת',
      emoji: '🎨',
      sky: ['#ffd9ec', '#ffe9a8'],
      ground: '#ff9ec4',
      species: ['dribbo', 'frostle', 'glimmy'],
      unlock: 6,
      prompt: (w) => (w.kind === 'number' ? `Show me the number ${w.say}!` : `Show me ${w.say}!`),
      words: [
        col('red', 'אָדֹם', '#e53935'), col('blue', 'כָּחֹל', '#1e88e5'), col('green', 'יָרֹק', '#43a047'), col('yellow', 'צָהֹב', '#fdd835'),
        col('orange', 'כָּתֹם', '#fb8c00'), col('pink', 'וָרֹד', '#ec6aa6'), col('purple', 'סָגֹל', '#8e44ad'), col('black', 'שָׁחֹר', '#212121'),
        col('white', 'לָבָן', '#ffffff'), col('brown', 'חוּם', '#8d6e63'),
        num('one', 'אֶחָד', 1), num('two', 'שְׁנַיִם', 2), num('three', 'שְׁלוֹשָׁה', 3), num('four', 'אַרְבָּעָה', 4), num('five', 'חֲמִשָּׁה', 5), num('six', 'שִׁשָּׁה', 6),
      ],
    },
  ];

  ZONES.forEach((z) => z.words.forEach((w) => { w.id = `${z.id}:${w.w}`; w.zone = z.id; }));

  global.Words = { ZONES, byId: Object.fromEntries(ZONES.flatMap((z) => z.words.map((w) => [w.id, w]))) };
})(window);
