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

type AppContextValue = {
  state: AppState;
  mode: 'connected' | 'offline' | null;
  busy: boolean;
  toast: string;
  notify: (text: string) => void;
  login: (phone: string, dni: string, offline?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  setNotifications: (enabled: boolean) => Promise<void>;
  readAlerts: () => Promise<void>;
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
  const value: AppContextValue = {
    state,
    mode,
    busy,
    toast,
    notify: setToast,
    login: (phone, dni, offline = false) =>
      operation(async () => {
        if (!/^9\d{8}$/.test(phone) || !/^\d{8}$/.test(dni)) {
          throw new Error('Ingresa celular de 9 dígitos y DNI de 8 dígitos');
        }
        if (offline) {
          setState({
            ...initialState(),
            profile: { ...initialState().profile, phone, dni },
          });
          setMode('offline');
          return;
        }
        const session = await request<{ token: string }>(
          '/sessions',
          undefined,
          'POST',
          { phone, dni },
        );
        token.current = session.token;
        await refresh();
        setMode('connected');
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
        const saved =
          mode === 'connected'
            ? await request<Profile>('/me', token.current, 'PATCH', profile)
            : { ...profile, version: profile.version + 1 };
        setState(current => ({ ...current, profile: saved }));
        setToast('Perfil actualizado');
      }),
    setNotifications: enabled =>
      operation(async () => {
        if (mode === 'connected') {
          await request('/preferences', token.current, 'PATCH', {
            notifications: enabled,
          });
          await refresh();
        } else {
          setState(current => ({ ...current, notifications: enabled }));
        }
      }),
    readAlerts: async () => {
      if (state.alertsRead || alertsLock.current) {
        return;
      }
      alertsLock.current = true;
      try {
        if (mode === 'connected') {
          await request('/alerts/read-all', token.current, 'POST');
          await refresh();
        } else {
          setState(current => ({ ...current, alertsRead: true }));
        }
      } finally {
        alertsLock.current = false;
      }
    },
    recharge: (amount, method, key) =>
      operation(async () => {
        if (![5, 10, 20, 50].includes(amount)) {
          throw new Error('Selecciona un monto válido');
        }
        if (mode === 'connected') {
          await request<Recharge>(
            '/recharges',
            token.current,
            'POST',
            { amount: amount.toFixed(2), method },
            key,
          );
          await refresh();
        } else {
          setState(current => {
            if (current.recharges.some(item => item.id === key)) {
              return current;
            }
            const balanceAfter = (
              (Math.round(Number(current.balance) * 100) + amount * 100) /
              100
            ).toFixed(2);
            return {
              ...current,
              balance: balanceAfter,
              recharges: [
                {
                  id: key,
                  amount: amount.toFixed(2),
                  method,
                  balanceAfter,
                  createdAt: new Date().toISOString(),
                  dataMode: 'SIMULATED',
                },
                ...current.recharges,
              ],
            };
          });
        }
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
