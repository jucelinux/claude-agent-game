/// <reference lib="webworker" />

import { compileProject } from '../authoring/project.ts'
import type { CompiledBundle } from '../compiler/types.ts'

export type CompilerWorkerResult = {
  readonly bundle: CompiledBundle
  readonly elapsedMs: number
}

const started = performance.now()
const result: CompilerWorkerResult = {
  bundle: compileProject(),
  elapsedMs: performance.now() - started,
}

self.postMessage(result)
