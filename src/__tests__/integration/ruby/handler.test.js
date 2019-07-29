'use strict';

const { resolve } = require('path');
const { URL } = require('url');
const fetch = require('node-fetch');
const Serverless = require('serverless');
const ServerlessOffline = require('../../../../src/ServerlessOffline.js');

jest.setTimeout(10000);

describe.skip('ruby tests', () => {
  let serverlessOffline;

  // init
  beforeAll(async () => {
    const serverless = new Serverless();
    serverless.config.servicePath = resolve(__dirname);
    await serverless.init();
    serverlessOffline = new ServerlessOffline(serverless, {});

    return serverlessOffline.start();
  });

  // cleanup
  afterAll(async () => {
    return serverlessOffline.end();
  });

  const url = new URL('http://localhost:3000');

  [
    {
      description: 'should work with ruby',
      expected: {
        message: 'Hello Python!',
      },
      path: 'hello',
    },
  ].forEach(({ description, expected, path }) => {
    test(description, async () => {
      url.pathname = path;
      const response = await fetch(url);
      const json = await response.json();
      expect(json).toEqual(expected);
    });
  });
});
