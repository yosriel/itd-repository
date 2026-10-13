import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DemoCard } from '../DemoCard';
import {
  CreditCard,
  UserRound,
  ChevronRight,
  Bell,
  ShieldCheck,
  LockKeyhole,
  CircleHelp,
  LogOut,
  X,
  Wallet,
} from '../icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  NavigationProp,
  useNavigation,
  usePreventRemove,
} from '@react-navigation/native';
import { useApp } from '../AppProvider';
import {
  fixtures,
  initials,
  money,
  Profile as UserProfile,
  Recharge,
} from '../domain';
import { AccountStackParams, TabParams } from '../navigationTypes';
import { Button, Card, colors, Field, Heading, Logo, Page, Sub } from '../ui';
const gradientStyle = { borderRadius: 20, padding: 22 };

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <View
      className={`items-center justify-center rounded-full bg-steel ${
        large ? 'h-[76px] w-[76px]' : 'h-10 w-10'
      }`}
    >
      <Text
        className={`font-sans font-bold text-white ${
          large ? 'text-2xl' : 'text-sm'
        }`}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
export function Account({
  navigation,
}: NativeStackScreenProps<AccountStackParams, 'Account'>) {
  const { state } = useApp();
  const [sheet, setSheet] = useState(false);
  const [digitalCard, setDigitalCard] = useState(false);
  return (
    <Page header={
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver perfil y preferencias"
        onPress={() => navigation.navigate('Profile')}
        className="flex-row items-center gap-3 bg-white"
      >
        <Avatar name={state.profile.fullName} />
        <View className="flex-1">
          <Heading>{state.profile.fullName}</Heading>
          <Sub>Ver perfil y preferencias</Sub>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>}>
      <LinearGradient colors={['#0B3552', '#0F435F']} style={gradientStyle}>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-[12px] text-[#C7D5E2]">
            Tarjeta Metropolitano
          </Text>
          <Logo size={36} />
        </View>
        <Text className="mb-4 mt-2 font-sans text-[32px] font-bold text-white">
          {money(state.balance)}
        </Text>
        <Text className="font-sans tracking-widest text-[#9FB3C4]">
          •••• •••• •••• 4417
        </Text>
      </LinearGradient>
      <Button title="Ver tarjeta y QR" variant="ghost" onPress={() => setDigitalCard(true)} />
      <DemoCard visible={digitalCard} close={() => setDigitalCard(false)} />
      <Button
        title="Recargar saldo"
        variant="amber"
        onPress={() => setSheet(true)}
      />
      <Heading>Historial reciente</Heading>
      {state.recharges.map(item => (
        <Card key={item.id}>
          <View className="flex-row justify-between gap-2">
            <View className="flex-1">
              <Heading>
                Recarga vía {item.method === 'YAPE_DEMO' ? 'Yape' : 'Tarjeta'} ·
                Demo
              </Heading>
              <Sub>
                {new Date(item.createdAt).toLocaleString('es-PE', {
                  timeZone: 'America/Lima',
                })}
              </Sub>
            </View>
            <Text className="font-sans font-bold text-[#168254]">
              +{money(item.amount)}
            </Text>
          </View>
        </Card>
      ))}
      {fixtures.historial.map((item, index) => (
        <Card key={index}>
          <View className="flex-row justify-between gap-2">
            <View className="flex-1">
              <Heading>{item.desc}</Heading>
              <Sub>{item.fecha} · Ejemplo</Sub>
            </View>
            <Text
              className={`font-sans font-bold ${
                item.monto > 0 ? 'text-[#168254]' : 'text-critical'
              }`}
            >
              {item.monto > 0 ? '+' : '−'}
              {money(Math.abs(item.monto))}
            </Text>
          </View>
        </Card>
      ))}
      <Sub>Saldo e historial simulados · Prototipo académico</Sub>
      <RechargeSheet visible={sheet} close={() => setSheet(false)} />
    </Page>
  );
}
function RechargeSheet({
  visible,
  close,
}: {
  visible: boolean;
  close: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { recharge, busy, notify } = useApp();
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<Recharge['method'] | null>(null);
  const [pending, setPending] = useState(false);
  const key = useRef<string | null>(null);
  async function confirm() {
    if (!amount || !method) {
      notify('Elige un monto y un método de pago');
      return;
    }
    key.current ??= `demo-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}`;
    setPending(true);
    try {
      await recharge(amount, method, key.current);
      key.current = null;
      setPending(false);
      setAmount(null);
      setMethod(null);
      close();
    } catch (e) {
      notify(
        e instanceof Error
          ? `${e.message}. Reintenta con la misma selección.`
          : 'No se pudo completar',
      );
    }
  }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) {
          close();
        }
      }}
    >
      <View className="flex-1 justify-end bg-black/50">
        <ScrollView
          className="max-h-[90%] w-full max-w-[480px] self-center rounded-t-3xl bg-white"
          contentContainerClassName="gap-4 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        >
          <View className="flex-row justify-between">
            <Text className="font-title text-[21px] text-navy">
              Recargar saldo
            </Text>
            <Pressable
              accessibilityLabel="Cerrar recarga"
              accessibilityRole="button"
              disabled={busy}
              onPress={close}
              hitSlop={12}
            >
              <X color={colors.muted} />
            </Pressable>
          </View>
          <Sub>Recarga ficticia. No se realizará ningún cobro.</Sub>
          <Heading>Elige un monto</Heading>
          <View className="flex-row gap-2">
            {[5, 10, 20, 50].map(value => (
              <Pressable
                key={value}
                disabled={pending}
                accessibilityRole="radio"
                accessibilityState={{ selected: amount === value }}
                onPress={() => setAmount(value)}
                className={`flex-1 items-center rounded-xl border py-3 ${
                  amount === value ? 'border-amber bg-[#FDF1DC]' : 'border-line'
                }`}
              >
                <Text className="font-sans font-bold text-navy">
                  S/ {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <Heading>Método de pago</Heading>
          {(['YAPE_DEMO', 'CARD_DEMO'] as const).map(value => (
            <Pressable
              key={value}
              disabled={pending}
              accessibilityRole="radio"
              accessibilityState={{ selected: method === value }}
              onPress={() => setMethod(value)}
              className={`rounded-xl border p-4 ${
                method === value ? 'border-steel bg-[#E4F7EE]' : 'border-line'
              }`}
            >
              <Heading>
                {value === 'YAPE_DEMO'
                  ? 'Yape · Simulado'
                  : 'Tarjeta de crédito / débito · Simulada'}
              </Heading>
            </Pressable>
          ))}
          {pending && !busy && (
            <Sub>
              Resultado pendiente de comprobar. Reintentar usa la misma clave y
              evita duplicar la operación.
            </Sub>
          )}
          <Button
            title={
              busy
                ? 'Registrando…'
                : pending
                ? 'Reintentar recarga ficticia'
                : 'Recargar ahora · Demo'
            }
            variant="amber"
            onPress={confirm}
            disabled={busy}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
export function Profile({
  navigation,
}: NativeStackScreenProps<AccountStackParams, 'Profile'>) {
  const { state, saveProfile, busy, notify, logout } = useApp();
  const tabs = useNavigation<NavigationProp<TabParams>>();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(state.profile);
  usePreventRemove(editing, ({ data }) => {
    Alert.alert('Descartar cambios', 'Los cambios sin guardar se perderán.', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });
  function edit() {
    setDraft({ ...state.profile });
    setEditing(true);
  }
  function cancel() {
    setDraft({ ...state.profile });
    setEditing(false);
  }
  function leave() {
    if (!busy) {
      navigation.goBack();
    }
  }
  async function save() {
    try {
      await saveProfile(draft);
      setEditing(false);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error al guardar');
    }
  }
  const rows = [
    {
      title: 'Datos personales',
      sub: 'Nombre, DNI y celular',
      icon: UserRound,
      action: edit,
    },
    {
      title: 'Tarjeta Metropolitano',
      sub: '•••• •••• •••• 4417',
      icon: CreditCard,
      action: () => navigation.goBack(),
    },
    {
      title: 'Medios de pago',
      sub: 'Opciones de recarga de demostración',
      icon: Wallet,
      action: () => navigation.navigate('Settings', { section: 'payments' }),
    },
    {
      title: 'Notificaciones',
      sub: 'Alertas de servicio y viaje',
      icon: Bell,
      action: () => tabs.navigate('Alerts'),
    },
    {
      title: 'Seguridad y acceso',
      sub: 'Información sobre el acceso demo',
      icon: ShieldCheck,
      action: () => navigation.navigate('Settings', { section: 'security' }),
    },
    {
      title: 'Privacidad',
      sub: 'Permisos y uso de tus datos',
      icon: LockKeyhole,
      action: () => navigation.navigate('Settings', { section: 'privacy' }),
    },
    {
      title: 'Ayuda y soporte',
      sub: 'Preguntas frecuentes del prototipo',
      icon: CircleHelp,
      action: () => navigation.navigate('Settings', { section: 'help' }),
    },
    {
      title: 'Cerrar sesión',
      sub: 'Salir de esta cuenta en este dispositivo',
      icon: LogOut,
      action: () =>
        logout().catch(error =>
          notify(
            `Sesión local cerrada; no se pudo confirmar revocación: ${error.message}`,
          ),
        ),
    },
  ];
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Page
        title="Mi perfil"
        back={leave}
        action={
          !editing && (
            <Pressable accessibilityRole="button" onPress={edit} hitSlop={10}>
              <Text className="font-sans font-bold text-steel">Editar</Text>
            </Pressable>
          )
        }
      >
        {editing ? (
          <>
            <Card>
              <View className="gap-4">
                <Field
                  label="Nombre completo"
                  value={draft.fullName}
                  maxLength={100}
                  onChange={value => setDraft({ ...draft, fullName: value })}
                />
                <Field
                  label="Celular"
                  numeric
                  maxLength={9}
                  value={draft.phone}
                  onChange={value => setDraft({ ...draft, phone: value })}
                />
                <Field
                  label="DNI"
                  numeric
                  maxLength={8}
                  value={draft.dni}
                  onChange={value => setDraft({ ...draft, dni: value })}
                />
                <Field
                  label="Correo electrónico"
                  email
                  maxLength={254}
                  value={draft.email}
                  onChange={value => setDraft({ ...draft, email: value })}
                />
                <Button
                  title={busy ? 'Guardando…' : 'Guardar cambios'}
                  onPress={save}
                  disabled={busy}
                />
              </View>
            </Card>
            <Button
              title="Cancelar"
              variant="ghost"
              onPress={cancel}
              disabled={busy}
            />
          </>
        ) : (
          <>
            <View className="items-center gap-2 py-3">
              <Avatar name={state.profile.fullName} large />
              <Text className="font-title text-[20px] text-navy">
                {state.profile.fullName}
              </Text>
              <Sub>Usuario de demostración</Sub>
            </View>
            {[rows.slice(0, 3), rows.slice(3, 6), rows.slice(6)].map(
              (group, groupIndex) => (
                <View
                  key={groupIndex}
                  className="overflow-hidden rounded-2xl border border-line bg-white"
                >
                  {group.map(row => (
                    <Pressable
                      key={row.title}
                      disabled={busy}
                      accessibilityRole="button"
                      onPress={row.action}
                      className="min-h-[68px] flex-row items-center gap-3 border-b border-line px-4 py-3"
                    >
                      <View className="rounded-xl bg-canvas p-2">
                        <row.icon
                          size={18}
                          color={
                            row.title === 'Cerrar sesión'
                              ? colors.critical
                              : colors.navy
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`font-sans text-[13px] font-bold ${
                            row.title === 'Cerrar sesión'
                              ? 'text-critical'
                              : 'text-ink'
                          }`}
                        >
                          {row.title}
                        </Text>
                        <Sub>{row.sub}</Sub>
                      </View>
                      <ChevronRight color={colors.muted} size={18} />
                    </Pressable>
                  ))}
                </View>
              ),
            )}
          </>
        )}
      </Page>
    </KeyboardAvoidingView>
  );
}
export function Settings({
  route,
  navigation,
}: NativeStackScreenProps<AccountStackParams, 'Settings'>) {
  const content = {
    payments: {
      title: 'Medios de pago',
      text: 'Yape y tarjeta son opciones de demostración dentro de Recargar saldo. No hay tarjetas bancarias vinculadas ni pasarela de pagos. No ingreses información financiera real.',
    },
    security: {
      title: 'Seguridad y acceso',
      text: 'El acceso por celular y DNI es exclusivamente ficticio. No acredita identidad. La sesión conectada dura hasta una hora; el cierre revoca su token en el servidor. Contraseña, recuperación y autenticación real están pendientes.',
    },
    privacy: {
      title: 'Privacidad',
      text: 'Utiliza datos inventados. La demo conectada guarda perfil, saldo de prueba y preferencias en la base local del backend. La demo sin conexión se borra al cerrar sesión. Esta versión no solicita GPS ni envía notificaciones push. No contiene una integración oficial con ATU.',
    },
    help: {
      title: 'Ayuda y soporte',
      text: '¿La recarga cobra dinero? No, solo suma saldo ficticio.\n\n¿Los buses están en vivo? No, sus estados y tiempos son ejemplos del HTML.\n\n¿Dónde se guarda mi perfil? En el backend al entrar a la demo conectada; sin conexión solo durante la sesión.\n\n¿Puedo consultar una tarjeta física? No.\n\nEste prototipo no tiene canal de atención oficial ni tickets de soporte.',
    },
  }[route.params.section];
  return (
    <Page title={content.title} back={() => navigation.goBack()}>
      <Card>
        <Text className="font-sans text-[14px] leading-6 text-ink">
          {content.text}
        </Text>
      </Card>
    </Page>
  );
}
