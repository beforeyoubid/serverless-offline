# Serverless Offline

<p>
  <a href="https://www.serverless.com">
    <img src="http://public.serverless.com/badges/v3.svg">
  </a>
  <a href="https://www.npmjs.com/package/serverless-offline">
    <img src="https://img.shields.io/npm/v/serverless-offline.svg?style=flat-square">
  </a>
  <a href="https://github.com/dherault/serverless-offline/actions?query=workflow%3ACI">
    <img src="https://img.shields.io/github/workflow/status/dherault/serverless-offline/CI?style=flat-square">
  </a>
  <img src="https://img.shields.io/node/v/serverless-offline.svg?style=flat-square">
  <a href="https://github.com/serverless/serverless">
    <img src="https://img.shields.io/npm/dependency-version/serverless-offline/peer/serverless.svg?style=flat-square">
  </a>
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
  </a>
  <img src="https://img.shields.io/npm/l/serverless-offline.svg?style=flat-square">
  <a href="#contributing">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square">
  </a>
  <a href="https://gitter.im/serverless-offline/community">
    <img src="https://badges.gitter.im/serverless-offline.png">
  </a>
</p>

This [Serverless](https://github.com/serverless/serverless) plugin emulates [AWS λ](https://aws.amazon.com/lambda) and [API Gateway](https://aws.amazon.com/api-gateway) on your local machine to speed up your development cycles.
To do so, it starts an HTTP server that handles the request's lifecycle like APIG does and invokes your handlers.

**Features:**

- [Node.js](https://nodejs.org), [Python](https://www.python.org), [Ruby](https://www.ruby-lang.org) and [Go](https://golang.org) λ runtimes.
- Velocity templates support.
- Lazy loading of your handler files.
- And more: integrations, authorizers, proxies, timeouts, responseParameters, HTTPS, CORS, etc...

This plugin is updated by its users, I just do maintenance and ensure that PRs are relevant to the community. In other words, if you [find a bug or want a new feature](https://github.com/dherault/serverless-offline/issues), please help us by becoming one of the [contributors](https://github.com/dherault/serverless-offline/graphs/contributors) :v: ! See the [contributing section](#contributing).

## Documentation

- [Installation](#installation)
- [Usage and command line options](#usage-and-command-line-options)
- [Usage with `invoke`](#usage-with-invoke)
- [The `process.env.IS_OFFLINE` variable](#the-processenvis_offline-variable)
- [Docker and Layers](#docker-and-layers)
- [Token authorizers](#token-authorizers)
- [Custom authorizers](#custom-authorizers)
- [Remote authorizers](#remote-authorizers)
- [JWT authorizers](#jwt-authorizers)
- [Serverless plugin authorizers](#serverless-plugin-authorizers)
- [Custom headers](#custom-headers)
- [Environment variables](#environment-variables)
- [AWS API Gateway Features](#aws-api-gateway-features)
  - [Velocity Templates](#velocity-templates)
  - [CORS](#cors)
  - [Catch-all Path Variables](#catch-all-path-variables)
  - [ANY method](#any-method)
  - [Lambda and Lambda Proxy Integrations](#lambda-and-lambda-proxy-integrations)
  - [HTTP Proxy](#http-proxy)
  - [Response parameters](#response-parameters)
- [WebSocket](#websocket)
- [Usage with Webpack](#usage-with-webpack)
- [Velocity nuances](#velocity-nuances)
- [Debug process](#debug-process)
- [Resource permissions and AWS profile](#resource-permissions-and-aws-profile)
- [Scoped execution](#scoped-execution)
- [Simulation quality](#simulation-quality)
- [Usage with serverless-dynamodb-local and serverless-webpack plugin](#usage-with-serverless-dynamodb-local-and-serverless-webpack-plugin)
- [Credits and inspiration](#credits-and-inspiration)
- [License](#license)
- [Contributing](#contributing)
- [Contributors](#contributors)

## Installation

First, add Serverless Offline to your project:

`npm install serverless-offline --save-dev`

Then inside your project's `serverless.yml` file add following entry to the plugins section: `serverless-offline`. If there is no plugin section you will need to add it to the file.

**Note that the "plugin" section for serverless-offline must be at root level on serverless.yml.**

It should look something like this:

```YAML
plugins:
  - serverless-offline
```

You can check wether you have successfully installed the plugin by running the serverless command line:

`serverless --verbose`

the console should display _Offline_ as one of the plugins now available in your Serverless project.

## Usage and command line options

In your project root run:

`serverless offline` or `sls offline`.

to list all the options for the plugin run:

`sls offline --help`

All CLI options are optional:

```
--allowCache                Allows the code of lambda functions to cache if supported.
--apiKey                    Defines the API key value to be used for endpoints marked as private Defaults to a random hash.
--corsAllowHeaders          Used as default Access-Control-Allow-Headers header value for responses. Delimit multiple values with commas. Default: 'accept,content-type,x-api-key'
--corsAllowOrigin           Used as default Access-Control-Allow-Origin header value for responses. Delimit multiple values with commas. Default: '*'
--corsDisallowCredentials   When provided, the default Access-Control-Allow-Credentials header value will be passed as 'false'. Default: true
--corsExposedHeaders        Used as additional Access-Control-Exposed-Headers header value for responses. Delimit multiple values with commas. Default: 'WWW-Authenticate,Server-Authorization'
--disableCookieValidation   Used to disable cookie-validation on hapi.js-server
--disableScheduledEvents    Disables all scheduled events. Overrides configurations in serverless.yml.
--dockerHost                The host name of Docker. Default: localhost
--dockerHostServicePath     Defines service path which is used by SLS running inside Docker container
--dockerNetwork             The network that the Docker container will connect to
--dockerReadOnly            Marks if the docker code layer should be read only. Default: true
--enforceSecureCookies      Enforce secure cookies
--hideStackTraces           Hide the stack trace on lambda failure. Default: false
--host                  -o  Host name to listen on. Default: localhost
--httpPort                  Http port to listen on. Default: 3000
--httpsProtocol         -H  To enable HTTPS, specify directory (relative to your cwd, typically your project dir) for both cert.pem and key.pem files
--ignoreJWTSignature        When using HttpApi with a JWT authorizer, don't check the signature of the JWT token. This should only be used for local development.
--lambdaPort                Lambda http port to listen on. Default: 3002
--layersDir                 The directory layers should be stored in. Default: ${codeDir}/.serverless-offline/layers'
--noAuth                    Turns off all authorizers
--noPrependStageInUrl       Don't prepend http routes with the stage.
--noStripTrailingSlashInUrl Don't strip trailing slash from http routes.
--noTimeout             -t  Disables the timeout feature.
--prefix                -p  Adds a prefix to every path, to send your requests to http://localhost:3000/[prefix]/[your_path] instead. Default: ''
--printOutput               Turns on logging of your lambda outputs in the terminal.
--resourceRoutes            Turns on loading of your HTTP proxy settings from serverless.yml
--useChildProcesses         Run handlers in a child process
--useDocker                 Run handlers in a docker container.
--useWorkerThreads          Uses worker threads for handlers. Requires node.js v11.7.0 or higher
--webSocketHardTimeout      Set WebSocket hard timeout in seconds to reproduce AWS limits (https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html#apigateway-execution-service-websocket-limits-table). Default: 7200 (2 hours)
--webSocketIdleTimeout      Set WebSocket idle timeout in seconds to reproduce AWS limits (https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html#apigateway-execution-service-websocket-limits-table). Default: 600 (10 minutes)
--websocketPort             WebSocket port to listen on. Default: 3001
```

Any of the CLI options can be added to your `serverless.yml`. For example:

```
custom:
  serverless-offline:
    httpsProtocol: "dev-certs"
    httpPort: 4000
    stageVariables:
      foo: "bar"
```

Options passed on the command line override YAML options.

By default you can send your requests to `http://localhost:3000/`. Please note that:

- You'll need to restart the plugin if you modify your `serverless.yml` or any of the default velocity template files.
- When no Content-Type header is set on a request, API Gateway defaults to `application/json`, and so does the plugin.
  But if you send an `application/x-www-form-urlencoded` or a `multipart/form-data` body with an `application/json` (or no) Content-Type, API Gateway won't parse your data (you'll get the ugly raw as input), whereas the plugin will answer 400 (malformed JSON).
  Please consider explicitly setting your requests' Content-Type and using separate templates.

## Usage with `invoke`

To use `Lambda.invoke` you need to set the lambda endpoint to the serverless-offline endpoint:

```js
const { Lambda } = require('aws-sdk')

const lambda = new Lambda({
  apiVersion: '2015-03-31',
  // endpoint needs to be set only if it deviates from the default, e.g. in a dev environment
  // process.env.SOME_VARIABLE could be set in e.g. serverless.yml for provider.environment or function.environment
  endpoint: process.env.SOME_VARIABLE
    ? 'http://localhost:3002'
    : 'https://lambda.us-east-1.amazonaws.com',
})
```

All your lambdas can then be invoked in a handler using

```js
exports.handler = async function () {
  const params = {
    // FunctionName is composed of: service name - stage - function name, e.g.
    FunctionName: 'myServiceName-dev-invokedHandler',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ data: 'foo' }),
  }

  const response = await lambda.invoke(params).promise()
}
```

You can also invoke using the aws cli by specifying `--endpoint-url`

```
aws lambda invoke /dev/null \
  --endpoint-url http://localhost:3002 \
  --function-name myServiceName-dev-invokedHandler
```

List of available function names and their corresponding serverless.yml function keys
are listed after the server starts. This is important if you use a custom naming
scheme for your functions as `serverless-offline` will use your custom name.
The left side is the function's key in your `serverless.yml`
(`invokedHandler` in the example below) and the right side is the function name
that is used to call the function externally such as `aws-sdk`
(`myServiceName-dev-invokedHandler` in the example below):

```
serverless offline
...
offline: Starting Offline: local/us-east-1.
offline: Offline [http for lambda] listening on http://localhost:3002
offline: Function names exposed for local invocation by aws-sdk:
           * invokedHandler: myServiceName-dev-invokedHandler
```

To list the available manual invocation paths exposed for targeting
by `aws-sdk` and `aws-cli`, use `SLS_DEBUG=*` with `serverless offline`. After the invoke server starts up, full list of endpoints will be displayed:

```
SLS_DEBUG=* serverless offline
...
offline: Starting Offline: local/us-east-1.
...
offline: Offline [http for lambda] listening on http://localhost:3002
offline: Function names exposed for local invocation by aws-sdk:
           * invokedHandler: myServiceName-dev-invokedHandler
[offline] Lambda Invocation Routes (for AWS SDK or AWS CLI):
           * POST http://localhost:3002/2015-03-31/functions/myServiceName-dev-invokedHandler/invocations
[offline] Lambda Async Invocation Routes (for AWS SDK or AWS CLI):
           * POST http://localhost:3002/2014-11-13/functions/myServiceName-dev-invokedHandler/invoke-async/
```

You can manually target these endpoints with a REST client to debug your lambda
function if you want to. Your `POST` JSON body will be the `Payload` passed to your function if you were
to calling it via `aws-sdk`.

## The `process.env.IS_OFFLINE` variable

Will be `"true"` in your handlers and thorough the plugin.

## Docker and Layers

To use layers with serverless-offline, you need to have the `useDocker` option set to true. This can either be by using the `--useDocker` command, or in your serverless.yml like this:

```yml
custom:
  serverless-offline:
    useDocker: true
```

This will allow the docker container to look up any information about layers, download and use them. For this to work, you must be using:

- AWS as a provider, it won't work with other provider types.
- Layers that are compatible with your runtime.
- ARNs for layers. Local layers aren't supported as yet.
- A local AWS account set-up that can query and download layers.

If you're using least-privilege principals for your AWS roles, this policy should get you by:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:GetLayerVersion",
      "Resource": "arn:aws:lambda:*:*:layer:*:*"
    }
  ]
}
```

Once you run a function that boots up the Docker container, it'll look through the layers for that function, download them in order to your layers folder, and save a hash of your layers so it can be re-used in future. You'll only need to re-download your layers if they change in the future. If you want your layers to re-download, simply remove your layers folder.

You should then be able to invoke functions as normal, and they're executed against the layers in your docker container.

### Additional Options

There are 5 additional options available for Docker and Layer usage.

- dockerHost
- dockerHostServicePath
- dockerNetwork
- dockerReadOnly
- layersDir

#### dockerHost

When running Docker Lambda inside another Docker container, you may need to configure the host name for the host machine to resolve networking issues between Docker Lambda and the host. Typically in such cases you would set this to `host.docker.internal`.

#### dockerHostServicePath

When running Docker Lambda inside another Docker container, you may need to override the code path that gets mounted to the Docker Lambda container relative to the host machine. Typically in such cases you would set this to `${PWD}`.

#### dockerNetwork

When running Docker Lambda inside another Docker container, you may need to override network that Docker Lambda connects to in order to communicate with other containers.

#### dockerReadOnly

For certain programming languages and frameworks, it's desirable to be able to write to the filesystem for things like testing with local SQLite databases, or other testing-only modifications. For this, you can set `dockerReadOnly: false`, and this will allow local filesystem modifications. This does not strictly mimic AWS Lambda, as Lambda has a Read-Only filesystem, so this should be used as a last resort.

#### layersDir

By default layers are downloaded on a per-project basis, however, if you want to share them across projects, you can download them to a common place. For example, `layersDir: /tmp/layers` would allow them to be shared across projects. Make sure when using this setting that the directory you are writing layers to can be shared by docker.

## Token authorizers

As defined in the [Serverless Documentation](https://serverless.com/framework/docs/providers/aws/events/apigateway/#setting-api-keys-for-your-rest-api) you can use API Keys as a simple authentication method.

Serverless-offline will emulate the behaviour of APIG and create a random token that's printed on the screen. With this token you can access your private methods adding `x-api-key: generatedToken` to your request header. All api keys will share the same token. To specify a custom token use the `--apiKey` cli option.

## Custom authorizers

Only [custom authorizers](https://aws.amazon.com/blogs/compute/introducing-custom-authorizers-in-amazon-api-gateway/) are supported. Custom authorizers are executed before a Lambda function is executed and return an Error or a Policy document.

The Custom authorizer is passed an `event` object as below:

```javascript
{
  "type": "TOKEN",
  "authorizationToken": "<Incoming bearer token>",
  "methodArn": "arn:aws:execute-api:<Region id>:<Account id>:<API id>/<Stage>/<Method>/<Resource path>"
}
```

The `methodArn` does not include the Account id or API id.

The plugin only supports retrieving Tokens from headers. You can configure the header as below:

```javascript
"authorizer": {
  "type": "TOKEN",
  "identitySource": "method.request.header.Authorization", // or method.request.header.SomeOtherHeader
  "authorizerResultTtlInSeconds": "0"
}
```

## Remote authorizers

You are able to mock the response from remote authorizers by setting the environmental variable `AUTHORIZER` before running `sls offline start`

Example:

> Unix: `export AUTHORIZER='{"principalId": "123"}'`

> Windows: `SET AUTHORIZER='{"principalId": "123"}'`

## JWT authorizers

For HTTP APIs, [JWT authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
defined in the `serverless.yml` can be used to validate the token and scopes in the token. However at this time,
the signature of the JWT is not validated with the defined issuer. Since this is a security risk, this feature is
only enabled with the `--ignoreJWTSignature` flag. Make sure to only set this flag for local development work.

## Serverless plugin authorizers

If your authentication needs are custom and not satisfied by the existing capabilities of the Serverless offline project, you can inject your own authentication strategy. To inject a custom strategy for Lambda invocation, you define a custom variable under `serverless-offline` called `authenticationProvider` in the serverless.yml file. The value of the custom variable will be used to `require(your authenticationProvider value)` where the location is expected to return a function with the following signature.

```js
module.exports = function (endpoint, functionKey, method, path) {
  return {
    name: 'your strategy name',
    scheme: 'your scheme name',

    getAuthenticateFunction: () => ({
      async authenticate(request, h) {
        // your implementation
      },
    }),
  }
}
```

A working example of injecting a custom authorization provider can be found in the projects integration tests under the folder `custom-authentication`.

## Custom headers

You are able to use some custom headers in your request to gain more control over the requestContext object.

| Header                          | Event key                                                   | Example                                                                           |
| ------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| cognito-identity-id             | event.requestContext.identity.cognitoIdentityId             |                                                                                   |
| cognito-authentication-provider | event.requestContext.identity.cognitoAuthenticationProvider |                                                                                   |
| sls-offline-authorizer-override | event.requestContext.authorizer                             | { "iam": {"cognitoUser": { "amr": ["unauthenticated"], "identityId": "abc123" }}} |

By doing this you are now able to change those values using a custom header. This can help you with easier authentication or retrieving the userId from a `cognitoAuthenticationProvider` value.

## Environment variables

You are able to use environment variables to customize identity params in event context.

| Environment Variable                | Event key                                                   |
| ----------------------------------- | ----------------------------------------------------------- |
| SLS_COGNITO_IDENTITY_POOL_ID        | event.requestContext.identity.cognitoIdentityPoolId         |
| SLS_ACCOUNT_ID                      | event.requestContext.identity.accountId                     |
| SLS_COGNITO_IDENTITY_ID             | event.requestContext.identity.cognitoIdentityId             |
| SLS_CALLER                          | event.requestContext.identity.caller                        |
| SLS_API_KEY                         | event.requestContext.identity.apiKey                        |
| SLS_API_KEY_ID                      | event.requestContext.identity.apiKeyId                      |
| SLS_COGNITO_AUTHENTICATION_TYPE     | event.requestContext.identity.cognitoAuthenticationType     |
| SLS_COGNITO_AUTHENTICATION_PROVIDER | event.requestContext.identity.cognitoAuthenticationProvider |

You can use [serverless-dotenv-plugin](https://github.com/colynb/serverless-dotenv-plugin) to load environment variables from your `.env` file.

## AWS API Gateway Features

### Velocity Templates

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#request-templates)
~ [AWS doc](http://docs.aws.amazon.com/apigateway/latest/developerguide/models-mappings.html#models-mappings-mappings)

You can supply response and request templates for each function. This is optional. To do so you will have to place function specific template files in the same directory as your function file and add the .req.vm extension to the template filename.
For example,
if your function is in code-file: `helloworld.js`,
your response template should be in file: `helloworld.res.vm` and your request template in file `helloworld.req.vm`.

### CORS

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#enabling-cors)

For HTTP APIs, the CORS configuration will work out of the box. Any CLI arguments
passed in will be ignored.

For REST APIs, if the endpoint config has CORS set to true, the plugin will use the CLI CORS options for the associated route.
Otherwise, no CORS headers will be added.

### Catch-all Path Variables

[AWS doc](https://aws.amazon.com/blogs/aws/api-gateway-update-new-features-simplify-api-development/)

Set greedy paths like `/store/{proxy+}` that will intercept requests made to `/store/list-products`, `/store/add-product`, etc...

### ANY method

[AWS doc](https://aws.amazon.com/blogs/aws/api-gateway-update-new-features-simplify-api-development/)

Works out of the box.

### Lambda and Lambda Proxy Integrations

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#lambda-proxy-integration)
~ [AWS doc](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html)

Works out of the box. See examples in the manual_test directory.

### HTTP Proxy

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#setting-an-http-proxy-on-api-gateway)
~
[AWS doc - AWS::ApiGateway::Method](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-method.html)
~
[AWS doc - AWS::ApiGateway::Resource](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-resource.html)

Example of enabling proxy:

```
custom:
  serverless-offline:
    resourceRoutes: true
```

or

```
    YourCloudFormationMethodId:
      Type: AWS::ApiGateway::Method
      Properties:
        ......
        Integration:
          Type: HTTP_PROXY
          Uri: 'https://s3-${self:custom.region}.amazonaws.com/${self:custom.yourBucketName}/{proxy}'
          ......
```

```
custom:
  serverless-offline:
    resourceRoutes:
      YourCloudFormationMethodId:
        Uri: 'http://localhost:3001/assets/{proxy}'
```

### Response parameters

[AWS doc](http://docs.aws.amazon.com/apigateway/latest/developerguide/request-response-data-mappings.html#mapping-response-parameters)

You can set your response's headers using ResponseParameters.

May not work properly. Please PR. (Difficulty: hard?)

Example response velocity template:

```javascript
"responseParameters": {
  "method.response.header.X-Powered-By": "Serverless", // a string
  "method.response.header.Warning": "integration.response.body", // the whole response
  "method.response.header.Location": "integration.response.body.some.key" // a pseudo JSON-path
},
```

## WebSocket

Usage in order to send messages back to clients:

`POST http://localhost:3001/@connections/{connectionId}`

Or,

```js
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: 'http://localhost:3001',
});

apiGatewayManagementApi.postToConnection({
  ConnectionId: ...,
  Data: ...,
});
```

Where the `event` is received in the lambda handler function.

There's support for [websocketsApiRouteSelectionExpression](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-selection-expressions.html) in it's basic form: `$request.body.x.y.z`, where the default value is `$request.body.action`.

## Usage with Webpack

Use [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack) to compile and bundle your ES-next code

## Velocity nuances

Consider this requestTemplate for a POST endpoint:

```json
"application/json": {
  "payload": "$input.json('$')",
  "id_json": "$input.json('$.id')",
  "id_path": "$input.path('$').id"
}
```

Now let's make a request with this body: `{ "id": 1 }`

AWS parses the event as such:

```javascript
{
  "payload": {
    "id": 1
  },
  "id_json": 1,
  "id_path": "1" // Notice the string
}
```

Whereas Offline parses:

```javascript
{
  "payload": {
    "id": 1
  },
  "id_json": 1,
  "id_path": 1 // Notice the number
}
```

Accessing an attribute after using `$input.path` will return a string on AWS (expect strings like `"1"` or `"true"`) but not with Offline (`1` or `true`).
You may find other differences.

## Debug process

Serverless offline plugin will respond to the overall framework settings and output additional information to the console in debug mode. In order to do this you will have to set the `SLS_DEBUG` environmental variable. You can run the following in the command line to switch to debug mode execution.

> Unix: `export SLS_DEBUG=*`

> Windows: `SET SLS_DEBUG=*`

Interactive debugging is also possible for your project if you have installed the node-inspector module and chrome browser. You can then run the following command line inside your project's root.

Initial installation:
`npm install -g node-inspector`

For each debug run:
`node-debug sls offline`

The system will start in wait status. This will also automatically start the chrome browser and wait for you to set breakpoints for inspection. Set the breakpoints as needed and, then, click the play button for the debugging to continue.

Depending on the breakpoint, you may need to call the URL path for your function in seperate browser window for your serverless function to be run and made available for debugging.

## Resource permissions and AWS profile

Lambda functions assume an IAM role during execution: the framework creates this role and set all the permission provided in the `iamRoleStatements` section of `serverless.yml`.

However, serverless offline makes use of your local AWS profile credentials to run the lambda functions and that might result in a different set of permissions. By default, the aws-sdk would load credentials for you default AWS profile specified in your configuration file.

You can change this profile directly in the code or by setting proper environment variables. Setting the `AWS_PROFILE` environment variable before calling `serverless` offline to a different profile would effectively change the credentials, e.g.

`AWS_PROFILE=<profile> serverless offline`

## Scoped execution

Downstream plugins may tie into the `before:offline:start:end` hook to release resources when the server is shutting down.

## Simulation quality

This plugin simulates API Gateway for many practical purposes, good enough for development - but is not a perfect simulator.
Specifically, Lambda currently runs on Node.js v10.x, v12.x and v14.x ([AWS Docs](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)), whereas _Offline_ runs on your own runtime where no memory limits are enforced.

## Usage with serverless-dynamodb-local and serverless-webpack plugin

Run `serverless offline start`. In comparison with `serverless offline`, the `start` command will fire an `init` and a `end` lifecycle hook which is needed for serverless-offline and serverless-dynamodb-local to switch off resources.

Add plugins to your `serverless.yml` file:

```yaml
plugins:
  - serverless-webpack
  - serverless-dynamodb-local
  - serverless-offline # serverless-offline needs to be last in the list
```

## Credits and inspiration

This plugin was initially a fork of [Nopik](https://github.com/Nopik/)'s [Serverless-serve](https://github.com/Nopik/serverless-serve).

## License

MIT
