import InvokeController from './InvokeController.js'

// https://docs.aws.amazon.com/lambda/latest/dg/API_Invoke.html
export default function invokeRoute(lambda) {
  const invokeController = new InvokeController(lambda)

  return {
    method: 'POST',
    options: {
      payload: {
        // allow: ['binary/octet-stream'],
        defaultContentType: 'binary/octet-stream',
        // request.payload will be a raw buffer
        parse: false,
      },
      tags: ['api'],
    },
    path: '/{apiVersion}/functions/{functionName}/invocations',
    handler(request) {
      const {
        params: { functionName },
        payload,
      } = request

      return invokeController.invoke(functionName, payload)
    },
  }
}
