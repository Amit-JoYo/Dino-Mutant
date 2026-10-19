/* Connection self-test. Creates temporary anonymous users in the Firebase project and deletes them at the end. */
(function () {
  'use strict';

  const SDK = '10.12.2';
  const cfg = window.FIREBASE_CONFIG;
  const out = document.getElementById('out');
  const lines = [];
  const TEST_DOC = 'classes/ZZZZZZZZ';
  const base = cfg ? `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents` : '';

  const log = (s) => {
    lines.push(s);
    out.textContent = lines.join('\n');
  };

  const within = (p, ms) => {
    let t;
    return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`no answer after ${ms / 1000}s`)), ms); })]).finally(() => clearTimeout(t));
  };

  async function step(name, fn, ms) {
    const t0 = performance.now();
    try {
      const res = await within(fn(), ms || 15000);
      log(`OK    ${name}${res ? ` -> ${res}` : ''} (${Math.round(performance.now() - t0)}ms)`);
      return true;
    } catch (e) {
      log(`FAIL  ${name} -> ${e.code || ''} ${e.message || e} (${Math.round(performance.now() - t0)}ms)`);
      return false;
    }
  }

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('script blocked or failed: ' + src));
    document.head.appendChild(s);
  });

  async function restFetch(url, opts) {
    const r = await fetch(url, opts);
    let body = null;
    try { body = await r.json(); } catch (e) { /* not json */ }
    return { status: r.status, body };
  }

  async function run() {
    lines.length = 0;
    log(`time: ${new Date().toISOString()}`);
    log(`page: ${location.href}`);
    log(`online flag: ${navigator.onLine}`);
    log(`browser: ${navigator.userAgent}`);
    log(`referrer sent to google: ${document.referrer === '' ? '(page has none)' : document.referrer}`);
    if (!cfg) return log('FAIL  firebase-config.js is empty');
    log('');

    let token = null;
    let restUid = null;

    await step('1. load Firebase SDK scripts from gstatic.com', async () => {
      for (const n of ['app', 'auth', 'firestore']) await loadScript(`https://www.gstatic.com/firebasejs/${SDK}/firebase-${n}-compat.js`);
    });

    await step('2. REST: create anonymous user (identitytoolkit.googleapis.com)', async () => {
      const { status, body } = await restFetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cfg.apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
      });
      if (status !== 200) throw new Error(`HTTP ${status} ${body && body.error ? body.error.message : ''}`);
      token = body.idToken;
      restUid = body.localId;
      return 'HTTP 200';
    });

    if (token) {
      await step(`3. REST: read ${TEST_DOC} from Firestore (expected: 404 = allowed, not found)`, async () => {
        const { status, body } = await restFetch(`${base}/${TEST_DOC}`, { headers: { Authorization: `Bearer ${token}` } });
        if (status === 404 || status === 200) return `HTTP ${status} (connection and rules OK)`;
        throw new Error(`HTTP ${status} ${body && body.error ? body.error.message : ''}`);
      });
    }

    if (window.firebase) {
      for (const [label, settings] of [['4. SDK, forced long polling', { experimentalForceLongPolling: true }], ['5. SDK, default connection', {}]]) {
        const app = window.firebase.initializeApp(cfg, label.slice(0, 1));
        const db = app.firestore();
        if (Object.keys(settings).length) db.settings(settings);
        const ok = await step(`${label}: anonymous sign in`, async () => { await app.auth().signInAnonymously(); });
        if (ok) {
          await step(`${label}: read ${TEST_DOC}`, async () => {
            const snap = await db.doc(TEST_DOC).get();
            return snap.exists ? 'exists' : 'not found (connection and rules OK)';
          }, 20000);
          try { await app.auth().currentUser.delete(); } catch (e) { /* cleanup is best effort */ }
        }
      }
    }

    if (token) {
      await step('6. cleanup: delete the REST test user', async () => {
        const { status } = await restFetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${cfg.apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }),
        });
        return `HTTP ${status} (${restUid})`;
      });
    }
    log('');
    log('done');
  }

  const btn = document.getElementById('go');
  btn.onclick = async () => {
    btn.disabled = true;
    try { await run(); } catch (e) { log(`FAIL  unexpected: ${e.message}`); }
    btn.disabled = false;
  };
})();
