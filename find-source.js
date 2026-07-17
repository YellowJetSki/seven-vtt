const sourceMap = require('source-map');
const fs = require('fs');

async function main() {
  const mapData = JSON.parse(fs.readFileSync('vtt/dist/assets/index-ISu8LWCX.js.map', 'utf8'));
  
  const consumer = await new sourceMap.SourceMapConsumer(mapData);
  
  // Error: index-D46EtLXT.js:9:27055 -> our build ISu8LWCX, same structure
  // The `ai` function at col 27055
  // Let me try line 12:18407 for the ErrorBoundary
  const pos3 = consumer.originalPositionFor({
    line: 12,
    column: 18407
  });
  console.log('\nLine 12:18407:');
  console.log('  Source:', pos3.source);
  console.log('  Line:', pos3.line);
  console.log('  Column:', pos3.column);
  if (pos3.source && pos3.line) {
    const sourceContent = consumer.sourceContentFor(pos3.source);
    if (sourceContent) {
      const lines = sourceContent.split('\n');
      for (let i = Math.max(0, pos3.line - 2); i < Math.min(lines.length, pos3.line + 3); i++) {
        console.log(`  ${i === pos3.line - 1 ? '>>' : '  '} ${i + 1}: ${lines[i]?.substring(0, 120)}`);
      }
    }
  }
  
  // The ErrorBoundary component Ca is at line 12:18407
  const pos2 = consumer.originalPositionFor({
    line: 12,
    column: 18407
  });
  
  console.log('\nErrorBoundary Ca:');
  console.log('  Source:', pos2.source);
  console.log('  Line:', pos2.line);
  console.log('  Column:', pos2.column);
  
  if (pos2.source && pos2.line) {
    const sourceContent = consumer.sourceContentFor(pos2.source);
    if (sourceContent) {
      const lines = sourceContent.split('\n');
      const start = Math.max(0, pos2.line - 3);
      const end = Math.min(lines.length, pos2.line + 3);
      console.log(`\nErrorBoundary context (lines ${start}-${end}):`);
      for (let i = start; i < end; i++) {
        const marker = i === pos2.line - 1 ? ' >>>' : '    ';
        console.log(`${marker} ${i + 1}: ${lines[i]}`);
      }
    }
  }
  
  console.log('Source map result:');
  console.log('  Source:', pos.source);
  console.log('  Line:', pos.line);
  console.log('  Column:', pos.column);
  console.log('  Name:', pos.name);
  
  if (pos.source && pos.line) {
    // Read the actual source file
    const sourceContent = consumer.sourceContentFor(pos.source);
    if (sourceContent) {
      const lines = sourceContent.split('\n');
      const start = Math.max(0, pos.line - 5);
      const end = Math.min(lines.length, pos.line + 5);
      console.log(`\nSource context (lines ${start}-${end}):`);
      for (let i = start; i < end; i++) {
        const marker = i === pos.line - 1 ? ' >>>' : '    ';
        console.log(`${marker} ${i + 1}: ${lines[i]}`);
      }
    }
  }
  
  consumer.destroy();
}

main().catch(console.error);
