'use strict';

const { env, platform } = process;

module.exports = {
  extends: ['eslint:recommended', 'dherault', 'eslint-config-prettier'],

  plugins: ['prettier'],

  env: {
    es6: true,
    jest: true,
    node: true,
  },

  rules: {
    'no-restricted-syntax': 'off',
    strict: 'off',
    // workaround for git + eslint line ending issue on Travis for Windows OS:
    // https://travis-ci.community/t/files-in-checkout-have-eol-changed-from-lf-to-crlf/349/2
    ...(env.TRAVIS &&
      platform === 'win32' && {
        ['linebreak-style']: 'off',
      }),
  },
};
