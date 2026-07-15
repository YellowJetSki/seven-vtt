import { execSync } from 'child_process';
const result = execSync('npx vercel whoami', { encoding: 'utf-8' });
console.log('Logged in as:', result.trim());
