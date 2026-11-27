// Coordenadas del corredor, tabla 39 de https://repositorio.uni.edu.pe/handle/20.500.14076/22099.
const stations = [
  ['Naranjal', -11.9827434, -77.0586044],
  ['Izaguirre', -11.9895485, -77.0570156],
  ['Tomás Valle', -12.0071044, -77.0538935],
  ['UNI', -12.0233577, -77.0499812],
  ['Caquetá', -12.0365329, -77.0436359],
  ['Dos de Mayo', -12.0463973, -77.0427601],
  ['España', -12.0576357, -77.0417886],
  ['Estación Central', -12.0576764, -77.0359753],
] as const;

export const stationNames = stations.map(([name]) => name);

export function nearestStation(
  { latitude, longitude }: { latitude: number; longitude: number },
  choices: ReadonlyArray<{ name: string; latitude: number; longitude: number }> =
    stations.map(([name, lat, lon]) => ({ name, latitude: lat, longitude: lon })),
) {
  const radians = Math.PI / 180;
  let nearest = '';
  let bestDistance = Infinity;
  for (const { name, latitude: lat, longitude: lon } of choices) {
    const distance = Math.sin((lat - latitude) * radians / 2) ** 2 +
      Math.cos(lat * radians) * Math.cos(latitude * radians) * Math.sin((lon - longitude) * radians / 2) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = name;
    }
  }
  return nearest;
}

export function destinationGroups(origin: string) {
  const index = stationNames.findIndex(name => name === origin);
  return [
    { label: 'Subida · Hacia el norte', stations: stationNames.slice(0, index).reverse() },
    { label: 'Bajada · Hacia el sur', stations: stationNames.slice(index + 1) },
  ];
}
