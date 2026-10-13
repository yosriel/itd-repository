import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import qrcode from 'qrcode-generator';
import Svg, { Rect } from 'react-native-svg';
import { useApp } from './AppProvider';
import { money } from './domain';
import { Button, Heading, Sub } from './ui';

export function DemoCard({ visible, close }: { visible: boolean; close: () => void }) {
  const { state } = useApp();
  const [remaining, setRemaining] = useState(30);
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!visible) { return; }
    setRemaining(30); setMessage(''); setGeneration(value => value + 1);
    const timer = setInterval(() => setRemaining(value => value - 1), 1000);
    return () => clearInterval(timer);
  }, [visible]);
  useEffect(() => {
    if (remaining <= 0) { setGeneration(value => value + 1); setRemaining(30); setMessage(''); }
  }, [remaining]);
  const code = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(`METROPOLITANO-DEMO:NO-VALIDO-PARA-VIAJAR:4417:${generation}`);
    qr.make(); return qr;
  }, [generation]);
  const count = code.getModuleCount();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <View className="flex-1 justify-center bg-black/50 px-5">
      <View className="max-h-[85%] w-full max-w-[440px] self-center rounded-3xl bg-white p-5">
        <ScrollView contentContainerClassName="items-center gap-4">
          <Heading>Tarjeta digital · Demo</Heading>
          <Sub>•••• 4417 · {money(state.balance)}</Sub>
          <Svg width="100%" height={220} viewBox={`0 0 ${count + 8} ${count + 8}`} accessibilityLabel="QR de demostración sin validez para viajar">
            <Rect width={count + 8} height={count + 8} fill="white" />
            {Array.from({ length: count }, (_, row) => Array.from({ length: count }, (__, col) => code.isDark(row, col) ? <Rect key={`${row}-${col}`} x={col + 4} y={row + 4} width={1} height={1} fill="black" /> : null))}
          </Svg>
          <Text className="font-sans text-[13px] text-navy">Se renueva en {remaining} segundos</Text>
          <Sub>No válido en torniquetes. No contiene datos personales ni realiza cobros.</Sub>
          <View className="w-full gap-3">
            <Button title="Simular lectura del QR" disabled={!!message} onPress={() => setMessage('Lectura de prueba completada. Saldo sin cambios.')} />
            {message && <Text accessibilityRole="alert" className="font-sans text-[13px] text-steel">{message}</Text>}
            <Button title="Cerrar" variant="ghost" onPress={close} />
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
