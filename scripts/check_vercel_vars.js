import https from 'https';

const TOKEN = process.env.VERCEL_TOKEN || process.argv[2];
if (!TOKEN) { console.error('Need token'); process.exit(1); }

const PROJECT_ID = 'prj_ke8rixqTto17KlwNLpRbWSHOtdi8';
const TEAM_ID = 'team_Mf228XWiXJHydTRcI4CHBmS';

https.get(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`, {
  headers: { Authorization: `Bearer ${TOKEN}` }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const json = JSON.parse(d);
    if (json.envs) {
      json.envs.forEach(env => {
        console.log(env.key + ' = ' + env.value + ' (target: ' + JSON.stringify(env.target) + ')');
      });
    } else {
      console.log(JSON.stringify(json, null, 2));
    }
  });
});
