module.exports = {
    env: {
        node: true,
        es2020: true,
    },
    extends: 'eslint:recommended',
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'semi': ['error', 'always'],
        'semi-style': ['error', 'last'],

        'indent': ['error', 4, {
            'SwitchCase': 1,
        }],

        'comma-dangle': ['error', {
            'arrays': 'always-multiline',
            'objects': 'always-multiline',
        }],

        'quotes': ['error', 'single'],
    },
};
