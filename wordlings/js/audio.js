/* Sound: English speech from the device's voices, and small sound effects made with the Web Audio API (no audio files). */
(function (global) {
  'use strict';

  let timer = 0;
  let muted = false;

  function pickVoice() {
    const voices = global.speechSynthesis ? global.speechSynthesis.getVoices() : [];
    const us = voices.filter((v) => /^en[-_]US/i.test(v.lang));
    return us.find((v) => /natural|online/i.test(v.name)) || us.find((v) => /google/i.test(v.name)) || us[0] || voices.find((v) => /^en/i.test(v.lang)) || null;
  }

  /** A single word is said twice, slowly: the first sound of a lone word is often clipped. */
  function say(text, opts) {
    const synth = global.speechSynthesis;
    if (!synth || muted) return;
    synth.cancel();
    let t = String(text).trim();
    const single = !/\s/.test(t);
    if (single) t = `${t}. ${t}.`;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'en-US';
    u.rate = (opts && opts.rate) || (single ? 0.8 : 0.85);
    u.volume = 1;
    const v = pickVoice();
    if (v) u.voice = v;
    clearTimeout(timer);
    timer = setTimeout(() => synth.speak(u), 120);
  }

  function stop() {
    clearTimeout(timer);
    if (global.speechSynthesis) global.speechSynthesis.cancel();
  }

  let ctx = null;
  function tone(freq, start, dur, type, gain) {
    if (muted) return;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    const t0 = ctx.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  const sfx = {
    ok() { tone(660, 0, 0.14, 'triangle'); tone(880, 0.1, 0.22, 'triangle'); },
    bad() { tone(220, 0, 0.22, 'sine', 0.12); },
    tap() { tone(520, 0, 0.06, 'sine', 0.1); },
    throw() { tone(300, 0, 0.18, 'sine', 0.12); tone(500, 0.1, 0.18, 'sine', 0.12); },
    wobble() { tone(180, 0, 0.12, 'square', 0.07); },
    caught() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.2)); },
    level() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.18)); },
  };

  global.Sound = {
    say,
    stop,
    sfx,
    get muted() { return muted; },
    setMuted(m) { muted = !!m; if (muted) stop(); },
    warmUp() { if (global.speechSynthesis) global.speechSynthesis.getVoices(); },
  };
})(window);
