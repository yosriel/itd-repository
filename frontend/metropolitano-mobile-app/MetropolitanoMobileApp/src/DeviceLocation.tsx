import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Button, Card, Heading, Sub } from './ui';
import { nearestStation } from './stations';
import { regularCatalog } from './regularRoutes';
import type { StationLocation } from './regularRoutes';

const key = 'metro.last-position';
type Fix = { latitude: number; longitude: number; timestamp: number };

const LocationContext = createContext<{
  fix: Fix | null;
  busy: boolean;
  message: string;
  settings: boolean;
  update: (requestAgain?: boolean) => Promise<void>;
} | null>(null);

export function useDeviceLocation() {
  const value = useContext(LocationContext);
  if (!value) { throw new Error('LocationProvider requerido'); }
  return value;
}

export function LocationProvider({ children }: React.PropsWithChildren) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(false);

  const update = useCallback(async (requestAgain = false) => {
    if (pending.current) { return; }
    pending.current = true;
    setBusy(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status === 'undetermined' || (requestAgain && !permission.granted && permission.canAskAgain)) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!mounted.current) { return; }
      setSettings(!permission.granted && !permission.canAskAgain);
      if (!permission.granted) {
        setFix(null);
        await SecureStore.deleteItemAsync(key);
        setMessage('Puedes continuar sin compartir tu ubicación.');
        return;
      }
      const saved = await SecureStore.getItemAsync(key);
      if (mounted.current && saved) { setFix(JSON.parse(saved) as Fix); }
      if (!await Location.hasServicesEnabledAsync()) {
        setMessage('Activa la ubicación del dispositivo para actualizarla.');
        return;
      }
      setMessage('Buscando la señal de ubicación…');
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: false });
      if (!mounted.current || !(await Location.getForegroundPermissionsAsync()).granted) { return; }
      const point = { latitude: result.coords.latitude, longitude: result.coords.longitude, timestamp: result.timestamp };
      await SecureStore.setItemAsync(key, JSON.stringify(point));
      if (mounted.current) { setFix(point); setMessage('Guardada en este dispositivo.'); }
    } catch {
      if (mounted.current) { setMessage('No se pudo actualizar tu ubicación. Vuelve a intentar con el GPS activado.'); }
    } finally {
      pending.current = false;
      if (mounted.current) { setBusy(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    update();
    const listener = AppState.addEventListener('change', status => {
      if (status === 'active') { update(); }
    });
    return () => { mounted.current = false; listener.remove(); };
  }, [update]);

  return <LocationContext.Provider value={{ fix, busy, message, settings, update }}>
    {children}
  </LocationContext.Provider>;
}

export function DeviceLocation() {
  const { fix, busy, message, settings, update } = useDeviceLocation();
  const [settingsError, setSettingsError] = useState(false);
  const [stations, setStations] = useState<StationLocation[]>([]);
  useEffect(() => {
    let active = true;
    regularCatalog().then(catalog => {
      if (active) { setStations(catalog.stations); }
    }).catch(() => { /* El GPS sigue disponible aunque falle el catálogo. */ });
    return () => { active = false; };
  }, []);
  return <Card>
    <Heading>Ubicación actual</Heading>
    {fix && stations.length > 0 && <Sub>Estación de referencia: {nearestStation(fix, stations)}</Sub>}
    <Sub>{settingsError ? 'Abre los ajustes de permisos de la app.' : message}</Sub>
    <Button title={settings ? 'Abrir ajustes de ubicación' : 'Actualizar ubicación'} variant="ghost" disabled={busy}
      onPress={() => settings ? Linking.openSettings().catch(() => setSettingsError(true)) : update(true)} />
  </Card>;
}
