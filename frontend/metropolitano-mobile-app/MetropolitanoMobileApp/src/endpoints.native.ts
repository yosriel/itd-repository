// Expo sustituye estos valores públicos al generar el bundle.
declare const process: { env: {
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_AI_URL?: string;
} };
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1/demo';
export const AI_API_URL = process.env.EXPO_PUBLIC_AI_URL || 'http://localhost:8001';
