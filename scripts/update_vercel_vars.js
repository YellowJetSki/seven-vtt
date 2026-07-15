import https from 'https';

const TOKEN = process.env.VERCEL_TOKEN || process.argv[2];

if (!TOKEN) {
  console.error('Need VERCEL_TOKEN env var or arg');
  process.exit(1);
}

const PROJECT_ID = 'prj_ke8rixqTto17KlwNLpRbWSHOtdi8';
const TEAM_ID = 'team_Mf228XWiXJHydTRcI4CHBmS';

async function getExisting() {
  return new Promise((resolve, reject) => {
    const u = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
    const r = https.get(u, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    r.on('error', reject);
    r.end();
  });
}

async function delEnv(id) {
  return new Promise((resolve, reject) => {
    const u = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${id}?teamId=${TEAM_ID}`;
    const r = https.request(u, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN}` } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    r.on('error', reject);
    r.end();
  });
}

async function addEnv(k, v) {
  return new Promise((resolve, reject) => {
    const u = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
    const b = JSON.stringify({ type: 'encrypted', key: k, value: v, target: ['production'] });
    const r = https.request(u, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    r.on('error', reject);
    r.write(b);
    r.end();
  });
}

async function main() {
  console.log('Fetching existing Vercel env vars...');
  const existing = await getExisting();
  let count = 0;
  for (const env of (existing.envs || [])) {
    if (env.key === 'VITE_DM_USERNAME' || env.key === 'VITE_DM_PASSWORD') {
      console.log('Deleting ' + env.key + '...');
      await delEnv(env.id);
      count++;
    }
  }
  console.log('Deleted ' + count + ' old env vars');
  console.log('Adding VITE_DM_USERNAME=MikeJello...');
  await addEnv('VITE_DM_USERNAME', 'MikeJello');
  console.log('Adding VITE_DM_PASSWORD=Jello1...');
  await addEnv('VITE_DM_PASSWORD', 'Jello1');
  console.log('Success! Vercel env vars updated.');
}

main().catch(console.error);
