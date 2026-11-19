import React, { useEffect, useRef, useState } from 'react';
import { useAssistant } from '../src/useAssistant';
import { assistantQuestions, assistantSections } from '../src/assistantOptions';
import type { TabParams } from '../src/navigationTypes';

export function Assistant({ onNavigate }: { onNavigate: (tab: keyof TabParams) => void }) {
  const { mode, message, setMessage, reply, error, loading, send } = useAssistant();
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === 'connected') { input.current?.focus(); }
      else { close.current?.focus(); }
    }
  }, [open, mode]);

  function closePanel() {
    setOpen(false);
    launcher.current?.focus();
  }

  return (
    <div className="assistant-float" onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.stopPropagation(); closePanel(); }
    }}>
      {open && <section className="card assistant" id="assistant-panel" aria-labelledby="assistant-title">
      <div className="assistant-header">
        <h2 id="assistant-title">Asistente IA</h2>
        <button ref={close} type="button" className="assistant-close" aria-label="Cerrar asistente" onClick={closePanel}>×</button>
      </div>
      <p className="assistant-notice">Tu consulta y datos demo se envían a Google. No compartas datos personales.</p>
      <div className="assistant-options" aria-label="Ir a un apartado">
        <strong>Ir a un apartado</strong>
        <div className="assistant-section-buttons">
          {assistantSections.map(section => (
            <button type="button" key={section.tab} onClick={() => {
              closePanel();
              onNavigate(section.tab);
            }}>Ir a {section.label}</button>
          ))}
        </div>
      </div>
      {mode !== 'connected' ? (
        <p>Inicia una sesión conectada para usar el asistente.</p>
      ) : (
        <>
          <div className="assistant-options" aria-label="Preguntas sugeridas">
            <strong>Preguntas sugeridas</strong>
            {assistantQuestions.map(question => (
              <button type="button" key={question} disabled={loading}
                onClick={() => send(question)}>{question}</button>
            ))}
          </div>
          <form onSubmit={event => { event.preventDefault(); send(); }}>
            <label htmlFor="assistant-message">Pregunta para el asistente</label>
            <textarea ref={input} id="assistant-message" aria-label="Pregunta para el asistente"
              value={message} onChange={event => setMessage(event.target.value)}
              maxLength={1000} rows={3} />
            <button type="submit" aria-disabled={loading}>
              {loading ? 'Consultando…' : 'Enviar pregunta'}
            </button>
          </form>
          <div className="assistant-result" aria-live="polite" aria-atomic="true">
            {loading && <p>Consultando al asistente…</p>}
            {error && <p className="assistant-error">{error}</p>}
            {reply && <p>Asistente: {reply}</p>}
          </div>
        </>
      )}
      </section>}
      <button ref={launcher} type="button" className="assistant-launcher"
        aria-label={open ? 'Cerrar asistente de IA' : 'Abrir asistente de IA'}
        aria-expanded={open} aria-controls={open ? 'assistant-panel' : undefined}
        onClick={() => open ? closePanel() : setOpen(true)}>
        {open ? '×' : 'IA'}
      </button>
    </div>
  );
}
