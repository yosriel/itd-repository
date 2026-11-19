import {
  aiSupportedStations,
  createAiRouteRequest,
  stationId,
  stationLabel,
} from '../src/aiRoute';

test('builds the documented synthetic peak and off-peak API scenarios', () => {
  expect(createAiRouteRequest('Naranjal', 'Estación Central', 'peak', true))
    .toMatchObject({
      origen: 'Naranjal',
      destino: 'Estacion_Central',
      es_hora_punta: 1,
      incidencia_caqueta: 1,
      afluencia_anden: 410,
    });
  expect(createAiRouteRequest('Naranjal', 'Caquetá', 'offpeak', false))
    .toMatchObject({
      destino: 'Caqueta',
      es_hora_punta: 0,
      incidencia_caqueta: 0,
      afluencia_anden: 95,
    });
});

test('keeps API station identifiers and user-facing labels consistent', () => {
  expect(aiSupportedStations).toContain('Tomás Valle');
  expect(stationId('Tomás Valle')).toBe('Tomas_Valle');
  expect(stationLabel('Tomas_Valle')).toBe('Tomás Valle');
});
