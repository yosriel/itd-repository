import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Button, Card, Heading } from './ui';
import { useAssistant } from './useAssistant';
import { assistantQuestions, assistantSections } from './assistantOptions';
import type { TabParams } from './navigationTypes';

export function Assistant({ onNavigate }: { onNavigate: (tab: keyof TabParams) => void }) {
  const { mode, message, setMessage, reply, error, loading, send } = useAssistant();
  const [open, setOpen] = useState(false);
  const { height } = useWindowDimensions();
  useEffect(() => {
    if (Platform.OS === 'ios' && (reply || error)) {
      AccessibilityInfo.announceForAccessibility(reply ? `Asistente: ${reply}` : error);
    }
  }, [reply, error]);
  return (
    <View className="absolute bottom-20 left-4 right-4 items-end" pointerEvents="box-none">
      {open && <View className="mb-3 w-full max-w-[360px]">
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: height * 0.55 }}>
      <Card>
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Heading>Asistente IA</Heading>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar asistente"
            onPress={() => setOpen(false)} className="h-11 w-11 items-center justify-center">
            <Text className="text-[26px] text-navy">×</Text>
          </Pressable>
        </View>
        <Text className="font-sans text-[12px] leading-5 text-ink">
          Tu consulta y datos demo se envían a Google. No compartas datos personales.
        </Text>
        <Text className="font-sans font-bold text-navy">Ir a un apartado</Text>
        <View className="flex-row flex-wrap gap-2">
          {assistantSections.map(section => (
            <Pressable key={section.tab} accessibilityRole="button" accessibilityLabel={`Ir a ${section.label}`}
              onPress={() => { setOpen(false); onNavigate(section.tab); }}
              className="min-h-[44px] justify-center rounded-xl border border-line px-3">
              <Text className="font-sans text-navy">Ir a {section.label}</Text>
            </Pressable>
          ))}
        </View>
        {mode !== 'connected' ? (
          <Text className="font-sans text-[13px] text-navy">
            Inicia una sesión conectada para usar el asistente.
          </Text>
        ) : (
          <>
            <Text className="font-sans font-bold text-navy">Preguntas sugeridas</Text>
            {assistantQuestions.map(question => (
              <Pressable key={question} accessibilityRole="button"
                accessibilityState={{ disabled: loading }} disabled={loading}
                onPress={() => send(question)}
                className="min-h-[44px] justify-center rounded-xl border border-line px-3 py-2">
                <Text className="font-sans text-navy">{question}</Text>
              </Pressable>
            ))}
            <TextInput
              accessibilityLabel="Pregunta para el asistente"
              placeholder="Escribe tu pregunta"
              placeholderTextColor="#5B6B7A"
              value={message}
              onChangeText={setMessage}
              maxLength={1000}
              multiline
              className="min-h-[64px] rounded-xl border border-line bg-white px-4 py-3 font-sans text-[14px] text-ink"
            />
            <Button title={loading ? 'Consultando…' : 'Enviar pregunta'} disabled={loading} onPress={() => send()} />
            <View accessibilityLiveRegion="polite">
              {loading ? <Text className="font-sans text-[13px] text-navy">Consultando al asistente…</Text> : null}
              {error ? <Text accessibilityRole="alert" className="font-sans text-[13px] text-[#9F211B]">{error}</Text> : null}
              {reply ? <Text className="font-sans text-[14px] leading-6 text-ink">Asistente: {reply}</Text> : null}
            </View>
          </>
        )}
      </View>
      </Card>
      </ScrollView>
      </View>}
      <Pressable accessibilityRole="button"
        accessibilityLabel={open ? 'Cerrar asistente de IA' : 'Abrir asistente de IA'}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(current => !current)}
        className="h-[58px] w-[58px] items-center justify-center rounded-full bg-navy">
        <Text className="font-sans text-[18px] font-bold text-white">{open ? '×' : 'IA'}</Text>
      </Pressable>
    </View>
  );
}
