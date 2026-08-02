'use client';

type SirenHandle = { stop: () => void };

let sharedCtx: AudioContext | null = null;
let unlockBound = false;
let sirenHandle: SirenHandle | null = null;

function getSharedContext(): AudioContext | null {
  if (!sharedCtx) {
    try {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      sharedCtx = null;
    }
  }
  return sharedCtx;
}

function resumeSharedContext() {
  try {
    if (sharedCtx && sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {});
    }
  } catch { /* silent */ }
}

function resumeWhenVisible() {
  try {
    if (document.visibilityState === 'visible') resumeSharedContext();
  } catch { /* silent */ }
}

export function bindAudioUnlock() {
  if (unlockBound || typeof document === 'undefined') return;
  unlockBound = true;
  const unlock = () => {
    getSharedContext();
    resumeSharedContext();
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('touchstart', unlock);
  document.addEventListener('mousedown', unlock);
  document.addEventListener('click', unlock);
  document.addEventListener('keydown', unlock);
}

export function prepareAudio() {
  try {
    bindAudioUnlock();
    getSharedContext();
    resumeSharedContext();
  } catch { /* silent */ }
}

export function playSiren() {
  stopSiren();
  try {
    const ctx = getSharedContext();
    if (!ctx) return;
    bindAudioUnlock();
    resumeSharedContext();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
    master.connect(ctx.destination);
    let stopped = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const oscs: OscillatorNode[] = [];

    const playPattern = () => {
      if (stopped) return;
      const t0 = ctx.currentTime + 0.05;
      const notes = [
        { freq: 740.0, start: 0, dur: 0.35 },
        { freq: 1180.0, start: 0.4, dur: 0.35 },
      ];
      notes.forEach((n) => {
        try {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(n.freq, t0 + n.start);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, t0 + n.start);
          gain.gain.exponentialRampToValueAtTime(0.9, t0 + n.start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.start + n.dur);
          osc.connect(gain);
          gain.connect(master);
          osc.start(t0 + n.start);
          osc.stop(t0 + n.start + n.dur + 0.05);
          oscs.push(osc);
        } catch { /* silent */ }
      });
      timers.push(setTimeout(playPattern, 800));
    };
    playPattern();

    const resumeTimer = setInterval(resumeSharedContext, 500);
    window.addEventListener('focus', resumeWhenVisible);
    document.addEventListener('visibilitychange', resumeWhenVisible);

    sirenHandle = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        clearInterval(resumeTimer);
        window.removeEventListener('focus', resumeWhenVisible);
        document.removeEventListener('visibilitychange', resumeWhenVisible);
        timers.forEach((t) => clearTimeout(t));
        oscs.forEach((o) => { try { o.stop(); } catch { /* silent */ } });
        try { master.disconnect(); } catch { /* silent */ }
      },
    };
    if (ctx.state === 'running') {
      console.info('[emergency] danger siren started (audio running)');
    } else {
      console.info('[emergency] danger siren scheduled; audio blocked by browser until first interaction');
    }
  } catch (e) {
    console.warn('[emergency] danger siren failed', e);
  }
}

export function stopSiren() {
  if (sirenHandle) {
    try { sirenHandle.stop(); } catch { /* silent */ }
    sirenHandle = null;
  }
}

export function getSirenState() {
  return {
    ctxCreated: !!sharedCtx,
    ctxState: sharedCtx?.state ?? 'none',
    unlockBound,
    sirenActive: !!sirenHandle,
  };
}
