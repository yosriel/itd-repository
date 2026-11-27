import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import qrcode from 'qrcode-generator';
import { AppProvider, useApp } from '../src/AppProvider';
import { money, initials } from '../src/domain';
import {
  demoArrivals,
  DemoPlan,
} from '../src/demoTransit';
import { logoXml } from '../assets/images/logo';
import './style.css';
import { Assistant } from './Assistant';
import { RegularPlanner } from './RegularPlanner';
import { assistantSections } from '../src/assistantOptions';
import { destinationGroups, nearestStation } from '../src/stations';
import { passwordHint } from '../src/registration';
import type { TabParams } from '../src/navigationTypes';
import { aiSupportedStations, requestAiRoute, Scenario, stationLabel, AiRouteResponse } from '../src/aiRoute';
const logo = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoXml)}`;
const images = {
  splash: new URL('../assets/images/splash.jpg', import.meta.url).href,
  bus: new URL('../assets/images/bus.jpg', import.meta.url).href,
  second: new URL('../assets/images/second-bus.jpg', import.meta.url).href,
  wordmark: new URL('../assets/images/wordmark.png', import.meta.url).href,
};
function WebApp() {
  const app = useApp();
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState('Inicio');
  const [showSimulation, setShowSimulation] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [plan, setPlan] = useState<DemoPlan | null>(null);
  const [aiPrediction, setAiPrediction] = useState<AiRouteResponse | null>(null);
  const [aiScenario, setAiScenario] = useState<Scenario>('peak');
  const [aiIncident, setAiIncident] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [detail, setDetail] = useState(false);
  const [station, setStation] = useState('');
  const [modal, setModal] = useState('');
  const [amount, setAmount] = useState(5);
  const [method, setMethod] = useState<'YAPE_DEMO' | 'CARD_DEMO'>('YAPE_DEMO');
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'receipt'>('select');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const [profile, setProfile] = useState(false);
  const [draft, setDraft] = useState(app.state.profile);
  const [clock, setClock] = useState(Date.now());
  const [locationMessage, setLocationMessage] = useState('');
  const [travelIndex, setTravelIndex] = useState(-1);
  const [read, setRead] = useState(false);
  const [key, setKey] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (travelIndex < 0 || !plan || !detail) {
      return;
    }
    const timer = setTimeout(
      () => setTravelIndex(i => (i + 1 < plan.paradas.length ? i + 1 : -1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [travelIndex, plan, detail]);
  const qrPeriod = Math.floor(clock / 30000);
  const qr = useMemo(() => {
    const code = qrcode(0, 'M');
    code.addData(`METROPOLITANO-DEMO:NO-VALIDO-PARA-VIAJAR:4417:${qrPeriod}`);
    code.make();
    return code.createSvgTag({ cellSize: 4, margin: 16, scalable: true });
  }, [qrPeriod]);
  const paymentQr = useMemo(() => {
    const code = qrcode(0, 'M');
    code.addData(`SIMULACION-NO-COBRABLE|METROPOLITANO|${amount}`);
    code.make();
    return code.createSvgTag({ cellSize: 4, margin: 12, scalable: true });
  }, [amount]);
  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }
  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Este navegador no ofrece ubicación.');
      return;
    }
    setLocationMessage('Buscando la estación más cercana…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const nearest = nearestStation(coords);
      setOrigin(nearest);
      setDestination('');
      setPlan(null);
      setAiPrediction(null);
      setLocationMessage(`Estación más cercana: ${nearest}`);
    }, () => setLocationMessage('No se pudo obtener tu ubicación. Puedes elegir el origen manualmente.'),
    { maximumAge: 60000, timeout: 15000 });
  }
  async function searchRoute() {
    setPlan(null);
    setAiPrediction(null);
    setError('');
    setRouteLoading(true);
    try {
      const prediction = await requestAiRoute(origin, destination, aiScenario, aiIncident);
      setAiPrediction(prediction);
      setPlan({
        origin,
        destinoNombre: destination,
        tiempo: `${prediction.costo_grafo_minutos} min · A*`,
        linea: 'Ruta calculada por A*',
        paradas: prediction.ruta.map(stationLabel),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar la API de IA.');
    } finally {
      setRouteLoading(false);
    }
  }
  function navigateTo(name: string) {
    setTab(name);
    setProfile(false);
    setDetail(false);
    setError('');
    if (name === 'Alertas') {
      run(app.readAlerts);
    }
  }
  function navigateFromAssistant(target: keyof TabParams) {
    const section = assistantSections.find(item => item.tab === target);
    if (section) { navigateTo(section.label); }
  }
  const button = (title: string, action: () => void, ghost = false) => (
    <button
      type="button"
      className={ghost ? 'ghost' : ''}
      onClick={action}
      disabled={app.busy}
    >
      {title}
    </button>
  );
  if (!app.mode) {
    return (
      <main className="shell">
        {splash ? (
          <section className="splash">
            <img
              className="hero"
              src={images.splash}
              alt="Bus del Metropolitano"
            />
            <div className="fade" />
            <div className="splash-content">
              <img className="mark" src={logo} alt="Logotipo de Metropolitano de Lima App" />
              <h1>
                Metropolitano
                <br />
                de Lima App
              </h1>
              <p>Tu ruta, en un solo lugar.</p>
              {button('Pulsa para continuar', () => setSplash(false))}
            </div>
          </section>
        ) : (
          <section className="login">
            <img
              className="wordmark"
              src={images.wordmark}
              alt="Logotipo del HTML"
            />
            <h1>{registering ? 'Crear cuenta' : 'Inicia sesión'}</h1>
            <p>
              {registering
                ? 'Completa tus datos para crear tu cuenta.'
                : 'Ingresa con el celular y contraseña de tu cuenta.'}
            </p>
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (registering) {
                  if (password !== passwordConfirmation) {
                    setError('Las contraseñas no coinciden');
                    return;
                  }
                  await run(() =>
                    app.register({ firstName, lastName, phone, dni, email, password }),
                  );
                } else {
                  await run(() => app.login(phone, password));
                }
              }}
            >
              {registering && (
                <>
                  <label>Nombres
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={100} autoComplete="given-name" required />
                  </label>
                  <label>Apellidos
                    <input value={lastName} onChange={e => setLastName(e.target.value)} maxLength={100} autoComplete="family-name" required />
                  </label>
                </>
              )}
              <label>
                Número de celular
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  inputMode="numeric"
                  maxLength={9}
                  autoComplete="tel"
                  required
                />
              </label>
              {registering && (
                <>
                  <label>
                    DNI
                    <input
                      value={dni}
                      onChange={e => setDni(e.target.value)}
                      inputMode="numeric"
                      maxLength={8}
                      autoComplete="off"
                      required
                    />
                  </label>
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      maxLength={254}
                      autoComplete="email"
                      required
                    />
                  </label>
                </>
              )}
              <label>
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={registering ? 10 : 1}
                  maxLength={72}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  required
                />
              </label>
              {registering && (
                <>
                  <label>
                    Confirmar contraseña
                    <input
                      type="password"
                      value={passwordConfirmation}
                      onChange={e => setPasswordConfirmation(e.target.value)}
                      minLength={10}
                      maxLength={72}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <small>{passwordHint}</small>
                </>
              )}
              <button disabled={app.busy}>
                {app.busy
                  ? 'Conectando…'
                  : registering
                    ? 'Crear cuenta'
                    : 'Ingresar'}
              </button>
            </form>
            <button
              type="button"
              className="ghost"
              disabled={app.busy}
              onClick={() => {
                setError('');
                setRegistering(value => !value);
              }}
            >
              {registering
                ? 'Ya tengo cuenta · Iniciar sesión'
                : '¿No tienes cuenta? Crear cuenta'}
            </button>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
        )}
      </main>
    );
  }
  return (
    <main className="shell">
      <header>
        <small>
          Conectado
        </small>
        {tab === 'Inicio' ? (
          <>
            <div className="row">
              <div>
                <p>Buenos días</p>
                <h1>
                  {app.state.profile.fullName.split(' ').slice(0, 2).join(' ')}
                </h1>
              </div>
              {button(
                `Alertas${app.state.alertsRead ? '' : ' (2)'}`,
                () => {
                  setTab('Alertas');
                  run(app.readAlerts);
                },
                true,
              )}
            </div>
            <input
              aria-label="Buscar estación"
              placeholder="Buscar estación o paradero…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </>
        ) : (
          <h1>
            {profile
              ? 'Mi perfil'
              : detail
              ? 'Detalle de ruta'
              : tab === 'Rutas'
              ? 'Planea tu ruta'
              : tab}
          </h1>
        )}
      </header>
      <section className="content">
        {tab === 'Inicio' && (
          <>
            {button('Usar mi ubicación', useMyLocation, true)}
            {locationMessage && <p role="status">{locationMessage}</p>}
            <h2>Estaciones</h2>
            {app.state.fixtures.stations
              .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
              .map(s => (
                <button
                  key={s.name}
                  className="card row station"
                  onClick={() => {
                    setStation(s.name);
                    setModal('station');
                  }}
                >
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.sub}</small>
                  </span>
                  <span className={`pill ${s.status}`}>{s.label}</span>
                </button>
              ))}
            <h2>Tus rutas frecuentes</h2>
            <div className="frequent">
              {[images.bus, images.second].map((image, i) => (
                <article key={image} className="card">
                  <img src={image} alt="Fotografía del HTML" />
                  <strong>{i ? 'Regular C' : 'Regular A'}</strong>
                  <small>
                    {i ? 'Central → Matellini' : 'Naranjal → Central'}
                  </small>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === 'Rutas' && !showSimulation && <RegularPlanner onSimulation={() => setShowSimulation(true)} />}
        {tab === 'Rutas' && showSimulation &&
          (detail && plan ? (
            <>
              {button('Volver al planeador', () => setDetail(false), true)}
              <div className="digital">
                <h2>
                  {plan.origin} → {plan.destinoNombre}
                </h2>
                <h1>{plan.tiempo}</h1>
                <p>{plan.linea}</p>
                <small>{plan.transbordos === undefined ? 'Transbordos no incluidos en el cálculo' : `${plan.transbordos} transbordos estimados`}</small>
              </div>
              {plan.paradas.map((stop, i) => (
                <div className="card" key={stop}>
                  {travelIndex === i ? '● ' : ''}
                  {stop}
                </div>
              ))}
              {button(
                travelIndex >= 0
                  ? 'Cancelar simulación'
                  : 'Iniciar recorrido guiado',
                () => setTravelIndex(travelIndex >= 0 ? -1 : 0),
              )}
              <small>Explora el orden de las estaciones del recorrido.</small>
            </>
          ) : (
            <>
              {button('Volver a rutas regulares', () => setShowSimulation(false), true)}
              <label>
                Origen
                <select
                  value={origin}
                  onChange={e => {
                    setOrigin(e.target.value);
                    setDestination('');
                    setPlan(null);
                    setAiPrediction(null);
                  }}
                >
                  <option value="">Selecciona el origen</option>
                  {aiSupportedStations.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {button('Usar mi ubicación', useMyLocation, true)}
              {locationMessage && <p role="status">{locationMessage}</p>}
              <label>
                ¿A dónde vas?
                <select
                  value={destination}
                  onChange={e => {
                    setDestination(e.target.value);
                    setPlan(null);
                    setAiPrediction(null);
                  }}
                >
                  <option value="">Selecciona una estación</option>
                  {origin && destinationGroups(origin).map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.stations.map(name => <option key={name}>{name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              {button(
                'Intercambiar estaciones',
                () => {
                  if (destination) {
                    setOrigin(destination);
                    setDestination(origin);
                    setPlan(null);
                    setAiPrediction(null);
                  }
                },
                true,
              )}
              {app.mode === 'connected' && (
                <section className="ai-route-options" aria-label="Escenario de predicción">
                  <strong>Escenario de predicción · Datos sintéticos</strong>
                  <small>La distancia, el servicio y la frecuencia restante son supuestos de ejemplo.</small>
                  <div className="ai-route-presets">
                    <button type="button" aria-pressed={aiScenario === 'peak'}
                      onClick={() => { setAiScenario('peak'); setPlan(null); setAiPrediction(null); }}>
                      Hora punta
                    </button>
                    <button type="button" aria-pressed={aiScenario === 'offpeak'}
                      onClick={() => { setAiScenario('offpeak'); setPlan(null); setAiPrediction(null); }}>
                      Hora valle
                    </button>
                  </div>
                  <label className="ai-route-incident">
                    <input type="checkbox" checked={aiIncident}
                      onChange={event => { setAiIncident(event.target.checked); setPlan(null); setAiPrediction(null); }} />
                    Incluir incidencia en Caquetá
                  </label>
                </section>
              )}
              <button
                disabled={!origin || !destination || origin === destination || routeLoading}
                onClick={searchRoute}
              >
                {routeLoading ? 'Calculando…' : 'Buscar ruta'}
              </button>
              {origin === destination && (
                <p role="alert">Elige dos estaciones diferentes.</p>
              )}
              {plan && (
                <article className="card">
                  <h2>
                    {plan.origin} → {plan.destinoNombre}
                  </h2>
                  <p>{plan.linea}</p>
                  <strong>
                    {plan.tiempo}{plan.transbordos === undefined ? '' : ` · ${plan.transbordos} transbordos`}
                  </strong>
                  {button('Ver ruta trazada', () => setDetail(true))}
                </article>
              )}
              {aiPrediction && (
                <article className="card" aria-live="polite">
                  <h2>Predicción de IA</h2>
                  <p>ETA Ridge: {aiPrediction.eta_modelo_minutos} min. Es distinto del costo A*.</p>
                  <p>Saturación: {aiPrediction.saturacion_critica ? 'crítica' : 'normal'} · probabilidad XGBoost: {(aiPrediction.probabilidad_saturacion * 100).toFixed(1)}%</p>
                  <small>Estimaciones con datos sintéticos, no información en tiempo real.</small>
                </article>
              )}
              <small>
                Estimaciones de referencia; no hay horarios en vivo disponibles.
              </small>
            </>
          ))}
        {tab === 'Alertas' && (
          <>
            <article className="card row">
              <div>
                <h2>Notificaciones push</h2>
                <small>Preferencia de avisos</small>
              </div>
              <input
                aria-label="Notificaciones"
                type="checkbox"
                checked={app.state.notifications}
                onChange={e =>
                  run(() => app.setNotifications(e.target.checked))
                }
              />
            </article>
            {app.state.fixtures.alerts.map(a => (
              <article className={`card alert ${a.level}`} key={a.title}>
                <h2>{a.title}</h2>
                <p>{a.body}</p>
                <small>{a.time} · Ejemplo</small>
              </article>
            ))}
          </>
        )}
        {tab === 'Cuenta' &&
          (profile ? (
            <>
              <div className="avatar">
                {initials(app.state.profile.fullName)}
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  run(async () => {
                    await app.saveProfile(draft);
                    setProfile(false);
                  });
                }}
              >
                {(['fullName', 'phone', 'dni', 'email'] as const).map(
                  (field, i) => (
                    <label key={field}>
                      {
                        [
                          'Nombre completo',
                          'Celular',
                          'DNI',
                          'Correo electrónico',
                        ][i]
                      }
                      <input
                        value={draft[field]}
                        onChange={e =>
                          setDraft({ ...draft, [field]: e.target.value })
                        }
                      />
                    </label>
                  ),
                )}
                <button disabled={app.busy}>Guardar cambios</button>
              </form>
              {button('Cancelar', () => setProfile(false), true)}
            </>
          ) : (
            <>
              <button
                className="card row station"
                onClick={() => {
                  setDraft({ ...app.state.profile });
                  setProfile(true);
                }}
              >
                <span className="avatar">
                  {initials(app.state.profile.fullName)}
                </span>
                <span>
                  <strong>{app.state.profile.fullName}</strong>
                  <small>Ver perfil y preferencias</small>
                </span>
                <span>›</span>
              </button>
              <div className="digital">
                <img src={logo} alt="Logotipo" />
                <p>Tarjeta Metropolitano · Demo</p>
                <h1>{money(app.state.balance)}</h1>
                <small>•••• •••• •••• 4417</small>
              </div>
              {button(
                'Ver tarjeta y QR',
                () => {
                  setRead(false);
                  setModal('qr');
                },
                true,
              )}
              {button('Recargar saldo', () => {
                setKey(crypto.randomUUID());
                setPaymentStep('select');
                setPaymentReference('');
                setPaymentDate('');
                setPaymentAttempted(false);
                setError('');
                setModal('recharge');
              })}
              <h2>Historial reciente</h2>
              {app.state.recharges.map(r => (
                <article className="card row" key={r.id}>
                  <strong>
                    Recarga vía {r.method === 'YAPE_DEMO' ? 'Yape' : 'Tarjeta'}{' '}
                    · Demo
                  </strong>
                  <span className="green">+{money(r.amount)}</span>
                </article>
              ))}
              {app.state.fixtures.historial.map((r, i) => (
                <article className="card row" key={i}>
                  <span>
                    <strong>{r.desc}</strong>
                    <small>{r.fecha} · Ejemplo</small>
                  </span>
                  <strong className={r.monto > 0 ? 'green' : 'red'}>
                    {r.monto > 0 ? '+' : '−'}
                    {money(Math.abs(r.monto))}
                  </strong>
                </article>
              ))}
              {button('Cerrar sesión', () => run(app.logout), true)}
            </>
          ))}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <nav>
        {['Inicio', 'Rutas', 'Alertas', 'Cuenta'].map(name => (
          <button
            key={name}
            aria-current={tab === name ? 'page' : undefined}
            onClick={() => navigateTo(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      {!modal && <Assistant onNavigate={navigateFromAssistant} />}
      {app.toast && (
        <div className="toast" role="status">
          {app.toast}
        </div>
      )}
      {modal && (
        <div className="overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === 'station'
                ? 'Próximos buses'
                : modal === 'qr'
                ? 'Tarjeta digital'
                : 'Recargar saldo'
            }
            className="dialog"
          >
            <button
              aria-label="Cerrar"
              className="close"
              disabled={paymentStep === 'processing'}
              onClick={() => setModal('')}
            >
              ×
            </button>
            {modal === 'station' && (
              <>
                <h1>{station}</h1>
                <p>Servicios de referencia · Llegadas estimadas</p>
                {demoArrivals(station, app.state.fixtures.rutas).map((a, i) => (
                  <article className="card" key={a.line}>
                    <h2>{a.line}</h2>
                    <small>{a.platform}</small>
                    <strong className="eta">
                      {Math.floor(
                        ((i + 1) * 180 - (Math.floor(clock / 1000) % 180)) / 60,
                      )}
                      :
                      {String(59 - (Math.floor(clock / 1000) % 60)).padStart(
                        2,
                        '0',
                      )}
                    </strong>
                  </article>
                ))}
              </>
            )}
            {modal === 'qr' && (
              <>
                <h1>Tarjeta digital · Demo</h1>
                <p>•••• 4417 · {money(app.state.balance)}</p>
                <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
                <p>
                  Se renueva en {30 - (Math.floor(clock / 1000) % 30)} segundos
                </p>
                <small>No válido para viajar ni realizar cobros.</small>
                <button disabled={read} onClick={() => setRead(true)}>
                  Simular lectura del QR
                </button>
                {read && (
                  <p role="status">
                    Lectura de prueba completada. Saldo sin cambios.
                  </p>
                )}
              </>
            )}
            {modal === 'recharge' && (
              <>
                {paymentStep === 'receipt' ? (
                  <>
                    <h1>Comprobante de simulación</h1>
                    <section className="payment-receipt" role="status">
                      <h2>Recarga de prueba registrada</h2>
                      <strong>{money(amount)}</strong>
                      <p>
                        No hubo pago, transferencia ni cargo real. Este
                        comprobante corresponde solo a una simulación.
                      </p>
                    </section>
                    <div className="payment-details">
                      <small>
                        Método de muestra:{' '}
                        {method === 'YAPE_DEMO'
                          ? 'Yape (simulación)'
                          : 'Tarjeta (simulación)'}
                      </small>
                      <small>Referencia de simulación: {paymentReference}</small>
                      <small>Fecha y hora: {paymentDate}</small>
                      <small>Saldo de prueba actualizado en la aplicación.</small>
                    </div>
                    {button('Cerrar comprobante', () => setModal(''), true)}
                  </>
                ) : paymentStep === 'processing' ? (
                  <div className="payment-processing" role="status" aria-live="polite">
                    <h2>Preparando simulación…</h2>
                    <p>No se está realizando un cobro real.</p>
                  </div>
                ) : (
                  <>
                    <section className="payment-notice" role="note">
                      <strong>Recarga simulada</strong>
                      <p>
                        No se cobra dinero ni se conecta con Yape o bancos. No
                        ingreses números de tarjeta, vencimiento, CVV ni claves.
                      </p>
                    </section>
                    <label>
                      Monto de prueba
                      <select
                        value={amount}
                        disabled={paymentAttempted}
                        onChange={e => setAmount(Number(e.target.value))}
                      >
                        {[5, 10, 20, 50].map(n => (
                          <option value={n} key={n}>
                            S/ {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Vista de método (no cobrable)
                      <select
                        value={method}
                        disabled={paymentAttempted}
                        onChange={e =>
                          setMethod(e.target.value as typeof method)
                        }
                      >
                        <option value="YAPE_DEMO">Yape · vista de ejemplo</option>
                        <option value="CARD_DEMO">Tarjeta · vista de ejemplo</option>
                      </select>
                    </label>
                    {method === 'YAPE_DEMO' ? (
                      <section className="payment-qr">
                        <strong>QR de muestra · No es un QR de pago</strong>
                        <div
                          className="qr"
                          aria-label="Código QR de simulación; no permite pagar"
                          dangerouslySetInnerHTML={{ __html: paymentQr }}
                        />
                        <small>
                          Destino de muestra: Metropolitano
                        </small>
                      </section>
                    ) : (
                      <section className="sample-card">
                        <strong>Tarjeta de muestra · No cobrable</strong>
                        <p>
                          Campos de ejemplo bloqueados. No ingreses datos de
                          tarjetas reales; nada se guarda ni se envía.
                        </p>
                        <label>
                          Titular de muestra
                          <input aria-label="Titular de muestra, campo bloqueado" value="USUARIO DE PRUEBA" disabled readOnly />
                        </label>
                        <label>
                          Número de muestra
                          <input aria-label="Número de tarjeta de muestra, campo bloqueado" value="•••• •••• •••• 4242" disabled readOnly />
                        </label>
                        <div className="row">
                          <label>
                            Vencimiento de muestra
                            <input aria-label="Vencimiento de muestra, campo bloqueado" value="12/30" disabled readOnly />
                          </label>
                          <label>
                            CVV de muestra
                            <input aria-label="CVV de muestra, campo bloqueado" value="•••" disabled readOnly />
                          </label>
                        </div>
                      </section>
                    )}
                    <button
                      type="button"
                      disabled={app.busy}
                      onClick={async () => {
                        setError('');
                        setPaymentAttempted(true);
                        setPaymentStep('processing');
                        await new Promise(resolve =>
                          window.setTimeout(resolve, 1600),
                        );
                        try {
                          await app.recharge(amount, method, key);
                          setPaymentReference(
                            `SIM-${key.slice(-8).toUpperCase()}`,
                          );
                          setPaymentDate(
                            new Date().toLocaleString('es-PE', {
                              timeZone: 'America/Lima',
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }),
                          );
                          setPaymentStep('receipt');
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? `${e.message}. Puedes reintentar con la misma selección.`
                              : 'No se pudo completar la simulación.',
                          );
                          setPaymentStep('select');
                        }
                      }}
                    >
                      {paymentAttempted
                        ? 'Reintentar simulación'
                        : `Simular recarga · ${money(amount)}`}
                    </button>
                  </>
                )}
              </>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
function SessionView() {
  const { mode } = useApp();
  return <WebApp key={mode ?? 'login'} />;
}
createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <SessionView />
  </AppProvider>,
);
