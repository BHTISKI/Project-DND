import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';

const argument = process.argv[2];
if (argument && !['--baseline', '--with-mechanics'].includes(argument)) throw new Error('Use --baseline or --with-mechanics');
const modes = argument ? [argument.slice(2)] : ['baseline', 'with-mechanics'];
const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
try {
  const { runSimulation } = await server.ssrLoadModule('/scripts/simulatePlaythrough.ts');
  for (const mode of modes) {
    const result = runSimulation(mode);
    const output = mode === 'baseline' ? 'docs/baseline-results.json' : 'docs/mechanics-results.json';
    await writeFile(output, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ output, ...result.summary }, null, 2));
  }
} finally { await server.close(); }
