import { simulate } from './engine';
import { compareModels } from './comparison';
import type { ComparisonRequest, Config } from './types';
self.onmessage = (event: MessageEvent<Config | ComparisonRequest>) => {
  try {
    if ('kind' in event.data) {
      const { config, runs, compareTimings } = event.data;
      const onProgress = (completed: number, total: number) => self.postMessage({ progress: { completed, total } });
      self.postMessage({ comparison: compareModels(config, runs, onProgress, compareTimings) });
    } else self.postMessage({ result: simulate(event.data) });
  }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Simulation failed.' }); }
};
