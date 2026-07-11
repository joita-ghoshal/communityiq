'use client';
import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({ latitude: null, longitude: null, error: null, loading: true });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported', loading: false }));
      return;
    }
    const watcher = navigator.geolocation.watchPosition(
      (pos) => setState({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, error: null, loading: false }),
      (err) => setState((s) => ({ ...s, error: err.message, loading: false })),
      { enableHighAccuracy, maximumAge: 30000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [enableHighAccuracy]);

  return state;
}
