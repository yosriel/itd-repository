import { useEffect, useRef, useState } from 'react';
import { useApp } from './AppProvider';

export function useAssistant() {
  const { mode, askAssistant } = useApp();
  const [message, setMessage] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function send(suggestedQuestion?: string) {
    if (pending.current) { return; }
    const question = (suggestedQuestion ?? message).trim();
    if (!question) {
      setError('Escribe una pregunta antes de enviar.');
      return;
    }
    pending.current = true;
    setSubmittedQuestion(question);
    setLoading(true);
    setError('');
    setReply('');
    try {
      const answer = await askAssistant(question);
      if (mounted.current) {
        setReply(answer);
        if (suggestedQuestion === undefined) { setMessage(''); }
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'No se pudo consultar al asistente.');
      }
    } finally {
      pending.current = false;
      if (mounted.current) { setLoading(false); }
    }
  }
  return { mode, message, setMessage, submittedQuestion, reply, error, loading, send };
}
