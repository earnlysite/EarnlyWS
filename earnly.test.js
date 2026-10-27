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
// 7. simulation bancaire : valeurs de référence calculées à la main (frais, partage, pertes), sans coûts internes d'Earnly
await p.click('#dashB [data-tab="si"]');
const S=await p.evaluate(()=>EarnlyDash.sim);let V=0,NA=0;for(let k=0;k<12;k++){const na=12000*.4*3*Math.pow(1.03,k);NA+=na;V+=na*120}
chk('sim volume',near(S.V,V,1e-3),S.V);chk('sim frais HT (taux moyen 0,30 %)',near(S.HT,V*.003,1e-3),'');chk('sim Earnly + banque = frais (sans double comptage)',near(S.EA+S.BK,S.HT,1e-3),'');chk('sim pertes',near(S.LO,V*.002,1e-3),'');
chk('aucun coût interne d\'Earnly dans la simulation publique',!(await p.locator('[data-pn="si"]').textContent()).match(/Coûts fixes|Coût variable|Seuil de rentabilité|Résultat Earnly/)&&await p.locator('#sF,#sV,#sL,#sCo').count()==0,'');
// 8. traductions : aucun libellé français résiduel dans les nouveaux blocs
for(const l of['en','es','it']){const q=await page(l,'#banque');await q.click('#dashB [data-tab="si"]');await q.click('#dashB [data-tab="pf"]');const t1=await q.locator('#dashB [data-pn="pf"]').textContent();await q.click('#dashB [data-tab="si"]');const t2=await q.locator('#dashB [data-pn="si"]').textContent(),t3=await q.locator('#pilote').textContent();
 const fr=/(Pertes|Résultat|Contribution Earnly par avance|Marge contributive|Impayés échus|Coût variable|Critères d|Décisions possibles|Réussite technique|Maîtrise du risque|Dans ces hypothèses)/;
 chk('traduction '+l,!fr.test(t1+t2+t3),(t1+t2+t3).match(fr)&&(t1+t2+t3).match(fr)[0]);await q.context().close()}
// 9. mobile : pas de défilement horizontal
for(const h of['#salarie','#entreprise','#banque']){const m=await page('fr',h,390);chk('mobile sans débordement '+h,await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),await m.evaluate(()=>document.documentElement.scrollWidth));await m.context().close()}

// 10. structure : les panneaux du tableau de bord restent frères (pas de balise en trop)
chk('panneaux frères',await p.evaluate(()=>{const ps=[...document.querySelectorAll('#dashB [data-pn]')];return ps.length===6&&ps.every(x=>x.parentElement===ps[0].parentElement)}),'');
// 11. refonte visuelle : bloc de calcul intégré, hero sobre, démo en section, libellés d'interface
const vis=await page('fr','#salarie');
const V1=await vis.evaluate(()=>{const c=document.querySelector('.calc'),bg=(getComputedStyle(c).backgroundImage.includes('gradient')?[255,255]:getComputedStyle(c).backgroundColor.match(/\d+/g).map(Number)),t=c.innerText,h=document.querySelector('#v-s .hero');return{light:bg[0]>200&&bg[1]>200,snake:/[a-z]_[a-z]/.test(t),couche:/COUCHE/i.test(t),centered:getComputedStyle(h).textAlign=='center',demoInSection:!!document.querySelector('#sim #slotS .phone'),heroHasDemo:!!h.querySelector('.phone'),brief:document.querySelectorAll('#brief .card').length,demoTag:/DÉMO/.test(document.querySelector('.phone').innerText),h1:document.querySelector('#v-s h1').innerText}});
chk('bloc de calcul clair',V1.light,'');chk('bloc de calcul : libellés lisibles (pas de snake_case)',!V1.snake&&!V1.couche,'');chk('hero centré',V1.centered&&!V1.heroHasDemo,'');chk('démo dans sa propre section',V1.demoInSection,'');chk('« En bref » : 4 blocs',V1.brief==4,V1.brief);chk('plus de pastille DÉMO',!V1.demoTag,'');
await vis.context().close();
const bk=await page('fr','#banque');const R2=await bk.evaluate(()=>{const b=document.querySelector('.badge');return{pill:b?parseFloat(getComputedStyle(b).borderRadius)<20:true,fb:document.querySelector('#v-b .fb')?.innerText||''}});chk('pas de pastille arrondie coupant le texte',R2.pill,'');chk('barre de fenêtre sobre',!/démonstration|simulation/i.test(R2.fb),R2.fb);await bk.context().close();
// 12. valeurs dynamiques présentes dans le HTML statique (visibles sans JavaScript)
const raw=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8');
chk('aucun data-t vide dans le HTML statique',!/<(span|div|b)[^>]*data-t="\w+"[^>]*><\/\1>/.test(raw.replace(/<script[\s\S]*?<\/script>/g,'')),'');
// 13. une seule méthode employeur, un seul remboursement, plus de « piste A/B » ni de « mécanisme à définir »
const rawNoM=raw.replace(/const M=\{[\s\S]*?\};/,'');chk('plus de piste A/B',!/Piste [AB] ·/.test(rawNoM),'');chk('plus de mécanisme à valider',!/mécanisme (encore )?à (définir|valider)/.test(rawNoM),(rawNoM.match(/.{60}mécanisme (encore )?à (définir|valider).{20}/)||[''])[0]);
// 14. texte rendu : aucune anomalie dans les 4 langues et 3 parcours
for(const l of['fr','en','es','it'])for(const h of['#salarie','#entreprise','#banque']){const q=await page(l,h);const bad=await q.evaluate(()=>{const t=document.querySelector('.view.on').innerText;return /undefined|NaN|\bnull\b|\bde est\b/.test(t)||/\d[A-Za-zÉé]{4,}/.test(t.replace(/\d+(?:er|e|ème|st|nd|rd|th)/g,''))});chk('texte rendu sain '+l+h,!bad,'anomalie');await q.context().close()}
// 15. matrice des responsabilités et pilote : présents et traduits
for(const l of['en','es','it']){const q=await page(l,'#banque');const t=await q.locator('#v-b').textContent();chk('matrice traduite '+l,!/(Matrice des responsabilités|Financer et verser|Responsable :|Choix de conception|Conditions préalables)/.test(t)&&!/Tester l’avance sur salaire/.test(t),(t.match(/(Matrice des responsabilités|Financer et verser|Choix de conception|Conditions préalables|Tester l’avance sur salaire)/)||[])[0]);await q.context().close()}
// 16. héros centrés et démos en sections propres (Entreprise, Banque) comme sur la page Salarié
for(const h of['#entreprise','#banque']){const q=await page('fr',h);const r=await q.evaluate(()=>{const v=document.querySelector('.view.on'),hero=v.querySelector('.hero');return{center:getComputedStyle(hero).textAlign==='center',noDemo:!hero.querySelector('.frame,.phone'),pill:parseFloat(getComputedStyle(hero).borderRadius)<30,brief:!!v.querySelector('#gainsE,#gainsB'),demo:!!v.querySelector('#consolesec .frame,#dashB .frame')}});
 chk('héros centré '+h,r.center&&r.noDemo&&r.pill,JSON.stringify(r));chk('« En bref » puis démo '+h,r.brief&&r.demo,JSON.stringify(r));await q.context().close()}
// 17. intro : s'ouvre, se passe d'un clic, disparaît seule, respecte « réduire les animations »
{const c=await b.newContext({viewport:{width:1280,height:800},reducedMotion:'no-preference'}),q=await c.newPage();await q.addInitScript(()=>{try{localStorage.setItem('ea-lang','fr');localStorage.removeItem('earnly.dash')}catch(e){}});
 await q.goto(URL+'#banque');await q.waitForSelector('div#ea-open',{timeout:3000});chk('intro affichée',true,'');
 chk('intro adaptée au parcours demandé',(await q.locator('div#ea-open h2').textContent()).includes('service de plus'),await q.locator('div#ea-open h2').textContent());
 await q.click('div#ea-open button');await q.waitForSelector('div#ea-open',{state:'detached',timeout:2000});chk('intro passée au clic',true,'');
 chk('page révélée après l\'intro',await q.evaluate(()=>!!document.querySelector('.view.on .hero.hgo')&&document.documentElement.style.overflow!=='hidden'),'');
 const q2=await c.newPage();await q2.addInitScript(()=>{try{localStorage.setItem('ea-lang','fr')}catch(e){}});await q2.goto(URL+'#salarie');await q2.waitForSelector('div#ea-open');await q2.waitForSelector('div#ea-open',{state:'detached',timeout:6000});chk('intro terminée seule en moins de 6 s',true,'');
 await c.close();
 const r=await page('fr','#banque');chk('aucune intro avec « réduire les animations »',await r.evaluate(()=>!document.querySelector('div#ea-open')),'');await r.context().close()}
// 18. définitions : chaque bouton « i » renvoie à une ligne complète (définition, formule, période, source)
{const q=await page('fr','#banque');
 const r=await q.evaluate(()=>{const keys=[...document.querySelectorAll('#dashB .ib')].map(x=>x.dataset.def),rows={};document.querySelectorAll('#defsB tr').forEach(t=>rows[t.dataset.k]=[...t.children].map(c=>c.textContent.trim()));return{keys,rows}});
 chk('définitions : 5 cellules renseignées par ligne',Object.values(r.rows).length>=20&&Object.values(r.rows).every(c=>c.length===5&&c.every(x=>x.length>2)),JSON.stringify(Object.keys(r.rows)));
 for(const tab of['ov','pf','pi','si']){await q.click(`#dashB [data-tab="${tab}"]`);const ks=await q.evaluate(()=>[...document.querySelectorAll('#dashB [data-pn]:not([hidden]) .ib')].map(x=>x.dataset.def));const miss=ks.filter(k=>!r.rows[k]);chk('boutons « i » sans ligne manquante · '+tab,(tab==='pf'||ks.length>0)&&!miss.length,miss.join(','));
  const vis=await q.evaluate(()=>[...document.querySelectorAll('#defsB tr:not([hidden])')].length);chk('définitions visibles · '+tab,vis>0,vis)}
 await q.click('#dashB [data-tab="ov"]');await q.click('#dashB .ib');chk('bouton « i » ouvre et surligne la ligne',await q.evaluate(()=>document.querySelector('#defs').open&&!!document.querySelector('#defsB tr.hl')),'');
 await q.click('#dashB [data-tab="pa"]');chk('pas de tableau de définitions sur Paramètres',await q.evaluate(()=>document.querySelector('#defs').hidden),'');
 chk('définitions : aucun « hypothèse » répété dans la colonne Source',await q.evaluate(()=>![...document.querySelectorAll('#defsB tr')].some(t=>/hypoth/i.test(t.children[4].textContent))),'');await q.context().close()}
// 19. mobile : les tableaux deviennent des cartes lisibles
{const m=await page('fr','#banque',390);await m.click('#dashB [data-tab="op"]');
 const r=await m.evaluate(()=>{const t=document.querySelector('#oB'),tr=t.querySelector('tr'),td=tr.querySelector('td');return{rowBlock:getComputedStyle(tr).display==='block',label:td.dataset.l,thHidden:getComputedStyle(document.querySelector('#dashB [data-pn="op"] thead')).display==='none',noScroll:document.documentElement.scrollWidth<=innerWidth+1}});
 chk('mobile : tableau en cartes',r.rowBlock&&r.thHidden&&!!r.label&&r.noScroll,JSON.stringify(r));
 await m.click('#dashB [data-tab="pf"]');chk('mobile : rentabilité en cartes sans débordement',await m.evaluate(()=>getComputedStyle(document.querySelector('#pT tr')).display==='block'&&document.documentElement.scrollWidth<=innerWidth+1),'');await m.context().close()}
// 20. accessibilité et référencement : lien d'évitement, contrastes calculés, titre SEO de la Banque, description
{const q=await page('fr','#banque');const r=await q.evaluate(()=>{const L=h=>{h=h.replace('#','');const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)};const [r,g,b]=[0,2,4].map(i=>f(parseInt(h.substr(i,2),16)));return .2126*r+.7152*g+.0722*b},cr=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)},v=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();return{mut:cr(v('--mut'),'#f4f6f9'),gr2:cr(v('--gr2'),'#e7f8ef'),title:document.title,desc:document.querySelector('meta[name=description]')?.content.length>60,skip:document.querySelector('#skip')===document.querySelector('a,button,input,select,textarea,summary')}});
 chk('contraste --mut ≥ 4,5',r.mut>=4.5,r.mut);chk('contraste --gr2 ≥ 4,5',r.gr2>=4.5,r.gr2);chk('titre SEO Banque aligné sur le titre de la page',/Tester l.avance sur salaire/.test(r.title),r.title);chk('méta description',r.desc,'');chk('lien d\'évitement en premier',r.skip,'');
 await q.keyboard.press('Tab');chk('lien d\'évitement atteignable au clavier',await q.evaluate(()=>document.activeElement.id==='skip'),'');await q.keyboard.press('Enter');chk('lien d\'évitement envoie le focus sur la vue',await q.evaluate(()=>document.activeElement.id==='v-b'),'');await q.context().close()}
// 21. avertissements : une seule mention « aucun partenaire » par bloc de pied de page, et plus de « (hypothèses) » en colonne Source
{const q=await page('fr','#banque');const n=await q.evaluate(()=>[...document.querySelectorAll('#v-b .foot')].filter(f=>/aucun partenaire signé, aucune intégration active/i.test(f.textContent)).length);chk('avertissement de statut non répété (Banque)',n===0,n);await q.context().close()}
console.log('OK',ok.length,'· KO',ko.length);ko.forEach(k=>console.log(' ✗',k));await b.close();process.exit(ko.length?1:0)})();
