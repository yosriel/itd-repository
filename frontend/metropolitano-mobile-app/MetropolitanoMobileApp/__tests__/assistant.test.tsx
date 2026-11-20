import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppProvider, useApp } from '../src/AppProvider';
import { useAssistant } from '../src/useAssistant';
import { Assistant } from '../src/Assistant';

jest.setTimeout(15000);

let app: ReturnType<typeof useApp>;
let assistant: ReturnType<typeof useAssistant>;
function Capture() {
  app = useApp();
  assistant = useAssistant();
  return null;
}

test('assistant validates messages, requires a connected session and shows replies', async () => {
  let tree!: Renderer.ReactTestRenderer;
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  await act(async () => { tree = Renderer.create(<AppProvider><Capture /></AppProvider>); });
  await act(async () => { await assistant.send(); });
  expect(assistant.error).toContain('Escribe una pregunta');
  await act(async () => { assistant.setMessage('Hola'); });
  await act(async () => { await assistant.send(); });
  expect(assistant.error).toContain('sesión conectada');
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ token: 'test-token' }) } as Response);
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: {}, alertsRead: false }) } as Response);
  await act(async () => { await app.loginPresentation(); });
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reply: 'Datos simulados' }) } as Response);
  await act(async () => { await assistant.send(); });
  expect(assistant.reply).toBe('Datos simulados');
  expect(assistant.message).toBe('');
  expect(fetchMock.mock.calls[2][0]).toContain('/assistant');
  expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({ Authorization: 'Bearer test-token' });
  await act(async () => { assistant.setMessage('Borrador personal'); });
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reply: 'Rutas demo' }) } as Response);
  await act(async () => { await assistant.send('¿Qué rutas hay?'); });
  expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body))).toEqual({ message: '¿Qué rutas hay?' });
  expect(assistant.reply).toBe('Rutas demo');
  expect(assistant.message).toBe('Borrador personal');
  await act(async () => { assistant.setMessage('Otra pregunta'); });
  fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ detail: 'El asistente no está configurado' }) } as Response);
  await act(async () => { await assistant.send(); });
  expect(assistant.error).toContain('no está configurado');
  expect(assistant.message).toBe('Otra pregunta');
  expect(assistant.loading).toBe(false);
  await act(async () => { tree.unmount(); });
  fetchMock.mockRestore();
});

test('floating assistant opens and closes without requiring a connection', async () => {
  let tree!: Renderer.ReactTestRenderer;
  const navigate = jest.fn();
  await act(async () => { tree = Renderer.create(<AppProvider><Assistant onNavigate={navigate} /></AppProvider>); });
  expect(JSON.stringify(tree.toJSON())).not.toContain('Inicia una sesión conectada');
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: 'Abrir asistente de IA' }).props.onPress();
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Inicia una sesión conectada');
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: 'Cerrar asistente' }).props.onPress();
  });
  expect(JSON.stringify(tree.toJSON())).not.toContain('Inicia una sesión conectada');
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: 'Abrir asistente de IA' }).props.onPress();
  });
  const routesButton = tree.root.findByProps({ accessibilityLabel: 'Ir a Rutas' });
  await act(async () => { routesButton.props.onPress(); });
  expect(navigate).toHaveBeenCalledWith('Routes');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Inicia una sesión conectada');
  await act(async () => { tree.unmount(); });
});
