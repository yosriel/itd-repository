import { requestAi } from './api';

export type AiRouteRequest = {
  origen: string;
  destino: string;
  franja_horaria: number;
  es_hora_punta: 0 | 1;
  distancia_km: number;
  afluencia_anden: number;
  frecuencia_buses_min: number;
  incidencia_caqueta: 0 | 1;
  tipo_servicio: 'Regular' | 'Expreso';
};

export type AiRouteResponse = {
  ruta: string[];
  costo_grafo_minutos: number;
  eta_modelo_minutos: number;
  saturacion_critica: boolean;
  probabilidad_saturacion: number;
  datos: string;
  nota: string;
};

export type Scenario = 'peak' | 'offpeak';

export { stationNames as aiSupportedStations } from './stations';

export function stationId(name: string): string {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const id = normalized.replace(/\s+/g, '_');
  return id === 'Central' ? 'Estacion_Central' : id;
}

export function createAiRouteRequest(
  origin: string,
  destination: string,
  scenario: Scenario,
  incident: boolean,
): AiRouteRequest {
  const peak = scenario === 'peak';
  return {
    origen: stationId(origin),
    destino: stationId(destination),
    franja_horaria: peak ? 7.75 : 11,
    es_hora_punta: peak ? 1 : 0,
    distancia_km: 12,
    afluencia_anden: peak ? 410 : 95,
    frecuencia_buses_min: peak ? 5.5 : 8,
    incidencia_caqueta: incident ? 1 : 0,
    tipo_servicio: 'Regular',
  };
}

export function requestAiRoute(
  origin: string,
  destination: string,
  scenario: Scenario,
  incident: boolean,
): Promise<AiRouteResponse> {
  return requestAi<AiRouteResponse>(
    '/predict',
    createAiRouteRequest(origin, destination, scenario, incident),
  );
}

export function stationLabel(id: string): string {
  const labels: Record<string, string> = {
    Tomas_Valle: 'Tomás Valle',
    Caqueta: 'Caquetá',
    Dos_de_Mayo: 'Dos de Mayo',
    Espana: 'España',
    Estacion_Central: 'Estación Central',
  };
  return labels[id] ?? id;
}
