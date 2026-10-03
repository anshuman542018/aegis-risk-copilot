import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
const values=JSON.parse(await fs.readFile('.secrets/runtime-env.json','utf8'));
values.SNOWFLAKE_CORTEX_ENABLED='false';
const cli=path.join(process.env.APPDATA,'npm/node_modules/vercel/dist/index.js');
for(const [key,value] of Object.entries(values)){
  await new Promise((resolve,reject)=>{
    const p=spawn(process.execPath,[cli,'env','add',key,'production','--yes','--force',key==='SNOWFLAKE_PRIVATE_KEY'?'--sensitive':'--no-sensitive'],{stdio:['pipe','inherit','inherit']});
    p.stdin.end(value);
    p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error(`Could not configure ${key}`)));
  });
}
