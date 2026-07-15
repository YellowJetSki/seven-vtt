import { execSync } from 'child_process';

// Try removing from ALL environments explicitly
const envs = ['production', 'preview', 'development'];
const vars = ['VITE_DM_USERNAME', 'VITE_DM_PASSWORD'];

for (const env of envs) {
  for (const v of vars) {
    try {
      console.log('Removing ' + v + ' from ' + env + '...');
      execSync('npx vercel env rm ' + v + ' ' + env + ' --yes', {
        stdio: 'inherit',
        timeout: 20000
      });
    } catch (e) {
      console.log('  Error: ' + e.message.substring(0, 60));
    }
    try {
      console.log('Removing ' + v + ' from ' + env + ' (uppercase)...');
      execSync('npx vercel --cwd vtt env rm ' + v + ' ' + env + ' --yes', {
        stdio: 'inherit',
        timeout: 20000
      });
    } catch (e) {
      console.log('  Error: ' + e.message.substring(0, 60));
    }
  }
}

console.log('\nNow running vercel env ls to verify...');
execSync('npx vercel env ls', { stdio: 'inherit', timeout: 20000 });

console.log('\nNow adding the correct values...');
execSync('echo "MikeJello" | npx vercel env add VITE_DM_USERNAME production', { stdio: 'inherit', timeout: 20000 });
execSync('echo "Jello1" | npx vercel env add VITE_DM_PASSWORD production', { stdio: 'inherit', timeout: 20000 });
execSync('echo "MikeJello" | npx vercel env add VITE_DM_USERNAME preview', { stdio: 'inherit', timeout: 20000 });
execSync('echo "Jello1" | npx vercel env add VITE_DM_PASSWORD preview', { stdio: 'inherit', timeout: 20000 });
execSync('echo "MikeJello" | npx vercel env add VITE_DM_USERNAME development', { stdio: 'inherit', timeout: 20000 });
execSync('echo "Jello1" | npx vercel env add VITE_DM_PASSWORD development', { stdio: 'inherit', timeout: 20000 });

console.log('\nVerifying final state...');
execSync('npx vercel env ls', { stdio: 'inherit', timeout: 20000 });

console.log('\nDone! Now deploy with: npx vercel --cwd vtt --prod --force');
