export default {
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.(t|j)sx?$': [
            '@swc/jest',
            {
                jsc: {
                    parser: {
                        syntax: 'typescript',
                    },
                },
            },
        ],
    },
    moduleNameMapper: {
        '^(\\.\\.?/.*)\\.js$': '$1',
    },
    testMatch: ['**/tests/**/*.test.ts'],
};
