import { Server as HapiServer } from '@hapi/hapi'
import { Server as WebSocketServer } from 'ws'
import debugLog from './debugLog.js'
import LambdaFunctionPool from './LambdaFunctionPool.js'
import serverlessLog from './serverlessLog.js'
import { createUniqueId } from './utils/index.js'
import WebSocketConnectEvent from './WebSocketConnectEvent.js'
import WebSocketDisconnectEvent from './WebSocketDisconnectEvent.js'
import WebSocketEvent from './WebSocketEvent.js'

const { stringify } = JSON

export default class ApiGatewayWebSocket {
  constructor(service, options, config) {
    this._config = config
    this._lambdaFunctionPool = new LambdaFunctionPool()
    this._options = options
    this._provider = service.provider
    this._server = null
    this._webSocketClients = new Map()
    this._webSocketRoutes = new Map()
    this._websocketsApiRouteSelectionExpression =
      this._provider.websocketsApiRouteSelectionExpression ||
      '$request.body.action'
    this._webSocketServer = null

    this._init()
  }

  _printBlankLine() {
    if (process.env.NODE_ENV !== 'test') {
      console.log()
    }
  }

  _init() {
    const { host, websocketPort } = this._options

    const serverOptions = {
      host,
      port: websocketPort,
      router: {
        // allows for paths with trailing slashes to be the same as without
        // e.g. : /my-path is the same as /my-path/
        stripTrailingSlash: true,
      },
    }

    // // HTTPS support
    // if (typeof httpsProtocol === 'string' && httpsProtocol.length > 0) {
    //   serverOptions.tls = {
    //     cert: readFileSync(resolve(httpsProtocol, 'cert.pem'), 'ascii'),
    //     key: readFileSync(resolve(httpsProtocol, 'key.pem'), 'ascii'),
    //   }
    // }

    // Hapijs server
    this._server = new HapiServer(serverOptions)

    // share server
    this._webSocketServer = new WebSocketServer({
      server: this._server.listener,
    })
  }

  async _processEvent(websocketClient, connectionId, route, event) {
    let routeOptions = this._webSocketRoutes.get(route)

    if (!routeOptions && route !== '$connect' && route !== '$disconnect') {
      routeOptions = this._webSocketRoutes.get('$default')
    }

    if (!routeOptions) {
      return
    }

    const sendError = (err) => {
      if (websocketClient.readyState === /* OPEN */ 1) {
        websocketClient.send(
          stringify({
            connectionId,
            message: 'Internal server error',
            requestId: '1234567890',
          }),
        )
      }

      // mimic AWS behaviour (close connection) when the $connect route handler throws
      if (route === '$connect') {
        websocketClient.close()
      }

      debugLog(`Error in route handler '${routeOptions}'`, err)
    }

    const { functionName, functionObj } = routeOptions

    const lambdaFunction = this._lambdaFunctionPool.get(
      functionName,
      functionObj,
      this._provider,
      this._config,
      this._options,
    )

    const requestId = createUniqueId()

    lambdaFunction.setEvent(event)
    lambdaFunction.setRequestId(requestId)

    // let result

    try {
      /* result = */ await lambdaFunction.runHandler()

      const {
        billedExecutionTimeInMillis,
        executionTimeInMillis,
      } = lambdaFunction

      serverlessLog(
        `(λ: ${functionName}) RequestId: ${requestId}  Duration: ${executionTimeInMillis.toFixed(
          2,
        )} ms  Billed Duration: ${billedExecutionTimeInMillis} ms`,
      )

      // TODO what to do with "result"?
    } catch (err) {
      sendError(err)
    }
  }

  async createServer() {
    this._webSocketServer.on('connection', (webSocketClient /* request */) => {
      console.log('received connection')

      const connectionId = createUniqueId()

      debugLog(`connect:${connectionId}`)

      this._addWebSocketClient(webSocketClient, connectionId)

      const connectEvent = new WebSocketConnectEvent(
        connectionId,
        this._options,
      )

      this._processEvent(
        webSocketClient,
        connectionId,
        '$connect',
        connectEvent,
      )

      webSocketClient.on('close', () => {
        debugLog(`disconnect:${connectionId}`)

        this._removeWebSocketClient(webSocketClient)

        const disconnectEvent = new WebSocketDisconnectEvent(connectionId)

        this._processEvent(
          webSocketClient,
          connectionId,
          '$disconnect',
          disconnectEvent,
        )
      })

      webSocketClient.on('message', (message) => {
        // if (!request.payload || initially) {
        //   return h.response().code(204)
        // }

        debugLog(`message:${message}`)

        let route = null

        if (
          this._websocketsApiRouteSelectionExpression.startsWith(
            '$request.body.',
          )
        ) {
          // route = request.payload
          route = message // TODO

          if (typeof route === 'object') {
            this._websocketsApiRouteSelectionExpression
              .replace('$request.body.', '')
              .split('.')
              .forEach((key) => {
                if (route) {
                  route = route[key]
                }
              })
          } else {
            route = null
          }
        }

        if (typeof route !== 'string') {
          route = null
        }

        route = route || '$default'

        debugLog(`route:${route} on connection=${connectionId}`)

        const event = new WebSocketEvent(connectionId, route, message)

        this._processEvent(webSocketClient, connectionId, route, event)

        // return h.response().code(204)
      })
    })

    this._server.route({
      handler: (request, h) => h.response().code(426),
      method: 'GET',
      path: '/{path*}',
    })

    this._server.route({
      method: 'POST',
      path: '/@connections/{connectionId}',
      options: {
        payload: {
          parse: false,
        },
      },
      handler: (request, h) => {
        debugLog(`got POST to ${request.url}`)

        const { connectionId } = request.params

        const webSocketClient = this._getWebSocketClient(connectionId)

        if (!webSocketClient) return h.response().code(410)
        if (!request.payload) return ''

        webSocketClient.send(request.payload.toString())

        debugLog(`sent data to connection:${connectionId}`)

        return ''
      },
    })

    this._server.route({
      options: {
        payload: {
          parse: false,
        },
      },
      method: 'DELETE',
      path: '/@connections/{connectionId}',
      handler: (request, h) => {
        const { connectionId } = request.params

        debugLog(`got DELETE to ${request.url}`)

        const webSocketClient = this._getWebSocketClient(connectionId)

        if (!webSocketClient) return h.response().code(410)

        webSocketClient.close()

        debugLog(`closed connection:${connectionId}`)

        return ''
      },
    })
  }

  // we'll add both 'client' and 'connectionId' for quick access
  _addWebSocketClient(client, connectionId) {
    this._webSocketClients.set(client, connectionId)
    this._webSocketClients.set(connectionId, client)
  }

  _removeWebSocketClient(client) {
    const connectionId = this._webSocketClients.get(client)

    this._webSocketClients.delete(client)
    this._webSocketClients.delete(connectionId)

    return connectionId
  }

  _getWebSocketClient(connectionId) {
    return this._webSocketClients.get(connectionId)
  }

  createEvent(functionName, functionObj, websocket) {
    this._printBlankLine()

    const { route } = websocket

    // set the route name
    this._webSocketRoutes.set(route, {
      functionName,
      functionObj,
    })

    serverlessLog(`route '${route}'`)
  }

  async start() {
    const { host, httpsProtocol, websocketPort } = this._options

    try {
      await this._server.start()
    } catch (error) {
      console.error(
        `Unexpected error while starting serverless-offline websocket server on port ${websocketPort}:`,
        error,
      )
      process.exit(1)
    }

    this._printBlankLine()
    serverlessLog(
      `Offline [websocket] listening on ws${
        httpsProtocol ? 's' : ''
      }://${host}:${websocketPort}`,
    )
  }

  // stops the hapi server
  stop(timeout) {
    return this._server.stop({
      timeout,
    })
  }
}
