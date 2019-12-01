import debugLog from '../../debugLog'
import { logWarning } from '../../serverlessLog'
import {
  supportedNodejs,
  supportedPython,
  supportedRuby,
} from '../../config/index'
import { satisfiesVersionRange } from '../../utils/index'
import { Options } from '../../interfaces'

export default class HandlerRunner {
  private readonly _env: NodeJS.ProcessEnv
  private readonly _funOptions: any
  private readonly _options: Options
  private _runner: any

  constructor(funOptions, options: Options, env: NodeJS.ProcessEnv) {
    this._env = env
    this._funOptions = funOptions
    this._options = options
    this._runner = null
  }

  private async _loadRunner() {
    const { useChildProcesses, useWorkerThreads } = this._options

    const {
      functionKey,
      handlerName,
      handlerPath,
      runtime,
      timeout,
    } = this._funOptions

    debugLog(`Loading handler... (${handlerPath})`)

    if (supportedNodejs.has(runtime)) {
      if (useChildProcesses) {
        const { default: ChildProcessRunner } = await import(
          './ChildProcessRunner'
        )
        return new ChildProcessRunner(this._funOptions, this._env)
      }

      if (useWorkerThreads) {
        // worker threads
        this._verifyWorkerThreadCompatibility()

        const { default: WorkerThreadRunner } = await import(
          './WorkerThreadRunner'
        )
        return new WorkerThreadRunner(this._funOptions, this._env)
      }

      const { default: InProcessRunner } = await import('./InProcessRunner')
      return new InProcessRunner(
        functionKey,
        handlerPath,
        handlerName,
        this._env,
        timeout,
      )
    }

    if (supportedPython.has(runtime)) {
      const { default: PythonRunner } = await import('./PythonRunner')
      return new PythonRunner(this._funOptions, this._env)
    }

    if (supportedRuby.has(runtime)) {
      const { default: RubyRunner } = await import('./RubyRunner')
      return new RubyRunner(this._funOptions, this._env)
    }

    // TODO FIXME
    throw new Error('Unsupported runtime')
  }

  private _verifyWorkerThreadCompatibility() {
    const { node: currentVersion } = process.versions
    const requiredVersionRange = '>=11.7.0'

    const versionIsSatisfied = satisfiesVersionRange(
      currentVersion,
      requiredVersionRange,
    )

    // we're happy
    if (!versionIsSatisfied) {
      logWarning(
        `"worker threads" require node.js version ${requiredVersionRange}, but found version ${currentVersion}.
         To use this feature you have to update node.js to a later version.
        `,
      )

      throw new Error(
        '"worker threads" are not supported with this node.js version',
      )
    }
  }

  // () => Promise<void>
  cleanup() {
    // TODO console.log('handler runner cleanup')
    return this._runner.cleanup()
  }

  async run(event, context) {
    if (this._runner == null) {
      this._runner = await this._loadRunner()
    }

    return this._runner.run(event, context)
  }
}
