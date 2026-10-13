import { demoArrivals, demoStations, planDemo } from '../src/demoTransit';

test('routes start and finish at selected stations in both directions', () => {
  for (const origin of demoStations) {
    for (const destination of demoStations) {
      if (origin === destination) { continue; }
      const result = planDemo(origin, destination);
      expect(result).not.toBeNull();
      expect(result!.paradas[0]).toBe(origin);
      expect(result!.paradas.at(-1)).toBe(destination);
      expect(parseInt(result!.tiempo, 10)).toBeGreaterThan(0);
    }
  }
});

test('identical and unknown endpoints do not produce itineraries', () => {
  expect(planDemo('Naranjal', 'Naranjal')).toBeNull();
  expect(planDemo('Unknown', 'Naranjal')).toBeNull();
  expect(planDemo('Naranjal', 'Unknown')).toBeNull();
});

test('station board filters services and handles unknown stations', () => {
  expect(demoArrivals('Naranjal').length).toBeGreaterThan(0);
  expect(demoArrivals('Unknown')).toEqual([]);
  expect(new Set(demoArrivals('Naranjal').map(a => a.line)).size).toBe(demoArrivals('Naranjal').length);
});
