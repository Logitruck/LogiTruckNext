module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  // Without a trailing slash in the lookahead, prefix matching works:
  // 'expo' matches expo/, expo-modules-core/, expo-notifications/, etc.
  // 'react-native' matches react-native/, react-native-maps/, react-native-reanimated/, etc.
  transformIgnorePatterns: [
    '/node_modules/(?!(' + [
      '.pnpm',
      'react-native',
      '@react-native',
      '@react-native-community',
      '@react-native-firebase',
      '@react-native-async-storage',
      'expo',
      '@expo',
      '@expo-google-fonts',
      '@unimodules',
      'unimodules',
      '@gorhom',
      'react-navigation',
      '@react-navigation',
      '@sentry/react-native',
      'native-base',
      'uuid',
    ].join('|') + '))',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
}
