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
  await act(async () => { await app.login('912345678', 'ClaveSegura#123'); });
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

test('assistant tab displays its content and navigates to another tab', async () => {
  let tree!: Renderer.ReactTestRenderer;
  const navigate = jest.fn();
  await act(async () => { tree = Renderer.create(<AppProvider><Assistant onNavigate={navigate} /></AppProvider>); });
  expect(JSON.stringify(tree.toJSON())).toContain('Inicia una sesión conectada');
  const routesButton = tree.root.findByProps({ accessibilityLabel: 'Ir a Rutas' });
  await act(async () => { routesButton.props.onPress(); });
  expect(navigate).toHaveBeenCalledWith('Routes');
  await act(async () => { tree.unmount(); });
});

test('a suggested question puts the response ahead of the other controls', async () => {
  let tree!: Renderer.ReactTestRenderer;
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const suggestion = '¿Cómo puedo planificar una ruta?';
  const answer = 'Abre Rutas, elige el origen y destino y toca Buscar ruta.';
  try {
    await act(async () => {
      tree = Renderer.create(<AppProvider><Capture /><Assistant onNavigate={jest.fn()} /></AppProvider>);
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ token: 'test-token' }) } as Response);
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: {} }) } as Response);
    await act(async () => { await app.login('912345678', 'ClaveSegura#123'); });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reply: answer }) } as Response);

    await act(async () => {
      tree.root.findAllByProps({ accessibilityLabel: suggestion }).find(node => node.props.onPress)?.props.onPress();
    });

    const rendered = JSON.stringify(tree.toJSON());
    const responseIndex = rendered.indexOf(answer);
    expect(responseIndex).toBeGreaterThan(-1);
    expect(responseIndex).toBeLessThan(rendered.indexOf('Ver preguntas sugeridas'));
    expect(responseIndex).toBeLessThan(rendered.indexOf('Pregunta para el asistente'));
  } finally {
    if (tree) { await act(async () => { tree.unmount(); }); }
    fetchMock.mockRestore();
  }
});
