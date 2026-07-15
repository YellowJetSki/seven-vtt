import { execSync } from 'child_process';

try {
  // First check how many VITE_DM_USERNAME env vars exist
  const listOutput = execSync('npx vercel env ls', {
    encoding: 'utf-8',
    timeout: 15000
  });
  console.log('Current env vars listing:');
  const lines = listOutput.split('\n').filter(l => l.includes('DM_USERNAME') || l.includes('DM_PASSWORD'));
  lines.forEach(l => console.log('  ' + l.trim()));
} catch (e) {
  console.log('List error: ' + e.message.substring(0, 80));
}

// Now remove them one by one via the CLI
// The Vercel CLI's env rm removes all instances of a given key
console.log('\nRemoving ALL VITE_DM_USERNAME entries...');
execSync('npx vercel env rm VITE_DM_USERNAME production --yes', {
  stdio: 'inherit',
  timeout: 15000
});

console.log('Removing ALL VITE_DM_PASSWORD entries...');
execSync('npx vercel env rm VITE_DM_PASSWORD production --yes', {
  stdio: 'inherit',
  timeout: 15000
});

console.log('Adding VITE_DM_USERNAME=MikeJello...');
execSync('echo "MikeJello" | npx vercel env add VITE_DM_USERNAME production', {
  stdio: 'inherit',
  timeout: 15000
});

console.log('Adding VITE_DM_PASSWORD=Jello1...');
execSync('echo "Jello1" | npx vercel env add VITE_DM_PASSWORD production', {
  stdio: 'inherit',
  timeout: 15000
});

console.log('\nVerifying...');
const finalList = execSync('npx vercel env ls', {
  encoding: 'utf-8',
  timeout: 15000
});
const dmLines = finalList.split('\n').filter(l => l.includes('DM_USERNAME') || l.includes('DM_PASSWORD'));
dmLines.forEach(l => console.log('  ' + l.trim()));

console.log('\nDone! Now rebuild with: npm run build && npx vercel --cwd vtt --prod --force');
