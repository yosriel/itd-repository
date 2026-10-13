import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useApp } from '../AppProvider';
import { assets, Button, Field, Logo, Photo, Sub } from '../ui';

export function Auth() {
  const [splash, setSplash] = useState(true);
  const [phone, setPhone] = useState('987654321');
  const [dni, setDni] = useState('76543210');
  const [error, setError] = useState('');
  const { login, busy } = useApp();
  const { height } = useWindowDimensions();
  async function enter(offline = false) {
    setError('');
    try {
      await login(phone, dni, offline);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ingresar');
    }
  }
  if (splash) {
    return (
      <SafeAreaView className="flex-1 bg-navy">
        <StatusBar barStyle="light-content" />
        <View className="absolute left-0 right-0 top-0" style={{ height: height * 0.68 }}>
          <Photo uri={assets.splash} height={height * 0.68} />
          <LinearGradient
            colors={['#0B355220', '#0B3552']}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <ScrollView contentContainerClassName="grow justify-end px-5 pb-9 gap-6" contentContainerStyle={{ paddingTop: height * 0.4 }}>
          <View className="items-center gap-4">
            <Logo size={104} />
            <Text className="text-center font-title text-[27px] text-white">
              Metropolitano{'\n'}Lima App
            </Text>
            <Text className="font-sans text-white">
              Tu ruta, en una experiencia de demostración.
            </Text>
          </View>
          <Button
            title="Pulsa para continuar"
            variant="red"
            onPress={() => setSplash(false)}
          />
          <Text className="text-center font-sans text-[11px] text-[#C7D5E2]">
            Prototipo académico · Sin conexión oficial con ATU{'\n'}Fotografía
            de referencia: Wikimedia Commons
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow justify-center px-5 py-8 gap-4"
        >
          <View className="items-center mb-3">
            <Logo wordmark />
          </View>
          <Text className="font-title text-[24px] text-navy">
            Inicia sesión
          </Text>
          <Sub>
            Ingresa con tu número de celular y DNI para explorar el prototipo.
          </Sub>
          <Field
            label="Número de celular"
            value={phone}
            onChange={setPhone}
            numeric
            maxLength={9}
          />
          <Field
            label="DNI"
            value={dni}
            onChange={setDni}
            numeric
            maxLength={8}
          />
          {error !== '' && (
            <Text accessibilityRole="alert" className="font-sans text-critical">
              {error}
              {'\n'}Comprueba que Spring esté iniciado o utiliza la demo sin
              conexión.
            </Text>
          )}
          <Button
            title={busy ? 'Ingresando…' : 'Ingresar'}
            onPress={() => enter()}
            disabled={busy}
          />
          <Text onPress={() => enter(true)} accessibilityRole="button" className="text-center font-sans text-[12px] text-steel">Explorar sin conexión</Text>
          <Sub>
            Prototipo académico · Datos simulados
          </Sub>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
