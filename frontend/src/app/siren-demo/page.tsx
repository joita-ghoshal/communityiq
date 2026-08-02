'use client';

import { useState } from 'react';
import { playSiren, stopSiren } from '@/lib/emergencySiren';

export default function SirenDemo() {
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (playing) {
      stopSiren();
      setPlaying(false);
    } else {
      playSiren();
      setPlaying(true);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6">
      <h1 className="text-2xl font-extrabold mb-2">🚨 Emergency Alert Siren Demo</h1>
      <p className="text-slate-400 text-center max-w-md mb-6">
        This is the exact sound the app plays on an emergency alert: a loud two-tone
        danger siren (740Hz / 1180Hz), looping continuously.
      </p>
      <button
        onClick={toggle}
        className={`rounded-2xl px-14 py-7 text-xl font-extrabold shadow-xl transition-colors ${
          playing ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
        }`}
      >
        {playing ? '⏹ STOP SIREN' : '🔊 PLAY SIREN'}
      </button>
      <p className="text-slate-500 text-sm mt-4">
        If nothing plays: turn up volume, exit silent mode, tap the screen once.
      </p>
    </main>
  );
}
