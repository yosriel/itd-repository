import React, { useState } from 'react';
import { destinationGroupsFor } from '../src/regularRoutes';
import type { RegularService, StationLocation } from '../src/regularRoutes';
import { useRegularPlanner } from '../src/useRegularPlanner';

export function RegularPlanner({ onSimulation }: { onSimulation: () => void }) {
  const [position, setPosition] = useState<Omit<StationLocation, 'name'> | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const planner = useRegularPlanner(position);
  const schedules = new Map(planner.catalog?.services.map(item => [item.id, item.scheduleNote]));

  function findOrigin() {
    if (!navigator.geolocation) {
      setLocationMessage('Este navegador no ofrece ubicación.');
      return;
    }
    setLocationMessage('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      planner.chooseOrigin('');
      setPosition(coords);
      setLocationMessage('Seleccionamos una estación de referencia para tu ubicación.');
    }, () => setLocationMessage('Elige el origen manualmente si no puedes compartir tu ubicación.'),
    { maximumAge: 60000, timeout: 15000 });
  }

  return <>
    {planner.catalogError && <>
      <p role="alert">{planner.catalogError}</p>
      <button onClick={planner.retry}>Reintentar</button>
    </>}
    {!planner.catalog && !planner.catalogError && <p>Cargando estaciones…</p>}
    {planner.catalog && <>
      <label>Servicio
        <select value={planner.service} disabled={planner.loading}
          onChange={event => planner.chooseService(event.target.value as RegularService | '')}>
          <option value="">Todos</option>
          {planner.catalog.services.map(service => (
            <option key={service.id} value={service.id}>Regular {service.id}</option>
          ))}
        </select>
      </label>
      {planner.activeService && <p>
        {planner.activeService.stops[0]} ↔ {planner.activeService.stops.at(-1)}
        {' · '}<a href={planner.activeService.source} target="_blank" rel="noreferrer">Mapa y horario en ATU</a>
      </p>}
      {planner.activeService?.scheduleNote && <small>{planner.activeService.scheduleNote}</small>}
      {planner.activeService && <details>
        <summary>Ver recorrido completo</summary>
        <p>{planner.activeService.stops.join(' → ')}</p>
      </details>}
      <label>Origen
        <select value={planner.origin} disabled={planner.loading}
          onChange={event => planner.chooseOrigin(event.target.value)}>
          <option value="">Selecciona el origen</option>
          {planner.stations.map(({ name }) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <button type="button" className="ghost" onClick={findOrigin} disabled={planner.loading}>Usar mi ubicación</button>
      {locationMessage && <p role="status">{locationMessage}</p>}
      <label>¿A dónde vas?
        <select value={planner.destination} disabled={!planner.origin || planner.loading}
          onChange={event => planner.chooseDestination(event.target.value)}>
          <option value="">Selecciona una estación</option>
          {planner.origin && destinationGroupsFor(planner.stations, planner.origin).map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.stations.map(({ name }) => <option key={name}>{name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <button type="button" className="ghost" onClick={planner.swap} disabled={!planner.destination || planner.loading}>
        Intercambiar estaciones
      </button>
      <button type="button" onClick={planner.search} disabled={!planner.origin || !planner.destination || planner.loading}>
        {planner.loading ? 'Calculando…' : 'Buscar ruta'}
      </button>
      <small>Consulta el horario del servicio antes de viajar.</small>
      {planner.error && <p role="alert">{planner.error}</p>}
      {planner.options?.length === 0 && <p>Elige Todos para ver conexiones entre estas estaciones.</p>}
      <div aria-live="polite">
        {planner.options?.map(legs => (
          <article className="card" key={legs.map(leg => leg.service).join('-')}>
            <h2>{legs.map(leg => `Regular ${leg.service}`).join(' → ')}</h2>
            {legs.length > 1 && <p>Transbordo en {legs[0].stops.at(-1)}</p>}
            {legs.map(leg => <details key={leg.service}>
              <summary>Regular {leg.service} · Hacia {leg.toward}</summary>
              <p>{leg.stops.join(' → ')}</p>
              {schedules.get(leg.service) && <small>{schedules.get(leg.service)}</small>}
            </details>)}
          </article>
        ))}
      </div>
    </>}
    <button type="button" className="ghost" onClick={onSimulation}>Simular tiempos y afluencia</button>
  </>;
}
