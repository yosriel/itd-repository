module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transform: { '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest' },
  moduleNameMapper: { '\\.(css)$': '<rootDir>/test-style-mock.js' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-svg|lucide-react-native)/)',
  ],
};
