import { sendTravelNotice } from '../deviceNotifications';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { useDeviceLocation } from '../DeviceLocation';
import { destinationGroups, nearestStation } from '../stations';
import { useApp } from '../AppProvider';
import { aiSupportedStations, requestAiRoute, Scenario, stationLabel, AiRouteResponse } from '../aiRoute';
import { DemoPlan } from '../demoTransit';
import { RoutesStackParams } from '../navigationTypes';
import { Button, Card, Heading, Page, Pill, Sub } from '../ui';

export function PredictionPlanner({ navigation }: NativeStackScreenProps<RoutesStackParams, 'Prediction'>) {
  const { fix } = useDeviceLocation();
  const [selectedOrigin, setOrigin] = useState('');
  const [planOrigin, setPlanOrigin] = useState('');
  const origin = selectedOrigin || planOrigin || (fix ? nearestStation(fix) : '');
  const [destination, setDestination] = useState('');
  const [selecting, setSelecting] = useState<'origin' | 'destination' | null>(null);
  const [result, setResult] = useState<DemoPlan | null>(null);
  const [aiResult, setAiResult] = useState<AiRouteResponse | null>(null);
  const [scenario, setScenario] = useState<Scenario>('peak');
  const [incident, setIncident] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  async function searchRoute() {
    setPlanOrigin(origin);
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const prediction = await requestAiRoute(origin, destination, scenario, incident);
      setAiResult(prediction);
      setResult({
        origin,
        destinoNombre: destination,
        tiempo: `${prediction.costo_grafo_minutos} min · A*`,
        linea: 'Ruta calculada por A*',
        paradas: prediction.ruta.map(stationLabel),
      });
      setSearched(true);
    } catch (e) {
      setResult(null);
      setSearched(true);
      setError(e instanceof Error ? e.message : 'No se pudo consultar la API de IA.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Page title="Simular tiempos y afluencia" back={() => navigation.goBack()}>
      <Sub>Origen</Sub>
      <Button title={origin || 'Selecciona el origen'} variant="ghost" disabled={loading} onPress={() => setSelecting('origin')} />
      {!selectedOrigin && fix && origin === nearestStation(fix) && <Sub>Estación más cercana según tu ubicación</Sub>}
      <Sub>¿A dónde vas?</Sub>
      <Button title={destination || 'Selecciona una estación'} variant="ghost" disabled={!origin || loading} onPress={() => setSelecting('destination')} />
      <Button title="Intercambiar estaciones" variant="ghost" disabled={!destination || loading} onPress={() => { setOrigin(destination); setDestination(origin); setResult(null); setSearched(false); }} />
      <Modal visible={!!selecting} transparent onRequestClose={() => setSelecting(null)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[75%] w-full max-w-[480px] self-center rounded-t-3xl bg-white p-5">
            <Heading>Selecciona {selecting === 'origin' ? 'origen' : 'destino'}</Heading>
            <ScrollView className="my-4">
              {(selecting === 'origin' ? [{ label: '', stations: aiSupportedStations }] : destinationGroups(origin)).map(group => (
                <View key={group.label} className="gap-2">
                  {group.label !== '' && <Heading>{group.label}</Heading>}
                  {group.stations.length === 0 && <Sub>Sin estaciones en este sentido.</Sub>}
                  {group.stations.map(station => (
                    <Pressable key={station} accessibilityRole="button" onPress={() => {
                      if (selecting === 'origin') {
                        setOrigin(station);
                        if (station === destination) { setDestination(''); }
                      } else {
                        setPlanOrigin(origin);
                        setDestination(station);
                      }
                      setSelecting(null);
                      setResult(null);
                      setAiResult(null);
                      setSearched(false);
                      setError('');
                    }} className="min-h-[48px] justify-center border-b border-line py-3">
                      <Text className="font-sans text-[14px] text-ink">{station}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
            <Button title="Cancelar" variant="ghost" onPress={() => setSelecting(null)} />
          </View>
        </View>
      </Modal>
      <View className="gap-2 rounded-xl bg-[#F0F5F8] p-3">
        <Sub>Escenario de predicción · Datos sintéticos</Sub>
        <Sub>La distancia, el servicio y la frecuencia restante son supuestos de ejemplo.</Sub>
        <View className="flex-row gap-2">
          <Button title="Hora punta" variant={scenario === 'peak' ? 'amber' : 'ghost'} onPress={() => { setScenario('peak'); setResult(null); setAiResult(null); }} />
          <Button title="Hora valle" variant={scenario === 'offpeak' ? 'amber' : 'ghost'} onPress={() => { setScenario('offpeak'); setResult(null); setAiResult(null); }} />
        </View>
        <View className="flex-row items-center justify-between">
          <Sub>Incluir incidencia en Caquetá</Sub>
          <Switch accessibilityLabel="Incluir incidencia en Caquetá" value={incident} onValueChange={value => { setIncident(value); setResult(null); setAiResult(null); }} />
        </View>
      </View>
      <Button title={loading ? 'Calculando…' : 'Buscar ruta'} disabled={!origin || !destination || destination === origin || loading} onPress={searchRoute} />
      {origin !== '' && origin === destination && <Sub>Elige dos estaciones diferentes.</Sub>}
      {error !== '' && <Text accessibilityRole="alert" className="font-sans text-[13px] text-[#9F211B]">{error}</Text>}
      {searched && !result && error === '' && <Sub>No se encontró una ruta entre estas estaciones.</Sub>}
      {result && <Card><View className="gap-3"><Heading>{origin} → {destination}</Heading><Sub>{result.linea}</Sub><Heading>{result.tiempo}{result.transbordos === undefined ? '' : ` · ${result.transbordos} transbordos`}</Heading><Button title="Ver ruta trazada" variant="amber" onPress={() => navigation.navigate('Detail', { plan: result })} /></View></Card>}
      {aiResult && <Card><View className="gap-2">
        <Heading>Predicción de IA</Heading>
        <Sub>ETA Ridge: {aiResult.eta_modelo_minutos} min. Es distinta del costo A*.</Sub>
        <Sub>Saturación: {aiResult.saturacion_critica ? 'crítica' : 'normal'} · probabilidad XGBoost: {(aiResult.probabilidad_saturacion * 100).toFixed(1)}%</Sub>
        <Sub>La ruta, el ETA y la alerta se estiman con datos sintéticos, no en tiempo real.</Sub>
      </View></Card>}
      <Sub>Estimaciones de referencia; no hay horarios en vivo disponibles.</Sub>
    </Page>
  );
}
export function Detail({
  route,
  navigation,
}: NativeStackScreenProps<RoutesStackParams, 'Detail'>) {
  const { state, notify } = useApp();
  const plan = route.params.plan ?? { ...state.fixtures.rutas[route.params.routeKey!], origin: 'Naranjal' };
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
      const message = 'Has llegado al destino de la simulación';
      notify(message);
      if (state.notifications) { sendTravelNotice(message).catch(() => notify('No se pudo enviar el aviso de llegada.')); }
    }
  }, [index, running, plan.paradas.length, notify, state.notifications]);
  return (
    <Page
      title={`${plan.origin} → ${plan.destinoNombre}`}
      back={() => navigation.goBack()}
      subtitle="Estaciones del recorrido"
    >
      <View className="gap-3 rounded-[18px] bg-navy p-5">
        <Text className="font-sans text-[24px] font-bold text-white">
          {plan.tiempo}
        </Text>
        <Pill status="amber" label={plan.transbordos === undefined ? 'Transbordos no modelados' : `${plan.transbordos} transbordos`} />
        <Text className="font-sans text-[12px] text-white">{plan.linea}</Text>
      </View>
      <Heading>Próxima parada</Heading>
      <Pill
        label={`Cuenta atrás ${Math.floor(seconds / 60)}:${String(
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
        title={running ? 'Recorrido en curso…' : 'Iniciar recorrido guiado'}
        disabled={running}
        onPress={() => {
          setIndex(0);
          setRunning(true);
        }}
      />
      {running && (
        <Button
          title="Detener recorrido"
          variant="ghost"
          onPress={() => {
            setRunning(false);
            setIndex(0);
          }}
        />
      )}
      <Sub>Explora el orden de las estaciones de tu recorrido.</Sub>
    </Page>
  );
}
