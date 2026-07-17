const fs = require('fs');

// The deployed error at index-D0zo8ewM.js:9:27486 (first deploy with the bug)
// Our local source map is index-B9wrBGLU.js.map (same source, different hash)
const mapFiles = fs.readdirSync('vtt/dist/assets').filter(f => f.startsWith('index-') && f.endsWith('.js.map'));
console.log('Available maps:', mapFiles);

// Use the largest source map (main chunk)
const mapFile = mapFiles.find(f => f.includes('esm') === false);
console.log('Using map:', mapFile);

const sourceMap = require('source-map');
const mapData = JSON.parse(fs.readFileSync(`vtt/dist/assets/${mapFile}`, 'utf-8'));

async function main() {
  const consumer = await new sourceMap.SourceMapConsumer(mapData);

  // Deployed error: index-D0zo8ewM.js:9:27486 -> `li` function at line 9 col 27486
  // But also: index-B3-60jzW.js:9:27486 (same code, different hash)
  // The error in minified React is at `createFiberFromTypeAndProps`

  // Let's find ALL the positions from the stack trace
  const stackPositions = [
    {name: 'li (throw)', line: 9, col: 27486},
    {name: 'si (beginWork)', line: 9, col: 27059},
    {name: 'Wo (performUnitOfWork)', line: 9, col: 52205},
    {name: 'Vo (workLoopConcurrent)', line: 9, col: 52034},
    {name: 'Vc (renderRoot)', line: 9, col: 91728},
    {name: 'El (performConcurrentWorkOnRoot)', line: 9, col: 106849},
    {name: 'Tl', line: 9, col: 106733},
    {name: 'El (flushWork)', line: 9, col: 106870},
    {name: 'Tl (workLoop)', line: 9, col: 106733},
    {name: 'El (flushActQueue)', line: 9, col: 107613},
  ];

  for (const sp of stackPositions) {
    const pos = consumer.originalPositionFor({line: sp.line, column: sp.col});
    console.log(`${sp.name} -> ${pos.source?.split('/').pop() || 'unknown'}:${pos.line}:${pos.column}`);
  }

  // Also check what component fails - the ErrorBoundary is at line 12:18409
  const ebPos = consumer.originalPositionFor({line: 12, column: 18409});
  console.log(`\nErrorBoundary (Ta) -> ${ebPos.source?.split('/').pop() || 'unknown'}:${ebPos.line}:${ebPos.column}`);
  
  // Find the actual error message - check line 9 at the exact error position
  // React error codes are at certain positions - let's look at column 27059 which is "si" = beginWork
  // beginWork is the function that creates new fibers - it's where the "A component suspended" error is thrown
  
  // Let me try a different approach - check what file is at pos 9:27059
  const beginWorkPos = consumer.originalPositionFor({line: 9, column: 27059});
  if (beginWorkPos.source && beginWorkPos.source.includes('react-dom')) {
    const content = consumer.sourceContentFor(beginWorkPos.source);
    if (content) {
      const lines = content.split('\n');
      const start = Math.max(0, beginWorkPos.line - 15);
      const end = Math.min(lines.length, beginWorkPos.line + 2);
      console.log(`\nContext around beginWork error (line ${start+1}-${end}):`);
      for (let i = start; i < end; i++) {
        const marker = i + 1 === beginWorkPos.line ? '>>>' : '   ';
        console.log(`${marker} ${i + 1}: ${lines[i]}`);
      }
    }
  }

  consumer.destroy();
}

main().catch(console.error);
