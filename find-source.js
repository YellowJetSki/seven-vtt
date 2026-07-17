const sourceMap = require('source-map');
const fs = require('fs');

async function main() {
  const mapData = JSON.parse(fs.readFileSync('vtt/dist/assets/index-DV7Z2OYp.js.map', 'utf8'));
  
  // Line 12, column 212972 in the minified file
  // Note: source-map uses 1-based lines and 0-based columns
  const consumer = await new sourceMap.SourceMapConsumer(mapData);
  
  // The original error was at index-DxS76chb.js:12:212972
  // Our new build hash is DV7Z2OYp but same structure
  const pos = consumer.originalPositionFor({
    line: 12,
    column: 212972
  });
  
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
