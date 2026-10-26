// Tests de non-régression Earnly. Usage : node tests/earnly.test.js  (Playwright requis ; ouvre ../index.html en local)
const path=require('path'),fs=require('fs');
let chromium;try{({chromium}=require('playwright'))}catch(e){({chromium}=require(process.env.PW_PATH||'/home/claude/.npm-global/lib/node_modules/playwright'))}
const URL='file://'+path.resolve(__dirname,'..','index.html'),ok=[],ko=[];
const chk=(n,c,d)=>(c?ok:ko).push(c?n:n+' → '+d),near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
(async()=>{const b=await chromium.launch();
async function page(lang,hash,w=1280){const c=await b.newContext({viewport:{width:w,height:900},reducedMotion:'reduce',acceptDownloads:true}),p=await c.newPage(),errs=[];
 p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(l=>{try{localStorage.setItem('ea-lang',l);sessionStorage.setItem('ea','1');localStorage.removeItem('earnly.dash')}catch(e){}},lang);
 await p.goto(URL+hash);await p.waitForTimeout(500);p.errs=errs;return p}
// 1. chargement sans erreur, 4 langues, 3 parcours
for(const l of['fr','en','es','it'])for(const h of['#salarie','#entreprise','#banque']){const p=await page(l,h);chk('chargement '+l+h,p.errs.length===0,p.errs.join(';'));await p.context().close()}
const p=await page('fr','#banque'),txt=s=>p.locator('#dashB '+s).first().textContent();
// 2. agrégats : recalcul indépendant sur 3 périodes
for(const per of['30','90','12']){await p.click(`#dashB #per [data-p="${per}"]`);
 const r=await p.evaluate(()=>{const D=EarnlyDash,f=D.f,t=D.t;let adv=0,A=0,B=0,rep=0,unp=0,enc=0;for(const x of D.OPS){if(x.d>=f&&x.d<=t){adv+=x.a;x.np?B+=x.a:A+=x.a}if(x.rd>=f&&x.rd<=t){if(x.s0=='Remboursé')rep+=x.a;if(x.s0=='Impayé')unp+=x.a}if(x.d<=t&&x.rd>t)enc+=x.a}
  const a=D.agg(f,t),s=D.ser(f,t),l=D.list();return{ok:a.adv==adv&&a.rep==rep&&a.unpP==unp&&a.enc==enc,ht:near(a.ht,A*.002+B*.007),split:near(a.ear+a.bank,a.ht),ttc:near(a.ttc,a.ht*1.2),ser:s.A.reduce((x,y)=>x+y,0)==adv&&s.R.reduce((x,y)=>x+y,0)==rep,list:l.reduce((z,o)=>z+o.a,0)==adv}
  function near(a,b){return Math.abs(a-b)<1e-6}});
 for(const k in r)chk(`période ${per} · ${k}`,r[k],'faux')}
// 3. exemples de référence du modèle : 300 € → 0,60 € (A) et 2,10 € (B), 50/50
chk('référence 300 € A',near(300*.2/100,.6)&&near(300*.2/100/2,.3),'');chk('référence 300 € B',near(300*.7/100,2.1)&&near(300*.7/100/2,1.05),'');
// 4. CSV : lignes = tableau, total = tableau, virgule décimale
await p.click('#dashB [data-tab="op"]');
for(const v of['','Remboursé','À venir','Impayé','_nr']){await p.selectOption('#dashB #oF',v);const[d]=await Promise.all([p.waitForEvent('download'),p.click('#dashB #oX')]);const L=fs.readFileSync(await d.path(),'utf8').split('\n'),rows=L.slice(1),sh=await txt('#oC');
 chk('csv lignes '+(v||'tous'),rows.length==+sh.split(' avances')[0].replace(/\D/g,''),sh);chk('csv total '+(v||'tous'),rows.reduce((z,l)=>z+ +l.split(';')[3],0)==+sh.split('total')[1].replace(/\D/g,''),sh);
 if(!v){chk('csv décimale virgule',/;\d+,\d{2};\d+,\d{2};/.test(rows[0]),rows[0]);chk('csv en-tête taux',L[0].includes('Taux (%)'),L[0])}}
// 5. paramètres, bornes, réinitialisation
await p.click('#dashB [data-tab="pa"]');await p.fill('#cFeeA','0.5');await p.fill('#cFeeB','1');await p.fill('#cShare','60');await p.fill('#cTva','10');
chk('paramètres appliqués',await p.evaluate(()=>{const a=EarnlyDash.agg(EarnlyDash.f,EarnlyDash.t),h=a.advA*.005+a.advB*.01;return Math.abs(a.ht-h)<1e-6&&Math.abs(a.ear-h*.6)<1e-6&&Math.abs(a.ttc-h*1.1)<1e-6}),'');
await p.fill('#cFeeA','20');chk('borne 0–5 %',(await txt('#cE')).includes('Hors plage')&&await p.evaluate(()=>EarnlyDash.C.feeA)==.5,'');
await p.click('#dashB #cR');chk('réinitialisation',JSON.stringify(await p.evaluate(()=>EarnlyDash.C))=='{"feeA":0.2,"feeB":0.7,"share":50,"tva":20}','');
// 6. pilote fictif : un incident n'est compté que si l'échéance est dans la fenêtre
const pl=await p.evaluate(()=>{const P=EarnlyDash.PL;return{AB:P.advA+P.advB==P.AM,rep:P.rep==P.R.reduce((x,y)=>x+y,0),rate:P.rep<=P.due}});chk('pilote cohérent',pl.AB&&pl.rep&&pl.rate,JSON.stringify(pl));
// 7. simulation de rentabilité : valeurs de référence calculées à la main
await p.click('#dashB [data-tab="si"]');
const S=await p.evaluate(()=>EarnlyDash.sim);let V=0,NA=0;for(let k=0;k<12;k++){const na=12000*.4*3*Math.pow(1.03,k);NA+=na;V+=na*120}
const HT=V*.003,EA=HT/2,LO=V*.002,LE=LO/2,VC=NA*.05,CT=EA-LE-VC,RS=CT-240000;
chk('sim volume',near(S.V,V,1e-3),S.V);chk('sim frais HT (taux moyen 0,30 %)',near(S.HT,HT,1e-3),'');chk('sim Earnly + banque = frais (sans double comptage)',near(S.EA+S.BK,S.HT,1e-3),'');
chk('sim pertes',near(S.LO,LO,1e-3),'');chk('sim contribution',near(S.CT,CT,1e-3),'');chk('sim résultat',near(S.RS,RS,1e-3),S.RS+' vs '+RS);
chk('sim seuil de perte',near(S.be,(120*.003*.5-.05)/(120*.5)*100,1e-9),S.be);
await p.fill('#sL','0');await p.dispatchEvent('#sL','input');chk('sim sans partage de pertes : seuil illimité',!isFinite(await p.evaluate(()=>EarnlyDash.sim.be)),'');
await p.fill('#sR','100');await p.dispatchEvent('#sR','input');chk('sim zéro perte',await p.evaluate(()=>EarnlyDash.sim.LO)==0,'');
// 8. traductions : aucun libellé français résiduel dans les nouveaux blocs
for(const l of['en','es','it']){const q=await page(l,'#banque');await q.click('#dashB [data-tab="si"]');await q.click('#dashB [data-tab="pf"]');const t1=await q.locator('#dashB [data-pn="pf"]').textContent();await q.click('#dashB [data-tab="si"]');const t2=await q.locator('#dashB [data-pn="si"]').textContent(),t3=await q.locator('#pilote').textContent();
 const fr=/(Pertes|Résultat|Contribution|Impayés échus|Coût variable|Critères d|Décisions possibles|Réussite technique|Maîtrise du risque|Dans ces hypothèses)/;
 chk('traduction '+l,!fr.test(t1+t2+t3),(t1+t2+t3).match(fr)&&(t1+t2+t3).match(fr)[0]);await q.context().close()}
// 9. mobile : pas de défilement horizontal
for(const h of['#salarie','#entreprise','#banque']){const m=await page('fr',h,390);chk('mobile sans débordement '+h,await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),await m.evaluate(()=>document.documentElement.scrollWidth));await m.context().close()}
console.log('OK',ok.length,'· KO',ko.length);ko.forEach(k=>console.log(' ✗',k));await b.close();process.exit(ko.length?1:0)})();
