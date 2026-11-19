import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppProvider, useApp } from '../src/AppProvider';
import { initialState } from '../src/domain';

let app: ReturnType<typeof useApp>;
function Capture() {
  app = useApp();
  return null;
}
let tree: Renderer.ReactTestRenderer;
beforeEach(async () => {
  await act(async () => {
    tree = Renderer.create(
      <AppProvider>
        <Capture />
      </AppProvider>,
    );
  });
});
afterEach(async () => {
  await act(async () => {
    tree.unmount();
  });
});
test('a failed state request leaves the user signed out', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'demo' }) } as Response)
    .mockRejectedValueOnce(new Error('Servicio interrumpido'));
  try {
    await act(async () => {
      await expect(app.loginPresentation()).rejects.toThrow('Servicio interrumpido');
    });
    expect(app.mode).toBeNull();
    expect(app.state).toEqual(initialState());
  } finally {
    fetchMock.mockRestore();
  }
});
test('invalid profile does not overwrite saved profile', async () => {
  const saved = app.state.profile;
  await act(async () => {
    await expect(
      app.saveProfile({ ...saved, fullName: 'Persona de prueba', phone: '912345678', dni: '12345678', email: 'invalid' }),
    ).rejects.toThrow('correo válido');
  });
  expect(app.state.profile).toEqual(saved);
});
test('registration creates an account and establishes a connected session', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ token: 'registration-token' }),
  } as Response);
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      ...initialState(),
      profile: { ...initialState().profile, fullName: 'Ana Torres' },
    }),
  } as Response);
  await act(async () => {
    await app.register({
      fullName: 'Ana Torres',
      phone: '912345678',
      dni: '12345678',
      email: 'ana@example.test',
      password: 'ClaveAcademica123',
    });
  });
  expect(app.mode).toBe('connected');
  expect(app.state.profile.fullName).toBe('Ana Torres');
  expect(fetchMock.mock.calls[0][0]).toContain('/register');
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
    phone: '912345678',
    password: 'ClaveAcademica123',
  });
  fetchMock.mockRestore();
});
