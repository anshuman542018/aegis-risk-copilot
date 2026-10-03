import {getDataset} from '../../../lib/snowflake';
export async function GET(){try{return Response.json(await getDataset(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Snowflake is configured but unavailable. Check the connection and run the bootstrap SQL.'},{status:503});}}
