/* Sound: English speech from the device's voices, and small sound effects made with the Web Audio API (no audio files). */
(function (global) {
  'use strict';

  let timer = 0;
  let muted = false;

  function pickVoice(lang) {
    const voices = global.speechSynthesis ? global.speechSynthesis.getVoices() : [];
    if (lang === 'he') return voices.find((v) => /^he/i.test(v.lang) || /^iw/i.test(v.lang)) || null;
    const us = voices.filter((v) => /^en[-_]US/i.test(v.lang));
    return us.find((v) => /natural|online/i.test(v.name)) || us.find((v) => /google/i.test(v.name)) || us[0] || voices.find((v) => /^en/i.test(v.lang)) || null;
  }

  function utterance(text, lang, rate) {
    const u = new SpeechSynthesisUtterance(String(text).trim());
    u.lang = lang === 'he' ? 'he-IL' : 'en-US';
    u.rate = rate || (lang === 'he' ? 0.85 : 0.8);
    u.volume = 1;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    return u;
  }

  /** Says one English word or sentence; the short delay stops desktop Chrome clipping the first sound. */
  function say(text, opts) {
    const synth = global.speechSynthesis;
    if (!synth || muted) return;
    synth.cancel();
    const u = utterance(text, 'en', opts && opts.rate);
    clearTimeout(timer);
    timer = setTimeout(() => synth.speak(u), 120);
  }

  /** Says several parts one after the other, e.g. an English name and then its Hebrew line: [{ text, lang: 'en' | 'he' }]. */
  function sayAll(parts) {
    const synth = global.speechSynthesis;
    if (!synth || muted) return;
    synth.cancel();
    const list = parts.filter((x) => x && x.text && String(x.text).trim()).map((x) => utterance(x.text.replace(/[^\u0590-\u05FFA-Za-z0-9 .,!?'-]/g, ' '), x.lang));
    clearTimeout(timer);
    // One after the other: some browsers drop an utterance that is queued while the previous one uses a different voice.
    const next = (i) => {
      if (i >= list.length) return;
      const u = list[i];
      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        setTimeout(() => next(i + 1), 150);
      };
      u.onend = go;
      u.onerror = go;
      synth.speak(u);
    };
    timer = setTimeout(() => next(0), 120);
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
    alert() { tone(880, 0, 0.09, 'square', 0.1); tone(1175, 0.1, 0.16, 'square', 0.1); },
    bump() { tone(150, 0, 0.08, 'square', 0.06); },
    throw() { tone(300, 0, 0.18, 'sine', 0.12); tone(500, 0.1, 0.18, 'sine', 0.12); },
    wobble() { tone(180, 0, 0.12, 'square', 0.07); },
    caught() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.2)); },
    level() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.18)); },
  };

  global.Sound = {
    say,
    sayAll,
    stop,
    sfx,
    get muted() { return muted; },
    setMuted(m) { muted = !!m; if (muted) stop(); },
    warmUp() { if (global.speechSynthesis) global.speechSynthesis.getVoices(); },
    hasHebrew() { return !!pickVoice('he'); },
  };
})(window);
