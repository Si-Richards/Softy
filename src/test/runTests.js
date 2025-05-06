
#!/usr/bin/env node

// This script runs tests without needing to modify package.json
const { spawnSync } = require('child_process');

console.log('Running tests with Vitest...');

// Run vitest with the appropriate configuration
const result = spawnSync('npx', 
  ['vitest', 'run', '--config', 'src/test/vitest.config.ts'], 
  { stdio: 'inherit' });

process.exit(result.status);
