import { fixtures } from './domain';

export type DemoPlan = { origin: string; destinoNombre: string; tiempo: string; transbordos: number; linea: string; paradas: string[] };
export const demoStations = [...new Set(Object.values(fixtures.rutas).flatMap(r => r.paradas))].sort();
// Fictional, bidirectional connections derived exclusively from the HTML.
// Equal time per segment is an academic approximation, not operational data.
export function planDemo(origin: string, destination: string): DemoPlan | null {
  if (origin === destination) { return null; }
  const edges = new Map<string, { to: string; minutes: number; line: string }[]>();
  for (const route of Object.values(fixtures.rutas)) {
    const minutes = parseInt(route.tiempo, 10) / (route.paradas.length - 1);
    for (let i = 1; i < route.paradas.length; i++) {
      const a = route.paradas[i - 1], b = route.paradas[i];
      for (const [from, to] of [[a, b], [b, a]]) {
        edges.set(from, [...(edges.get(from) ?? []), { to, minutes, line: route.linea }]);
      }
    }
  }
  const queue = [{ station: origin, minutes: 0, stops: [origin], lines: [] as string[] }];
  const visited = new Set<string>();
  while (queue.length) {
    queue.sort((a, b) => a.minutes - b.minutes);
    const current = queue.shift()!;
    if (visited.has(current.station)) { continue; }
    visited.add(current.station);
    if (current.station === destination) {
      const lines = current.lines.filter((line, i) => i === 0 || line !== current.lines[i - 1]);
      return { origin, destinoNombre: destination, tiempo: `${Math.ceil(current.minutes)} min`, transbordos: Math.max(0, lines.length - 1), linea: lines.join(' → '), paradas: current.stops };
    }
    for (const edge of edges.get(current.station) ?? []) {
      queue.push({ station: edge.to, minutes: current.minutes + edge.minutes, stops: [...current.stops, edge.to], lines: [...current.lines, edge.line] });
    }
  }
  return null;
}

export function demoArrivals(station: string) {
  return [...new Set(Object.values(fixtures.rutas).filter(r => r.paradas.includes(station)).map(r => r.linea))]
    .slice(0, 3).map((line, i) => ({ line, platform: `Andén de prueba ${i + 1}`, seconds: (i + 1) * 180 }));
}
