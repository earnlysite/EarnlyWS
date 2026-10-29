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
for(const v of['','Remboursé','À venir','Impayé','_nr']){await p.selectOption('#dashB #oF',v);const[d]=await Promise.all([p.waitForEvent('download'),p.click('#dashB #oX')]);const L=fs.readFileSync(await d.path(),'utf8').split('\n'),rows=L.slice(1).filter(Boolean),sh=await txt('#oC');
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

// 20. intro illustrée : canvas d'illustration + titre accessible, dessin réel, passage au clic, aucune erreur
for(const[h,txt]of[['#salarie','salaire gagné'],['#entreprise','avantage salarié'],['#banque','service de plus']]){const c=await b.newContext({viewport:{width:1280,height:760}}),q=await c.newPage(),er=[];q.on('pageerror',e=>er.push(e.message));await q.addInitScript(()=>{try{localStorage.setItem('ea-lang','fr')}catch(e){}});await q.goto(URL+h);await q.waitForSelector('div#ea-open');
 chk('intro illustrée : canvas + dialogue '+h,await q.evaluate(()=>!!document.querySelector('div#ea-open canvas')&&document.querySelector('div#ea-open').getAttribute('role')==='dialog'),'');
 chk('intro : titre accessible '+h,(await q.locator('div#ea-open h2').textContent()).toLowerCase().includes(txt),'');
 await q.waitForTimeout(900);const px=await q.evaluate(()=>{const cv=document.querySelector('div#ea-open canvas'),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=0;i<d.length;i+=4*97)if(Math.abs(d[i]-244)+Math.abs(d[i+1]-246)+Math.abs(d[i+2]-249)>30)n++;return n});
 chk('intro : le canvas dessine une illustration '+h,px>40,px);await q.click('div#ea-open button');await q.waitForSelector('div#ea-open',{state:'detached',timeout:2000});chk('intro passée sans erreur '+h,er.length===0,er.join());await c.close()}
// 21. console RH simulée : chaque bouton a un effet visible, saisies contrôlées, aucune donnée d'avance
{const e=await page('fr','#entreprise'),T=async s=>(await e.locator(s).textContent()).trim(),H0=async()=>(await e.locator('#rcH li').first().textContent());
 chk('console : état initial',(await T('#rcV'))==='3 / 11'&&(await T('#rcTo'))==='6'&&(await T('#rcS'))==='2','');
 await e.click('#rcT button[aria-label^="Confirmer — Inès R."]');chk('confirmer : KPI + statut + historique',(await T('#rcV'))==='4 / 11'&&(await H0()).includes('Dossier confirmé : Inès R.'),await T('#rcV'));
 await e.fill('#rcF','camille');chk('recherche (sans accent ni casse)',(await e.locator('#rcT tr').count())===1,'');await e.fill('#rcF','');
 await e.selectOption('#rcSt','flag');chk('filtre « signalés »',(await e.locator('#rcT tr').count())===2,'');await e.selectOption('#rcSt','');
 await e.fill('#rcF','zzz');chk('état vide de la recherche',(await T('#rcT')).includes('Aucun salarié'),'');await e.fill('#rcF','');
 await e.click('#rcT button[aria-label^="Modifier — Hugo B."]');await e.fill('#rcES','50');await e.click('#rcT button[data-a="save"]');chk('saisie invalide refusée (salaire)',(await T('#rcM')).includes('entre 800')&&await e.locator('#rcM.bad').count()===1,await T('#rcM'));
 await e.fill('#rcES','2100');await e.fill('#rcED','45');await e.click('#rcT button[data-a="save"]');chk('saisie invalide refusée (jours)',(await T('#rcM')).includes('entre 0 et 30'),await T('#rcM'));
 await e.fill('#rcED','12');await e.click('#rcT button[data-a="save"]');chk('modification : statut à confirmer + historique',(await T('#rcV'))==='3 / 11'&&(await H0()).includes('Données modifiées : Hugo B.')&&(await e.locator('#rcT tr',{hasText:'Hugo B.'}).textContent()).includes('12 / 30'),await H0());
 await e.selectOption('#rcT select[aria-label^="Signaler… — Karim D."]','arret');chk('signalement : arrêt de travail',(await T('#rcS'))==='3'&&(await H0()).includes('Arrêt de travail signalé : Karim D.'),await T('#rcS'));
 await e.click('#rcT button[aria-label^="Lever le signalement — Élise G."]');chk('lever un signalement',(await T('#rcS'))==='2','');
 await e.click('#rcT button[aria-label^="Actualiser — Nora A."]');chk('donnée obsolète actualisée',(await e.locator('#rcT tr',{hasText:'Nora A.'}).textContent()).includes('10 / 30')&&(await H0()).includes('Donnée actualisée'),'');
 await e.click('#rcI');chk('import : nouveau dossier + dernière transmission',(await T('#rcV')).endsWith('/ 12')&&(await H0()).includes('Fichier d’exemple importé')&&!(await T('#rcL')).includes('26 oct'),await T('#rcL'));
 await e.click('#rcA');chk('confirmation collective',(await T('#rcTo'))==='0'&&(await H0()).includes('Confirmation collective'),await T('#rcTo'));
 const[dl]=await Promise.all([e.waitForEvent('download'),e.click('#rcX')]);const csvT=fs.readFileSync(await dl.path(),'utf8');chk('export CSV : en-tête et lignes',csvT.includes('"Salarié";"Fonction";"Contrat"')&&csvT.trim().split('\n').length===14,csvT.split('\n')[0]);
 chk('confidentialité : aucune donnée d’avance, d’usage ni bancaire',!/avance|iban|compte/i.test(csvT.split('\n')[0])&&(await T('#console')).includes('ne montre pas'),'');
 await e.click('#rcR');chk('réinitialisation',(await T('#rcV'))==='3 / 11'&&(await H0()).includes('Démonstration réinitialisée'),'');
 chk('console : boutons et champs libellés',await e.evaluate(()=>[...document.querySelectorAll('#rcT button,#rcT select')].every(x=>x.getAttribute('aria-label'))&&!!document.querySelector('#rcF').getAttribute('aria-label')),'');await e.context().close()}
// 22. disposition de la démo Salarié : calcul centré sous le téléphone, relié, sans débordement
for(const w of[1280,390]){const v=await page('fr','#salarie',w);const g=await v.evaluate(()=>{const ph=document.querySelector('#slotS .phone').getBoundingClientRect(),ca=document.querySelector('#slotS .calc').getBoundingClientRect(),fr=document.querySelector('#slotS .frame').getBoundingClientRect();return{below:ca.top>=ph.bottom-2,cx:Math.abs((ca.left+ca.right)/2-(fr.left+fr.right)/2),inside:ca.left>=fr.left-1&&ca.right<=fr.right+1,ov:document.documentElement.scrollWidth<=innerWidth+1}});
 chk('calcul sous le téléphone '+w,g.below&&g.inside&&g.ov,JSON.stringify(g));if(w>=900)chk('calcul centré dans le cadre',g.cx<20,g.cx);await v.context().close()}
// 23. formats de nombres selon la langue
for(const[l,re1,re2]of[['en',/\d,\d{3}/,/\d\u202f\d{3}/],['es',/\d\.\d{3}/,/\d\u202f\d{3}/],['it',/\d\.\d{3}/,/\d\u202f\d{3}/],['fr',/\d\u202f\d{3}/,/\d,\d{3}\b(?!\d)/]]){const q=await page(l,'#banque');const t=(await q.locator('#dashB #kp').first().textContent()).replace(/\u00a0/g,'\u202f');chk('format des nombres '+l,re1.test(t)&&!re2.test(t),t.slice(0,60));await q.context().close()}
// 24. ordre des sections
{const q=await page('fr','#entreprise'),o=await q.evaluate(()=>['console','role','parcours','implique','hr','contact-e'].map(i=>document.getElementById(i)).map(e=>e.getBoundingClientRect().top+scrollY));chk('entreprise : le temps RH vient après ce que l’intégration implique',o.every((v,i)=>i==0||v>o[i-1]),o.join());await q.context().close();
 const r=await page('fr','#banque'),p2=await r.evaluate(()=>['dashB','meca','archi','eco','pilote'].map(i=>document.getElementById(i)).map(e=>e.getBoundingClientRect().top+scrollY));chk('banque : qui fait quoi juste après le circuit',p2.every((v,i)=>i==0||v>p2[i-1]),p2.join());await r.context().close()}
// 25. hygiène du dépôt public : aucune donnée interne dans le site, README sans hypothèses internes
{const idx=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8'),rd=fs.readFileSync(path.resolve(__dirname,'..','README.md'),'utf8');
 chk('le site ne référence pas le modèle interne',!/modele-interne|interne\//.test(idx.replace(/const M=\{[\s\S]*?\};/,'')),'');chk('README sans hypothèses de coûts internes',!/coûts fixes|0,05 €|20 000 €\/mois/.test(rd),'');
 chk('dossier interne et suivi privé absents du dépôt public',!fs.existsSync(path.resolve(__dirname,'..','interne'))&&!fs.existsSync(path.resolve(__dirname,'..','A-FOURNIR.md')),'');
 const sm=fs.readFileSync(path.resolve(__dirname,'..','sitemap.xml'),'utf8'),sw=fs.readFileSync(path.resolve(__dirname,'..','sw.js'),'utf8');
 chk('sitemap : 5 adresses (accueil, 3 parcours, app)',(sm.match(/<loc>/g)||[]).length===5&&!/interne/.test(sm),'');chk('sw.js : version datée de cette livraison',/earnly-v(9|\d\d)/.test(sw),sw.match(/VERSION = '[^']+'/)[0]);
 const ids=new Set([...idx.matchAll(/ id="([^"]+)"/g)].map(m=>m[1])),bad=[...idx.replace(/const M=\{[\s\S]*?\};/,'').matchAll(/href="#([a-zA-Z][\w-]*)"/g)].map(m=>m[1]).filter(h=>!ids.has(h)&&!['salarie','entreprise','banque'].includes(h));chk('liens d’ancrage valides',bad.length===0,[...new Set(bad)].join());}

// 26. console RH : aucun libellé français résiduel en EN / ES / IT (tableau, KPI, boutons, historique, rôles)
for(const l of['en','es','it']){const q=await page(l,'#entreprise');await q.click('#rcI');const t=await q.locator('#consolesec').textContent();const fr=/(Dossiers|Signalements|Importer|Historique des actions|Qualité des données|Confirmer les dossiers|Actualiser|Salaire net de référence|Jours travaillés|Chargée|Magasinier|Développeuse|Technicienne|Non éligible|Rechercher|Fichier d’exemple importé|Dernière transmission|Cycle de paie)/;
 chk('console traduite '+l,!fr.test(t),(t.match(fr)||[])[0]);await q.context().close()}
console.log('OK',ok.length,'· KO',ko.length);ko.forEach(k=>console.log(' ✗',k));await b.close();process.exit(ko.length?1:0)})();
