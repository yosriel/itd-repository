import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import qrcode from 'qrcode-generator';
import Svg, { Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
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
      {state.fixtures.historial.map((item, index) => (
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
      <Sub>Saldo e historial de prueba</Sub>
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
  const [step, setStep] = useState<'select' | 'processing' | 'receipt'>(
    'select',
  );
  const [reference, setReference] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const key = useRef<string | null>(null);
  useEffect(() => {
    if (visible) {
      setAmount(null);
      setMethod(null);
      setPending(false);
      setStep('select');
      setReference('');
      setCompletedAt('');
      key.current = null;
    }
  }, [visible]);
  const paymentQr = useMemo(() => {
    if (!amount || method !== 'YAPE_DEMO') {
      return null;
    }
    const qr = qrcode(0, 'M');
    qr.addData(`SIMULACION-NO-COBRABLE|METROPOLITANO|${amount}`);
    qr.make();
    return qr;
  }, [amount, method]);
  const retrying = key.current !== null;
  async function confirm() {
    if (!amount || !method) {
      notify('Elige un monto y un método de pago');
      return;
    }
    key.current ??= `demo-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}`;
    setPending(true);
    setStep('processing');
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1600));
      await recharge(amount, method, key.current);
      setReference(`SIM-${key.current.slice(-8).toUpperCase()}`);
      setCompletedAt(
        new Date().toLocaleString('es-PE', {
          timeZone: 'America/Lima',
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      );
      setStep('receipt');
    } catch (e) {
      setStep('select');
      notify(
        e instanceof Error
          ? `${e.message}. Puedes reintentar con la misma selección.`
          : 'No se pudo completar',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy && !pending) {
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
              {step === 'receipt'
                ? 'Comprobante de simulación'
                : 'Recargar saldo'}
            </Text>
            <Pressable
              accessibilityLabel="Cerrar recarga de prueba"
              accessibilityRole="button"
              disabled={busy || pending}
              onPress={close}
              hitSlop={12}
            >
              <X color={colors.muted} />
            </Pressable>
          </View>
          {step === 'receipt' ? (
            <View className="gap-4">
              <View
                accessibilityRole="alert"
                className="items-center gap-2 rounded-2xl border border-[#E8C882] bg-[#FFF8E8] p-5"
              >
                <Text className="font-title text-[20px] text-navy">
                  Recarga de prueba registrada
                </Text>
                <Text className="font-sans text-[30px] font-bold text-navy">
                  {money(amount ?? 0)}
                </Text>
                <Text className="text-center font-sans text-[13px] leading-5 text-ink">
                  No hubo pago, transferencia ni cargo real. Este comprobante
                  solo corresponde a una simulación académica.
                </Text>
              </View>
              <View className="gap-2 rounded-xl border border-line p-4">
                <Sub>
                  Método de muestra:{' '}
                  {method === 'YAPE_DEMO' ? 'Yape (simulación)' : 'Tarjeta (simulación)'}
                </Sub>
                <Sub>Referencia de simulación: {reference}</Sub>
                <Sub>Fecha y hora: {completedAt}</Sub>
                <Sub>Saldo de prueba actualizado en la aplicación.</Sub>
              </View>
              <Button
                title="Cerrar comprobante"
                variant="ghost"
                onPress={close}
              />
            </View>
          ) : step === 'processing' ? (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Procesando una simulación de recarga"
              className="items-center gap-3 rounded-2xl bg-[#F4F7F9] p-8"
            >
              <Text className="font-title text-[18px] text-navy">
                Preparando simulación…
              </Text>
              <Sub>No se está realizando un cobro real.</Sub>
            </View>
          ) : (
            <>
              <View
                accessibilityRole="alert"
                className="rounded-xl border border-[#E8C882] bg-[#FFF8E8] p-3"
              >
                <Heading>Entorno académico · Sin pagos reales</Heading>
                <Sub>
                  No se cobra dinero ni se conecta con Yape o bancos. No
                  ingreses números de tarjeta, vencimiento, CVV ni claves.
                </Sub>
              </View>
              <Heading>Elige un monto</Heading>
              <View className="flex-row gap-2">
                {[5, 10, 20, 50].map(value => (
                  <Pressable
                    key={value}
                    disabled={pending || retrying}
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
              <Heading>Vista de método (no cobrable)</Heading>
              {(['YAPE_DEMO', 'CARD_DEMO'] as const).map(value => (
                <Pressable
                  key={value}
                  disabled={pending || retrying}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: method === value }}
                  onPress={() => setMethod(value)}
                  className={`rounded-xl border p-4 ${
                    method === value ? 'border-steel bg-[#E4F7EE]' : 'border-line'
                  }`}
                >
                  <Heading>
                    {value === 'YAPE_DEMO'
                      ? 'Yape · vista de ejemplo'
                      : 'Tarjeta · vista de ejemplo'}
                  </Heading>
                  <Sub>
                    {value === 'YAPE_DEMO'
                      ? 'QR académico que no inicia pagos.'
                      : 'Tarjeta de muestra; no se solicitan datos bancarios.'}
                  </Sub>
                </Pressable>
              ))}
              {method === 'YAPE_DEMO' && paymentQr && (
                <View className="items-center gap-2 rounded-2xl border border-line p-4">
                  <Text className="font-sans font-bold text-[#5B2C83]">
                    QR de muestra · No es un QR de pago
                  </Text>
                  <Svg
                    width={190}
                    height={190}
                    viewBox={`0 0 ${paymentQr.getModuleCount() + 8} ${paymentQr.getModuleCount() + 8}`}
                    accessibilityLabel="Código QR de simulación; no permite pagar"
                  >
                    <Rect
                      width={paymentQr.getModuleCount() + 8}
                      height={paymentQr.getModuleCount() + 8}
                      fill="white"
                    />
                    {Array.from(
                      { length: paymentQr.getModuleCount() },
                      (_, row) =>
                        Array.from(
                          { length: paymentQr.getModuleCount() },
                          (__, col) =>
                            paymentQr.isDark(row, col) ? (
                              <Rect
                                key={`${row}-${col}`}
                                x={col + 4}
                                y={row + 4}
                                width={1}
                                height={1}
                                fill="#21152A"
                              />
                            ) : null,
                        ),
                    )}
                  </Svg>
                  <Sub>Destino de muestra: Metropolitano · proyecto académico</Sub>
                </View>
              )}
              {method === 'CARD_DEMO' && (
                <View className="gap-2 rounded-xl bg-[#F4F7F9] p-4">
                  <Heading>Tarjeta de muestra · No cobrable</Heading>
                  <Sub>
                    Campos visuales bloqueados. No ingreses datos de una tarjeta
                    real; nada se guarda ni se envía.
                  </Sub>
                  <View className="gap-1">
                    <Sub>Titular de muestra</Sub>
                    <TextInput
                      accessibilityLabel="Titular de muestra, campo bloqueado"
                      editable={false}
                      value="USUARIO DE PRUEBA"
                      className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[14px] text-ink"
                    />
                  </View>
                  <View className="gap-1">
                    <Sub>Número de muestra</Sub>
                    <TextInput
                      accessibilityLabel="Número de tarjeta de muestra, campo bloqueado"
                      editable={false}
                      value="•••• •••• •••• 4242"
                      className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[14px] text-ink"
                    />
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1 gap-1">
                      <Sub>Vencimiento de muestra</Sub>
                      <TextInput
                        accessibilityLabel="Vencimiento de muestra, campo bloqueado"
                        editable={false}
                        value="12/30"
                        className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[14px] text-ink"
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Sub>CVV de muestra</Sub>
                      <TextInput
                        accessibilityLabel="CVV de muestra, campo bloqueado"
                        editable={false}
                        value="•••"
                        className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[14px] text-ink"
                      />
                    </View>
                  </View>
                </View>
              )}
              {retrying && !pending && (
                <Sub>
                  No se pudo confirmar el resultado. Reintenta con la misma
                  selección; se conservará la referencia de esta operación.
                </Sub>
              )}
              <Button
                title={
                  busy || pending
                    ? 'Registrando simulación…'
                    : retrying
                      ? 'Reintentar simulación'
                      : `Simular recarga · ${money(amount ?? 0)}`
                }
                variant="amber"
                onPress={confirm}
                disabled={busy || pending || !amount || !method}
              />
            </>
          )}
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
      sub: 'Métodos disponibles en esta versión',
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
      sub: 'Preguntas frecuentes',
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
              <Sub>Cuenta de presentación</Sub>
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
      text: 'Yape y tarjeta permiten probar el flujo de recarga. No hay tarjetas bancarias vinculadas ni pasarela de pagos, y no se realizan cobros. No ingreses información financiera real.',
    },
    security: {
      title: 'Seguridad y acceso',
      text: 'El acceso por celular y DNI es exclusivamente ficticio. No acredita identidad. La sesión conectada dura hasta una hora; el cierre revoca su token en el servidor. Contraseña, recuperación y autenticación real están pendientes.',
    },
    privacy: {
      title: 'Privacidad',
      text: 'Utiliza los datos asignados para la presentación. La cuenta conectada guarda perfil, saldo de prueba y preferencias en la base de datos del servidor. Esta versión no solicita GPS ni envía notificaciones push. No contiene una integración oficial con ATU.',
    },
    help: {
      title: 'Ayuda y soporte',
      text: '¿La recarga cobra dinero? No, solo suma saldo de prueba.\n\n¿Los buses están en vivo? No, los estados y tiempos son referenciales.\n\n¿Dónde se guarda mi perfil? En la base de datos del servidor.\n\n¿Puedo consultar una tarjeta física? No.\n\nEsta versión no tiene canal de atención ni tickets de soporte.',
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
