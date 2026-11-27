import { validateProfile } from './domain';

export type RegistrationInput = {
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
  email: string;
  password: string;
};

const namePattern = /^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u;
const domains = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'yahoo.com',
  'yahoo.es', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'aol.com',
  'gmx.com', 'zoho.com', 'fastmail.com',
]);

export const passwordHint = 'Usa al menos 10 caracteres, una mayúscula y un símbolo @, # o .';

export function normalizeRegistration(input: RegistrationInput) {
  const cleanName = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');
  const data = {
    ...input,
    firstName: cleanName(input.firstName),
    lastName: cleanName(input.lastName),
    phone: input.phone.trim(),
    dni: input.dni.trim(),
    email: input.email.trim().toLowerCase(),
  };
  if (!namePattern.test(data.firstName) || !namePattern.test(data.lastName)) {
    throw new Error('Ingresa nombres y apellidos válidos');
  }
  const fullName = `${data.firstName} ${data.lastName}`;
  const error = validateProfile({ ...data, fullName, version: 0 });
  if (error) { throw new Error(error); }
  const [mailbox, domain] = data.email.split('@');
  if (!domains.has(domain) || !/^[a-z0-9_+%.-]{1,64}$/.test(mailbox) ||
      mailbox.startsWith('.') || mailbox.endsWith('.') || mailbox.includes('..')) {
    throw new Error('Utiliza un correo válido de Gmail, Outlook u otro proveedor admitido');
  }
  if (data.password.length < 10 || !/\p{Lu}/u.test(data.password) || !/[@#.]/.test(data.password)) {
    throw new Error(passwordHint);
  }
  if (data.password.length > 72) { throw new Error('La contraseña excede el máximo permitido'); }
  return { ...data, fullName };
}
