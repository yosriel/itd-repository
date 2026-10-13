import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from './icons';
import { SvgXml } from 'react-native-svg';
import { logoXml } from '../assets/images/logo';

export const colors = {
  navy: '#0B3552',
  steel: '#00897E',
  amber: '#F5A623',
  green: '#1FA971',
  critical: '#D6483C',
  muted: '#5B6B7A',
  line: '#E4E9EE',
};
export const assets = {
  splash: require('../assets/images/splash.jpg'),
  wordmark: require('../assets/images/wordmark.png'),
  bus: require('../assets/images/bus.jpg'),
  secondBus: require('../assets/images/second-bus.jpg'),
};
export function Logo({
  size = 72,
  wordmark = false,
}: {
  size?: number;
  wordmark?: boolean;
}) {
  const dimensions = {
    width: wordmark ? 180 : size,
    height: wordmark ? 64 : size,
  };
  return (
    <View
      className="items-center justify-center rounded-3xl bg-white"
      style={dimensions}
    >
      {wordmark ? (
        <Image source={assets.wordmark} resizeMode="contain" style={dimensions} accessibilityLabel="Logotipo del HTML de referencia" />
      ) : (
        <SvgXml
          xml={logoXml}
          width={size * 0.7}
          height={size * 0.7}
        />
      )}
    </View>
  );
}
export function Photo({ uri, height = 72 }: { uri: ImageSourcePropType; height?: number }) {
  return (
    <Image
      source={uri}
      resizeMode="cover"
      className="w-full"
      style={{ height }}
      accessibilityLabel="Fotografía del prototipo de referencia"
    />
  );
}
export function Page({
  children,
  title,
  subtitle,
  back,
  action,
  header,
}: React.PropsWithChildren<{
  title?: string;
  subtitle?: string;
  back?: () => void;
  action?: React.ReactNode;
  header?: React.ReactNode;
}>) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      {header && <View className="border-b border-line bg-white px-5 py-4">{header}</View>}
      {title && (
        <View className="flex-row items-center gap-3 border-b border-line bg-white px-5 py-4">
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={12}
              onPress={back}
            >
              <ChevronLeft color={colors.navy} />
            </Pressable>
          )}
          <View className="flex-1">
            <Text className="font-title text-[21px] text-navy">{title}</Text>
            {subtitle && (
              <Text className="mt-1 font-sans text-[12px] text-muted">
                {subtitle}
              </Text>
            )}
          </View>
          {action}
        </View>
      )}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pt-4 pb-8 gap-4"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Card({ children }: React.PropsWithChildren) {
  return (
    <View className="rounded-[18px] border border-line bg-white p-4">
      {children}
    </View>
  );
}
export function Heading({ children }: React.PropsWithChildren) {
  return (
      <Text className="font-sans text-[13.5px] font-semibold text-navy">
      {children}
    </Text>
  );
}
export function Sub({ children }: React.PropsWithChildren) {
  return (
    <Text className="font-sans text-[12px] leading-5 text-muted">
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'amber' | 'ghost' | 'red';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-navy',
    amber: 'bg-amber',
    ghost: 'border border-line bg-transparent',
    red: 'bg-[#B63830]',
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[48px] items-center justify-center rounded-[14px] px-4 py-4 ${
        styles[variant]
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <Text
        className={`font-sans text-[14px] font-bold ${
          variant === 'ghost'
            ? 'text-muted'
            : variant === 'amber'
            ? 'text-[#3A2600]'
            : 'text-white'
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  numeric = false,
  email = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  email?: boolean;
  maxLength?: number;
}) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-[12px] font-bold text-muted">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={
          numeric ? 'number-pad' : email ? 'email-address' : 'default'
        }
        autoCapitalize={email ? 'none' : 'words'}
        autoCorrect={!numeric && !email}
        maxLength={maxLength}
        className="rounded-xl border border-line bg-white px-4 py-3 font-sans text-[14px] text-ink"
      />
    </View>
  );
}
export function Pill({
  label,
  status = 'green',
}: {
  label: string;
  status?: string;
}) {
  const style =
    status === 'red'
      ? 'bg-[#FBE7E5] text-critical'
      : status === 'amber'
      ? 'bg-[#FDF1DC] text-[#8A5A0B]'
      : 'bg-[#E4F7EE] text-[#168254]';
  return (
    <Text
      className={`self-start rounded-full px-3 py-1 font-sans text-[11px] font-bold ${style}`}
    >
      {label}
    </Text>
  );
}
