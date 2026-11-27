import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  initialState,
  Profile,
  Recharge,
  validateProfile,
} from './domain';
import { request } from './api';
import { normalizeRegistration, RegistrationInput } from './registration';

type AppContextValue = {
  state: AppState;
  mode: 'connected' | null;
  busy: boolean;
  toast: string;
  notify: (text: string) => void;
  login: (phone: string, credential: string) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  setNotifications: (enabled: boolean) => Promise<void>;
  readAlerts: () => Promise<void>;
  askAssistant: (message: string) => Promise<string>;
  recharge: (
    amount: number,
    method: Recharge['method'],
    key: string,
  ) => Promise<void>;
};
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState(initialState);
  const [mode, setMode] = useState<AppContextValue['mode']>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const token = useRef<string | undefined>(undefined);
  const lock = useRef(false);
  const alertsLock = useRef(false);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function operation(action: () => Promise<void>) {
    if (lock.current) {
      throw new Error('Espera a que termine la operación actual');
    }
    lock.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    const requestToken = token.current;
    const data = await request<AppState>('/state', requestToken);
    if (token.current === requestToken && requestToken) {
      setState(data);
    }
  }
  async function openSession(sessionToken: string) {
    const data = await request<AppState>('/state', sessionToken);
    token.current = sessionToken;
    setState(data);
    setMode('connected');
  }
  const value: AppContextValue = {
    state,
    mode,
    busy,
    toast,
    notify: setToast,
    login: (phone, credential) =>
      operation(async () => {
        if (!/^9\d{8}$/.test(phone.trim()) || !credential) {
          throw new Error('Ingresa un celular y contraseña válidos');
        }
        const session = await request<{ token: string }>(
          '/sessions',
          undefined,
          'POST',
          { phone: phone.trim(), password: credential },
        );
        await openSession(session.token);
      }),
    register: input =>
      operation(async () => {
        const data = normalizeRegistration(input);
        const session = await request<{ token: string }>(
          '/register',
          undefined,
          'POST',
          data,
        );
        await openSession(session.token);
      }),
    logout: () =>
      operation(async () => {
        try {
          if (token.current) {
            await request('/sessions/current', token.current, 'DELETE');
          }
        } finally {
          token.current = undefined;
          setMode(null);
          setState(initialState());
          setToast('');
        }
      }),
    saveProfile: profile =>
      operation(async () => {
        const error = validateProfile(profile);
        if (error) {
          throw new Error(error);
        }
        const saved = await request<Profile>('/me', token.current, 'PATCH', profile);
        setState(current => ({ ...current, profile: saved }));
        setToast('Perfil actualizado');
      }),
    setNotifications: enabled =>
      operation(async () => {
        await request('/preferences', token.current, 'PATCH', {
          notifications: enabled,
        });
        await refresh();
      }),
    readAlerts: async () => {
      if (state.alertsRead || alertsLock.current) {
        return;
      }
      alertsLock.current = true;
      try {
        await request('/alerts/read-all', token.current, 'POST');
        await refresh();
      } finally {
        alertsLock.current = false;
      }
    },
    askAssistant: async message => {
      if (mode !== 'connected' || !token.current) {
        throw new Error('El asistente necesita una sesión conectada.');
      }
      const result = await request<{ reply: string }>(
        '/assistant', token.current, 'POST', { message }, undefined, 120000,
      );
      return result.reply;
    },
    recharge: (amount, method, key) =>
      operation(async () => {
        if (![5, 10, 20, 50].includes(amount)) {
          throw new Error('Selecciona un monto válido');
        }
        await request<Recharge>(
          '/recharges',
          token.current,
          'POST',
          { amount: amount.toFixed(2), method },
          key,
        );
        await refresh();
        setToast(
          'Recarga ficticia registrada. No acredita una tarjeta física.',
        );
      }),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('AppProvider requerido');
  }
  return context;
}
