import React, { useCallback, useState } from 'react';
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Bell, CircleCheck, Clock, TriangleAlert } from '../icons';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useApp } from '../AppProvider';
import { DeviceLocation } from '../DeviceLocation';
import { notificationPermission, sendTravelNotice } from '../deviceNotifications';
import { StationBoard } from '../StationBoard';
import { TabParams } from '../navigationTypes';
import {
  assets,
  Button,
  Card,
  colors,
  Heading,
  Page,
  Photo,
  Pill,
  Sub,
} from '../ui';

export function Home() {
  const { state } = useApp();
  const navigation = useNavigation<NavigationProp<TabParams>>();
  const [query, setQuery] = useState('');
  const [stationBoard, setStationBoard] = useState<string | null>(null);
  const stations = state.fixtures.stations.filter(station =>
    station.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <Page header={<View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Sub>Buenos días</Sub>
          <Text className="font-title text-[19px] text-navy">
            {state.profile.fullName.split(' ').slice(0, 2).join(' ')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver alertas"
          onPress={() => navigation.navigate('Alerts')}
          className="rounded-full bg-canvas p-3"
        >
          <Bell size={20} color={colors.navy} />
          {!state.alertsRead && (
            <Text className="absolute right-0 top-0 rounded-full bg-critical px-1.5 text-xs text-white">
              2
            </Text>
          )}
        </Pressable>
      </View>
      <TextInput
        accessibilityLabel="Buscar estación"
        placeholder="Buscar estación o paradero…"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-ink"
      />
    </View>}>
      <DeviceLocation />
      <Heading>Estaciones</Heading>
      {stations.map(station => (
        <Pressable key={station.name} accessibilityRole="button" accessibilityLabel={`Ver próximos buses en ${station.name}`} onPress={() => setStationBoard(station.name)}><Card>
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1">
              <Heading>{station.name}</Heading>
              <Sub>{station.sub}</Sub>
            </View>
            <Pill status={station.status} label={station.label} />
          </View>
        </Card></Pressable>
      ))}
      {stations.length === 0 && (
        <Sub>Ninguna estación coincide con tu búsqueda.</Sub>
      )}
      <Heading>Tus rutas frecuentes</Heading>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3"
      >
        {[
          {
            trip: 'Naranjal → Central',
            line: 'Regular A',
            image: assets.bus,
          },
          {
            trip: 'Central → Matellini',
            line: 'Regular C',
            image: assets.secondBus,
          },
        ].map(route => (
          <View
            key={route.trip}
            className="w-[170px] overflow-hidden rounded-[18px] border border-line bg-white"
          >
            <Photo uri={route.image} />
            <View className="gap-2 p-3">
              <Sub>{route.trip}</Sub>
              <Heading>{route.line}</Heading>
            </View>
          </View>
        ))}
      </ScrollView>
      <StationBoard routes={state.fixtures.rutas} station={stationBoard} close={() => setStationBoard(null)} />
    </Page>
  );
}
export function Alerts() {
  const { state, setNotifications, readAlerts, notify, busy } = useApp();
  const [granted, setGranted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    const check = () => notificationPermission().then(p => {
      if (active) { setGranted(p.granted); setBlocked(!p.granted && !p.canAskAgain); }
    }).catch(() => { if (active) { notify('No se pudo consultar el permiso de avisos.'); } });
    check();
    const listener = AppState.addEventListener('change', status => { if (status === 'active') { check(); } });
    return () => { active = false; listener.remove(); };
  }, [notify]));
  async function toggle(enabled: boolean) {
    if (enabled) {
      const permission = await notificationPermission(true);
      setGranted(permission.granted);
      setBlocked(!permission.granted && !permission.canAskAgain);
      if (!permission.granted) { notify('Se necesita permiso para mostrar avisos en este dispositivo.'); return; }
    }
    await setNotifications(enabled);
  }
  useFocusEffect(
    useCallback(() => {
      readAlerts().catch(error => notify(error.message));
    }, [readAlerts, notify]),
  );
  return (
    <Page title="Alertas" subtitle="Notificaciones sobre tu ruta · Demo">
      <Card>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Heading>Avisos de viaje</Heading>
            <Sub>Recibe un aviso al finalizar tu recorrido de demostración.</Sub>
          </View>
          <Switch
            accessibilityLabel="Preferencia de notificaciones"
            value={state.notifications && granted}
            disabled={busy}
            onValueChange={enabled =>
              toggle(enabled).catch(error => notify(error.message))
            }
            trackColor={{ true: '#1FA971', false: colors.line }}
          />
        </View>
      </Card>
      {blocked && <Button title="Abrir ajustes de notificaciones" variant="ghost" onPress={() => Linking.openSettings().catch(() => notify('Abre los permisos de la app en Ajustes.'))} />}
      {granted && state.notifications && <Button title="Probar notificación" variant="ghost" onPress={() => sendTravelNotice('Los avisos de viaje están activos.').catch(() => notify('No se pudo mostrar el aviso.'))} />}
      {state.fixtures.alerts.map(alert => {
        const Icon =
          alert.level === 'red'
            ? TriangleAlert
            : alert.level === 'amber'
            ? Clock
            : CircleCheck;
        return (
          <View
            key={alert.title}
            className="rounded-[18px] border border-l-4 border-line bg-white p-4"
            style={{
              borderLeftColor:
                alert.level === 'red'
                  ? colors.critical
                  : alert.level === 'amber'
                  ? colors.amber
                  : colors.green,
            }}
          >
            <View className="mb-2 flex-row items-center gap-2">
              <Icon size={16} color={alert.level === 'red' ? colors.critical : alert.level === 'amber' ? '#8A5A0B' : colors.green} />
              <Text className="flex-1 font-sans text-[13px] font-semibold text-navy">
                {alert.title}
              </Text>
            </View>
            <Text className="mb-2 font-sans text-[13px] text-ink">
              {alert.body}
            </Text>
            <Sub>{alert.time}</Sub>
          </View>
        );
      })}
    </Page>
  );
}
