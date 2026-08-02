'use client';

import { useEffect } from 'react';
import { bindAudioUnlock } from '@/lib/emergencySiren';

export default function SirenUnlocker() {
  useEffect(() => {
    bindAudioUnlock();
  }, []);
  return null;
}
