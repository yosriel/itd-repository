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
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const { login, loginPresentation, register, busy } = useApp();
  const { height } = useWindowDimensions();
  async function enter(offline = false) {
    setError('');
    try {
      if (registering) {
        if (password !== passwordConfirmation) {
          throw new Error('Las contraseñas no coinciden');
        }
        await register({ fullName, phone, dni, email, password });
      } else {
        await login(
          offline ? phone || '987654321' : phone,
          offline ? dni || '76543210' : password,
          offline,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ingresar');
    }
  }
  async function enterPresentation() {
    setError('');
    try {
      await loginPresentation();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir la presentación');
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
              Tu ruta, en un solo lugar.
            </Text>
          </View>
          <Button
            title="Pulsa para continuar"
            variant="red"
            onPress={() => setSplash(false)}
          />
          <Text className="text-center font-sans text-[11px] text-[#C7D5E2]">
            Experiencia académica · Datos de referencia{'\n'}Fotografía:
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
            {registering ? 'Crear cuenta académica' : 'Inicia sesión'}
          </Text>
          <Sub>
            {registering
              ? 'Crea un perfil para probar la aplicación. No uses contraseñas ni datos personales que utilices en otros servicios.'
              : 'Ingresa con el celular y contraseña de tu cuenta académica.'}
          </Sub>
          {registering && (
            <Field
              label="Nombre completo"
              value={fullName}
              onChange={setFullName}
              maxLength={100}
            />
          )}
          <Field
            label="Número de celular"
            value={phone}
            onChange={setPhone}
            numeric
            maxLength={9}
          />
          {registering && (
            <>
              <Field
                label="DNI (dato académico de prueba)"
                value={dni}
                onChange={setDni}
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
              <Sub>
                La contraseña se guarda como hash. Esta versión no verifica la
                titularidad del celular ni del correo y no es una cuenta de
                producción. El perfil de presentación puede borrarse cuando
                Render reinicie el servicio.
              </Sub>
            </>
          )}
          {error !== '' && (
            <Text accessibilityRole="alert" className="font-sans text-critical">
              {error}
              {'\n'}Si el servidor estaba inactivo, espera un momento y vuelve
              a intentarlo; también puedes explorar sin conexión.
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
            onPress={() => enter(false)}
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
          {!registering && (
            <>
              <Button
                title="Entrar a la presentación"
                variant="ghost"
                onPress={enterPresentation}
                disabled={busy}
              />
              <Text
                onPress={() => {
                  if (!phone) {
                    setPhone('987654321');
                  }
                  if (!dni) {
                    setDni('76543210');
                  }
                  enter(true);
                }}
                accessibilityRole="button"
                className="text-center font-sans text-[12px] text-steel"
              >
                Explorar sin conexión
              </Text>
            </>
          )}
          <Sub>
            La primera conexión después de un tiempo sin uso puede tardar más
            mientras el servidor se inicia.
          </Sub>
          <Sub>
            Acceso de presentación · Datos de prueba
          </Sub>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
