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
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../AppProvider';
import { passwordHint } from '../registration';
import { assets, Button, Field, Logo, Photo, Sub } from '../ui';

export function Auth() {
  const [splash, setSplash] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const { login, register, busy } = useApp();
  const { height } = useWindowDimensions();
  async function enter() {
    setError('');
    try {
      if (registering) {
        if (password !== passwordConfirmation) {
          throw new Error('Las contraseñas no coinciden');
        }
        await register({ firstName, lastName, phone, dni, email, password });
      } else {
        await login(phone, password);
      }
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
              Metropolitano{'\n'}de Lima App
            </Text>
            <Text className="font-sans text-white">
              Tu ruta, en un solo lugar.
            </Text>
          </View>
          <Button
            title="Pulsa para continuar"
            variant="red"
            onPress={() => setSplash(false)}
          />
          <Text className="text-center font-sans text-[11px] text-[#C7D5E2]">
            Fotografía:
            Wikimedia Commons
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
            {registering ? 'Crear cuenta' : 'Inicia sesión'}
          </Text>
          <Sub>
            {registering
              ? 'Completa tus datos para crear tu cuenta.'
              : 'Ingresa con el celular y contraseña de tu cuenta.'}
          </Sub>
          {registering && (
            <>
              <Field label="Nombres" value={firstName} onChange={setFirstName} maxLength={100} />
              <Field label="Apellidos" value={lastName} onChange={setLastName} maxLength={100} />
            </>
          )}
          <Field
            label="Número de celular"
            value={phone}
            onChange={value => setPhone(value.replace(/\D/g, '').slice(0, 9))}
            numeric
            maxLength={9}
          />
          {registering && (
            <>
              <Field
                label="DNI"
                value={dni}
                onChange={value => setDni(value.replace(/\D/g, '').slice(0, 8))}
                numeric
                maxLength={8}
              />
              <Field
                label="Correo electrónico"
                value={email}
                onChange={setEmail}
                email
                maxLength={254}
              />
            </>
          )}
          <Field
            label="Contraseña"
            value={password}
            onChange={setPassword}
            secure
            passwordType={registering ? 'newPassword' : 'password'}
            maxLength={72}
          />
          {registering && (
            <>
              <Field
                label="Confirmar contraseña"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                secure
                maxLength={72}
              />
              <Sub>{passwordHint}</Sub>
            </>
          )}
          {error !== '' && (
            <Text accessibilityRole="alert" className="font-sans text-critical">
              {error}
            </Text>
          )}
          <Button
            title={
              busy
                ? 'Conectando con el servidor…'
                : registering
                  ? 'Crear cuenta'
                  : 'Ingresar'
            }
            onPress={enter}
            disabled={busy}
          />
          <Text
            onPress={() => {
              setError('');
              setRegistering(value => !value);
            }}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            className="text-center font-sans text-[13px] font-bold text-steel"
          >
            {registering
              ? 'Ya tengo una cuenta · Iniciar sesión'
              : '¿No tienes cuenta? Crear cuenta'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
