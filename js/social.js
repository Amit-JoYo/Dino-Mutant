/* Class interactions: emoji reactions to classmates' dinos and gifts of dinos. Server calls live in cloud.js. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => global.Puzzles.escapeHtml(s);
  const cooldown = {};
  let offering = false;

  const eligible = () => global.App.state.dinos.filter((d) => !d.legendary && d.species !== 'trex' && !d.gift);

  async function react(visitor, kind, say) {
    const Cloud = global.Cloud;
    const now = Date.now();
    if (now - (cooldown[visitor.ownerId] || 0) < 6000) return say('רֶגַע... אֶפְשָׁר לִשְׁלֹחַ שׁוּב בְּעוֹד כַּמָּה שְׁנִיּוֹת ⏳');
    cooldown[visitor.ownerId] = now;
    try {
      await Cloud.sendReaction(visitor.ownerId, kind);
      say(`${Cloud.REACTIONS[kind]} נִשְׁלַח אֶל ${visitor.owner}`);
    } catch (e) {
      cooldown[visitor.ownerId] = 0;
      say(Cloud.errorText(e));
    }
    return undefined;
  }

  /* The sender picks one of their own dinos; a copy goes to the classmate and the dino stays. */
  function gift(visitor) {
    const App = global.App;
    const Cloud = global.Cloud;
    if (!Cloud.canGiftToday()) return App.toast(Cloud.errorText({ code: 'gift-limit' }));
    const list = eligible();
    if (!list.length) return App.toast('אֵין עֲדַיִן דִּינוֹזָאוּר שֶׁאֶפְשָׁר לִתֵּת כְּמַתָּנָה. אוֹסְפִים עוֹד! 🥚');
    App.openModal(`
      <h2>🎁 מַתָּנָה אֶל <span id="gift-to"></span></h2>
      <p class="muted">הַדִּינוֹזָאוּר שֶׁתִּבְחֲרוּ יִשָּׁאֵר גַּם אֶצְלֵכֶם, וְחָבֵר יְקַבֵּל עֹתֶק שֶׁלּוֹ. מַתָּנָה אַחַת בְּיוֹם.</p>
      <div class="gift-grid">${list.map((x) => `<button class="gift-item" data-gift-uid="${x.uid}"><span class="mini">${App.dinoHtml(x, { outfit: null })}</span><small>${esc(App.dinoName(x))}</small></button>`).join('')}</div>
      <div class="row"><button class="btn ghost" data-close>בִּטּוּל</button></div>`,
    () => { $('modal-card').onclick = null; });
    $('gift-to').textContent = visitor.owner;
    $('modal-card').onclick = async (e) => {
      const b = e.target.closest('[data-gift-uid]');
      if (!b) return;
      const mine = list.find((x) => x.uid === Number(b.dataset.giftUid));
      if (!mine) return;
      $('modal-card').onclick = null;
      try {
        await Cloud.sendGift(visitor.ownerId, mine);
        App.closeModal();
        App.toast(`🎁 הַמַּתָּנָה נִשְׁלְחָה אֶל ${visitor.owner}!`);
      } catch (err) {
        App.closeModal();
        App.toast(Cloud.errorText(err));
      }
    };
    return undefined;
  }

  function showGift(list) {
    const App = global.App;
    const Cloud = global.Cloud;
    if (!list.length) return;
    const g = list[0];
    const sp = global.Renderer.SPECIES[g.species];
    App.openModal(`
      <h2>🎁 מַתָּנָה!</h2>
      <div class="celebrate-dino">${global.Renderer.dino(g.species, { tint: g.tint })}</div>
      <p class="reward-line"><span id="gift-from"></span> שָׁלַח/ה לָךְ ${sp.short}!</p>
      <button class="btn big" id="gift-take">🎉 לְקַבֵּל</button>
      <div class="row"><button class="btn ghost" data-close>אוּלַי אַחַר כָּךְ</button></div>`);
    $('gift-from').textContent = g.name || 'חָבֵר מֵהַכִּתָּה';
    $('gift-take').onclick = async () => {
      $('gift-take').disabled = true;
      try {
        await Cloud.claimGift(g.from);
      } catch (e) {
        $('gift-take').disabled = false;
        return App.toast(Cloud.errorText(e));
      }
      const st = App.state;
      const d = { uid: st.nextUid++, species: g.species, legendary: false, tint: g.tint, horns: 0, eggs: 0, gift: true, giftFrom: g.name || '' };
      st.dinos.push(d);
      App.save();
      App.closeModal();
      App.celebrate({
        title: 'דִּינוֹזָאוּר חָדָשׁ בַּגַּן! 🎁',
        lines: [sp.name],
        dinoHtml: App.dinoHtml(d),
        onClose: () => showGift(list.slice(1)),
      });
      return undefined;
    };
  }

  async function offerGifts() {
    const Cloud = global.Cloud;
    if (offering || !Cloud || !Cloud.inClass()) return;
    offering = true;
    try {
      const list = await Cloud.pendingGifts();
      if (list.length && $('modal').hidden) showGift(list);
    } catch (e) { /* offline: try again next time */ }
    offering = false;
  }

  global.Social = { react, gift, offerGifts, eligible };
})(window);
