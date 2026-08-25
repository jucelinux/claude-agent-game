/// <reference lib="webworker" />

import { compileProject } from '../authoring/project.ts'
import type { CompiledBundle } from '../compiler/types.ts'
import type { PrototypeId } from '../projects/manifest.ts'

export type CompilerWorkerRequest = {
  readonly prototypeId: PrototypeId
}

export type CompilerWorkerResult = {
  readonly bundle: CompiledBundle
  readonly elapsedMs: number
}

self.addEventListener('message', (event: MessageEvent<CompilerWorkerRequest>) => {
  const started = performance.now()
  const result: CompilerWorkerResult = {
    bundle: compileProject(event.data.prototypeId),
    elapsedMs: performance.now() - started,
  }
  self.postMessage(result)
})
