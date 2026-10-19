/* Minimal Firestore client over plain HTTPS (the REST API). Used instead of the Firebase SDK's own connection, which some phones and networks
   cannot keep open. It exposes the small subset the app needs: doc().get/set/update/delete and collection().get. Security rules still apply. */
(function (global) {
  'use strict';

  const serverTime = { __serverTime: true };
  const TIMEOUT_MS = 20000;

  const CODES = {
    PERMISSION_DENIED: 'permission-denied',
    NOT_FOUND: 'not-found',
    UNAUTHENTICATED: 'unauthenticated',
    RESOURCE_EXHAUSTED: 'resource-exhausted',
    FAILED_PRECONDITION: 'failed-precondition',
    INVALID_ARGUMENT: 'invalid-argument',
    ABORTED: 'aborted',
    ALREADY_EXISTS: 'already-exists',
  };

  function err(code, message) {
    return Object.assign(new Error(message || code), { code });
  }

  function encode(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
    return { mapValue: { fields: encodeFields(v) } };
  }

  function encodeFields(obj) {
    const out = {};
    Object.keys(obj).forEach((k) => {
      if (obj[k] !== undefined && obj[k] !== serverTime) out[k] = encode(obj[k]);
    });
    return out;
  }

  function decode(v) {
    if (!v || typeof v !== 'object') return null;
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('timestampValue' in v) {
      const ms = Date.parse(v.timestampValue);
      return { toMillis: () => ms };
    }
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
    if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
    return null;
  }

  function decodeFields(fields) {
    const out = {};
    Object.keys(fields).forEach((k) => { out[k] = decode(fields[k]); });
    return out;
  }

  /**
   * @param {{projectId:string}} cfg
   * @param {(forceRefresh?:boolean)=>Promise<string>} getToken returns a Firebase ID token
   */
  function client(cfg, getToken) {
    const root = `projects/${cfg.projectId}/databases/(default)/documents`;
    const host = 'https://firestore.googleapis.com/v1';

    async function call(method, url, body, retried) {
      const token = await getToken(!!retried);
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
      let res;
      try {
        res = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          signal: ctl.signal,
        });
      } catch (e) {
        throw err(e && e.name === 'AbortError' ? 'timeout' : 'unavailable', e && e.message);
      } finally {
        clearTimeout(timer);
      }
      let json = null;
      try { json = await res.json(); } catch (e) { /* empty body */ }
      if (res.status === 401 && !retried) return call(method, url, body, true);
      if (res.ok || res.status === 404) return { status: res.status, json };
      const status = json && json.error && json.error.status;
      throw err(CODES[status] || `http-${res.status}`, json && json.error && json.error.message);
    }

    function commit(path, fields, opts) {
      const write = { update: { name: `${root}/${path}`, fields: encodeFields(fields) } };
      const stamps = Object.keys(fields).filter((k) => fields[k] === serverTime);
      if (stamps.length) write.updateTransforms = stamps.map((k) => ({ fieldPath: k, setToServerValue: 'REQUEST_TIME' }));
      if (opts && opts.mustExist) {
        write.updateMask = { fieldPaths: Object.keys(fields).filter((k) => fields[k] !== serverTime) };
        write.currentDocument = { exists: true };
      }
      return call('POST', `${host}/${root}:commit`, { writes: [write] });
    }

    function snapshot(path, raw) {
      const data = raw ? decodeFields(raw.fields || {}) : null;
      const id = path.slice(path.lastIndexOf('/') + 1);
      return { id, exists: !!raw, data: () => data, ref: doc(path) };
    }

    function doc(path) {
      return {
        path,
        async get() {
          const { status, json } = await call('GET', `${host}/${root}/${path}`);
          return snapshot(path, status === 404 ? null : json);
        },
        async set(data) {
          await commit(path, data);
        },
        async update(data) {
          const { status } = await commit(path, data, { mustExist: true });
          if (status === 404) throw err('not-found', 'document does not exist');
        },
        async delete() {
          await call('POST', `${host}/${root}:commit`, { writes: [{ delete: `${root}/${path}` }] });
        },
      };
    }

    function collection(path) {
      return {
        async get() {
          const docs = [];
          let token = '';
          do {
            const { status, json } = await call('GET', `${host}/${root}/${path}?pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`);
            if (status !== 404 && json && json.documents) {
              json.documents.forEach((d) => docs.push(snapshot(`${path}/${d.name.slice(d.name.lastIndexOf('/') + 1)}`, d)));
            }
            token = (json && json.nextPageToken) || '';
          } while (token);
          return { docs, empty: docs.length === 0 };
        },
      };
    }

    return { doc, collection };
  }

  global.FsRest = { client, serverTime, encode, decode, decodeFields, encodeFields };
})(typeof window !== 'undefined' ? window : globalThis);
