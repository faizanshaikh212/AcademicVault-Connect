export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'utils/**/*.js',
        'middleware/**/*.js',
        '!**/__tests__/**',
        '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};