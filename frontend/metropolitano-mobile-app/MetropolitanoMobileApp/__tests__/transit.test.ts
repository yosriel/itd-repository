import { demoArrivals } from '../src/demoTransit';
import fixtures from '../src/data/fixtures.json';

test('station board filters services and handles unknown stations', () => {
  expect(demoArrivals('Naranjal', fixtures.rutas).length).toBeGreaterThan(0);
  expect(demoArrivals('Unknown', fixtures.rutas)).toEqual([]);
  expect(new Set(demoArrivals('Naranjal', fixtures.rutas).map(a => a.line)).size).toBe(demoArrivals('Naranjal', fixtures.rutas).length);
});
