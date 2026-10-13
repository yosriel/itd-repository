import fixtures from './data/fixtures.json';
export type RouteKey = keyof typeof fixtures.rutas;
export type Profile = {
  fullName: string;
  phone: string;
  dni: string;
  email: string;
  version: number;
};
export type Recharge = {
  id: string;
  amount: string;
  method: 'YAPE_DEMO' | 'CARD_DEMO';
  balanceAfter: string;
  createdAt: string;
  dataMode: string;
};
export type AppState = {
  profile: Profile;
  balance: string;
  notifications: boolean;
  alertsRead: boolean;
  recharges: Recharge[];
  dataMode: string;
};
export const initialState = (): AppState => ({
  profile: {
    fullName: 'Juan Carlos Quispe',
    phone: '987654321',
    dni: '76543210',
    email: 'juancarlos@example.com',
    version: 0,
  },
  balance: '12.50',
  notifications: true,
  alertsRead: false,
  recharges: [],
  dataMode: 'SIMULATED',
});
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0] ?? '')
    .join('')
    .toUpperCase();
}
export function validateProfile(profile: Profile): string | undefined {
  if (!profile.fullName.trim() || profile.fullName.trim().length > 100) {
    return 'Ingresa un nombre de hasta 100 caracteres';
  }
  if (!/^9\d{8}$/.test(profile.phone)) {
    return 'El celular debe tener 9 dígitos y comenzar con 9';
  }
  if (!/^\d{8}$/.test(profile.dni)) {
    return 'El DNI debe tener 8 dígitos';
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) ||
    profile.email.length > 254
  ) {
    return 'Ingresa un correo válido';
  }
}
export function money(value: string | number) {
  return `S/ ${Number(value).toFixed(2)}`;
}
export { fixtures };
