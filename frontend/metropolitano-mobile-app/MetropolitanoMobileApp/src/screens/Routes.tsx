import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../AppProvider';
import { fixtures } from '../domain';
import { DemoPlan, demoStations, planDemo } from '../demoTransit';
import { RoutesStackParams } from '../navigationTypes';
import { Button, Card, Heading, Page, Pill, Sub } from '../ui';

export function Planner({ navigation }: NativeStackScreenProps<RoutesStackParams, 'Planner'>) {
  const [origin, setOrigin] = useState('Naranjal');
  const [destination, setDestination] = useState('');
  const [selecting, setSelecting] = useState<'origin' | 'destination' | null>(null);
  const [result, setResult] = useState<DemoPlan | null>(null);
  const [searched, setSearched] = useState(false);
  return (
    <Page title="Planea tu ruta" subtitle="Recorridos de demostración">
      <Sub>Origen</Sub>
      <Button title={origin} variant="ghost" onPress={() => setSelecting('origin')} />
      <Sub>¿A dónde vas?</Sub>
      <Button title={destination || 'Selecciona una estación'} variant="ghost" onPress={() => setSelecting('destination')} />
      <Button title="Intercambiar estaciones" variant="ghost" disabled={!destination} onPress={() => { setOrigin(destination); setDestination(origin); setResult(null); setSearched(false); }} />
      <Modal visible={!!selecting} transparent onRequestClose={() => setSelecting(null)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[75%] w-full max-w-[480px] self-center rounded-t-3xl bg-white p-5">
            <Heading>Selecciona {selecting === 'origin' ? 'origen' : 'destino'}</Heading>
            <ScrollView className="my-4">
              {demoStations.map(station => <Pressable key={station} accessibilityRole="button" onPress={() => { if (selecting === 'origin') { setOrigin(station); } else { setDestination(station); } setSelecting(null); setResult(null); setSearched(false); }} className="min-h-[48px] justify-center border-b border-line py-3"><Text className="font-sans text-[14px] text-ink">{station}</Text></Pressable>)}
            </ScrollView>
            <Button title="Cancelar" variant="ghost" onPress={() => setSelecting(null)} />
          </View>
        </View>
      </Modal>
      <Button title="Buscar ruta" disabled={!destination || destination === origin} onPress={() => { setResult(planDemo(origin, destination)); setSearched(true); }} />
      {origin === destination && <Sub>Elige dos estaciones diferentes.</Sub>}
      {searched && !result && <Sub>No hay una conexión en el catálogo de demostración.</Sub>}
      {result && <Card><View className="gap-3"><Heading>{origin} → {destination}</Heading><Sub>{result.linea}</Sub><Heading>{result.tiempo} · {result.transbordos} transbordos</Heading><Button title="Ver ruta trazada" variant="amber" onPress={() => navigation.navigate('Detail', { plan: result })} /></View></Card>}
      <Sub>Conexiones y tiempos aproximados derivados del prototipo; no representan rutas operativas verificadas.</Sub>
    </Page>
  );
}
export function Detail({
  route,
  navigation,
}: NativeStackScreenProps<RoutesStackParams, 'Detail'>) {
  const plan = route.params.plan ?? { ...fixtures.rutas[route.params.routeKey!], origin: 'Naranjal' };
  const { notify } = useApp();
  const focused = useIsFocused();
  const [seconds, setSeconds] = useState(180);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!focused) {
      setRunning(false);
      return;
    }
    const timer = setInterval(
      () => setSeconds(current => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [focused]);
  useEffect(() => {
    if (!running || !focused) {
      return;
    }
    const timer = setInterval(() => setIndex(current => current + 1), 900);
    return () => clearInterval(timer);
  }, [running, focused]);
  useEffect(() => {
    if (running && index >= plan.paradas.length) {
      setRunning(false);
      notify('Has llegado al destino de la simulación');
    }
  }, [index, running, plan.paradas.length, notify]);
  return (
    <Page
      title={`${plan.origin} → ${plan.destinoNombre}`}
      back={() => navigation.goBack()}
      subtitle="Esquema de paradas · No es un mapa geográfico"
    >
      <View className="gap-3 rounded-[18px] bg-navy p-5">
        <Text className="font-sans text-[24px] font-bold text-white">
          {plan.tiempo}
        </Text>
        <Pill status="amber" label={`${plan.transbordos} transbordos`} />
        <Text className="font-sans text-[12px] text-white">{plan.linea}</Text>
      </View>
      <Heading>Próxima parada</Heading>
      <Pill
        label={`Llegada simulada ${Math.floor(seconds / 60)}:${String(
          seconds % 60,
        ).padStart(2, '0')}`}
      />
      <Card>
        {plan.paradas.map((stop, position) => (
          <View
            key={`${position}-${stop}`}
            className="flex-row items-center gap-4 py-3"
          >
            <View
              className={`h-3 w-3 rounded-full ${
                position < index
                  ? 'bg-[#1FA971]'
                  : position === index
                  ? 'bg-steel'
                  : 'bg-line'
              }`}
            />
            <Text
              className={`font-sans text-[14px] ${
                position === index ? 'font-bold text-navy' : 'text-ink'
              }`}
            >
              {stop}
            </Text>
          </View>
        ))}
      </Card>
      <Button
        title={running ? 'Viaje en curso…' : 'Iniciar viaje simulado'}
        disabled={running}
        onPress={() => {
          setIndex(0);
          setRunning(true);
        }}
      />
      {running && (
        <Button
          title="Cancelar simulación"
          variant="ghost"
          onPress={() => {
            setRunning(false);
            setIndex(0);
          }}
        />
      )}
      <Sub>
        Esta animación no sigue un bus, no cobra un pasaje ni modifica el
        historial de viajes. Al salir se detiene.
      </Sub>
    </Page>
  );
}

