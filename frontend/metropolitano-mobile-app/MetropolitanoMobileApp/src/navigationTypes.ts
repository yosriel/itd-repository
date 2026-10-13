export type RoutesStackParams = {
  Planner: undefined;
  Detail: { routeKey?: import('./domain').RouteKey; plan?: import('./demoTransit').DemoPlan };
};
export type AccountStackParams = {
  Account: undefined;
  Profile: undefined;
  Settings: { section: 'payments' | 'security' | 'privacy' | 'help' };
};
export type TabParams = {
  Home: undefined;
  Routes: undefined;
  Alerts: undefined;
  AccountTab: undefined;
};
