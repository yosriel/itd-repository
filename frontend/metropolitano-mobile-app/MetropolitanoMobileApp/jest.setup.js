jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-linear-gradient', () => require('react-native').View);
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy(
    { __esModule: true, default: View, SvgUri: View },
    {
      get: (target, key) =>
        target[key] ??
        React.forwardRef((props, ref) =>
          React.createElement(View, { ...props, ref }),
        ),
    },
  );
});
/* global jest */
