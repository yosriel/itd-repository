import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useDeviceLocation } from '../DeviceLocation';
import { destinationGroupsFor, normalizeStationName } from '../regularRoutes';
import { useRegularPlanner } from '../useRegularPlanner';
import { Button, Card, Heading, Page, Sub } from '../ui';

export function RegularPlanner({ onSimulation }: { onSimulation: () => void }) {
  const { fix } = useDeviceLocation();
  const planner = useRegularPlanner(fix);
  const [selecting, setSelecting] = useState<'origin' | 'destination' | null>(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sourceError, setSourceError] = useState('');
  const [showFullRoute, setShowFullRoute] = useState(false);

  const schedules = new Map(planner.catalog?.services.map(item => [item.id, item.scheduleNote]));
  const groups = selecting === 'origin'
    ? [{ label: '', stations: planner.stations }]
    : destinationGroupsFor(planner.stations, planner.origin);
  const keyword = normalizeStationName(query);
  const filteredGroups = groups.map(group => ({
    ...group,
    stations: group.stations.filter(station => normalizeStationName(station.name).includes(keyword)),
  }));
  function openPicker(field: 'origin' | 'destination') {
    setQuery('');
    setSelecting(field);
  }

  return (
    <Page title="Planea tu ruta" subtitle="Servicios regulares A, B, C y D">
      {planner.catalogError !== '' && <>
        <Text accessibilityRole="alert" className="font-sans text-critical">{planner.catalogError}</Text>
        <Button title="Reintentar" onPress={planner.retry} />
      </>}
      {!planner.catalog && planner.catalogError === '' && <Sub>Cargando estaciones…</Sub>}
      {planner.catalog && <>
        <View className="gap-2">
          <Heading>Servicio</Heading>
          <View className="flex-row flex-wrap gap-2">
            {['' as const, ...planner.catalog.services.map(item => item.id)].map(service => (
              <Pressable key={service || 'todos'} onPress={() => { setShowFullRoute(false); setSourceError(''); planner.chooseService(service); }}
                disabled={planner.loading} accessibilityRole="button"
                accessibilityLabel={service ? `Regular ${service}` : 'Todos los servicios'}
                accessibilityState={{ selected: planner.service === service }}
                className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 ${planner.service === service ? 'border-navy bg-navy' : 'border-line bg-white'}`}>
                <Text className={`font-sans font-bold ${planner.service === service ? 'text-white' : 'text-navy'}`}>
                  {service || 'Todos'}
                </Text>
              </Pressable>
            ))}
          </View>
          {planner.activeService && (
            <>
              <Sub>{planner.activeService.stops[0]} ↔ {planner.activeService.stops.at(-1)} · {planner.activeService.stops.length} paradas</Sub>
              {planner.activeService.scheduleNote && <Sub>{planner.activeService.scheduleNote}</Sub>}
              <Button title={showFullRoute ? 'Ocultar recorrido' : 'Ver recorrido completo'} variant="ghost"
                onPress={() => setShowFullRoute(!showFullRoute)} />
              {showFullRoute && <Sub>{planner.activeService.stops.join(' → ')}</Sub>}
              <Pressable accessibilityRole="link" onPress={() => {
                const source = planner.activeService?.source;
                if (source) {
                  Linking.openURL(source).catch(() => setSourceError('No se pudo abrir la ficha de la ATU.'));
                }
              }}>
                <Text className="font-sans text-steel">Ver mapa y horario en la ATU</Text>
              </Pressable>
            </>
          )}
          {sourceError !== '' && <Sub>{sourceError}</Sub>}
        </View>
        <View className="gap-2">
          <Sub>Origen</Sub>
          <Button title={planner.origin || 'Selecciona el origen'} variant="ghost"
            disabled={planner.loading} onPress={() => openPicker('origin')} />
          {planner.origin && planner.origin === planner.suggested && <Sub>Estación de referencia según tu ubicación</Sub>}
          <Sub>¿A dónde vas?</Sub>
          <Button title={planner.destination || 'Selecciona una estación'} variant="ghost"
            disabled={!planner.origin || planner.loading} onPress={() => openPicker('destination')} />
          <Button title="Intercambiar estaciones" variant="ghost"
            disabled={!planner.destination || planner.loading} onPress={planner.swap} />
        </View>
        <Button title={planner.loading ? 'Calculando…' : 'Buscar ruta'}
          disabled={!planner.origin || !planner.destination || planner.loading}
          onPress={() => { setExpanded(null); planner.search(); }} />
        <Sub>Consulta el horario del servicio antes de viajar. El planificador usa paradas publicadas por la ATU.</Sub>
        {planner.error !== '' && <Text accessibilityRole="alert" className="font-sans text-critical">{planner.error}</Text>}
        {planner.options?.length === 0 && <Sub>El servicio elegido no une estas estaciones. Elige Todos para ver conexiones.</Sub>}
        {planner.options?.map((legs, index) => (
          <Card key={legs.map(leg => leg.service).join('-')}>
            <View className="gap-2">
              <Heading>{legs.map(leg => `Regular ${leg.service}`).join(' → ')}</Heading>
              {legs.length > 1 && <Sub>Transbordo en {legs[0].stops.at(-1)}</Sub>}
              {legs.map(leg => (
                <View key={leg.service}>
                  <Text className="font-sans font-bold text-navy">Regular {leg.service} · Hacia {leg.toward}</Text>
                  <Sub>Sube en {leg.stops[0]} · Baja en {leg.stops.at(-1)}</Sub>
                  {schedules.get(leg.service) && <Sub>{schedules.get(leg.service)}</Sub>}
                  {expanded === index && <Sub>{leg.stops.join(' → ')}</Sub>}
                </View>
              ))}
              <Button title={expanded === index ? 'Ocultar paradas' : 'Ver paradas'} variant="ghost"
                onPress={() => setExpanded(expanded === index ? null : index)} />
            </View>
          </Card>
        ))}
      </>}
      <Button title="Simular tiempos y afluencia" variant="ghost" onPress={onSimulation} />
      <Modal visible={selecting !== null} transparent onRequestClose={() => setSelecting(null)}>
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] w-full max-w-[480px] self-center rounded-t-3xl bg-white p-5">
            <Heading>Selecciona {selecting === 'origin' ? 'origen' : 'destino'}</Heading>
            <TextInput accessibilityLabel="Filtrar estaciones" placeholder="Filtrar estaciones"
              value={query} onChangeText={setQuery} className="my-2 rounded-xl border border-line p-3 font-sans text-ink" />
            <ScrollView keyboardShouldPersistTaps="handled" className="my-2">
              {filteredGroups.every(group => group.stations.length === 0) && <Sub>No se encontraron estaciones.</Sub>}
              {filteredGroups.map(group => {
                if (!group.stations.length) { return null; }
                return (
                  <View key={group.label} className="gap-1">
                    {group.label !== '' && <Heading>{group.label}</Heading>}
                    {group.stations.map(({ name }) => (
                      <Pressable key={name} accessibilityRole="button" accessibilityLabel={name}
                        className="min-h-[48px] justify-center border-b border-line py-3"
                        onPress={() => {
                          if (selecting === 'origin') { planner.chooseOrigin(name); }
                          else { planner.chooseDestination(name); }
                          setSelecting(null);
                        }}>
                        <Text className="font-sans text-ink">{name}</Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
            <Button title="Cancelar" variant="ghost" onPress={() => setSelecting(null)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Page>
  );
}
