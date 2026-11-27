import { useFonts } from 'expo-font';
import './global.css';
import React from 'react';
import { StatusBar, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationOptions, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Bell, CreditCard, House, MessageCircle, Route } from './src/icons';
import { AppProvider, useApp } from './src/AppProvider';
import {
  AccountStackParams,
  RoutesStackParams,
  TabParams,
} from './src/navigationTypes';
import { Auth } from './src/screens/Auth';
import { Home, Alerts } from './src/screens/HomeAlerts';
import { PredictionPlanner, Detail } from './src/screens/Routes';
import { RegularPlanner } from './src/screens/RegularPlanner';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Account, Profile, Settings } from './src/screens/Account';
import { colors } from './src/ui';
import { Assistant } from './src/Assistant';
import { LocationProvider } from './src/DeviceLocation';

const Tabs = createBottomTabNavigator<TabParams>();
const RouteStack = createNativeStackNavigator<RoutesStackParams>();
const AccountStack = createNativeStackNavigator<AccountStackParams>();
function AssistantScreen({ navigation }: BottomTabScreenProps<TabParams, 'AssistantTab'>) {
  return <Assistant onNavigate={tab => navigation.navigate(tab)} />;
}
const noHeader = { headerShown: false };
function Planner({ navigation }: NativeStackScreenProps<RoutesStackParams, 'Planner'>) {
  return <RegularPlanner onSimulation={() => navigation.navigate('Prediction')} />;
}

function Routes() {
  return (
    <RouteStack.Navigator screenOptions={noHeader}>
      <RouteStack.Screen name="Planner" component={Planner} />
      <RouteStack.Screen name="Prediction" component={PredictionPlanner} />
      <RouteStack.Screen name="Detail" component={Detail} />
    </RouteStack.Navigator>
  );
}
function Accounts() {
  return (
    <AccountStack.Navigator screenOptions={noHeader}>
      <AccountStack.Screen name="Account" component={Account} />
      <AccountStack.Screen name="Profile" component={Profile} />
      <AccountStack.Screen name="Settings" component={Settings} />
    </AccountStack.Navigator>
  );
}
function TabIcon({
  name,
  color,
  size,
}: {
  name: keyof TabParams;
  color: string;
  size: number;
}) {
  const Icon = {
    Home: House,
    Routes: Route,
    Alerts: Bell,
    AccountTab: CreditCard,
    AssistantTab: MessageCircle,
  }[name];
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}
function Content() {
  const { mode, state, toast } = useApp();
  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" />
      {mode ? (
        <LocationProvider><NavigationContainer>
          <Tabs.Navigator screenOptions={tabOptions}>
            <Tabs.Screen
              name="Home"
              component={Home}
              options={{ title: 'Inicio' }}
            />
            <Tabs.Screen
              name="Routes"
              component={Routes}
              options={{ title: 'Rutas' }}
            />
            <Tabs.Screen
              name="Alerts"
              component={Alerts}
              options={{
                title: 'Alertas',
                tabBarBadge: state.alertsRead ? undefined : 2,
              }}
            />
            <Tabs.Screen name="AssistantTab" component={AssistantScreen} options={{ title: 'IA', tabBarHideOnKeyboard: true }} />
            <Tabs.Screen
              name="AccountTab"
              component={Accounts}
              options={{ title: 'Cuenta' }}
            />
          </Tabs.Navigator>
        </NavigationContainer></LocationProvider>
      ) : (
        <Auth />
      )}
      {toast !== '' && (
        <View
          pointerEvents="none"
          className="absolute bottom-24 left-4 right-4 rounded-[14px] bg-navy p-4"
        >
          <Text
            accessibilityRole="alert"
            className="font-sans text-[13px] text-white"
          >
            {toast}
          </Text>
        </View>
      )}
    </View>
  );
}
function tabOptions({
  route,
}: {
  route: { name: keyof TabParams };
}): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.steel,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontFamily: 'Manrope', fontSize: 11 },
    tabBarIcon: props => <TabIcon name={route.name} {...props} />,
  };
}
export default function App() {
  const [loaded, error] = useFonts({
    Manrope: require('./assets/fonts/Manrope.ttf'),
    Fraunces: require('./assets/fonts/Fraunces.ttf'),
  });
  if (!loaded && !error) { return null; }
  return (
    <SafeAreaProvider>
      <AppProvider>
        <View className="flex-1 items-center bg-navy">
          <View className="flex-1 w-full max-w-[480px]">
            <Content />
          </View>
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
