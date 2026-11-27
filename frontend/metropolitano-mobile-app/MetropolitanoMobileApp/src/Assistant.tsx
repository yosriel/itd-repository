import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Card, Page } from './ui';
import { useAssistant } from './useAssistant';
import { assistantQuestions, assistantSections } from './assistantOptions';
import type { TabParams } from './navigationTypes';

export function Assistant({ onNavigate }: { onNavigate: (tab: keyof TabParams) => void }) {
  const { mode, message, setMessage, submittedQuestion, reply, error, loading, send } = useAssistant();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (loading || reply || error) {
      scroll.current?.scrollTo({ y: 0, animated: false });
    }
    if (Platform.OS === 'ios' && (reply || error)) {
      AccessibilityInfo.announceForAccessibility(reply ? `Respuesta del asistente: ${reply}` : error);
    }
  }, [loading, reply, error, submittedQuestion]);

  function submit(suggestion?: string) {
    Keyboard.dismiss();
    setShowSuggestions(false);
    send(suggestion);
  }

  const composer = mode === 'connected' && (
    <View className="gap-2 border-t border-line bg-white px-5 py-3">
      <TextInput
        accessibilityLabel="Pregunta para el asistente"
        placeholder="Escribe tu pregunta"
        placeholderTextColor="#5B6B7A"
        value={message}
        onChangeText={setMessage}
        maxLength={1000}
        multiline
        className="min-h-[44px] max-h-[100px] rounded-xl border border-line bg-white px-3 py-2 font-sans text-[15px] text-ink"
      />
      <Button
        title={loading ? 'Consultando…' : 'Enviar pregunta'}
        disabled={loading}
        onPress={() => submit()}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView className="flex-1" behavior="padding">
      <Page title="Asistente IA" scrollRef={scroll} footer={composer}>
        {(submittedQuestion !== '' || error !== '') && (
          <View className="gap-3">
            {submittedQuestion !== '' && (
              <View className="self-end rounded-2xl bg-[#DCEFEB] px-4 py-3">
                <Text numberOfLines={3} className="font-sans text-[14px] text-navy">
                  {submittedQuestion}
                </Text>
              </View>
            )}
            <View accessibilityLiveRegion="polite">
              <Card>
                {reply !== '' && (
                  <View className="gap-2">
                    <Text accessibilityRole="header" className="font-sans text-[15px] font-bold text-navy">
                      Respuesta del asistente
                    </Text>
                    <Text selectable className="font-sans text-[16px] leading-[26px] text-ink">{reply}</Text>
                  </View>
                )}
                {loading && <Text className="font-sans text-[15px] text-navy">Buscando una respuesta…</Text>}
                {error !== '' && (
                  <Text accessibilityRole="alert" className="font-sans text-[15px] text-[#9F211B]">{error}</Text>
                )}
              </Card>
            </View>
          </View>
        )}
        {mode === 'connected' ? (
          <View className="gap-2">
            {submittedQuestion === '' || showSuggestions ? (
              <>
                <Text className="font-sans font-bold text-navy">Preguntas sugeridas</Text>
                {assistantQuestions.map(question => (
                  <Pressable key={question} accessibilityRole="button" accessibilityLabel={question}
                    accessibilityState={{ disabled: loading }} disabled={loading}
                    onPress={() => submit(question)}
                    className="min-h-[44px] justify-center rounded-xl border border-line bg-white px-3 py-2">
                    <Text className="font-sans text-navy">{question}</Text>
                  </Pressable>
                ))}
              </>
            ) : (
              <Button title="Ver preguntas sugeridas" variant="ghost" disabled={loading} onPress={() => setShowSuggestions(true)} />
            )}
          </View>
        ) : (
          <Text className="font-sans text-[13px] text-navy">
            Inicia una sesión conectada para usar el asistente.
          </Text>
        )}
        <View className="flex-row flex-wrap gap-2">
          {assistantSections.map(section => (
            <Pressable key={section.tab} accessibilityRole="button" accessibilityLabel={`Ir a ${section.label}`}
              onPress={() => onNavigate(section.tab)}
              className="min-h-[44px] justify-center rounded-xl border border-line bg-white px-3">
              <Text className="font-sans text-navy">Ir a {section.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="font-sans text-[12px] leading-5 text-muted">
          Tu consulta y datos de la app se envían a Google. Evita compartir datos personales.
        </Text>
      </Page>
    </KeyboardAvoidingView>
  );
}
