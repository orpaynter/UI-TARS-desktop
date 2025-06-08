import { AgioEvent } from '@multimodal/agio';

export interface BootstrapCliOptions {
  agioProvider?: AgioEvent.AgioProvider;
  remoteConfig?: string;
}

const globalBootstrapCliOptions: BootstrapCliOptions = {};

export function setBootstrapCliOptions(options: BootstrapCliOptions) {
  Object.assign(globalBootstrapCliOptions, options);
}

export function getBootstrapCliOptions() {
  return globalBootstrapCliOptions;
}
