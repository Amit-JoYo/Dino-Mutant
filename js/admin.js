/* Owner-only admin page. Uses its own named Firebase app so signing in with Google never replaces the game's anonymous identity. */
(function () {
  'use strict';

  const SDK_VERSION = '10.12.2';
  const $ = (id) => document.getElementById(id);
  let auth;
  let db;

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    });
    kids.flat().forEach((k) => el.append(k instanceof Node ? k : document.createTextNode(String(k))));
    return el;
  }

  // Names come from kids, so they are only ever inserted as text (never as HTML).
  function cleanName(s) {
    return String(s || '').replace(/[^\p{L}\p{M}\s'’-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  }

  function makeCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  }

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('load ' + src));
    document.head.appendChild(s);
  });

  const withTimeout = (promise, ms) => {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('אין תשובה מהשרת (timeout). בדקו חיבור, רשת אחרת או כיבוי חוסם פרסומות')), ms); }),
    ]).finally(() => clearTimeout(timer));
  };

  // Every button action goes through here so a failure is shown instead of silently doing nothing.
  const guard = (fn) => async (...args) => {
    const box = $('err');
    try {
      await fn(...args);
      box.textContent = '';
    } catch (e) {
      box.textContent = `הפעולה נכשלה: ${e.code || ''} ${e.message || e}`;
    }
  };

  async function loadClasses() {
    const box = $('classes');
    box.replaceChildren(h('p', { class: 'muted' }, 'טוען…'));
    let snap;
    try {
      snap = await withTimeout(db.collection('classes').get(), 20000);
    } catch (e) {
      box.replaceChildren(h('p', { class: 'muted' }, `שגיאה בטעינת הכיתות: ${e.code || e.message}`), h('button', { onclick: loadClasses }, 'ניסיון חוזר'));
      return;
    }
    box.replaceChildren();
    if (snap.empty) box.append(h('p', { class: 'muted' }, 'אין כיתות עדיין'));
    snap.docs.forEach((doc) => box.append(classCard(doc.id, doc.data())));
  }

  function classCard(code, data) {
    const members = h('div');
    const card = h('div', { class: 'card' + (data.active ? '' : ' off') },
      h('div', {},
        h('b', {}, data.name || '(ללא שם)'), ' ',
        h('span', { class: 'code' }, code), ' ',
        h('button', { class: 'ghost', onclick: () => navigator.clipboard && navigator.clipboard.writeText(code) }, 'העתקה'),
        h('button', { class: 'ghost', onclick: guard(async () => {
          await db.doc(`classes/${code}`).update({ active: !data.active });
          loadClasses();
        }) }, data.active ? 'כיבוי הכיתה' : 'הפעלת הכיתה'),
        h('button', { class: 'ghost', onclick: () => showMembers(code, members) }, 'חברים')
      ),
      members
    );
    return card;
  }

  async function showMembers(code, box) {
    box.replaceChildren(h('p', { class: 'muted' }, 'טוען…'));
    let snap;
    try {
      snap = await withTimeout(db.collection(`classes/${code}/members`).get(), 20000);
    } catch (e) {
      box.replaceChildren(h('p', { class: 'muted' }, `שגיאה בטעינת החברים: ${e.code || e.message}`));
      return;
    }
    if (snap.empty) {
      box.replaceChildren(h('p', { class: 'muted' }, 'אין חברים'));
      return;
    }
    const rows = snap.docs.map((doc) => {
      const m = doc.data();
      const ref = doc.ref;
      const dinos = (m.dinos || []).map((d) => d.species).join(', ');
      return h('tr', {},
        h('td', {}, m.name, m.locked ? ' 🔒' : ''),
        h('td', { class: 'muted' }, dinos),
        h('td', {},
          h('button', { onclick: guard(async () => {
            const name = cleanName(prompt('שם חדש (יינעל):', m.name));
            if (name.length < 2) return;
            await ref.update({ name, locked: true });
            showMembers(code, box);
          }) }, 'שינוי שם'),
          m.locked ? h('button', { class: 'ghost', onclick: guard(async () => {
            await ref.update({ locked: false });
            showMembers(code, box);
          }) }, 'שחרור') : '',
          h('button', { class: 'danger', onclick: guard(async () => {
            if (!confirm(`להסיר את ${m.name}?`)) return;
            await ref.delete();
            showMembers(code, box);
          }) }, 'הסרה')
        )
      );
    });
    box.replaceChildren(h('table', {}, h('tr', {}, h('th', {}, 'שם'), h('th', {}, 'דינוזאורים'), h('th', {}, '')), rows));
  }

  async function onUser(user) {
    const status = $('status');
    $('btn-in').hidden = !!user;
    $('btn-out').hidden = !user;
    $('panel').hidden = true;
    if (!user) {
      status.textContent = 'לא מחובר';
      return;
    }
    status.textContent = `מחובר: ${user.email || ''}\nuid: ${user.uid}\nבודק הרשאות מנהל…`;
    let isAdmin = false;
    let checkError = '';
    try {
      const snap = await Promise.race([
        db.doc(`admins/${user.uid}`).get(),
        new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), 25000)),
      ]);
      isAdmin = snap.exists;
    } catch (e) {
      checkError = `\nשגיאת בדיקה: ${e.code || e.message}` + (e.code === 'timeout' ? '\nאין תשובה מ-Firestore. נסו חלון פרטי, כבו תוספי חסימת פרסומות, או רשת אחרת (למשל נתונים סלולריים).' : '');
    }
    if (!isAdmin) {
      status.textContent = `מחובר: ${user.email || ''}\nuid: ${user.uid}\nהחשבון עדיין לא מוגדר כמנהל: יש ליצור ב-Firestore, באוסף admins, מסמך שה-ID שלו הוא ה-uid הזה בדיוק.${checkError}`;
      return;
    }
    status.textContent = `מחובר כמנהל: ${user.email || ''}`;
    $('panel').hidden = false;
    loadClasses().catch((e) => { status.textContent = 'שגיאה בטעינה: ' + e.message; });
  }

  async function start() {
    if (!/^https?:$/.test(location.protocol)) {
      $('status').textContent = 'יש לפתוח את הדף דרך כתובת אינטרנט (http://localhost:8765/admin.html או האתר באינטרנט) ולא ישירות מהקובץ';
      return;
    }
    if (!window.FIREBASE_CONFIG) {
      $('status').textContent = 'js/firebase-config.js עדיין ריק';
      return;
    }
    $('status').textContent = 'טוען ספריות…';
    for (const n of ['app', 'auth']) {
      await loadScript(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-${n}-compat.js`);
    }
    $('status').textContent = 'מתחבר…';
    const app = firebase.initializeApp(window.FIREBASE_CONFIG, 'admin');
    auth = app.auth();
    // If the browser never reports a sign-in state (for example storage is blocked), say so instead of waiting forever.
    const watchdog = setTimeout(() => {
      $('status').textContent = 'הדפדפן לא החזיר מצב התחברות. נסו Chrome רגיל (לא חלון פרטי ולא דפדפן בתוך אפליקציה) ובדקו שהאחסון לא חסום.';
    }, 15000);
    auth.onAuthStateChanged((u) => { clearTimeout(watchdog); onUser(u); });
    // Data goes over plain HTTPS (js/fsrest.js): the SDK's streaming connection hangs on some phones and networks.
    db = FsRest.client(window.FIREBASE_CONFIG, (force) => auth.currentUser.getIdToken(!!force));
    let signingIn = false;
    $('btn-in').onclick = async () => {
      if (signingIn) return;
      signingIn = true;
      $('btn-in').disabled = true;
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      } catch (e) {
        const closed = e.code === 'auth/cancelled-popup-request' || e.code === 'auth/popup-closed-by-user';
        $('status').textContent = closed ? 'חלון ההתחברות נסגר. לחצו שוב ובחרו חשבון (פעם אחת בלבד, והמתינו לחלון).' : e.message;
      } finally {
        signingIn = false;
        $('btn-in').disabled = false;
      }
    };
    $('btn-out').onclick = () => auth.signOut();
    $('btn-create').onclick = guard(async () => {
      const name = $('new-name').value.trim().slice(0, 40);
      if (!name) return;
      await db.doc(`classes/${makeCode()}`).set({ name, active: true, createdAt: FsRest.serverTime });
      $('new-name').value = '';
      loadClasses();
    });
  }

  start().catch((e) => { $('status').textContent = 'שגיאה: ' + e.message; });
})();
