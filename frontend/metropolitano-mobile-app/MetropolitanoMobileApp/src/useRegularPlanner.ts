import { useEffect, useState } from 'react';
import { nearestStation } from './stations';
import { regularCatalog, regularPlan } from './regularRoutes';
import type { RegularCatalog, RegularService, StationLocation, TripLeg } from './regularRoutes';

export function useRegularPlanner(position: Omit<StationLocation, 'name'> | null) {
  const [catalog, setCatalog] = useState<RegularCatalog | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [catalogError, setCatalogError] = useState('');
  const [service, setService] = useState<RegularService | ''>('');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [options, setOptions] = useState<TripLeg[][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    regularCatalog().then(data => {
      if (active) { setCatalog(data); }
    }).catch(cause => {
      if (active) { setCatalogError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo'); }
    });
    return () => { active = false; };
  }, [attempt]);

  const activeService = catalog?.services.find(item => item.id === service);
  const stations = (catalog?.stations ?? []).filter(station =>
    !activeService || activeService.stops.includes(station.name),
  );
  const suggested = position && stations.length ? nearestStation(position, stations) : '';
  const origin = selectedOrigin || suggested;

  function clearResults() {
    setOptions(null);
    setError('');
  }
  function chooseService(next: RegularService | '') {
    const nextService = catalog?.services.find(item => item.id === next);
    setService(next);
    setSelectedOrigin(current => !nextService || nextService.stops.includes(current) ? current : '');
    setDestination('');
    clearResults();
  }
  function chooseOrigin(next: string) {
    setSelectedOrigin(next);
    setDestination('');
    clearResults();
  }
  function chooseDestination(next: string) {
    setSelectedOrigin(origin);
    setDestination(next);
    clearResults();
  }
  function swap() {
    setSelectedOrigin(destination);
    setDestination(origin);
    clearResults();
  }
  async function search() {
    if (!origin || !destination || origin === destination || loading) { return; }
    setSelectedOrigin(origin);
    clearResults();
    setLoading(true);
    try {
      const result = await regularPlan(origin, destination, service);
      setOptions(result.options);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo calcular el recorrido');
    } finally {
      setLoading(false);
    }
  }
  function retry() {
    setCatalogError('');
    setAttempt(value => value + 1);
  }

  return { catalog, catalogError, retry, activeService, stations, service, chooseService,
    origin, suggested, destination, chooseOrigin, chooseDestination, swap, search,
    options, error, loading };
}
