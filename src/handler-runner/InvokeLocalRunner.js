'use strict'

const { platform } = require('os')
const { delimiter, join, resolve, relative } = require('path')
const execa = require('execa')

const { parse, stringify } = JSON
const { cwd } = process

module.exports = class InvokeLocalRunner {
  constructor(funOptions, env) {
    const { handlerName, handlerPath, runtime } = funOptions

    this._env = env
    this._handlerName = handlerName
    this._handlerPath = handlerPath
    this._runtime = runtime

    this._invokeLocal = this._getLocalInvoke()
  }

  _getLocalInvoke() {
    if (['python2.7', 'python3.6', 'python3.7'].includes(this._runtime)) {
      return this._invokeLocalPython()
    }

    if (this._runtime === 'ruby2.5') {
      return this._invokeLocalRuby()
    }

    // TODO FIXME
    throw new Error('Unsupported runtime')
  }

  // no-op
  // () => void
  cleanup() {}

  // invokeLocalPython, loosely based on:
  // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/invokeLocal/index.js#L410
  // invoke.py, copy/pasted entirely as is:
  // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/invokeLocal/invoke.py
  _invokeLocalPython() {
    const runtime = platform() === 'win32' ? 'python.exe' : this._runtime

    return async (event, context) => {
      const input = stringify({
        context,
        event,
      })

      if (process.env.VIRTUAL_ENV) {
        const runtimeDir = platform() === 'win32' ? 'Scripts' : 'bin'
        process.env.PATH = [
          join(process.env.VIRTUAL_ENV, runtimeDir),
          delimiter,
          process.env.PATH,
        ].join('')
      }

      const [pythonExecutable] = runtime.split('.')

      const python = execa(
        pythonExecutable,
        [
          '-u',
          resolve(__dirname, 'invoke.py'),
          relative(cwd(), this._handlerPath),
          this._handlerName,
        ],
        {
          env: this._env,
          input,
          // shell: true,
        },
      )

      let result

      try {
        result = await python
      } catch (err) {
        // TODO
        console.log(err)

        throw err
      }

      const { stderr, stdout } = result

      if (stderr) {
        // TODO
        console.log(stderr)

        return stderr
      }

      try {
        return parse(stdout)
      } catch (err) {
        // TODO
        console.log('No JSON')

        return err
      }
    }
  }

  // invokeLocalRuby, loosely based on:
  // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/invokeLocal/index.js#L556
  // invoke.rb, copy/pasted entirely as is:
  // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/invokeLocal/invoke.rb
  _invokeLocalRuby() {
    const runtime = platform() === 'win32' ? 'ruby.exe' : 'ruby'

    // TODO FIXME
    return async (event, context) => {
      // https://docs.aws.amazon.com/lambda/latest/dg/ruby-context.html

      // https://docs.aws.amazon.com/lambda/latest/dg/ruby-context.html
      // exclude callbackWaitsForEmptyEventLoop, don't mutate context
      const { callbackWaitsForEmptyEventLoop, ..._context } = context

      const input = stringify({
        context: _context,
        event,
      })

      // console.log(input)

      const ruby = execa(
        runtime,
        [
          resolve(__dirname, 'invoke.rb'),
          relative(cwd(), this._handlerPath),
          this._handlerName,
        ],
        {
          env: this._env,
          input,
          // shell: true,
        },
      )

      let result

      try {
        result = await ruby
      } catch (err) {
        // TODO
        console.log(err)

        throw err
      }

      const { stderr, stdout } = result

      if (stderr) {
        // TODO
        console.log(stderr)

        return stderr
      }

      try {
        return parse(stdout)
      } catch (err) {
        // TODO
        console.log('No JSON')

        return err
      }
    }
  }

  run(event, context) {
    return this._invokeLocal(event, context)
  }
}
