/* Hebrew writing: she traces a letter (printed or handwriting style) with her finger, a pen or a mouse.
   The letter is drawn from a font; to check her tracing we rasterise the letter, thin it to a centre line (its "skeleton")
   and compare: does her ink cover the whole centre line, and does it stay on the letter, without scribbling?
   Three steps per letter: a bold guide, a faint guide, and from memory. */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const LETTERS = [
    ['א', 'אָלֶף'], ['ב', 'בֵּית'], ['ג', 'גִּימֶל'], ['ד', 'דָּלֶת'], ['ה', 'הֵא'], ['ו', 'וָו'], ['ז', 'זַיִן'], ['ח', 'חֵית'], ['ט', 'טֵית'],
    ['י', 'יוֹד'], ['כ', 'כָּף'], ['ל', 'לָמֶד'], ['מ', 'מֵם'], ['נ', 'נוּן'], ['ס', 'סָמֶךְ'], ['ע', 'עַיִן'], ['פ', 'פֵּא'], ['צ', 'צָדִי'],
    ['ק', 'קוּף'], ['ר', 'רֵישׁ'], ['ש', 'שִׁין'], ['ת', 'תָּו'],
  ];
  const FINALS = [['ך', 'כָּף סוֹפִית'], ['ם', 'מֵם סוֹפִית'], ['ן', 'נוּן סוֹפִית'], ['ף', 'פֵּא סוֹפִית'], ['ץ', 'צָדִי סוֹפִית']];
  const ALL = LETTERS.concat(FINALS);

  // family must match the @font-face names in style.css; scale is the font size as a fraction of the pad
  const STYLES = {
    print: { key: 'print', label: 'דַּפּוּס', family: 'WriteRubik', weight: '700', scale: 0.85 },
    hand: { key: 'hand', label: 'כְּתַב יָד', family: 'WriteGveret', weight: '400', scale: 0.95 },
  };

  const GRID = 100; // the letter and the ink are compared on a GRID x GRID raster
  const STEPS = 3;
  const REPEATS = 2; // successes needed to move to the next step
  const MIN_COVER = [0.85, 0.8, 0.75];
  const MIN_ACCURACY = 0.8;
  const MAX_INK = 4.2; // ink may be at most this many times the length of the letter's centre line

  let styleKey = 'print';
  let letterIdx = 0;
  let pad = null; // the open practice session

  const progressOf = (style, ch) => {
    const st = global.App.state;
    if (!st.writing) st.writing = {};
    if (!st.writing[style]) st.writing[style] = {};
    return st.writing[style][ch] || (st.writing[style][ch] = { n: 0 });
  };
  const stepOf = (n) => Math.min(STEPS - 1, Math.floor(n / REPEATS)); // 0..2
  const starsOf = (n) => Math.min(3, Math.floor(n / REPEATS));

  /* ---------- drawing the letter ---------- */
  function layout(ctx, ch, st, size) {
    const F = size * st.scale;
    ctx.font = `${st.weight} ${F}px ${st.family}, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(ch);
    return {
      x: size / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
      y: size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
    };
  }

  function drawGlyph(ctx, ch, st, size, mode) {
    const p = layout(ctx, ch, st, size);
    if (mode === 'bold') {
      ctx.fillStyle = '#dcefe3';
      ctx.fillText(ch, p.x, p.y);
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#79b78d';
      ctx.strokeText(ch, p.x, p.y);
      ctx.restore();
    } else if (mode === 'faint') {
      ctx.fillStyle = '#eaf4ee';
      ctx.fillText(ch, p.x, p.y);
    } else if (mode === 'solid') {
      ctx.fillStyle = '#000';
      ctx.fillText(ch, p.x, p.y);
    }
  }

  /* ---------- reading the letter: mask, centre line, tolerances ---------- */
  function chamfer(fg, w, h) {
    // distance from every cell to the nearest foreground cell
    const INF = 1e9;
    const d = new Float32Array(w * h);
    for (let i = 0; i < d.length; i++) d[i] = fg[i] ? 0 : INF;
    const S = Math.SQRT2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
        if (y > 0) {
          d[i] = Math.min(d[i], d[i - w] + 1);
          if (x > 0) d[i] = Math.min(d[i], d[i - w - 1] + S);
          if (x < w - 1) d[i] = Math.min(d[i], d[i - w + 1] + S);
        }
      }
    }
    for (let y = h - 1; y >= 0; y--) {
      for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x;
        if (x < w - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
        if (y < h - 1) {
          d[i] = Math.min(d[i], d[i + w] + 1);
          if (x < w - 1) d[i] = Math.min(d[i], d[i + w + 1] + S);
          if (x > 0) d[i] = Math.min(d[i], d[i + w - 1] + S);
        }
      }
    }
    return d;
  }

  // Zhang-Suen thinning: reduces the letter to a one-cell-wide centre line.
  function thin(mask, w, h) {
    const img = Uint8Array.from(mask);
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]);
    let changed = true;
    while (changed) {
      changed = false;
      for (let pass = 0; pass < 2; pass++) {
        const del = [];
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            if (!img[y * w + x]) continue;
            const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1);
            const p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
            const nb = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
            if (nb < 2 || nb > 6) continue;
            const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
            let trans = 0;
            for (let k = 0; k < 8; k++) if (!seq[k] && seq[k + 1]) trans++;
            if (trans !== 1) continue;
            if (pass === 0 ? p2 * p4 * p6 || p4 * p6 * p8 : p2 * p4 * p8 || p2 * p6 * p8) continue;
            del.push(y * w + x);
          }
        }
        if (del.length) changed = true;
        del.forEach((i) => (img[i] = 0));
      }
    }
    return img;
  }

  const targets = {};

  function buildTarget(ch, st) {
    const id = `${st.key}:${ch}`;
    if (targets[id]) return targets[id];
    const c = document.createElement('canvas');
    c.width = c.height = GRID;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    drawGlyph(ctx, ch, st, GRID, 'solid');
    const px = ctx.getImageData(0, 0, GRID, GRID).data;
    const mask = new Uint8Array(GRID * GRID);
    for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4 + 3] > 110 ? 1 : 0;
    const skel = thin(mask, GRID, GRID);
    const inside = chamfer(mask.map((v) => 1 - v), GRID, GRID); // for mask cells: distance to the edge
    const outside = chamfer(mask, GRID, GRID); // for other cells: distance to the letter
    const sk = [];
    const halves = [];
    for (let i = 0; i < skel.length; i++) {
      if (skel[i]) {
        sk.push(i);
        halves.push(inside[i]);
      }
    }
    halves.sort((a, b) => a - b);
    const half = halves.length ? halves[Math.floor(halves.length / 2)] : 3;
    const t = { mask, sk, outside, half, tol: half + 1.8, box: [GRID, GRID, 0, 0] };
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const x = i % GRID;
      const y = (i - x) / GRID;
      t.box = [Math.min(t.box[0], x), Math.min(t.box[1], y), Math.max(t.box[2], x), Math.max(t.box[3], y)];
    }
    // where to start: the top-right end of the centre line (Hebrew is written from the right)
    let best = null;
    let bestScore = -1e9;
    const nbrs = (i) => {
      const x = i % GRID;
      const y = (i - x) / GRID;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && skel[(y + dy) * GRID + x + dx]) n++;
      return n;
    };
    const ends = sk.filter((i) => nbrs(i) <= 1);
    (ends.length ? ends : sk).forEach((i) => {
      const x = i % GRID;
      const y = (i - x) / GRID;
      const score = x - y * 1.4;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    t.start = best == null ? null : [best % GRID, Math.floor(best / GRID)];
    targets[id] = t;
    return t;
  }

  /* ---------- stroke order: the strokes of the letter in the order and direction they are written ---------- */
  const strokeData = (ch, st) => (global.WriteStrokes && global.WriteStrokes[st.key] && global.WriteStrokes[st.key][ch]) || null;

  function pathsOf(t, ch, st) {
    if (t.paths) return t.paths;
    const data = strokeData(ch, st);
    const [x0, y0, x1, y1] = t.box;
    // the data is relative to the centre line's extent: for the printed letters the letter's box without half a pen width on every side,
    // for the handwriting font (whose strokes end in round blobs) the extent of the centre line itself
    let ix0 = x0 + t.half;
    let iy0 = y0 + t.half;
    let iw = x1 - x0 - 2 * t.half;
    let ih = y1 - y0 - 2 * t.half;
    if (st.key === 'hand' && t.sk.length) {
      const xs = t.sk.map((i) => i % GRID);
      const ys = t.sk.map((i) => Math.floor(i / GRID));
      ix0 = Math.min(...xs);
      iy0 = Math.min(...ys);
      iw = Math.max(...xs) - ix0;
      ih = Math.max(...ys) - iy0;
    }
    iw = Math.max(1, iw);
    ih = Math.max(1, ih);
    const raw = (data || []).map((s) => s.map(([fx, fy]) => [ix0 + fx * iw, iy0 + fy * ih]));
    t.paths = raw.map((s) => followCentreLine(t, s));
    return t.paths;
  }

  // The listed points only say roughly where a stroke goes. The stroke itself follows the letter's centre line between them,
  // so the guide and the demonstration run exactly along the letter.
  function followCentreLine(t, pts) {
    if (!t.sk.length) return pts;
    const nearest = (p) => {
      let best = t.sk[0];
      let bd = Infinity;
      t.sk.forEach((i) => {
        const x = i % GRID;
        const d = (x - p[0]) * (x - p[0]) + ((i - x) / GRID - p[1]) * ((i - x) / GRID - p[1]);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    };
    const cells = [];
    pts.map(nearest).forEach((c) => {
      if (cells[cells.length - 1] !== c) cells.push(c);
    });
    if (cells.length < 2) return pts;
    const walk = [cells[0]];
    for (let i = 1; i < cells.length; i++) {
      const leg = centreLineWalk(t, cells[i - 1], cells[i]);
      if (!leg) return pts;
      walk.push(...leg.slice(1));
    }
    const xy = walk.map((c) => [(c % GRID) + 0.5, Math.floor(c / GRID) + 0.5]);
    // light smoothing of the pixel steps, the ends stay where they are
    return xy.map((p, i) => {
      if (i === 0 || i === xy.length - 1) return p;
      const a = Math.max(0, i - 2);
      const b = Math.min(xy.length - 1, i + 2);
      let sx = 0;
      let sy = 0;
      for (let j = a; j <= b; j++) {
        sx += xy[j][0];
        sy += xy[j][1];
      }
      return [sx / (b - a + 1), sy / (b - a + 1)];
    });
  }

  // shortest way from one cell of the centre line to another along the centre line (Dijkstra), as a list of cells
  function centreLineWalk(t, from, to) {
    const dist = new Map([[from, 0]]);
    const prev = new Map();
    const open = new Set([from]);
    const done = new Set();
    const on = new Set(t.sk);
    while (open.size) {
      let cur = -1;
      let cd = Infinity;
      open.forEach((c) => {
        if (dist.get(c) < cd) {
          cd = dist.get(c);
          cur = c;
        }
      });
      if (cur === to) break;
      open.delete(cur);
      done.add(cur);
      const x = cur % GRID;
      const y = (cur - x) / GRID;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
          const n = ny * GRID + nx;
          if (!on.has(n) || done.has(n)) continue;
          const nd = cd + (dx && dy ? Math.SQRT2 : 1);
          if (nd < (dist.has(n) ? dist.get(n) : Infinity)) {
            dist.set(n, nd);
            prev.set(n, cur);
            open.add(n);
          }
        }
      }
    }
    if (!dist.has(to)) return null;
    const out = [to];
    while (out[0] !== from) out.unshift(prev.get(out[0]));
    return out;
  }

  const pathLength = (p) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);

  // the first `dist` of a path (grid units), with its end point
  function pathPrefix(p, dist) {
    const out = [p[0]];
    let left = dist;
    for (let i = 1; i < p.length; i++) {
      const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (seg >= left) {
        const f = seg ? left / seg : 0;
        out.push([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f]);
        return out;
      }
      out.push(p[i]);
      left -= seg;
    }
    return out;
  }

  /* ---------- checking her tracing ---------- */
  function rasteriseInk(strokes, size) {
    const c = document.createElement('canvas');
    c.width = c.height = GRID;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const k = GRID / size;
    ctx.lineWidth = 1.3;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    strokes.forEach((s) => {
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0][0] * k, s[0][1] * k, 0.9, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.beginPath();
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
      ctx.stroke();
    });
    const px = ctx.getImageData(0, 0, GRID, GRID).data;
    const ink = new Uint8Array(GRID * GRID);
    let count = 0;
    for (let i = 0; i < ink.length; i++) {
      if (px[i * 4 + 3] > 90) {
        ink[i] = 1;
        count++;
      }
    }
    return { ink, count };
  }

  /* From memory she may write the letter smaller, bigger or off-centre, so her ink is first stretched onto the letter's box. */
  function fitToLetter(strokes, size, t) {
    const pts = strokes.flat();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(([x, y]) => {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    });
    const k = size / GRID;
    const [bx0, by0, bx1, by1] = t.box.map((v) => v * k);
    const sx = (bx1 - bx0) / Math.max(1, x1 - x0);
    const sy = (by1 - by0) / Math.max(1, y1 - y0);
    // very different proportions (a long line standing for a wide letter) are not stretched into a match
    const clamp = (v) => Math.min(1.6, Math.max(0.6, v));
    const fx = clamp(sx);
    const fy = clamp(sy);
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    return strokes.map((s) => s.map(([x, y]) => [cx + (x - mx) * fx, cy + (y - my) * fy]));
  }

  function evaluate(strokes, size, t, step) {
    const memory = step === 2;
    const { ink, count } = rasteriseInk(memory && strokes.length ? fitToLetter(strokes, size, t) : strokes, size);
    if (count < 8) return { ok: false, reason: 'empty', missing: [], cover: 0, accuracy: 0 };
    const tol = memory ? t.half * 0.8 + 1.2 : t.tol;
    const near = memory ? 1.5 : 2;
    const R = Math.ceil(tol);
    const missing = [];
    let covered = 0;
    t.sk.forEach((i) => {
      const x = i % GRID;
      const y = (i - x) / GRID;
      let hit = false;
      for (let dy = -R; dy <= R && !hit; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= GRID || yy >= GRID) continue;
          if (ink[yy * GRID + xx] && dx * dx + dy * dy <= tol * tol) {
            hit = true;
            break;
          }
        }
      }
      if (hit) covered++;
      else missing.push(i);
    });
    const cover = covered / t.sk.length;
    let onLetter = 0;
    for (let i = 0; i < ink.length; i++) if (ink[i] && t.outside[i] <= near) onLetter++;
    const accuracy = onLetter / count;
    const tooMuch = count > MAX_INK * t.sk.length;
    let reason = 'ok';
    if (tooMuch) reason = 'scribble';
    else if (accuracy < MIN_ACCURACY) reason = 'off';
    else if (cover < MIN_COVER[step]) reason = 'missing';
    return { ok: reason === 'ok', reason, missing, cover, accuracy };
  }

  /* From memory the ink must also fit the right letter better than any other, so a ד does not pass for a ר. */
  function confusedWith(strokes, size, st, ch) {
    const mine = evaluate(strokes, size, buildTarget(ch, st), 2);
    const score = (r) => r.cover * r.accuracy;
    let worst = null;
    let best = score(mine) + 0.03;
    ALL.forEach(([other, name]) => {
      if (other === ch) return;
      const r = evaluate(strokes, size, buildTarget(other, st), 2);
      if (r.ok && score(r) > best) {
        best = score(r);
        worst = name;
      }
    });
    return worst;
  }

  /* ---------- the letter list ---------- */
  function renderPick() {
    const st = STYLES[styleKey];
    $('write-pad').hidden = true;
    $('write-pick').hidden = false;
    document.querySelectorAll('#write-styles button').forEach((b) => b.classList.toggle('on', b.dataset.style === styleKey));
    const cell = ([ch, name], i) => {
      const pr = progressOf(styleKey, ch);
      const s = starsOf(pr.n);
      return `<button class="wl-letter${s >= 3 ? ' done' : ''}" data-i="${i}" aria-label="${name}" style="font-family:${st.family};font-weight:${st.weight}"><b>${ch}</b><small>${'⭐'.repeat(s)}${'☆'.repeat(3 - s)}</small></button>`;
    };
    $('write-grid').innerHTML = LETTERS.map((l, i) => cell(l, i)).join('');
    $('write-finals').innerHTML = FINALS.map((l, i) => cell(l, LETTERS.length + i)).join('');
  }

  /* ---------- practice ---------- */
  function sizeCanvas() {
    const c = $('write-canvas');
    const size = Math.max(220, Math.min(440, Math.floor(c.parentElement.clientWidth)));
    const dpr = Math.min(2, global.devicePixelRatio || 1);
    c.style.width = c.style.height = `${size}px`;
    c.width = c.height = Math.round(size * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, size };
  }

  async function open(i) {
    const [ch, name] = ALL[i];
    const st = STYLES[styleKey];
    letterIdx = i;
    $('write-pick').hidden = true;
    $('write-pad').hidden = false;
    $('write-result').hidden = true;
    try {
      await document.fonts.load(`${st.weight} 100px ${st.family}`, ch);
    } catch (e) { /* the system font is used */ }
    const { ctx, size } = sizeCanvas();
    const pr = progressOf(styleKey, ch);
    const target = buildTarget(ch, st);
    if (pad) stopDemo();
    pad = { ch, name, st, ctx, size, strokes: [], cur: null, peek: false, hints: null, step: stepOf(pr.n), target, paths: pathsOf(target, ch, st), demo: null, raf: 0, showHow: false, timer: 0, busy: false };
    $('write-name').textContent = name;
    renderStep();
    redraw();
    if (global.App) global.App.speak(name);
    if (pr.n === 0 && pad.paths.length) {
      const me = pad;
      setTimeout(() => pad === me && !me.strokes.length && playDemo(), 600);
    }
  }

  function renderStep() {
    const labels = ['עִם הַדְרָכָה', 'הַדְרָכָה חַלָּשָׁה', 'מֵהַזִּכָּרוֹן'];
    $('write-step').textContent = `שָׁלָב ${pad.step + 1}/${STEPS} · ${labels[pad.step]}`;
    $('btn-peek').hidden = pad.step === 0;
    renderHow();
  }

  /* ---------- showing and telling the stroke order ---------- */
  const NUMS = ['①', '②', '③', '④', '⑤', '⑥'];
  const WORDS = { r: 'יָמִינָה', l: 'שְׂמֹאלָה', d: 'לְמַטָּה', u: 'לְמַעְלָה' };

  // Douglas-Peucker: the few corners of a stroke
  function corners(p, eps) {
    if (p.length < 3) return p;
    const [ax, ay] = p[0];
    const [bx, by] = p[p.length - 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = 0;
    let at = 0;
    for (let i = 1; i < p.length - 1; i++) {
      const d = Math.abs((bx - ax) * (ay - p[i][1]) - (ax - p[i][0]) * (by - ay)) / len;
      if (d > far) {
        far = d;
        at = i;
      }
    }
    if (far <= eps) return [p[0], p[p.length - 1]];
    return corners(p.slice(0, at + 1), eps).slice(0, -1).concat(corners(p.slice(at), eps));
  }

  // "right, down, left" for one stroke
  function describe(stroke) {
    const out = [];
    const pts = corners(stroke, 0.22);
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      if (Math.hypot(dx, dy) < 0.18) continue;
      const h = dx > 0 ? WORDS.r : WORDS.l;
      const v = dy > 0 ? WORDS.d : WORDS.u;
      let w;
      if (Math.abs(dy) <= Math.abs(dx) * 0.4) w = h;
      else if (Math.abs(dx) <= Math.abs(dy) * 0.4) w = v;
      else w = `בַּאֲלַכְסוֹן ${h} וּ${v}`;
      if (out[out.length - 1] !== w) out.push(w);
    }
    return out.join(', ');
  }

  function arrowHead(ctx, a, b, k) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const s = 9;
    ctx.beginPath();
    ctx.moveTo(b[0] * k, b[1] * k);
    ctx.lineTo(b[0] * k - s * Math.cos(ang - 0.5), b[1] * k - s * Math.sin(ang - 0.5));
    ctx.lineTo(b[0] * k - s * Math.cos(ang + 0.5), b[1] * k - s * Math.sin(ang + 0.5));
    ctx.closePath();
    ctx.fill();
  }

  // numbered start points (and, with `lines`, the way to go) for the strokes she has not written yet
  function drawGuide(ctx, p, lines) {
    const k = p.size / GRID;
    const done = Math.min(p.strokes.length, p.paths.length);
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    p.paths.forEach((path, i) => {
      if (i < done) return;
      const next = i === done;
      const col = next ? '#2fa84f' : '#8ab89a';
      if (lines && path.length > 1) {
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = next ? 4 : 3;
        ctx.globalAlpha = next ? 0.9 : 0.6;
        ctx.beginPath();
        path.forEach(([x, y], j) => (j ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
        ctx.stroke();
        const end = path[path.length - 1];
        let before = path[0];
        for (let j = path.length - 2; j >= 0; j--) {
          before = path[j];
          if (Math.hypot(end[0] - before[0], end[1] - before[1]) > 4) break;
        }
        arrowHead(ctx, before, end, k);
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(path[0][0] * k, path[0][1] * k, next ? 12 : 10, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${next ? 14 : 12}px Rubik, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), path[0][0] * k, path[0][1] * k + 1);
    });
    ctx.restore();
  }

  function drawDemo(ctx, p) {
    const k = p.size / GRID;
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = Math.max(8, p.size * 0.03, 1.7 * p.target.half * k);
    let tip = null;
    p.demo.forEach((path) => {
      ctx.beginPath();
      path.forEach(([x, y], j) => (j ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
      ctx.stroke();
      tip = path[path.length - 1];
    });
    if (tip) {
      ctx.beginPath();
      ctx.arc(tip[0] * k, tip[1] * k, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.restore();
  }

  function stopDemo() {
    if (!pad) return;
    cancelAnimationFrame(pad.raf);
    pad.demo = null;
  }

  // draws the letter once, stroke after stroke, in the right order and direction
  function playDemo() {
    if (!pad || !pad.paths.length) return;
    const me = pad;
    stopDemo();
    clearTimeout(me.timer);
    me.showHow = true;
    renderHow();
    const MS_PER_UNIT = 16;
    const GAP = 450;
    const lens = me.paths.map(pathLength);
    const total = lens.reduce((s, l) => s + l * MS_PER_UNIT + GAP, 0);
    const t0 = performance.now();
    const tick = (now) => {
      if (pad !== me) return;
      let rest = now - t0;
      if (rest >= total) {
        me.demo = null;
        redraw();
        return;
      }
      const parts = [];
      for (let i = 0; i < me.paths.length; i++) {
        const d = lens[i] * MS_PER_UNIT;
        if (rest >= d + GAP) {
          parts.push(me.paths[i]);
          rest -= d + GAP;
          continue;
        }
        parts.push(pathPrefix(me.paths[i], lens[i] * Math.min(1, rest / d)));
        break;
      }
      me.demo = parts;
      redraw();
      me.raf = requestAnimationFrame(tick);
    };
    me.raf = requestAnimationFrame(tick);
  }

  function renderHow() {
    const el = $('write-howto');
    const on = pad && pad.paths.length && (pad.step < 2 || pad.showHow);
    el.hidden = !on;
    $('btn-write-demo').hidden = !(pad && pad.paths.length);
    if (!on) return;
    const parts = strokeData(pad.ch, pad.st).map((s, i) => `<b>${NUMS[i] || i + 1}</b> ${describe(s)}`);
    el.innerHTML = `${pad.paths.length > 1 ? `${pad.paths.length} קַוִּים: ` : 'קַו אֶחָד: '}${parts.join(' &nbsp;·&nbsp; ')}`;
  }

  function redraw() {
    const { ctx, size, st } = pad;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    // faint writing lines
    ctx.strokeStyle = '#e3eee7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
    ctx.setLineDash([]);
    const mode = pad.peek ? 'bold' : ['bold', 'faint', 'none'][pad.step];
    drawGlyph(ctx, pad.ch, st, size, mode);
    if (pad.paths.length) {
      drawGuide(ctx, pad, pad.step === 0 || pad.peek);
    } else if (pad.step === 0 && pad.target.start && !pad.strokes.length) {
      const k = size / GRID;
      const [sx, sy] = pad.target.start;
      ctx.beginPath();
      ctx.arc(sx * k, sy * k, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(47,168,79,.85)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3f8bd8';
    ctx.lineWidth = Math.max(8, size * 0.03);
    pad.strokes.forEach((s) => {
      ctx.beginPath();
      if (s.length === 1) {
        ctx.arc(s[0][0], s[0][1], ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#3f8bd8';
        ctx.fill();
        return;
      }
      s.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    });
    if (pad.demo) drawDemo(ctx, pad);
    if (pad.hints) {
      const k = size / GRID;
      ctx.fillStyle = 'rgba(229,72,77,.85)';
      pad.hints.forEach((i, j) => {
        if (j % 3) return;
        const x = i % GRID;
        const y = (i - x) / GRID;
        ctx.beginPath();
        ctx.arc(x * k, y * k, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function point(e) {
    const r = $('write-canvas').getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * pad.size, ((e.clientY - r.top) / r.height) * pad.size];
  }

  function onDown(e) {
    if (!pad || pad.busy) return;
    e.preventDefault();
    try {
      $('write-canvas').setPointerCapture(e.pointerId);
    } catch (err) { /* fine: the stroke still follows the pointer over the canvas */ }
    clearTimeout(pad.timer);
    stopDemo();
    if (pad.hints) pad.hints = null;
    pad.cur = [point(e)];
    pad.strokes.push(pad.cur);
    redraw();
  }

  function onMove(e) {
    if (!pad || !pad.cur) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    (evs.length ? evs : [e]).forEach((ev) => pad.cur.push(point(ev)));
    redraw();
  }

  function onUp() {
    if (!pad || !pad.cur) return;
    pad.cur = null;
    // A letter that is already right is accepted after a short pause; mistakes are only pointed out when she presses ✔.
    clearTimeout(pad.timer);
    pad.timer = setTimeout(() => check(true), 1300);
  }

  function clearInk() {
    if (!pad) return;
    clearTimeout(pad.timer);
    pad.strokes = [];
    pad.hints = null;
    $('write-feedback').textContent = '';
    redraw();
  }

  const MESSAGES = {
    empty: 'כִּתְבִי אֶת הָאוֹת עִם הָאֶצְבַּע ✍️',
    missing: 'כִּמְעַט! חָסֵר עוֹד קְצָת, הַנְּקֻדּוֹת הָאֲדֻמּוֹת מַרְאוֹת אֵיפֹה',
    off: 'נַסִּי לְהִשָּׁאֵר עַל הָאוֹת. מוֹחֲקִים וְשׁוּב 🧽',
    scribble: 'לְאַט וּבְיֹשֶׁר, בְּלִי לְמַלֵּא 🐢. מוֹחֲקִים וְשׁוּב',
  };

  function check(auto) {
    if (!pad || pad.busy || !pad.strokes.length) {
      if (!auto && pad && !pad.strokes.length) $('write-feedback').textContent = MESSAGES.empty;
      return;
    }
    const res = evaluate(pad.strokes, pad.size, pad.target, pad.step);
    if (res.ok && pad.step === 2) {
      const other = confusedWith(pad.strokes, pad.size, pad.st, pad.ch);
      if (other) {
        res.ok = false;
        res.reason = 'similar';
        res.other = other;
      }
    }
    if (res.ok) return success();
    if (auto) return;
    $('write-feedback').textContent = res.reason === 'similar' ? `זֶה נִרְאֶה כְּמוֹ ${res.other}. נַסִּי שׁוּב 🤔` : MESSAGES[res.reason];
    if (res.reason === 'missing' && pad.step < 2) {
      pad.hints = res.missing;
      redraw();
      setTimeout(() => {
        if (pad) {
          pad.hints = null;
          redraw();
        }
      }, 2800);
    }
  }

  function success() {
    const App = global.App;
    pad.busy = true;
    clearTimeout(pad.timer);
    const pr = progressOf(styleKey, pad.ch);
    const before = starsOf(pr.n);
    pr.n++;
    const after = starsOf(pr.n);
    const stepBefore = pad.step;
    App.addDna(2);
    let extra = '';
    if (after > before) {
      App.addDna(5);
      extra = ` · ⭐ +5 דנ״א`;
    }
    App.save();
    const lines = [`+2 נְקֻדּוֹת דנ״א${extra}`];
    if (after === 3 && before < 3) {
      const update = App.applyReadingUpdate();
      lines.push(`הָאוֹת ${pad.ch} שֶׁלָּךְ! ${update.text}`);
      App.celebrate({
        title: `שָׁלַטְתְּ בָּאוֹת ${pad.ch}! 🌟`,
        lines,
        dinoHtml: App.dinoHtml(update.dino),
        onClose: () => next(),
      });
      return;
    }
    const msg = stepOf(pr.n) > stepBefore ? 'כׇּל הַכָּבוֹד! עוֹבְרִים לַשָּׁלָב הַבָּא 🎉' : 'יוֹפִי! 🎉';
    $('write-result').innerHTML = `<h3>${msg}</h3><p>${lines.join('')}</p>
      <div class="row"><button class="btn big" id="btn-w-again">עוֹד פַּעַם ✍️</button><button class="btn ghost" id="btn-w-next">הָאוֹת הַבָּאָה ➔</button></div>`;
    $('write-result').hidden = false;
    redraw();
  }

  function next() {
    open((letterIdx + 1) % ALL.length);
  }

  function peek() {
    if (!pad || pad.peek) return;
    pad.peek = true;
    redraw();
    setTimeout(() => {
      if (pad) {
        pad.peek = false;
        redraw();
      }
    }, 2200);
  }

  function back() {
    stopDemo();
    pad = null;
    global.App.showTab('write');
  }

  function init() {
    const c = $('write-canvas');
    if (!c) return;
    c.addEventListener('pointerdown', onDown);
    c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerup', onUp);
    c.addEventListener('pointercancel', onUp);
    $('write-styles').addEventListener('click', (e) => {
      const b = e.target.closest('[data-style]');
      if (b) {
        styleKey = b.dataset.style;
        renderPick();
      }
    });
    const pick = (e) => {
      const b = e.target.closest('[data-i]');
      if (b) open(Number(b.dataset.i));
    };
    $('write-grid').addEventListener('click', pick);
    $('write-finals').addEventListener('click', pick);
    $('btn-write-back').addEventListener('click', back);
    $('btn-write-clear').addEventListener('click', clearInk);
    $('btn-write-check').addEventListener('click', () => check(false));
    $('btn-peek').addEventListener('click', peek);
    $('btn-write-demo').addEventListener('click', playDemo);
    $('btn-write-say').addEventListener('click', () => pad && global.App.speak(pad.name));
    $('write-result').addEventListener('click', (e) => {
      if (e.target.closest('#btn-w-again')) open(letterIdx);
      else if (e.target.closest('#btn-w-next')) next();
    });
  }

  global.Writing = { init, renderPick, _test: { buildTarget, pathsOf, evaluate, confusedWith, STYLES, ALL, GRID, get STROKES() { return global.WriteStrokes; } } };
})(window);
