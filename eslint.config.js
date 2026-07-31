const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  rules: {
    'no-console': 'off',
    'no-restricted-syntax': 'off',
    'test/no-import-node-test': 'off',
  },
})
