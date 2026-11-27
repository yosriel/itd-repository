import { AI_API_URL, request, requestAi } from './api';

export type RegularService = 'A' | 'B' | 'C' | 'D';
export type StationLocation = { name: string; latitude: number; longitude: number };
export type RegularCatalog = {
  stations: StationLocation[];
  services: { id: RegularService; stops: string[]; source: string; scheduleNote?: string }[];
};
export type TripLeg = {
  service: RegularService;
  direction: 'norte' | 'sur';
  toward: string;
  stops: string[];
};

let catalogRequest: Promise<RegularCatalog> | undefined;

export function regularCatalog() {
  catalogRequest ??= request<RegularCatalog>('/regular/catalog', undefined, 'GET', undefined, undefined, 45000, AI_API_URL)
    .catch(error => { catalogRequest = undefined; throw error; });
  return catalogRequest;
}

export function regularPlan(origin: string, destination: string, service: RegularService | '') {
  return requestAi<{ options: TripLeg[][] }>('/regular/plan', {
    origin, destination, service: service || null,
  });
}

export function destinationGroupsFor(stations: StationLocation[], origin: string) {
  const index = stations.findIndex(station => station.name === origin);
  return [
    { label: 'Subida · Hacia el norte', stations: stations.slice(0, index).reverse() },
    { label: 'Bajada · Hacia el sur', stations: stations.slice(index + 1) },
  ];
}

export function normalizeStationName(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}
