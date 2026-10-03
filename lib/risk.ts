export type Transaction = {id:string;account:string;to:string;amount:number;time:string;country:string;channel:string;device:string};
export type Account = {id:string;name:string;segment:string;country:string;device:string;balance:number;kyc:string};
export type Loan = {id:string;account:string;sector:string;ead:number;pd:number;lgd:number;daysPastDue:number};
export type Dataset = {transactions:Transaction[];accounts:Account[];loans:Loan[];liquidity:{hqla:number;outflows:number;inflows:number};asOf:string};
export type Alert = {id:string;account:string;score:number;amount:number;rules:{code:string;label:string;points:number;detail:string}[];transactions:Transaction[]};
export function cycleEvidence(data:Dataset,account:string):Transaction[]{
 const transfers=data.transactions.filter(t=>t.channel==='Transfer');
 for(const t of transfers.filter(t=>t.account===account))for(const u of transfers.filter(u=>u.account===t.to&&u.to!==account))for(const v of transfers.filter(v=>v.account===u.to&&v.to===account)){
 if(new Set([t.account,u.account,v.account]).size===3&&Math.max(...[t,u,v].map(x=>Date.parse(x.time)))-Math.min(...[t,u,v].map(x=>Date.parse(x.time)))<=86400000)return [t,u,v];
 }return [];
}
export const policies = [
 {id:'POL-01',title:'Velocity monitoring',text:'Five or more outward payments within any 30-minute window require investigation. A monitoring signal is not proof of fraud.',source:'Synthetic internal AML policy v1.0, section 2.1'},
 {id:'POL-02',title:'Payment structuring',text:'Three or more payments between INR 45,000 and INR 50,000 to the same beneficiary within 24 hours trigger a structuring review. These thresholds are internal demonstration settings, not statutory thresholds.',source:'Synthetic internal AML policy v1.0, section 2.2'},
 {id:'POL-03',title:'Shared-device accounts',text:'A device used by three or more account holders is a linkage signal; shared households and authorized business operators must be investigated before escalation.',source:'Synthetic internal AML policy v1.0, section 2.3'},
 {id:'POL-04',title:'Circular movement',text:'A directed three-account payment cycle within 24 hours requires a documented review of purpose, source of funds and beneficial ownership.',source:'Synthetic internal AML policy v1.0, section 2.4'},
 {id:'POL-05',title:'Credit exposure methodology',text:'Expected loss = exposure at default × probability of default × loss given default. Probabilities and losses are synthetic assumptions; this is a scenario calculation, not a validated underwriting model.',source:'Synthetic risk methodology v1.0, section 3'},
 {id:'POL-06',title:'Liquidity coverage methodology',text:'Illustrative LCR = high-quality liquid assets / (30-day outflows − min(inflows, 75% of outflows)). A 100% baseline is an illustration of the Basel LCR minimum under normal conditions; asset eligibility and jurisdictional reporting require separate validation.',source:'Basel Committee LCR standard, January 2013; synthetic balance sheet'},
];
export function seedData():Dataset {
 const accounts:Account[]=Array.from({length:40},(_,i)=>({id:`ACC-${String(i+1).padStart(3,'0')}`,name:`Synthetic entity ${String(i+1).padStart(2,'0')}`,segment:i%3===0?'Business':'Retail',country:'IN',device:i<3?'DEV-SHARED-01':`DEV-${i+1}`,balance:120000+(i*71893)%980000,kyc:i===3||i===7?'Review due':'Verified'}));
 const transactions:Transaction[]=Array.from({length:240},(_,i)=>({id:`TX-${String(i+1).padStart(4,'0')}`,account:accounts[i%40].id,to:accounts[(i*7+11)%40].id,amount:700+(i*1397)%31000,time:new Date(Date.UTC(2026,9,3,1)+i*180000).toISOString(),country:'IN',channel:i%4===0?'Card':'UPI',device:accounts[i%40].device}));
 const add=(a:number,b:number,amt:number,min:number,country='IN')=>transactions.push({id:`TX-${String(transactions.length+1).padStart(4,'0')}`,account:accounts[a].id,to:accounts[b].id,amount:amt,time:new Date(Date.UTC(2026,9,3,12)+min*60000).toISOString(),country,channel:'Transfer',device:accounts[a].device});
 add(0,1,48000,0);add(1,2,47500,5);add(2,0,47000,10);
 [12,15,18,20,22,25].forEach((m,i)=>add(0,4,46000+i*500,m));
 [0,5,10,15,20,25].forEach((m,i)=>add(3,9,68000+i*2000,m));
 add(7,12,920000,7,'AE');add(7,14,650000,18,'SG');
 const loans:Loan[]=Array.from({length:30},(_,i)=>({id:`LN-${i+1}`,account:accounts[i].id,sector:['Retail','Manufacturing','Real estate','Services'][i%4],ead:350000+i*182000,pd:0.012+(i%7)*0.014,lgd:0.35+(i%3)*0.1,daysPastDue:i%9===0?95:i%5===0?38:0}));
 return {accounts,transactions,loans,liquidity:{hqla:15000000,outflows:20000000,inflows:6000000},asOf:'2026-10-03T18:00:00+05:30'};
}
export function analyze(data:Dataset,threshold=60):Alert[] {
 return data.accounts.map(a=>{
 const tx=data.transactions.filter(t=>t.account===a.id).sort((x,y)=>Date.parse(x.time)-Date.parse(y.time));
 const rules:Alert['rules']=[];
 const maxVelocity=Math.max(0,...tx.map(t=>tx.filter(x=>Date.parse(x.time)>=Date.parse(t.time)&&Date.parse(x.time)<Date.parse(t.time)+30*60000).length));
 if(maxVelocity>=5)rules.push({code:'POL-01',label:'Payment velocity',points:30,detail:`${maxVelocity} outward payments within 30 minutes.`});
 const structured=tx.filter(t=>t.amount>=45000&&t.amount<=50000);
 const structCount=Math.max(0,...structured.map(t=>structured.filter(x=>x.to===t.to&&Math.abs(Date.parse(x.time)-Date.parse(t.time))<=86400000).length));
 if(structCount>=3)rules.push({code:'POL-02',label:'Possible structuring',points:25,detail:`${structCount} payments of INR 45,000–50,000 to one beneficiary in 24 hours.`});
 const shared=data.accounts.filter(x=>x.device===a.device).length;
 if(shared>=3)rules.push({code:'POL-03',label:'Shared device',points:20,detail:`${shared} accounts share device ${a.device}.`});
 const cycle=tx.some(t=>t.channel==='Transfer'&&data.transactions.some(u=>u.channel==='Transfer'&&u.account===t.to&&u.to!==a.id&&Math.abs(Date.parse(u.time)-Date.parse(t.time))<=86400000&&data.transactions.some(v=>v.channel==='Transfer'&&v.account===u.to&&v.to===a.id&&Math.max(Date.parse(t.time),Date.parse(u.time),Date.parse(v.time))-Math.min(Date.parse(t.time),Date.parse(u.time),Date.parse(v.time))<=86400000)));
 if(cycle)rules.push({code:'POL-04',label:'Circular transfers',points:35,detail:'Account belongs to a three-account transfer cycle within 24 hours.'});
 if(tx.some(t=>t.country!==a.country&&t.amount>=500000))rules.push({code:'INT-05',label:'Large cross-border payment',points:25,detail:'Cross-border payment exceeds the internal INR 500,000 monitoring threshold.'});
 if(a.kyc==='Review due')rules.push({code:'INT-06',label:'KYC review due',points:15,detail:'Scheduled KYC review is outstanding.'});
 return {id:`CASE-${a.id.slice(4)}`,account:a.id,score:Math.min(100,rules.reduce((s,r)=>s+r.points,0)),amount:tx.reduce((s,t)=>s+t.amount,0),rules,transactions:tx};
 }).filter(a=>a.score>=threshold).sort((a,b)=>b.score-a.score);
}
export function credit(data:Dataset,pdShock=1){return {ead:data.loans.reduce((s,l)=>s+l.ead,0),loss:data.loans.reduce((s,l)=>s+l.ead*Math.min(1,l.pd*pdShock)*l.lgd,0),pastDue:data.loans.filter(l=>l.daysPastDue>=90).reduce((s,l)=>s+l.ead,0)};}
export function liquidity(data:Dataset,shock=0){const outflows=data.liquidity.outflows*(1+shock/100);const net=outflows-Math.min(data.liquidity.inflows,outflows*.75);return {outflows,net,lcr:100*data.liquidity.hqla/net,shortfall:Math.max(0,net-data.liquidity.hqla)};}
export const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export const compact=(n:number)=>n>=10000000?`₹${(n/10000000).toFixed(2)} Cr`:n>=100000?`₹${(n/100000).toFixed(2)} L`:money(n);
