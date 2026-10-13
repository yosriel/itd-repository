import {
  fixtures,
  initialState,
  initials,
  validateProfile,
} from '../src/domain';
test('profile rejects invalid personal data and preserves canonical data', () => {
  const saved = initialState().profile;
  const draft = { ...saved, fullName: 'Ana Torres', email: 'invalid' };
  expect(validateProfile(draft)).toBe('Ingresa un correo válido');
  expect(saved.fullName).toBe('Juan Carlos Quispe');
  expect(validateProfile({ ...saved, dni: '123' })).toBe(
    'El DNI debe tener 8 dígitos',
  );
  expect(validateProfile({ ...saved, phone: 'abcdefghj' })).toBe(
    'El celular debe tener 9 dígitos y comenzar con 9',
  );
  expect(validateProfile(saved)).toBeUndefined();
});
test('initials follow the original first-two-word convention', () => {
  expect(initials('  Juan Carlos Quispe  ')).toBe('JC');
  expect(initials('Ana')).toBe('A');
});
test('demo route fixtures preserve the supplied HTML', () => {
  expect(Object.keys(fixtures.rutas)).toHaveLength(12);
  expect(fixtures.rutas.central.paradas).toEqual([
    'Naranjal',
    'Honorio Delgado',
    'Caquetá',
    'Ramón Castilla',
    'Estación Central',
  ]);
  expect(fixtures.rutas.matellini.tiempo).toBe('58 min');
});
