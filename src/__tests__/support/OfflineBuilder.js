'use strict';

const functionHelper = require('../../functionHelper.js');
const ServerlessOffline = require('../../ServerlessOffline.js');
const ServerlessBuilder = require('./ServerlessBuilder.js');

function createHandler(handlers) {
  return (funOptions) => {
    const { handlerName, handlerPath } = funOptions;
    const [, path] = handlerPath.split('/');

    return handlers[path][handlerName];
  };
}

module.exports = class OfflineBuilder {
  constructor(serverlessBuilder, options) {
    this.serverlessBuilder = serverlessBuilder || new ServerlessBuilder();
    this.handlers = {};

    // Avoid already wrapped exception when offline is instanciated many times
    // Problem if test are instanciated serveral times
    // FIXME, we could refactor index to have an handlerFactory and just instanciate offline with a factory test stub
    // if (functionHelper.createHandler.restore) {
    //   functionHelper.createHandler.restore();
    // }
    this.options = options || {};
  }

  addFunctionConfig(functionName, functionConfig, handler) {
    this.serverlessBuilder.addFunction(functionName, functionConfig);
    const funOptions = functionHelper.getFunctionOptions(
      functionConfig,
      functionName,
      '.',
    );
    const [, handlerPath] = funOptions.handlerPath.split('/');
    this.handlers[handlerPath] = this.constructor.getFunctionIndex(
      funOptions.handlerName,
      handler,
    );

    return this;
  }

  addFunctionHTTP(functionName, http, handler) {
    return this.addFunctionConfig(
      functionName,
      {
        events: [
          {
            http,
          },
        ],
        handler: `handler.${functionName}`,
      },
      handler,
    );
  }

  addCustom(prop, value) {
    this.serverlessBuilder.addCustom(prop, value);

    return this;
  }

  addApiKeys(keys) {
    this.serverlessBuilder.addApiKeys(keys);

    return this;
  }

  static getFunctionIndex(handlerName, handler) {
    const functionIndex = {};
    functionIndex[handlerName] = handler;

    return functionIndex;
  }

  async toObject() {
    const serverlessOffline = new ServerlessOffline(
      this.serverlessBuilder.toObject(),
      this.options,
    );

    functionHelper.createHandler = jest.fn(createHandler(this.handlers));

    // offline.printBlankLine = jest.fn();

    serverlessOffline.mergeOptions();
    await serverlessOffline._buildApiGateway();
    await serverlessOffline.registerPlugins;
    serverlessOffline.setupEvents();

    // offline.apiGateway.printBlankLine = jest.fn();

    // this.server.restore = this.restore;

    return serverlessOffline.apiGateway.server;
  }

  // static restore() {
  //   functionHelper.createHandler.restore();
  // }
};
