import {Dataset,seedData,analyze} from './risk';
import {env} from './vercel-worker-env';
export function snowflakeConfig(key:string):string|undefined{return (env as unknown as Record<string,string>)[key]||process.env[key];}
type SQLResult={data?:string[][];statementHandle?:string;statementStatusUrl?:string;resultSetMetaData?:{numRows:number};message?:string};
async function keyPairToken():Promise<string>{
 const keyText=snowflakeConfig('SNOWFLAKE_PRIVATE_KEY');if(!keyText)throw new Error('Key missing');
 const account=snowflakeConfig('SNOWFLAKE_ACCOUNT_LOCATOR');const user=snowflakeConfig('SNOWFLAKE_USER');const fingerprint=snowflakeConfig('SNOWFLAKE_PUBLIC_KEY_FINGERPRINT');
 if(!account||!user||!fingerprint)throw new Error('Incomplete key-pair configuration.');
 const encode=(input:string|Uint8Array)=>btoa(typeof input==='string'?input:String.fromCharCode(...input)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
 const now=Math.floor(Date.now()/1000);const identity=`${account.toUpperCase()}.${user.toUpperCase()}`;
 const body=`${encode(JSON.stringify({alg:'RS256',typ:'JWT'}))}.${encode(JSON.stringify({iss:`${identity}.${fingerprint}`,sub:identity,iat:now,exp:now+300}))}`;
 const bytes=Uint8Array.from(atob(keyText.replace(/-----[^-]+-----/g,'').replace(/\s/g,'')),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(body));return `${body}.${encode(new Uint8Array(signature))}`;
}
export async function snowSQL(statement:string,bindings?:Record<string,{type:string;value:string}>):Promise<SQLResult>{
 const account=snowflakeConfig('SNOWFLAKE_ACCOUNT');
 const token=snowflakeConfig('SNOWFLAKE_PRIVATE_KEY')?await keyPairToken():snowflakeConfig('SNOWFLAKE_TOKEN');
 if(!account||!token)throw new Error('Snowflake connection is not configured.');
 if(!/^[a-zA-Z0-9.-]+$/.test(account))throw new Error('Invalid Snowflake account identifier.');
 const origin=`https://${account}.snowflakecomputing.com`;
 const headers={'Authorization':`Bearer ${token}`,'X-Snowflake-Authorization-Token-Type':snowflakeConfig('SNOWFLAKE_PRIVATE_KEY')?'KEYPAIR_JWT':snowflakeConfig('SNOWFLAKE_TOKEN_TYPE')||'PROGRAMMATIC_ACCESS_TOKEN','Content-Type':'application/json','Accept':'application/json','User-Agent':'AegisRisk/1.0'};
 const r=await fetch(`${origin}/api/v2/statements`,{method:'POST',headers,body:JSON.stringify({statement,timeout:20,warehouse:snowflakeConfig('SNOWFLAKE_WAREHOUSE')||'AEGIS_WH',database:'AEGIS_RISK',schema:'PUBLIC',role:snowflakeConfig('SNOWFLAKE_ROLE')||undefined,bindings}),signal:AbortSignal.timeout(25000)});
 let body:SQLResult=await r.json();
 if(!r.ok&&r.status!==202)throw new Error('Snowflake query failed. Check account permissions and warehouse status.');
 for(let i=0;r.status===202&&body.statementStatusUrl&&i<12;i++){
  if(!body.statementStatusUrl.startsWith('/api/v2/statements/'))throw new Error('Unexpected Snowflake status URL.');
  await new Promise(resolve=>setTimeout(resolve,500));
  const poll=await fetch(origin+body.statementStatusUrl,{headers,signal:AbortSignal.timeout(10000)});body=await poll.json();
  if(poll.status===200)return body;if(poll.status!==202)throw new Error('Snowflake query did not complete.');
 }
 if(!body.data)throw new Error('Snowflake query timed out.');return body;
}
export async function getDataset():Promise<{data:Dataset;mode:string;queryId:string|null}> {
 if(!snowflakeConfig('SNOWFLAKE_ACCOUNT')||(!snowflakeConfig('SNOWFLAKE_TOKEN')&&!snowflakeConfig('SNOWFLAKE_PRIVATE_KEY')))return {data:seedData(),mode:'synthetic-demo',queryId:null};
 const r=await snowSQL("SELECT OBJECT_CONSTRUCT('dataset', s.PAYLOAD, 'signals', (SELECT ARRAY_AGG(OBJECT_CONSTRUCT('account',ACCOUNT_ID,'score',SEVERITY_SCORE)) FROM AEGIS_RISK.PUBLIC.FRAUD_SIGNALS WHERE SEVERITY_SCORE>0)) FROM AEGIS_RISK.PUBLIC.DEMO_SNAPSHOT s LIMIT 1");
 const result=JSON.parse(r.data?.[0]?.[0]||'null') as {dataset:Dataset;signals:{account:string;score:number}[]};
 const data=result?.dataset;
 if(!data?.accounts||!data.transactions||!data.loans||!data.liquidity)throw new Error('Snowflake snapshot is missing or invalid. Run snowflake/bootstrap.sql.');
 const reference=analyze(data,1);if(reference.length!==(result.signals||[]).length||reference.some(a=>!result.signals.some(s=>s.account===a.account&&s.score===a.score)))throw new Error('Snowflake signals and reference calculations differ. Investigation data is blocked until reconciled.');
 return {data,mode:'snowflake-live',queryId:r.statementHandle||null};
}
