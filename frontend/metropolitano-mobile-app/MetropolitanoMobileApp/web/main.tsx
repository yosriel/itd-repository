import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import qrcode from 'qrcode-generator';
import { AppProvider, useApp } from '../src/AppProvider';
import { fixtures, money, initials } from '../src/domain';
import {
  demoStations,
  planDemo,
  demoArrivals,
  DemoPlan,
} from '../src/demoTransit';
import { logoXml } from '../assets/images/logo';
import './style.css';
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
  const [phone, setPhone] = useState('987654321');
  const [dni, setDni] = useState('76543210');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState('Naranjal');
  const [destination, setDestination] = useState('');
  const [plan, setPlan] = useState<DemoPlan | null>(null);
  const [detail, setDetail] = useState(false);
  const [station, setStation] = useState('');
  const [modal, setModal] = useState('');
  const [amount, setAmount] = useState(5);
  const [method, setMethod] = useState<'YAPE_DEMO' | 'CARD_DEMO'>('YAPE_DEMO');
  const [profile, setProfile] = useState(false);
  const [draft, setDraft] = useState(app.state.profile);
  const [clock, setClock] = useState(Date.now());
  const [locationExample, setLocationExample] = useState(false);
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
  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
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
              <img className="mark" src={logo} alt="Logotipo del prototipo" />
              <h1>
                Metropolitano
                <br />
                Lima App
              </h1>
              <p>Tu ruta, en una experiencia de demostración.</p>
              {button('Pulsa para continuar', () => setSplash(false))}
              <small>Prototipo académico · Sin conexión oficial con ATU</small>
            </div>
          </section>
        ) : (
          <section className="login">
            <img
              className="wordmark"
              src={images.wordmark}
              alt="Logotipo del HTML"
            />
            <h1>Inicia sesión</h1>
            <p>Ingresa con datos ficticios para explorar el prototipo.</p>
            <form
              onSubmit={e => {
                e.preventDefault();
                run(() => app.login(phone, dni));
              }}
            >
              <label>
                Número de celular
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  inputMode="numeric"
                  maxLength={9}
                />
              </label>
              <label>
                DNI
                <input
                  value={dni}
                  onChange={e => setDni(e.target.value)}
                  inputMode="numeric"
                  maxLength={8}
                />
              </label>
              <button disabled={app.busy}>Ingresar</button>
            </form>
            {button(
              'Explorar sin conexión',
              () => run(() => app.login(phone, dni, true)),
              true,
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <small>Prototipo académico · Datos simulados</small>
          </section>
        )}
      </main>
    );
  }
  return (
    <main className="shell">
      <header>
        <small>
          Prototipo académico ·{' '}
          {app.mode === 'connected' ? 'Conectado' : 'Sin conexión'}
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
            <button className="ghost" onClick={() => setModal('location')}>
              {locationExample
                ? 'Ejemplo: Naranjal · 3 min caminando'
                : 'Ver ejemplo de ubicación'}
            </button>
            <h2>Estaciones cercanas</h2>
            {fixtures.stations
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
                  <strong>{i ? 'Regular B' : 'Expreso 1'}</strong>
                  <small>
                    {i ? 'Central → Matellini' : 'Naranjal → Central'}
                  </small>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === 'Rutas' &&
          (detail && plan ? (
            <>
              {button('Volver al planeador', () => setDetail(false), true)}
              <div className="digital">
                <h2>
                  {plan.origin} → {plan.destinoNombre}
                </h2>
                <h1>{plan.tiempo}</h1>
                <p>{plan.linea}</p>
                <small>{plan.transbordos} transbordos · Simulado</small>
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
                  : 'Iniciar viaje simulado',
                () => setTravelIndex(travelIndex >= 0 ? -1 : 0),
              )}
              <small>
                Recorrido ilustrativo; no sigue un bus real ni cobra pasaje.
              </small>
            </>
          ) : (
            <>
              <label>
                Origen
                <select
                  value={origin}
                  onChange={e => {
                    setOrigin(e.target.value);
                    setPlan(null);
                  }}
                >
                  {demoStations.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                ¿A dónde vas?
                <select
                  value={destination}
                  onChange={e => {
                    setDestination(e.target.value);
                    setPlan(null);
                  }}
                >
                  <option value="">Selecciona una estación</option>
                  {demoStations.map(s => (
                    <option key={s}>{s}</option>
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
                  }
                },
                true,
              )}
              <button
                disabled={!destination || origin === destination}
                onClick={() => setPlan(planDemo(origin, destination))}
              >
                Buscar ruta
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
                    {plan.tiempo} · {plan.transbordos} transbordos
                  </strong>
                  {button('Ver ruta trazada', () => setDetail(true))}
                </article>
              )}
              <small>
                Estimaciones de prueba; no representan recorridos operativos
                verificados.
              </small>
            </>
          ))}
        {tab === 'Alertas' && (
          <>
            <article className="card row">
              <div>
                <h2>Notificaciones push</h2>
                <small>Preferencia simulada</small>
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
            {fixtures.alerts.map(a => (
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
              {fixtures.historial.map((r, i) => (
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
            onClick={() => {
              setTab(name);
              setProfile(false);
              setDetail(false);
              setError('');
              if (name === 'Alertas') {
                run(app.readAlerts);
              }
            }}
          >
            {name}
          </button>
        ))}
      </nav>
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
              onClick={() => setModal('')}
            >
              ×
            </button>
            {modal === 'location' && (
              <>
                <h1>Permite tu ubicación</h1>
                <p>
                  Puedes ver el ejemplo sin compartir tu ubicación real. No se
                  solicita permiso GPS.
                </p>
                {button('Ver ejemplo de ubicación', () => {
                  setLocationExample(true);
                  setModal('');
                })}
                {button('Ahora no', () => setModal(''), true)}
              </>
            )}
            {modal === 'station' && (
              <>
                <h1>{station}</h1>
                <p>Servicios del HTML · Andenes y llegadas simulados</p>
                {demoArrivals(station).map((a, i) => (
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
                <h1>Recargar saldo</h1>
                <p>Recarga ficticia. No se realizará ningún cobro.</p>
                <label>
                  Monto
                  <select
                    value={amount}
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
                  Método de pago
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value as typeof method)}
                  >
                    <option value="YAPE_DEMO">Yape · Simulado</option>
                    <option value="CARD_DEMO">Tarjeta · Simulada</option>
                  </select>
                </label>
                {button('Recargar ahora · Demo', () =>
                  run(async () => {
                    await app.recharge(amount, method, key);
                    setModal('');
                  }),
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
createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <WebApp />
  </AppProvider>,
);
