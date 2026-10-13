import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { demoArrivals } from './demoTransit';
import { Button, Card, Heading, Sub } from './ui';

export function StationBoard({ station, close }: { station: string | null; close: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    if (!station) { return; }
    const timer = setInterval(() => setElapsed(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [station]);
  const arrivals = station ? demoArrivals(station) : [];
  return <Modal visible={!!station} transparent animationType="slide" onRequestClose={close}>
    <View className="flex-1 justify-center bg-black/50 px-5">
      <View className="max-h-[80%] w-full max-w-[440px] self-center rounded-3xl bg-white p-5 gap-4">
        <Heading>{station} · Próximos buses</Heading>
        <Sub>Tablero simulado. Servicios del HTML; andenes y llegadas de prueba.</Sub>
        <ScrollView contentContainerClassName="gap-3">
          {arrivals.map(arrival => {
            const seconds = (arrival.seconds - elapsed % (arrival.seconds + 30) + arrival.seconds + 30) % (arrival.seconds + 30);
            return <Card key={arrival.line}><Heading>{arrival.line}</Heading><Sub>{arrival.platform}</Sub><Text accessibilityLiveRegion="none" className="font-sans text-[24px] font-bold text-steel">{seconds === 0 ? 'Llegando' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</Text></Card>;
          })}
          {!arrivals.length && <Sub>No hay servicios de ejemplo para esta estación.</Sub>}
        </ScrollView>
        <Button title="Cerrar" onPress={close} />
      </View>
    </View>
  </Modal>;
}
