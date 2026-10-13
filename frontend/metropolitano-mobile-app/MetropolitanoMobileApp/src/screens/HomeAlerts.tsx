import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Bell, CircleCheck, Clock, TriangleAlert, MapPin } from '../icons';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useApp } from '../AppProvider';
import { fixtures } from '../domain';
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
  const [gpsPrompt, setGpsPrompt] = useState(true);
  const [gpsDemo, setGpsDemo] = useState(false);
  const [stationBoard, setStationBoard] = useState<string | null>(null);
  const stations = fixtures.stations.filter(station =>
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
      {gpsDemo && <Pill label="Estación más cercana: Naranjal (3 min caminando) · Demo" />}
      <Heading>Estaciones cercanas</Heading>
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
            line: 'Expreso 1',
            time: '4 min',
            image: assets.bus,
            status: 'green',
          },
          {
            trip: 'Central → Matellini',
            line: 'Regular B',
            time: '11 min',
            image: assets.secondBus,
            status: 'amber',
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
              <Pill label={route.time} status={route.status} />
            </View>
          </View>
        ))}
      </ScrollView>
      <StationBoard station={stationBoard} close={() => setStationBoard(null)} />
      <Modal
        visible={gpsPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setGpsPrompt(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <View className="w-full max-w-[420px] gap-4 rounded-[20px] bg-white p-6">
            <View className="items-center">
              <MapPin size={36} color={colors.steel} />
            </View>
            <Text className="text-center font-title text-[19px] text-navy">
              Permite tu ubicación
            </Text>
            <Sub>
              En el HTML esta función es simulada. Aquí puedes ver ese mismo
              ejemplo sin compartir tu ubicación real.
            </Sub>
            <Button
              title="Ver ejemplo de ubicación"
              onPress={() => {
                setGpsDemo(true);
                setGpsPrompt(false);
              }}
            />
            <Button
              title="Ahora no"
              variant="ghost"
              onPress={() => setGpsPrompt(false)}
            />
          </View>
        </View>
      </Modal>
    </Page>
  );
}
export function Alerts() {
  const { state, setNotifications, readAlerts, notify, busy } = useApp();
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
            <Heading>Notificaciones push</Heading>
            <Sub>Recibe avisos antes de llegar a la estación · Simulado</Sub>
          </View>
          <Switch
            accessibilityLabel="Preferencia de notificaciones"
            value={state.notifications}
            disabled={busy}
            onValueChange={enabled =>
              setNotifications(enabled).catch(error => notify(error.message))
            }
            trackColor={{ true: '#1FA971', false: colors.line }}
          />
        </View>
      </Card>
      {fixtures.alerts.map(alert => {
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
