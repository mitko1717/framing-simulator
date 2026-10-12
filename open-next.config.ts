import { defineCloudflareConfig, type OpenNextConfig } from '@opennextjs/cloudflare';

const openNextConfig: OpenNextConfig = {
  ...defineCloudflareConfig(),
  buildCommand: 'npm run build:next',
};

export default openNextConfig;
