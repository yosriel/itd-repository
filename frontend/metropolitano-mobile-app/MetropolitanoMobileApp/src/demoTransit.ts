import type { Catalog } from './domain';

export type DemoPlan = { origin: string; destinoNombre: string; tiempo: string; transbordos?: number; linea: string; paradas: string[] };
export function demoArrivals(station: string, routes: Catalog['rutas']) {
  return [...new Set(Object.values(routes).filter(r => r.paradas.includes(station)).map(r => r.linea))]
    .slice(0, 3).map((line, i) => ({ line, platform: `Andén referencial ${i + 1}`, seconds: (i + 1) * 180 }));
}
