import { execSync } from 'child_process';

// Remove existing ones first
try {
  execSync('npx vercel env rm VITE_DM_USERNAME production --yes', { stdio: 'inherit', timeout: 15000 });
} catch(e) { console.log('Note: ' + e.message.substring(0, 60)); }

try {
  execSync('npx vercel env rm VITE_DM_PASSWORD production --yes', { stdio: 'inherit', timeout: 15000 });
} catch(e) { console.log('Note: ' + e.message.substring(0, 60)); }

// Also try removing from preview if they exist
try {
  execSync('npx vercel env rm VITE_DM_USERNAME preview --yes', { stdio: 'inherit', timeout: 15000 });
} catch(e) { console.log('Note: ' + e.message.substring(0, 60)); }

try {
  execSync('npx vercel env rm VITE_DM_PASSWORD preview --yes', { stdio: 'inherit', timeout: 15000 });
} catch(e) { console.log('Note: ' + e.message.substring(0, 60)); }

// Also try removing from development
try {
  execSync('npx vercel env rm VITE_DM_USERNAME development --yes', { stdio: 'inherit', timeout: 15000 });
} catch(e) { console.log('Note: ' + e.message.substring(0, 60)); }

try {
  execSync('npx vercel env rm VITE_DM_PASSWORD development --yes', { stdio: 'inherit', timeout: 15000 });
} catch(e) { console.log('Note: ' + e.message.substring(0, 60)); }

// Now add to all three environments
console.log('\nAdding to Production, Preview, and Development...');

console.log('Adding VITE_DM_USERNAME=MikeJello (Production)...');
execSync('echo "MikeJello" | npx vercel env add VITE_DM_USERNAME production', { stdio: 'inherit', timeout: 15000 });

console.log('Adding VITE_DM_PASSWORD=Jello1 (Production)...');
execSync('echo "Jello1" | npx vercel env add VITE_DM_PASSWORD production', { stdio: 'inherit', timeout: 15000 });

console.log('Adding VITE_DM_USERNAME=MikeJello (Preview)...');
execSync('echo "MikeJello" | npx vercel env add VITE_DM_USERNAME preview', { stdio: 'inherit', timeout: 15000 });

console.log('Adding VITE_DM_PASSWORD=Jello1 (Preview)...');
execSync('echo "Jello1" | npx vercel env add VITE_DM_PASSWORD preview', { stdio: 'inherit', timeout: 15000 });

console.log('Adding VITE_DM_USERNAME=MikeJello (Development)...');
execSync('echo "MikeJello" | npx vercel env add VITE_DM_USERNAME development', { stdio: 'inherit', timeout: 15000 });

console.log('Adding VITE_DM_PASSWORD=Jello1 (Development)...');
execSync('echo "Jello1" | npx vercel env add VITE_DM_PASSWORD development', { stdio: 'inherit', timeout: 15000 });

console.log('\nVerifying...');
execSync('npx vercel env ls', { stdio: 'inherit', timeout: 15000 });
