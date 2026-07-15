import { execSync } from 'child_process';

try {
  console.log('Removing old VITE_DM_USERNAME...');
  execSync('npx vercel env rm VITE_DM_USERNAME production --yes', {
    stdio: 'inherit',
    timeout: 15000
  });
} catch (e) {
  console.log('Note: ' + e.message.substring(0, 60));
}

try {
  console.log('Removing old VITE_DM_PASSWORD...');
  execSync('npx vercel env rm VITE_DM_PASSWORD production --yes', {
    stdio: 'inherit',
    timeout: 15000
  });
} catch (e) {
  console.log('Note: ' + e.message.substring(0, 60));
}

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

console.log('Done!');
