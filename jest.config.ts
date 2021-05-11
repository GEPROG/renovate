import type { InitialOptionsTsJest } from 'ts-jest/dist/types';

const ci = !!process.env.CI;

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  cacheDirectory: '.cache/jest',
  coverageDirectory: './coverage',
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    '!lib/**/*.{d,spec}.ts',
    '!lib/**/{__fixtures__,__mocks__,__testutil__}/**/*.{js,ts}',
    '!lib/config-validator.ts',
    '!lib/types/**/*.ts',
    '!lib/**/types.ts',
  ],
  coverageReporters: ci
    ? ['html', 'json', 'text-summary']
    : ['html', 'text-summary'],
  coverageThreshold: {
    global: {
      branches: 94.0,
      functions: 99.7,
      lines: 96.7,
      statements: 96.7,
    },
  },
  reporters: ['default', './tmp/tools/jest-gh-reporter.js'],
  setupFilesAfterEnv: ['<rootDir>/test/globals.ts'],
  snapshotSerializers: ['<rootDir>/test/newline-snapshot-serializer.ts'],
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  globals: {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
    },
  },
};

export default config;
