import { Server } from '@hapi/hapi'
import httpRoutes from './httpRoutes.js'
import serverlessLog from '../serverlessLog.js'

export default class HttpServer {
  constructor(options, webSocketClients) {
    this._options = options
    this._server = null
    this._webSocketClients = webSocketClients

    const { host, websocketPort } = options

    const serverOptions = {
      host,
      port: websocketPort,
      router: {
        // allows for paths with trailing slashes to be the same as without
        // e.g. : /my-path is the same as /my-path/
        stripTrailingSlash: true,
      },
    }

    this._server = new Server(serverOptions)
  }

  async start() {
    // add routes
    const routes = httpRoutes(this._webSocketClients)
    this._server.route(routes)

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

    serverlessLog(
      `Offline [http for websocket] listening on http${
        httpsProtocol ? 's' : ''
      }://${host}:${websocketPort}`,
    )
  }

  // stops the server
  stop(timeout) {
    return this._server.stop({
      timeout,
    })
  }

  get server() {
    return this._server.listener
  }
}
