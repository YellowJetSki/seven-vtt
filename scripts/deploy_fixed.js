import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.VERCEL_TOKEN || process.argv[2];
if (!TOKEN) { console.error('Need VERCEL_TOKEN'); process.exit(1); }

const PROJECT_ID = 'prj_ke8rixqTto17KlwNLpRbWSHOtdi8';
const TEAM_ID = 'team_Mf228XWiXJHydTRcI4CHBmS';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.vercel.com' + path + '?teamId=' + TEAM_ID;
    const opts = { method, headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
    const req = https.request(url, opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Fetching existing env vars...');
  const existing = await api('GET', '/v9/projects/' + PROJECT_ID + '/env');
  const toDelete = (existing.envs || []).filter(e => e.key === 'VITE_DM_USERNAME' || e.key === 'VITE_DM_PASSWORD');
  
  for (const env of toDelete) {
    console.log('Deleting ' + env.key + ' (id: ' + env.id + ')...');
    await api('DELETE', '/v9/projects/' + PROJECT_ID + '/env/' + env.id);
  }
  
  const targets = ['production', 'preview', 'development'];
  for (const target of targets) {
    console.log('Adding VITE_DM_USERNAME=MikeJello (' + target + ')...');
    await api('POST', '/v10/projects/' + PROJECT_ID + '/env', {
      type: 'encrypted', key: 'VITE_DM_USERNAME', value: 'MikeJello', target: [target]
    });
    console.log('Adding VITE_DM_PASSWORD=Jello1 (' + target + ')...');
    await api('POST', '/v10/projects/' + PROJECT_ID + '/env', {
      type: 'encrypted', key: 'VITE_DM_PASSWORD', value: 'Jello1', target: [target]
    });
  }
  
  console.log('\nBuilding...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  
  console.log('\nDeploying...');
  execSync('npx vercel --cwd vtt --prod --force', { stdio: 'inherit', timeout: 120000 });
  
  console.log('\nDone!');
}

main().catch(console.error);
