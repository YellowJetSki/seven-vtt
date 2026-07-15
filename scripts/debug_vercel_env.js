import { execSync } from 'child_process';

console.log('=== Debug Vercel Env ===');

// List all DM-related env vars
console.log('\n1. Current env vars listing:');
const list = execSync('npx vercel env ls', { encoding: 'utf-8', timeout: 15000 });
const dmLines = list.split('\n').filter(l => l.includes('DM_USERNAME') || l.includes('DM_PASSWORD'));
dmLines.forEach(l => console.log('   ' + l.trim()));

// Check if there might be duplicates by using the API
console.log('\n2. Checking for duplicate env vars...');
const jsonList = execSync('npx vercel env ls --json', { encoding: 'utf-8', timeout: 15000 });
try {
  const parsed = JSON.parse(jsonList);
  const dmEnvs = parsed.filter(e => e.key === 'VITE_DM_USERNAME' || e.key === 'VITE_DM_PASSWORD');
  console.log('   DM env var count: ' + dmEnvs.length);
  dmEnvs.forEach(e => console.log('   - ' + e.key + ' (id: ' + e.id + ', target: ' + JSON.stringify(e.target) + ')'));
} catch (err) {
  console.log('   Could not parse JSON: ' + err.message.substring(0, 80));
  console.log('   Raw: ' + jsonList.substring(0, 500));
}

// Pull the .env file that Vercel would use
console.log('\n3. Pulling Vercel env...');
execSync('npx vercel env pull .env.vercel --environment production', {
  stdio: 'inherit',
  timeout: 15000
});
