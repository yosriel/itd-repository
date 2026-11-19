import type { TabParams } from './navigationTypes';

export const assistantQuestions = [
  '¿Qué rutas de ejemplo hay disponibles?',
  '¿Cómo puedo planificar una ruta?',
  '¿Cómo puedo consultar mi saldo y recargas?',
];

export const assistantSections: { label: string; tab: keyof TabParams }[] = [
  { label: 'Inicio', tab: 'Home' },
  { label: 'Rutas', tab: 'Routes' },
  { label: 'Alertas', tab: 'Alerts' },
  { label: 'Cuenta', tab: 'AccountTab' },
];
