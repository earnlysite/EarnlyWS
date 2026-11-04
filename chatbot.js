/* Earnly : assistant hybride. Le mode local fonctionne sans serveur ni API ; un Worker sécurisé
   peut être configuré en option pour les questions libres. Les réponses suivent la langue choisie (fr, en, es, it).
   Pour modifier une réponse : éditez le sujet correspondant dans TOPICS (champ a). Pour ajouter un sujet : ajoutez un objet à TOPICS.
   Les chiffres (40 %, 0,20 %, 0,70 %) sont lus dans CFG ci-dessous : gardez-les alignés avec index.html. */
(() => {
  if (window.__eaChat) return; window.__eaChat = 1;
  const CFG = { cap: .40, a: .002, b: .007, days: 30 };
  const LS = ['fr', 'en', 'es', 'it'];
  const L = LS.includes(window.EA_LANG) ? window.EA_LANG : (LS.includes(document.documentElement.lang) ? document.documentElement.lang : 'fr');
  const LOC = window.EA_LOC || ({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT' })[L];
  const nf = (v, d = 2) => new Intl.NumberFormat(LOC, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const eur = v => nf(v, Number.isInteger(v) ? 0 : 2) + '\u00a0€';
  const pct = v => nf(v * 100, 2) + '\u00a0%';

  /* ---------- Textes de l'interface ---------- */
  const UI = {
    fr: { open: 'Poser une question', close: 'Fermer', title: 'Assistant Earnly', sub: 'Posez votre question, même avec des fautes', ph: 'Votre question…', send: 'Envoyer', clear: 'Nouvelle conversation',
      hello: 'Bonjour ! Je réponds à vos questions sur Earnly : le principe, les frais, le remboursement, les données, le rôle de l’entreprise ou de la banque. Earnly est un concept en conception, avec des données fictives.',
      note: 'Assistant automatique. Messages conservés dans cet onglet uniquement ; aucun envoi au serveur. Pas de conseil financier ou juridique.',
      fb: 'Je peux répondre sur Earnly, son fonctionnement et les hypothèses du projet, mais je n’ai pas trouvé de réponse fiable à cette question. Reformulez-la ou choisissez un sujet ci-dessous.',
      found: 'Voici le passage du site qui semble le plus proche de votre question :',
      noteAI: 'Avec l’IA activée, les questions libres sont transmises au service configuré ; les calculs restent locaux. N’envoyez aucune donnée bancaire, de paie ou sensible.',
      thanks: 'Avec plaisir ! D’autres questions ?', bye: 'À bientôt !', more: 'Pour aller plus loin :', typing: 'L’assistant écrit…', views: { s: 'Page Salarié', e: 'Page Entreprise', b: 'Page Banque' } },
    en: { open: 'Ask a question', close: 'Close', title: 'Earnly assistant', sub: 'Ask naturally, even with typos', ph: 'Your question…', send: 'Send', clear: 'New conversation',
      hello: 'Hello! I can answer questions about Earnly: the principle, fees, repayment, data, and the role of the employer or the bank. Earnly is a concept in design, with fictional data.',
      note: 'Automatic assistant. Messages stay in this browser tab; nothing is sent to a server. No financial or legal advice.',
      fb: 'I can answer questions about Earnly and the project assumptions, but I could not find a reliable answer to this question. Rephrase it or choose a topic below.',
      found: 'This is the passage on the site that seems closest to your question:',
      noteAI: 'With AI enabled, free-form questions are sent to the configured AI service; calculations stay local. Do not send bank, payroll or sensitive data.',
      thanks: 'My pleasure! Any other questions?', bye: 'See you soon!', more: 'To go further:', typing: 'The assistant is typing…', views: { s: 'Employee page', e: 'Company page', b: 'Bank page' } },
    es: { open: 'Hacer una pregunta', close: 'Cerrar', title: 'Asistente Earnly', sub: 'Pregunte con naturalidad, incluso con errores', ph: 'Su pregunta…', send: 'Enviar', clear: 'Nueva conversación',
      hello: '¡Hola! Respondo a sus preguntas sobre Earnly: el principio, las comisiones, el reembolso, los datos y el papel de la empresa o del banco. Earnly es un concepto en diseño, con datos ficticios.',
      note: 'Asistente automático. Los mensajes permanecen en esta pestaña; no se envían a ningún servidor. Sin asesoramiento financiero ni jurídico.',
      fb: 'Puedo responder sobre Earnly y las hipótesis del proyecto, pero no he encontrado una respuesta fiable. Reformule la pregunta o elija un tema.',
      found: 'Este es el pasaje del sitio que parece más relacionado con su pregunta:',
      noteAI: 'Con la IA activada, las preguntas libres se envían al servicio configurado; los cálculos permanecen locales. No envíe datos bancarios, de nómina ni sensibles.',
      thanks: '¡Con gusto! ¿Alguna otra pregunta?', bye: '¡Hasta pronto!', more: 'Para saber más:', typing: 'El asistente está escribiendo…', views: { s: 'Página Empleado', e: 'Página Empresa', b: 'Página Banco' } },
    it: { open: 'Fai una domanda', close: 'Chiudi', title: 'Assistente Earnly', sub: 'Fai la tua domanda, anche con errori', ph: 'La sua domanda…', send: 'Invia', clear: 'Nuova conversazione',
      hello: 'Buongiorno! Rispondo alle sue domande su Earnly: il principio, i costi, il rimborso, i dati e il ruolo dell’azienda o della banca. Earnly è un concept in progettazione, con dati fittizi.',
      note: 'Assistente automatico. I messaggi restano in questa scheda; non vengono inviati a un server. Nessuna consulenza finanziaria o legale.',
      fb: 'Posso rispondere su Earnly e sulle ipotesi del progetto, ma non ho trovato una risposta affidabile. Riformuli la domanda o scelga un argomento.',
      found: 'Ecco il passaggio del sito che sembra più vicino alla sua domanda:',
      noteAI: 'Con l’IA attivata, le domande libere vengono inviate al servizio configurato; i calcoli restano locali. Non invii dati bancari, retributivi o sensibili.',
      thanks: 'Con piacere! Altre domande?', bye: 'A presto!', more: 'Per approfondire:', typing: 'L’assistente sta scrivendo…', views: { s: 'Pagina Dipendente', e: 'Pagina Azienda', b: 'Pagina Banca' } }
  }[L];

  /* ---------- Base de connaissances ----------
     id, v (parcours concerné), k (radicaux de mots-clés, séparés par |, sans accents), l (libellé du bouton), a (réponse), go (vue à ouvrir) */
  const TOPICS = [
    { id: 'what', v: 'sebd', go: 's',
      k: { fr: 'earnly|c est quoi|c koi|koi|principe|concept|a quoi ca sert|presente|fonctionne|comment ca marche|cmt ca marche|avance sur salaire|salaire gagne', en: 'earnly|what is|principle|concept|how does it work|how it works|salary advance|earned wage|earned salary|what do you do', es: 'earnly|que es|principio|concepto|como funciona|adelanto|salario ganado', it: 'earnly|cos e|principio|concept|come funziona|anticipo|stipendio maturato' },
      l: { fr: 'C’est quoi, Earnly ?', en: 'What is Earnly?', es: '¿Qué es Earnly?', it: 'Che cos’è Earnly?' },
      a: { fr: 'Chaque jour travaillé vous rapporte une part de salaire, versée plus tard. Earnly calcule ce que vous avez déjà gagné et, avec une banque partenaire, vous permettrait d’en recevoir une partie avant la date de paie, sans changer cette date. Ce n’est pas une banque : Earnly ne manipule aucun fonds.',
        en: 'Every day you work earns you a share of salary that is paid later. Earnly calculates what you have already earned and, with a partner bank, would let you receive part of it before payday, without changing the payday itself. Earnly is not a bank and never handles any funds.',
        es: 'Cada día trabajado le genera una parte del salario que se paga más tarde. Earnly calcula lo que ya ha ganado y, con un banco socio, le permitiría recibir una parte antes del día de pago, sin cambiar esa fecha. Earnly no es un banco y no maneja fondos.',
        it: 'Ogni giorno lavorato le fa maturare una quota di stipendio pagata più tardi. Earnly calcola quanto ha già maturato e, con una banca partner, le permetterebbe di riceverne una parte prima della paga, senza cambiarne la data. Earnly non è una banca e non gestisce fondi.' } },
    { id: 'status', v: 'sebd', go: 's',
      k: { fr: 'disponible|dispo|existe|reel|vrai|souscrire|telecharger|lancement|lance|partenaire signe|banque partenaire|fictif|demo|essayer|utiliser|ouvert|date', en: 'available|exist|real|subscribe|download|launch|signed|partner bank|fictional|fake|demo|try|use it|when|live', es: 'disponible|existe|real|suscribir|descargar|lanzamiento|firmado|banco socio|ficticio|demo|probar|usar|cuando', it: 'disponibile|esiste|reale|sottoscrivere|scaricare|lancio|firmato|banca partner|fittizio|demo|provare|usare|quando' },
      l: { fr: 'Est-ce disponible ?', en: 'Is it available?', es: '¿Está disponible?', it: 'È disponibile?' },
      a: { fr: 'Pas encore. Earnly est un concept en conception : aucune banque n’est connectée, aucune intégration de paie n’est active, aucun partenaire n’est signé. La démonstration du site utilise des données fictives et aucune demande réelle ne peut être faite ici.',
        en: 'Not yet. Earnly is a concept in design: no bank is connected, no payroll integration is active and no partner has signed. The demo on this site uses fictional data and no real request can be made here.',
        es: 'Todavía no. Earnly es un concepto en diseño: no hay ningún banco conectado, ninguna integración de nómina activa ni ningún socio firmado. La demo usa datos ficticios y aquí no se puede hacer ninguna solicitud real.',
        it: 'Non ancora. Earnly è un concept in progettazione: nessuna banca collegata, nessuna integrazione paghe attiva, nessun partner firmato. La demo usa dati fittizi e qui non si può fare alcuna richiesta reale.' } },
    { id: 'cap', v: 's', go: 's',
      k: { fr: 'combien|plafond|40|maximum|montant|limite|jusqu a|accessible|pourcentage', en: 'cap|ceiling|40|maximum|limit|up to|accessible|percentage|amount', es: 'cuanto|limite|tope|40|maximo|importe|hasta|accesible|porcentaje', it: 'quanto|massimale|tetto|40|massimo|importo|fino a|accessibile|percentuale' },
      l: { fr: 'Combien puis-je avoir ?', en: 'How much could I get?', es: '¿Cuánto podría recibir?', it: 'Quanto potrei ottenere?' },
      a: { fr: 'Jusqu’à 40 % du salaire déjà gagné dans le mois, calculé sur votre salaire net de référence (hors primes variables). Exemple : 2 400 € de salaire net et 10 jours travaillés sur 30 donnent 800 € gagnés, soit jusqu’à 320 € accessibles. Le plafond de 40 % est une hypothèse de travail, ni une limite légale ni une garantie. Écrivez-moi votre salaire et vos jours (« 2 000 et 12 jours ») et je calcule.',
        en: 'Up to 40% of the salary already earned in the month, based on your reference net salary (excluding variable bonuses). Example: a net salary of €2,400 and 10 days worked out of 30 gives €800 earned, so up to €320 accessible. The 40% cap is a working assumption, neither a legal limit nor a guarantee. Tell me your salary and days (“2000 and 12 days”) and I’ll calculate.',
        es: 'Hasta el 40 % del salario ya ganado en el mes, calculado sobre su salario neto de referencia (sin primas variables). Ejemplo: 2 400 € netos y 10 días trabajados de 30 dan 800 € ganados, es decir, hasta 320 € accesibles. El tope del 40 % es una hipótesis de trabajo, ni un límite legal ni una garantía. Escríbame su salario y los días («2000 y 12 días») y lo calculo.',
        it: 'Fino al 40 % dello stipendio già maturato nel mese, calcolato sul suo stipendio netto di riferimento (esclusi i premi variabili). Esempio: 2.400 € netti e 10 giorni lavorati su 30 danno 800 € maturati, cioè fino a 320 € accessibili. Il massimale del 40 % è un’ipotesi di lavoro, non un limite di legge né una garanzia. Mi scriva stipendio e giorni («2000 e 12 giorni») e calcolo.' } },
    { id: 'fee', v: 'sb', go: 's',
      k: { fr: 'frais|cout|coute|tarif|prix|payer|gratuit|taux|0,20|0,70|0.2|0.7|commission|interet', en: 'fee|cost|price|pay|free|rate|0.20|0.70|commission|interest|charge', es: 'comision|coste|cuesta|tarifa|precio|pagar|gratis|tasa|0,20|0,70|interes|gastos', it: 'costo|costa|tariffa|prezzo|pagare|gratis|tasso|0,20|0,70|commissione|interesse|spese' },
      l: { fr: 'Combien ça coûte ?', en: 'What does it cost?', es: '¿Cuánto cuesta?', it: 'Quanto costa?' },
      a: { fr: 'Des frais en euros, affichés avant que vous confirmiez : 0,20 % du montant si vous êtes client d’une banque partenaire, 0,70 % sinon. Pour 300 € : 0,60 € ou 2,10 €. Ce sont des hypothèses commerciales à valider, tout comme leur traitement fiscal. Dites-moi un montant (« frais pour 450 € ») et je calcule.',
        en: 'Fees in euros, shown before you confirm: 0.20% of the amount if you bank with a partner bank, 0.70% otherwise. For €300: €0.60 or €2.10. These are commercial assumptions to be validated, as is their tax treatment. Give me an amount (“fees for 450”) and I’ll calculate.',
        es: 'Comisiones en euros, mostradas antes de confirmar: 0,20 % del importe si es cliente de un banco socio, 0,70 % en caso contrario. Para 300 €: 0,60 € o 2,10 €. Son hipótesis comerciales por validar, igual que su tratamiento fiscal. Dígame un importe («comisión de 450 €») y lo calculo.',
        it: 'Costi in euro, mostrati prima della conferma: 0,20 % dell’importo se è cliente di una banca partner, 0,70 % altrimenti. Per 300 €: 0,60 € o 2,10 €. Sono ipotesi commerciali da validare, come il loro trattamento fiscale. Mi indichi un importo («costi per 450 €») e calcolo.' } },
    { id: 'repay', v: 'sbe', go: 's',
      k: { fr: 'rembours|preleve|prelevement|sepa|mandat|jour de paie|rendre|rembourse', en: 'repay|refund|direct debit|debit|sepa|mandate|payday|pay back|paid back', es: 'reembols|devol|adeud|domicili|sepa|mandato|dia de pago|devolver', it: 'rimbors|restitu|addebit|sepa|mandato|giorno di paga|restituire' },
      l: { fr: 'Comment je rembourse ?', en: 'How do I repay?', es: '¿Cómo se reembolsa?', it: 'Come rimborso?' },
      a: { fr: 'Votre salaire est versé normalement. Le jour de la paie, la banque prélève l’avance et les frais sur votre compte, selon le mandat SEPA que vous avez accepté. Si le solde est insuffisant, le prélèvement est rejeté, vos nouvelles avances sont suspendues et la banque propose une régularisation. C’est un choix de conception, non contractualisé et non activé.',
        en: 'Your salary is paid as usual. On payday, the bank debits the advance and the fees from your account under the SEPA mandate you accepted. If the balance is insufficient, the debit is rejected, new advances are suspended and the bank proposes a suitable settlement. This is a design choice, not contracted and not active.',
        es: 'Su salario se abona con normalidad. El día de pago, el banco adeuda el adelanto y las comisiones en su cuenta, según el mandato SEPA aceptado. Si el saldo es insuficiente, el adeudo se rechaza, se suspenden los nuevos adelantos y el banco propone una regularización. Es una decisión de diseño, no contratada ni activada.',
        it: 'Il suo stipendio viene versato normalmente. Il giorno della paga la banca addebita anticipo e costi sul suo conto, secondo il mandato SEPA accettato. Se il saldo è insufficiente, l’addebito viene respinto, i nuovi anticipi sono sospesi e la banca propone una regolarizzazione. È una scelta di progetto, non contrattualizzata né attiva.' } },
    { id: 'data', v: 'seb', go: 's',
      k: { fr: 'donnee|confidential|rgpd|vie privee|prive|voit|voir|banc|collect|securite|secret|historique|avance|habitude', en: 'data|privacy|gdpr|private|see|sees|bank details|collect|security|confidential|history|advance|usage', es: 'dato|privacidad|rgpd|privado|ve |ven |bancari|recopil|seguridad|confidencial|historial|adelanto|uso', it: 'dati|privacy|gdpr|privato|vede|bancari|raccol|sicurezza|riservat|storico|anticipo|utilizzo' },
      l: { fr: 'Et mes données ?', en: 'What about my data?', es: '¿Y mis datos?', it: 'E i miei dati?' },
      a: { fr: 'Dans le modèle envisagé, l’employeur confirmerait votre emploi, votre salaire de référence et vos jours travaillés. Il n’aurait pas vocation à voir l’historique de vos avances, vos habitudes d’utilisation ni vos informations bancaires. Le site ne demande aucune donnée bancaire ni analyse de dépenses. Dans cette démonstration, l’historique du chatbot est conservé temporairement dans le stockage de session de votre onglet. En mode local, vos questions ne sont pas envoyées à un serveur. Si le mode IA facultatif est activé, les questions libres et les derniers échanges sont transmis au relais configuré puis à l’API d’OpenAI. Ne saisissez aucune donnée bancaire, de paie ou sensible. La conservation, les rôles RGPD et les mesures de sécurité du futur service restent à définir ; aucune certification n’est revendiquée.',
        en: 'In the envisaged model, the employer would confirm your employment, reference salary and days worked. The employer would not be intended to see your advance history, usage habits or bank details. The site does not request bank details or spending analysis. In this demo, chatbot history is kept temporarily in your tab’s session storage. In local mode, your questions are not sent to a server. If optional AI mode is enabled, free-form questions and recent exchanges are sent to the configured relay and then to the OpenAI API. Do not enter bank details, payroll data or other sensitive information. Retention, GDPR roles and security measures for the future service remain to be defined; no certification is claimed.',
        es: 'En el modelo previsto, el empleador confirmaría su empleo, su salario de referencia y los días trabajados. No estaría previsto que pudiera ver el historial de sus adelantos, sus hábitos de uso ni sus datos bancarios. El sitio no solicita datos bancarios ni análisis de gastos. En esta demostración, el historial del chatbot se conserva temporalmente en el almacenamiento de sesión de la pestaña. En modo local, sus preguntas no se envían a ningún servidor. Si se activa el modo IA opcional, las preguntas libres y los últimos intercambios se envían al relé configurado y después a la API de OpenAI. No introduzca datos bancarios, de nómina ni otra información sensible. La conservación, los roles RGPD y las medidas de seguridad del futuro servicio aún deben definirse; no se reclama ninguna certificación.',
        it: 'Nel modello previsto, il datore di lavoro confermerebbe il suo impiego, lo stipendio di riferimento e i giorni lavorati. Non sarebbe previsto che possa vedere lo storico degli anticipi, le abitudini di utilizzo o i dati bancari. Il sito non richiede dati bancari né analisi delle spese. In questa dimostrazione, la cronologia del chatbot viene conservata temporaneamente nella memoria di sessione della scheda. In modalità locale, le sue domande non vengono inviate a un server. Se viene attivata la modalità IA facoltativa, le domande libere e gli ultimi scambi vengono inviati al relay configurato e poi all’API di OpenAI. Non inserisca dati bancari, retributivi o altre informazioni sensibili. Conservazione, ruoli GDPR e misure di sicurezza del futuro servizio restano da definire; nessuna certificazione è dichiarata.' } },
    { id: 'elig', v: 's', go: 's',
      k: { fr: 'eligib|cdi|cdd|interim|qui peut|conditions|prime|variable|independant|stagiaire', en: 'eligib|permanent|fixed-term|temp|who can|conditions|bonus|variable|freelance|intern', es: 'eligib|indefinid|temporal|quien puede|condiciones|prima|variable|autonomo|becario', it: 'idone|indeterminat|determinat|interinale|chi puo|condizioni|premio|variabile|autonomo|stagista' },
      l: { fr: 'Qui est éligible ?', en: 'Who is eligible?', es: '¿Quién es elegible?', it: 'Chi è idoneo?' },
      a: { fr: 'Dans le démonstrateur : les salariés en CDI. Le calcul part du salaire mensuel net de référence ; les primes variables ou exceptionnelles n’entrent pas dans la base. Les critères définitifs dépendront des partenaires et des validations nécessaires.',
        en: 'In the demo: employees on permanent contracts. The calculation starts from the monthly net reference salary; variable or exceptional bonuses are not part of the base. Final criteria will depend on the partners and the required validations.',
        es: 'En el demostrador: empleados con contrato indefinido. El cálculo parte del salario mensual neto de referencia; las primas variables o excepcionales no entran en la base. Los criterios definitivos dependerán de los socios y de las validaciones necesarias.',
        it: 'Nel dimostratore: i dipendenti con contratto a tempo indeterminato. Il calcolo parte dallo stipendio mensile netto di riferimento; i premi variabili o straordinari non rientrano nella base. I criteri definitivi dipenderanno dai partner e dalle validazioni necessarie.' } },
    { id: 'suspend', v: 's', go: 's',
      k: { fr: 'arret|maladie|change d employeur|changer d employeur|demission|depart|licenci|suspendu|suspension|impaye|insuffisant|erron|erreur|fraude', en: 'sick|leave|change employer|new job|resign|quit|leaving|dismiss|suspend|unpaid|insufficient|wrong|error|fraud', es: 'baja|enfermedad|cambio de empleador|cambiar de empleo|dimision|salida|despido|suspend|impago|insuficiente|erron|error|fraude', it: 'malattia|cambio di datore|cambiare lavoro|dimission|uscita|licenzi|sospes|insoluto|insufficiente|errat|errore|frode' },
      l: { fr: 'Et si ma situation change ?', en: 'What if my situation changes?', es: '¿Y si mi situación cambia?', it: 'E se la mia situazione cambia?' },
      a: { fr: 'Changement d’employeur : les nouvelles avances sont suspendues dès le départ confirmé, le montant dû est recalculé et une nouvelle validation est nécessaire. Arrêt maladie : le service peut être suspendu ou l’éligibilité réévaluée. Solde insuffisant : prélèvement rejeté, nouvelles avances suspendues, régularisation adaptée, sans récupération systématique promise. Information erronée : une vérification proportionnée est prévue, un écart n’est pas présumé être une fraude.',
        en: 'Change of employer: new advances are suspended once the departure is confirmed, any amount due is recalculated and a new validation is needed. Sick leave: the service may be suspended or eligibility reassessed. Insufficient balance: debit rejected, new advances suspended, suitable settlement, with no systematic recovery promised. Wrong information: a proportionate check is planned; a discrepancy is not presumed to be fraud.',
        es: 'Cambio de empleador: los nuevos adelantos se suspenden al confirmarse la salida, el importe debido se recalcula y hace falta una nueva validación. Baja por enfermedad: el servicio puede suspenderse o reevaluarse la elegibilidad. Saldo insuficiente: adeudo rechazado, nuevos adelantos suspendidos, regularización adaptada, sin recobro sistemático prometido. Información errónea: se prevé una verificación proporcionada; una discrepancia no se presume fraude.',
        it: 'Cambio di datore di lavoro: i nuovi anticipi sono sospesi alla conferma dell’uscita, l’importo dovuto viene ricalcolato e serve una nuova validazione. Malattia: il servizio può essere sospeso o l’idoneità rivalutata. Saldo insufficiente: addebito respinto, nuovi anticipi sospesi, regolarizzazione adeguata, senza recupero sistematico promesso. Informazione errata: è prevista una verifica proporzionata; una discrepanza non si presume frode.' } },
    { id: 'employer', v: 'e', go: 'e',
      k: { fr: 'employeur|entreprise|rh|ressources humaines|paie|logiciel|integration|que dois|charge|travail|societe|console', en: 'employer|company|hr|human resources|payroll|software|integration|what do i have to|workload|console', es: 'empleador|empresa|rrhh|recursos humanos|nomina|software|integracion|que debo|carga|consola', it: 'datore|azienda|impresa|hr|risorse umane|paghe|software|integrazione|cosa devo|carico|console' },
      l: { fr: 'Que fait l’entreprise ?', en: 'What does the company do?', es: '¿Qué hace la empresa?', it: 'Che cosa fa l’azienda?' },
      a: { fr: 'Une seule étape est la vôtre : confirmer une fois chaque salarié (emploi, salaire de référence), puis transmettre à chaque cycle deux données, salaire net de référence et jours travaillés, par fichier ou dépôt sécurisé. Aucune intégration à votre outil de paie n’est nécessaire. Vous n’avez plus à répondre aux demandes une par une ni à calculer les montants. Si la transmission manque, les nouvelles avances du salarié sont suspendues. La console RH de la page Entreprise montre l’idée sur données fictives.',
        en: 'Only one step is yours: confirm each employee once (employment, reference salary), then send two data points each cycle, reference net salary and days worked, via a file or secure drop. No integration with your payroll tool is needed. You no longer answer requests one by one or calculate amounts. If a transmission is missing, that employee’s new advances are suspended. The HR console on the Company page shows the idea with fictional data.',
        es: 'Solo un paso es suyo: confirmar una vez a cada empleado (empleo, salario de referencia) y enviar en cada ciclo dos datos, salario neto de referencia y días trabajados, mediante archivo o depósito seguro. No hace falta integrar su herramienta de nómina. Ya no responde a las solicitudes una a una ni calcula importes. Si falta la transmisión, se suspenden los nuevos adelantos del empleado. La consola de RR. HH. de la página Empresa muestra la idea con datos ficticios.',
        it: 'Un solo passaggio è suo: confermare una volta ogni dipendente (impiego, stipendio di riferimento) e trasmettere a ogni ciclo due dati, stipendio netto di riferimento e giorni lavorati, tramite file o deposito sicuro. Non serve alcuna integrazione con il suo software paghe. Non risponde più alle richieste una per una né calcola gli importi. Se manca la trasmissione, i nuovi anticipi del dipendente sono sospesi. La console HR della pagina Azienda mostra l’idea con dati fittizi.' } },
    { id: 'ecost', v: 'e', go: 'e',
      k: { fr: 'abonnement|licence|gratuit pour|cout pour l entreprise|temps|heures|economis|gain|recrutement|attractivite', en: 'subscription|licence|license|free for|company cost|time|hours|saving|saved|gain|recruit|attractive', es: 'suscripcion|licencia|gratis para|coste para la empresa|tiempo|horas|ahorr|ganancia|contratacion|atractivo', it: 'abbonamento|licenza|gratis per|costo per l azienda|tempo|ore|risparm|guadagno|assunzion|attrattiv' },
      l: { fr: 'Ça coûte quoi à l’entreprise ?', en: 'What does it cost a company?', es: '¿Cuánto cuesta a la empresa?', it: 'Quanto costa all’azienda?' },
      a: { fr: 'Dans le modèle envisagé, aucun abonnement ni licence n’est facturé à l’entreprise : c’est une hypothèse commerciale à confirmer, pas une promesse contractuelle. Le simulateur de la page Entreprise estime le temps administratif évité (par exemple 250 salariés, 1,5 intervention par mois, 15 min, 70 % évités : environ 66 h par mois). Ce sont des hypothèses, pas des gains mesurés ni garantis.',
        en: 'In the envisaged model, no subscription or licence is charged to the company: this is a commercial assumption to confirm, not a contractual promise. The calculator on the Company page estimates the admin time avoided (for example 250 employees, 1.5 interventions a month, 15 min, 70% avoided: about 66 h a month). These are assumptions, not measured or guaranteed gains.',
        es: 'En el modelo previsto no se factura ninguna suscripción ni licencia a la empresa: es una hipótesis comercial por confirmar, no una promesa contractual. El simulador de la página Empresa estima el tiempo administrativo evitado (por ejemplo, 250 empleados, 1,5 intervenciones al mes, 15 min, 70 % evitado: unas 66 h al mes). Son hipótesis, no ganancias medidas ni garantizadas.',
        it: 'Nel modello previsto non viene fatturato alcun abbonamento o licenza all’azienda: è un’ipotesi commerciale da confermare, non una promessa contrattuale. Il simulatore della pagina Azienda stima il tempo amministrativo evitato (ad esempio 250 dipendenti, 1,5 interventi al mese, 15 min, 70 % evitato: circa 66 h al mese). Sono ipotesi, non risultati misurati né garantiti.' } },
    { id: 'bank', v: 'b', go: 'b',
      k: { fr: 'banque|modele economique|rentab|revenu|partage|50/50|scenario|tableau de bord|financ|api|application', en: 'bank|business model|profit|revenue|split|50/50|scenario|dashboard|fund|api|app', es: 'banco|modelo economico|rentab|ingreso|reparto|50/50|escenario|panel|financ|api|aplicacion', it: 'banca|modello economico|redditiv|ricavi|ripartizione|50/50|scenario|cruscotto|finanz|api|applicazione' },
      l: { fr: 'Et pour une banque ?', en: 'What’s in it for a bank?', es: '¿Y para un banco?', it: 'E per una banca?' },
      a: { fr: 'La banque finance et verse l’avance, garde la relation client, et le parcours s’affiche dans son application, sous sa marque. Earnly fournit le parcours, le calcul, les plafonds et un tableau de pilotage. Les revenus viennent des frais payés par le salarié à chaque avance, partagés 50/50 entre Earnly et la banque (hypothèse) : scénario A à 0,20 % pour un client de la banque partenaire, scénario B à 0,70 % sinon. Pas de commission sur l’ensemble du salaire. Rien de tout cela n’est une preuve de rentabilité : taux, partage et TVA restent à valider.',
        en: 'The bank funds and pays out the advance, keeps the customer relationship, and the journey appears in its own app under its brand. Earnly provides the journey, the calculation, the caps and a monitoring dashboard. Revenue comes from fees paid by the employee on each advance, split 50/50 between Earnly and the bank (assumption): scenario A at 0.20% for a partner-bank customer, scenario B at 0.70% otherwise. No commission on the whole salary. None of this proves profitability: rates, split and VAT remain to be validated.',
        es: 'El banco financia y abona el adelanto, conserva la relación con el cliente y el recorrido aparece en su app, con su marca. Earnly aporta el recorrido, el cálculo, los topes y un panel de seguimiento. Los ingresos provienen de las comisiones que paga el empleado en cada adelanto, repartidas al 50/50 entre Earnly y el banco (hipótesis): escenario A al 0,20 % para un cliente del banco socio, escenario B al 0,70 % en caso contrario. Sin comisión sobre todo el salario. Nada de esto prueba la rentabilidad: tasas, reparto e IVA están por validar.',
        it: 'La banca finanzia ed eroga l’anticipo, mantiene la relazione con il cliente e il percorso appare nella sua app, con il suo marchio. Earnly fornisce percorso, calcolo, massimali e un cruscotto di monitoraggio. I ricavi derivano dai costi pagati dal dipendente a ogni anticipo, ripartiti 50/50 tra Earnly e la banca (ipotesi): scenario A allo 0,20 % per un cliente della banca partner, scenario B allo 0,70 % altrimenti. Nessuna commissione sull’intero stipendio. Nulla di ciò prova la redditività: tassi, ripartizione e IVA sono da validare.' } },
    { id: 'pilot', v: 'b', go: 'b',
      k: { fr: 'pilote|phase|calendrier|trois mois|3 mois|volontaire|test|indicateur|arret du pilote|duree', en: 'pilot|phase|timeline|three months|3 months|volunteer|test|indicator|kpi|duration', es: 'piloto|fase|calendario|tres meses|3 meses|voluntari|prueba|indicador|duracion', it: 'pilota|fase|calendario|tre mesi|3 mesi|volontari|test|indicatore|durata' },
      l: { fr: 'Comment serait le pilote ?', en: 'What would the pilot look like?', es: '¿Cómo sería el piloto?', it: 'Come sarebbe il pilota?' },
      a: { fr: 'Une banque partenaire, une entreprise partenaire et un groupe limité de salariés volontaires et éligibles, environ trois mois (durée indicative) après cadrage et intégration. Cinq phases : cadrage, préparation technique, tests, pilote limité, évaluation. Le pilote se lit sur quatre dimensions séparées : réussite technique, adoption, maîtrise du risque, viabilité économique. Il s’arrête en cas d’incident de sécurité, de perte au-delà du plafond convenu, d’erreur de calcul sur des montants avancés ou de réserve juridique. Aucun délai n’est garanti.',
        en: 'One partner bank, one partner company and a limited group of volunteer, eligible employees, for about three months (indicative) after scoping and integration. Five phases: scoping, technical preparation, testing, limited pilot, evaluation. The pilot is read on four separate dimensions: technical success, adoption, risk control, economic viability. It stops on a security incident, losses beyond the agreed cap, a calculation error affecting advanced amounts, or a legal reservation. No deadline is guaranteed.',
        es: 'Un banco socio, una empresa socia y un grupo limitado de empleados voluntarios y elegibles, unos tres meses (indicativo) tras el encuadre y la integración. Cinco fases: encuadre, preparación técnica, pruebas, piloto limitado, evaluación. El piloto se lee en cuatro dimensiones separadas: éxito técnico, adopción, control del riesgo, viabilidad económica. Se detiene ante un incidente de seguridad, pérdidas por encima del tope acordado, un error de cálculo en importes adelantados o una reserva jurídica. No se garantiza ningún plazo.',
        it: 'Una banca partner, un’azienda partner e un gruppo limitato di dipendenti volontari e idonei, circa tre mesi (indicativo) dopo l’inquadramento e l’integrazione. Cinque fasi: inquadramento, preparazione tecnica, test, pilota limitato, valutazione. Il pilota si legge su quattro dimensioni separate: successo tecnico, adozione, controllo del rischio, sostenibilità economica. Si interrompe in caso di incidente di sicurezza, perdite oltre il massimale concordato, errore di calcolo sugli importi anticipati o riserva legale. Nessun termine è garantito.' } },
    { id: 'risk', v: 'b', go: 'b',
      k: { fr: 'risque|perte|controle|responsabilit|qui supporte|recouvrement|regularis|matrice', en: 'risk|loss|control|responsib|who bears|recovery|collection|settlement|matrix', es: 'riesgo|perdida|control|responsabilidad|quien asume|recobro|regulariz|matriz', it: 'rischio|perdita|controllo|responsabil|chi sostiene|recupero|regolariz|matrice' },
      l: { fr: 'Qui supporte le risque ?', en: 'Who bears the risk?', es: '¿Quién asume el riesgo?', it: 'Chi sostiene il rischio?' },
      a: { fr: 'Le plafond de 40 % n’est ni une garantie contre l’impayé ni une limite légale. En cas de perte, la partie qui a manqué à ses obligations la supporte ; si les deux ont failli, elle est partagée (modalités à définir avec la banque). La banque finance, verse et récupère ; Earnly gère parcours, calculs, plafonds et contrôles ; l’employeur répond de la fiabilité des données. Cinq contrôles sont envisagés : éligibilité, plafond, détection de données obsolètes, suspension en cas de changement, procédure de régularisation.',
        en: 'The 40% cap is neither a guarantee against non-payment nor a legal limit. In case of loss, the party that failed its obligations bears it; if both failed, it is shared (terms to be defined with the bank). The bank funds, pays out and recovers; Earnly handles the journey, calculations, caps and controls; the employer answers for data reliability. Five controls are planned: eligibility, cap, detection of stale data, suspension on change of situation, a settlement procedure.',
        es: 'El tope del 40 % no es una garantía contra el impago ni un límite legal. En caso de pérdida, la asume la parte que incumplió sus obligaciones; si ambas incumplieron, se reparte (modalidades por definir con el banco). El banco financia, abona y recupera; Earnly gestiona recorrido, cálculos, topes y controles; el empleador responde de la fiabilidad de los datos. Se prevén cinco controles: elegibilidad, tope, detección de datos obsoletos, suspensión ante cambios y procedimiento de regularización.',
        it: 'Il massimale del 40 % non è una garanzia contro l’insoluto né un limite di legge. In caso di perdita la sostiene la parte che ha mancato ai propri obblighi; se entrambe hanno mancato, è ripartita (modalità da definire con la banca). La banca finanzia, eroga e recupera; Earnly gestisce percorso, calcoli, massimali e controlli; il datore risponde dell’affidabilità dei dati. Sono previsti cinque controlli: idoneità, massimale, rilevamento di dati obsoleti, sospensione in caso di cambiamenti, procedura di regolarizzazione.' } },
    { id: 'legal', v: 'sebd', go: 'b',
      k: { fr: 'legal|juridique|reglement|regulat|agrement|licence bancaire|credit|pret|certif|conform|tva|mentions|loi|autorisation', en: 'legal|law|regulat|licen|banking licence|credit|loan|certif|complian|vat|tax|authori', es: 'legal|juridic|reglament|regulat|autorizacion|licencia bancaria|credito|prestamo|certific|cumplimiento|iva|ley', it: 'legale|giuridic|regolament|regolat|autorizzazion|licenza bancaria|credito|prestito|certific|conformita|iva|legge' },
      l: { fr: 'Est-ce légal ?', en: 'Is it legal?', es: '¿Es legal?', it: 'È legale?' },
      a: { fr: 'Aucune validation, certification ni statut réglementaire n’est revendiqué à ce jour. Restent à valider : la qualification juridique du produit et du financement, le rôle de la banque et celui d’Earnly comme fournisseur de technologie, les obligations éventuelles liées aux services de paiement, les contrats, le traitement des impayés, le RGPD et le traitement fiscal des frais, TVA comprise. Earnly n’est pas une banque : la société ne collecte pas de dépôts, ne prête pas d’argent et ne touche pas aux fonds. Je ne peux pas donner de conseil juridique.',
        en: 'No validation, certification or regulatory status is claimed to date. Still to be validated: the legal qualification of the product and the financing, the role of the bank and of Earnly as a technology provider, any obligations tied to payment services, contracts, handling of unpaid amounts, GDPR, and the tax treatment of fees, including VAT. Earnly is not a bank: it takes no deposits, lends no money and never handles funds. I can’t give legal advice.',
        es: 'A día de hoy no se reclama ninguna validación, certificación ni estatus regulatorio. Quedan por validar: la calificación jurídica del producto y de la financiación, el papel del banco y de Earnly como proveedor tecnológico, las posibles obligaciones de servicios de pago, los contratos, el tratamiento de impagos, el RGPD y el tratamiento fiscal de las comisiones, IVA incluido. Earnly no es un banco: no capta depósitos, no presta dinero y no maneja fondos. No puedo dar asesoramiento jurídico.',
        it: 'Ad oggi non è dichiarata alcuna validazione, certificazione o status regolamentare. Restano da validare: la qualificazione giuridica del prodotto e del finanziamento, il ruolo della banca e di Earnly come fornitore di tecnologia, gli eventuali obblighi sui servizi di pagamento, i contratti, la gestione degli insoluti, il GDPR e il trattamento fiscale dei costi, IVA compresa. Earnly non è una banca: non raccoglie depositi, non presta denaro e non gestisce fondi. Non posso fornire consulenza legale.' } },
    { id: 'contact', v: 'ebd', go: 'e',
      k: { fr: 'contact|contacter|joindre|parler|echanger|equipe|mail|courriel|formulaire|rendez-vous|devenir partenaire|partenariat', en: 'contact|reach|talk|speak|team|email|mail|form|meeting|become a partner|partnership|partner with', es: 'contacto|contactar|hablar|equipo|correo|formulario|reunion|ser socio|colaborar|alianza', it: 'contatto|contattare|parlare|team|email|modulo|incontro|diventare partner|collaborare|partnership' },
      l: { fr: 'Contacter l’équipe', en: 'Contact the team', es: 'Contactar al equipo', it: 'Contattare il team' },
      a: { fr: 'Les pages Entreprise et Banque ont un formulaire de contact : le message part vers le porteur du projet, sans qu’aucune adresse ne soit affichée. Aucune coordonnée de salarié n’est collectée. Aucune donnée de paie ni donnée client n’est demandée lors du premier échange.',
        en: 'The Company and Bank pages have a contact form: the message goes to the project owner, without any address being displayed. No employee contact details are collected. No payroll or customer data is requested in the first exchange.',
        es: 'Las páginas Empresa y Banco tienen un formulario de contacto: el mensaje llega al responsable del proyecto sin mostrar ninguna dirección. No se recopilan datos de contacto de empleados. En el primer intercambio no se pide ningún dato de nómina ni de clientes.',
        it: 'Le pagine Azienda e Banca hanno un modulo di contatto: il messaggio arriva al responsabile del progetto senza mostrare alcun indirizzo. Non vengono raccolti recapiti dei dipendenti. Nel primo scambio non si chiedono dati paghe né dati dei clienti.' } }
  ];

  const SMALL = {
    hi: { fr: 'bonjour|salut|coucou|bonsoir|hello|hey', en: 'hello|hi|hey|good morning|good evening', es: 'hola|buenas|buenos dias|buenas tardes', it: 'ciao|buongiorno|buonasera|salve' },
    thx: { fr: 'merci|super|parfait|top|genial', en: 'thanks|thank you|great|perfect|cheers', es: 'gracias|genial|perfecto|estupendo', it: 'grazie|perfetto|ottimo|fantastico' },
    bye: { fr: 'au revoir|a bientot|bye|salut a|ciao', en: 'goodbye|bye|see you', es: 'adios|hasta luego|chao', it: 'arrivederci|addio|a presto' }
  };

  /* ---------- Compréhension tolérante aux fautes ----------
     Le chatbot reste local : pas d'API, pas de clé secrète dans le dépôt.
     On combine synonymes/mots-clés, rapprochement orthographique et recherche
     dans les textes réellement présents sur les trois parcours du site. */
  const norm = s => String(s || '').toLocaleLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9,.% \/€-]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = s => norm(s).match(/[a-z0-9]+/g) || [];
  const hit = (m, list) => list.split('|').some(w => w && (' ' + m + ' ').includes(' ' + norm(w) + ' '));
  const STOP = {
    fr: 'a au aux avec ce ceci cela ces cette c est cest comment fonctionne dans de des du elle en et eux il ils je la le les leur lui ma mais me mes moi mon ne nos notre nous on ou par pas pour pourquoi que quel quelle quels quelles qui quoi sa se ses si son sous sur ta te tes toi ton tous tout un une vos votre vous y',
    en: 'a about after all also am an and any are as at be because been before being but by can could did do does doing for from had has have he her hers him his how i if in into is it its just me my of on or our ours she should so than that the their them then there these they this those to too up us was we were what when where which who why will with would you your yours',
    es: 'a al algo como con cual cuando de del desde donde el ella ellas ellos en es esa ese eso esta este esto fue ha hasta hay la las le les lo los mas mi mientras muy no nos o para pero por porque que se ser si sin su sus te tu tus un una unos unas y ya yo',
    it: 'a ad che chi ci come cosa cui da dal dalla dalle dagli dei del della delle di e ed è era essere gli ha hai hanno i il in io la le lei lo lui ma mi miei mio ne nei nel nella no noi non o per perché più quale quando quanto quella quelle quello questi questo si sono su sul sulla tra tu tua tue tuo un una uno vi voi'
  };
  const STOP_SET = new Set((STOP[L] || STOP.fr).split(' '));
  const meaningful = s => words(s).filter(w => !STOP_SET.has(w) && !/^\d+(?:[.,]\d+)?$/.test(w) && (w.length >= 3 || /^(cdi|cdd|api|sepa)$/.test(w)));

  function editDistance(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        rowMin = Math.min(rowMin, cur[j]);
      }
      if (rowMin > limit) return limit + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  function wordSimilarity(a, b) {
    if (a === b) return 1;
    if (a.length < 4 || b.length < 4) return 0;
    const short = a.length <= b.length ? a : b, long = a.length > b.length ? a : b;
    if (short.length >= 4 && long.startsWith(short) && long.length - short.length <= 4) return .82;
    const max = Math.max(a.length, b.length), d = editDistance(a, b, max >= 8 ? 2 : 1);
    if (d === 1) return .78;
    if (d === 2 && max >= 8) return .66;
    return 0;
  }
  const TOPIC_WORDS = TOPICS.map(t => [...new Set(t.k[L].split('|').flatMap(words).filter(w => w.length >= 3 || /^(cdi|cdd|api|sepa)$/.test(w)))]);
  const DOC_FREQ = new Map();
  TOPIC_WORDS.forEach(arr => new Set(arr).forEach(w => DOC_FREQ.set(w, (DOC_FREQ.get(w) || 0) + 1)));
  function hasFuzzyToken(m, candidates) {
    const q = meaningful(m), c = candidates.split('|').flatMap(words);
    return q.some(qw => c.some(cw => wordSimilarity(qw, cw) >= .66));
  }
  function score(m, t) {
    const q = meaningful(m), ix = TOPICS.indexOf(t), keys = TOPIC_WORDS[ix] || [];
    if (!q.length || !keys.length) return 0;
    let total = 0;
    q.forEach(qw => {
      let best = 0, bestKey = '';
      keys.forEach(kw => { const sim = wordSimilarity(qw, kw); if (sim > best) { best = sim; bestKey = kw; } });
      if (best >= .66) {
        const idf = 1 + Math.log((TOPICS.length + 1) / ((DOC_FREQ.get(bestKey) || 1) + 1));
        total += best * idf;
      }
    });
    const padded = ' ' + norm(m) + ' ';
    t.k[L].split('|').forEach(phrase => {
      const p = norm(phrase);
      if (p.length >= 5 && padded.includes(' ' + p + ' ')) total += 2.2 + Math.min(words(p).length, 3) * .25;
    });
    /* Les mots d'intention dominent les mots génériques comme « comment » ou « combien ». */
    const id = t.id;
    if (id === 'fee' && hasFuzzyToken(m, 'frais|cout|coute|prix|tarif|commission|payer|payant|gratuit|fee|cost|price|charge|comision|costo|costi|prezzo|tariffa')) total += 5.2;
    if (id === 'cap' && hasFuzzyToken(m, 'cout|coute|prix|tarif|commission|fee|cost|price|costo|prezzo|tariffa')) total -= 3.0;
    if (id === 'repay' && hasFuzzyToken(m, 'rembours|remboursement|rembourser|prelevement|prelever|debit|sepa|mandat|rejet|solde|echeance|refund|repay|reembolso|rimborso|addebito|devuelve|devolver|devolucion|devolucion|pago|cobro|cargo|descontar|rimborso|restituire')) total += 5.0;
    if (id === 'what' && hasFuzzyToken(m, 'rembours|remboursement|prelevement|debit|sepa|mandat|refund|repay|reembolso|rimborso|addebito|devuelve|devolver|devolucion|cobro|cargo')) total -= 3.0;
    if (id === 'ecost' && hasFuzzyToken(m, 'entreprise|employeur|societe|rh|company|employer|empresa|azienda') && hasFuzzyToken(m, 'cout|coute|prix|tarif|abonnement|licence|cost|price|subscription|costo|coste|cuesta|costa|prezzo|combien|cuanto|quanto|much')) total += 9.0;
    if ((id === 'employer' || id === 'fee' || id === 'cap') && hasFuzzyToken(m, 'entreprise|employeur|societe|rh|company|employer|empresa|azienda') && hasFuzzyToken(m, 'cout|coute|prix|tarif|abonnement|licence|cost|price|subscription|costo|coste|cuesta|costa|prezzo|combien|cuanto|quanto|much')) total -= 3.0;
    if (id === 'employer' && hasFuzzyToken(m, 'entreprise|employeur|societe|rh|paie|payroll|company|employer|empresa|azienda|integra|integration|logiciel|software')) total += 1.8;
    if (id === 'bank' && hasFuzzyToken(m, 'banque|bancaire|banquier|bank|banco|banca|financement')) total += 1.8;
    if (id === 'bank' && hasFuzzyToken(m, 'integration|api|connecteur|interface|architecture|technique|application')) total += 4.0;
    if (id === 'employer' && hasFuzzyToken(m, 'employeur|entreprise|societe|rh|paie|payroll|logiciel|software')) total += 2.0;
    if (id === 'legal' && hasFuzzyToken(m, 'legal|juridique|loi|reglement|reglementaire|conformite|autorisation|licence|law|compliance|legale')) total += 4.2;
    if (id === 'risk' && hasFuzzyToken(m, 'risque|risques|perte|impaye|impayes|incident|recouvrement|responsabilite|control|risk|loss|default')) total += 4.2;
    if (id === 'data' && hasFuzzyToken(m, 'donnee|donnees|confidentialite|vie privee|rgpd|gdpr|privacy|data|seguridad|sicurezza')) total += 2.8;
    if (id === 'data' && hasFuzzyToken(m, 'employeur|entreprise|rh|employer|company|empleador|empresa|datore|azienda') && hasFuzzyToken(m, 'voir|voit|see|sees|ver|ve|vede') && hasFuzzyToken(m, 'avance|avances|historique|history|adelanto|anticipi|anticipo')) total += 7.0;
    if (id === 'employer' && hasFuzzyToken(m, 'employeur|employer|empleador|datore') && hasFuzzyToken(m, 'voir|voit|see|sees|ver|vede') && hasFuzzyToken(m, 'avance|avances|historique|history|adelanto|anticipo')) total -= 2.0;
    if (id === 'what' && hasFuzzyToken(m, 'earnly') && hasFuzzyToken(m, 'banque|bank|banco|banca') && hasFuzzyToken(m, 'vrai|vraie|reel|reelle|true|real|verdadera|vera')) total += 8.0;
    if (id === 'bank' && hasFuzzyToken(m, 'earnly') && hasFuzzyToken(m, 'vrai|vraie|reel|reelle|true|real|verdadera|vera')) total -= 3.0;
    if (id === 'status' && hasFuzzyToken(m, 'disponible|dispo|lancement|lance|inscrire|inscription|utiliser|telecharger|existe|partenaire|available|launch|sign up')) total += 2.5;
    if (id === 'cap' && hasFuzzyToken(m, 'plafond|maximum|max|limite|montant|accessible|avance|pourcentage|combien|how much|limite|massimale')) total += 1.4;
    return total;
  }
  const nums = s => (String(s).match(/\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(/[ \u00a0\u202f]/g, '').replace(/\.(?=\d{3}$)/, '').replace(',', '.'))).filter(n => isFinite(n));

  /* Recherche de secours dans les contenus réellement rédigés sur le site.
     Elle renvoie un extrait, jamais une réponse inventée. */
  let SITE_TEXT_INDEX = null;
  function getSiteTextIndex() {
    if (SITE_TEXT_INDEX) return SITE_TEXT_INDEX;
    const selectors = 'main.view h1, main.view h2, main.view h3, main.view p, main.view li, main.view td, main.view dt, main.view dd, main.view summary';
    const seen = new Set(), out = [];
    document.querySelectorAll(selectors).forEach(el => {
      const raw = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (raw.length < 45 || raw.length > 900 || seen.has(raw)) return;
      seen.add(raw);
      raw.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9])/u).forEach(part => {
        const text = part.trim(); if (text.length >= 45 && text.length <= 460) out.push({ text, tokens: meaningful(text) });
      });
    });
    SITE_TEXT_INDEX = out;
    return out;
  }
  function searchSite(raw) {
    const q = meaningful(raw); if (q.length < 2) return null;
    let best = null, bestScore = 0;
    getSiteTextIndex().forEach(doc => {
      if (!doc.tokens.length) return;
      let s = 0, found = 0;
      q.forEach(qw => {
        let sim = 0; doc.tokens.forEach(dw => { sim = Math.max(sim, wordSimilarity(qw, dw)); });
        if (sim >= .66) { s += sim; found++; }
      });
      const adjusted = s / Math.sqrt(Math.max(1, doc.tokens.length / 7));
      if (found >= 2 && adjusted > bestScore) { bestScore = adjusted; best = doc.text; }
    });
    return best && bestScore >= 1.05 ? best.slice(0, 420) : null;
  }

  /* ---------- Calculs à la demande ---------- */
  const R2 = n => Math.round(n * 100) / 100;
  function calc(raw, m) {
    const n = nums(raw);
    const dayW = /jour|day|dia|giorn|(?:\d+\s*j\b)|\bj\b/.test(m), feeW = hit(m, 'frais|fee|fees|cost|cout|coute|coste|cuesta|precio|comision|costi|costa|tarif|tarifa|prix|commission|prezzo');
    const companyCostW = hit(m, 'entreprise|employeur|societe|rh|company|employer|empresa|azienda');
    if (n.length >= 2 && dayW) {
      let [sal, d] = n; if (sal < d) [sal, d] = [d, sal];
      if (d < 1 || d > 31 || sal < 100 || sal > 100000) return null;
      const earned = R2(sal * d / CFG.days), cap = R2(earned * CFG.cap);
      return ({
        fr: `Avec ${eur(sal)} de salaire net et ${d} jours sur ${CFG.days} : ${eur(earned)} déjà gagnés, soit jusqu’à ${eur(cap)} accessibles (40 %). Pour ${eur(cap)}, les frais seraient de ${eur(R2(cap * CFG.a))} (0,20 %) ou ${eur(R2(cap * CFG.b))} (0,70 %). Simulation pédagogique à titre indicatif, sans valeur d’offre.`,
        en: `With ${eur(sal)} net salary and ${d} days out of ${CFG.days}: ${eur(earned)} already earned, so up to ${eur(cap)} accessible (40%). For ${eur(cap)}, fees would be ${eur(R2(cap * CFG.a))} (0.20%) or ${eur(R2(cap * CFG.b))} (0.70%). Educational simulation, indicative only and not an offer.`,
        es: `Con ${eur(sal)} de salario neto y ${d} días de ${CFG.days}: ${eur(earned)} ya ganados, es decir, hasta ${eur(cap)} accesibles (40 %). Para ${eur(cap)}, las comisiones serían ${eur(R2(cap * CFG.a))} (0,20 %) o ${eur(R2(cap * CFG.b))} (0,70 %). Simulación pedagógica, orientativa y sin valor de oferta.`,
        it: `Con ${eur(sal)} di stipendio netto e ${d} giorni su ${CFG.days}: ${eur(earned)} già maturati, cioè fino a ${eur(cap)} accessibili (40 %). Per ${eur(cap)}, i costi sarebbero ${eur(R2(cap * CFG.a))} (0,20 %) o ${eur(R2(cap * CFG.b))} (0,70 %). Simulazione didattica, indicativa e senza valore di offerta.`
      })[L];
    }
    if (n.length >= 1 && feeW && !companyCostW) {
      const a = n[0]; if (a <= 0 || a > 100000) return null;
      const fa = R2(a * CFG.a), fb = R2(a * CFG.b);
      return ({
        fr: `Pour une avance de ${eur(a)} : ${eur(fa)} de frais si vous êtes client d’une banque partenaire (0,20 %), ${eur(fb)} sinon (0,70 %). Le jour de la paie, la banque prélèverait ${eur(R2(a + fa))} ou ${eur(R2(a + fb))}. Hypothèses commerciales à valider.`,
        en: `For an advance of ${eur(a)}: ${eur(fa)} in fees if you bank with a partner bank (0.20%), ${eur(fb)} otherwise (0.70%). On payday the bank would debit ${eur(R2(a + fa))} or ${eur(R2(a + fb))}. Commercial assumptions to be validated.`,
        es: `Para un adelanto de ${eur(a)}: ${eur(fa)} de comisión si es cliente de un banco socio (0,20 %), ${eur(fb)} en caso contrario (0,70 %). El día de pago el banco adeudaría ${eur(R2(a + fa))} o ${eur(R2(a + fb))}. Hipótesis comerciales por validar.`,
        it: `Per un anticipo di ${eur(a)}: ${eur(fa)} di costi se è cliente di una banca partner (0,20 %), ${eur(fb)} altrimenti (0,70 %). Il giorno della paga la banca addebiterebbe ${eur(R2(a + fa))} o ${eur(R2(a + fb))}. Ipotesi commerciali da validare.`
      })[L];
    }
    return null;
  }

  function answer(raw) {
    const m = norm(raw);
    if (!m) return null;
    const c = calc(raw, m); if (c) return { t: c, go: 's', id: 'cap' };
    if (hit(m, SMALL.bye[L]) && meaningful(m).length <= 2) return { t: UI.bye };
    if (hit(m, SMALL.thx[L]) && meaningful(m).length <= 2) return { t: UI.thanks };
    const cur = (window.EaRoute && window.EaRoute.cur && window.EaRoute.cur()) || 's';
    let ranked = TOPICS.map(t => ({ topic: t, value: score(m, t) + (t.v.includes(cur) ? .12 : 0) }))
      .sort((a, b) => b.value - a.value);
    const best = ranked[0], second = ranked[1];
    /* Un score suffisant ET un minimum d'écart évitent de répondre au hasard. */
    if (best && best.value >= 1.35 && (!second || best.value - second.value >= .08 || best.value >= 3.2)) {
      return { t: best.topic.a[L], go: best.topic.go, id: best.topic.id };
    }
    if (hit(m, SMALL.hi[L]) && meaningful(m).length <= 2) return { t: UI.hello };
    const excerpt = searchSite(raw);
    if (excerpt) return { t: UI.found + '\n\n“' + excerpt + '”\n\n' + UI.fb, fb: 1 };
    return { t: UI.fb, fb: 1 };
  }

  /* ---------- Interface ---------- */
  const css = `
#eac-btn{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:90;display:flex;align-items:center;gap:9px;height:52px;padding:0 20px 0 16px;border-radius:99px;background:var(--grad,linear-gradient(90deg,#7c3aed,#22c68a));color:#fff;font:700 14px/1 Inter,system-ui,sans-serif;box-shadow:0 10px 30px #7c3aed40,0 2px 6px #0f172a26;transition:transform .2s,box-shadow .2s}
#eac-btn:hover{transform:translateY(-2px)}#eac-btn svg{width:22px;height:22px;flex:none}
#eac-btn:focus-visible,#eac-p button:focus-visible,#eac-in:focus-visible{outline:3px solid #0f172a;outline-offset:2px}
#eac-p{position:fixed;right:18px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:91;width:min(392px,calc(100vw - 24px));height:min(600px,calc(100dvh - 110px));display:none;flex-direction:column;background:#fff;color:#0f172a;border:1px solid #e6e9ef;border-radius:22px;box-shadow:0 30px 80px #0f172a40;overflow:hidden;font:14px/1.5 Inter,system-ui,sans-serif}
#eac-p.on{display:flex;animation:eac-in .22s cubic-bezier(.2,.8,.2,1)}@keyframes eac-in{from{opacity:0;transform:translateY(10px) scale(.98)}}
#eac-h{display:flex;align-items:center;gap:10px;padding:14px 14px 12px 16px;background:linear-gradient(90deg,#7c3aed,#22c68a);color:#fff}
#eac-h b{display:block;font-size:15px;line-height:1.2}#eac-h small{display:block;font-size:12px;opacity:.95}#eac-h div{flex:1;min-width:0}
#eac-h button{width:34px;height:34px;border-radius:99px;display:grid;place-items:center;color:#fff;background:#ffffff26;font-size:16px}#eac-h button:hover{background:#ffffff40}#eac-h button:focus-visible{outline-color:#fff}
#eac-log{flex:1;overflow-y:auto;padding:14px 14px 6px;display:flex;flex-direction:column;gap:10px;background:#f7f8fb;overscroll-behavior:contain}
.eac-m{max-width:88%;padding:10px 13px;border-radius:16px;white-space:pre-line;overflow-wrap:anywhere}.eac-m p+p{margin-top:8px}
.eac-b{align-self:flex-start;background:#fff;border:1px solid #e6e9ef;border-bottom-left-radius:5px}.eac-u{align-self:flex-end;background:#0f172a;color:#fff;border-bottom-right-radius:5px}
.eac-n{align-self:center;max-width:100%;font-size:12px;color:#5a6a80;text-align:center;padding:2px 8px}
.eac-c{display:flex;flex-wrap:wrap;gap:7px;align-self:flex-start;max-width:100%}
.eac-c button{padding:7px 12px;border-radius:99px;background:#fff;border:1px solid #cfd6e2;font-size:13px;font-weight:600;color:#0f172a;text-align:left}.eac-c button:hover{border-color:#7c3aed;color:#6d28d9}
.eac-c .go{background:#e7f8ef;border-color:#b7e8cf;color:#0a7d55}
.eac-t{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#fff;border:1px solid #e6e9ef;border-radius:16px;border-bottom-left-radius:5px}
.eac-t i{width:7px;height:7px;border-radius:50%;background:#94a3b8;animation:eac-d 1s infinite}.eac-t i:nth-child(2){animation-delay:.15s}.eac-t i:nth-child(3){animation-delay:.3s}@keyframes eac-d{50%{transform:translateY(-4px);background:#7c3aed}}
#eac-f{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e6e9ef;background:#fff}
#eac-in{flex:1;min-width:0;height:42px;border:1px solid #cfd6e2;border-radius:99px;padding:0 16px;font:inherit;font-size:16px;color:#0f172a;background:#fff}
#eac-f button{width:42px;height:42px;flex:none;border-radius:99px;background:#0f172a;color:#fff;display:grid;place-items:center}#eac-f button svg{width:18px;height:18px}
#eac-ft{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:0 14px 10px;background:#fff;font-size:11.5px;color:#5a6a80}#eac-ft button{font-size:11.5px;text-decoration:underline;color:#5a6a80}
@media(max-width:560px){#eac-p{right:8px;left:8px;width:auto;bottom:calc(76px + env(safe-area-inset-bottom,0px));height:calc(100dvh - 96px);border-radius:18px}#eac-btn{right:12px}#eac-btn span{display:none}#eac-btn{padding:0;width:52px;justify-content:center}}
@media(prefers-reduced-motion:reduce){#eac-p.on{animation:none}.eac-t i{animation:none}#eac-btn{transition:none}}
@media print{#eac-btn,#eac-p{display:none!important}}`;
  const st = document.createElement('style'); st.id = 'eac-css'; st.textContent = css; document.head.appendChild(st);

  const SVG = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const el = (tag, attrs = {}, kids = []) => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => k === 'text' ? e.textContent = v : e.setAttribute(k, v)); kids.forEach(k => e.appendChild(k)); return e; };

  const btn = el('button', { id: 'eac-btn', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'eac-p', 'aria-label': UI.open });
  btn.innerHTML = SVG('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z"/>') + '<span></span>'; btn.lastChild.textContent = UI.open;
  const panel = el('section', { id: 'eac-p', role: 'dialog', 'aria-label': UI.title });
  const head = el('div', { id: 'eac-h' });
  const ht = el('div'); ht.append(el('b', { text: UI.title }), el('small', { text: UI.sub }));
  const x = el('button', { type: 'button', 'aria-label': UI.close, text: '✕' });
  head.append(ht, x);
  const log = el('div', { id: 'eac-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
  const form = el('form', { id: 'eac-f', autocomplete: 'off' });
  const inp = el('input', { id: 'eac-in', type: 'text', placeholder: UI.ph, 'aria-label': UI.ph, maxlength: '300', enterkeyhint: 'send' });
  const send = el('button', { type: 'submit', 'aria-label': UI.send }); send.innerHTML = SVG('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>');
  form.append(inp, send);
  const foot = el('div', { id: 'eac-ft' }); const clr = el('button', { type: 'button', text: UI.clear }); const aiConfigured = typeof window.EA_CHAT_API === 'string' && /^https:\/\//i.test(window.EA_CHAT_API.trim()); foot.append(el('span', { text: aiConfigured ? UI.noteAI : UI.note }), clr);
  panel.append(head, log, form, foot);

  /* ---------- Conversation ---------- */
  let hist = []; try { hist = JSON.parse(sessionStorage.getItem('ea-chat-' + L) || '[]'); } catch (e) { }
  const save = () => { try { sessionStorage.setItem('ea-chat-' + L, JSON.stringify(hist.slice(-30))); } catch (e) { } };
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const addMsg = (cls, text) => { const m = el('div', { class: 'eac-m ' + cls }); m.textContent = text; log.appendChild(m); scroll(); return m; };
  const chips = (items, extraCls) => {
    const w = el('div', { class: 'eac-c' });
    items.forEach(([label, fn, cls]) => { const b = el('button', { type: 'button', text: label }); if (cls) b.className = cls; b.onclick = () => fn(label); w.appendChild(b); });
    log.appendChild(w); scroll(); return w;
  };
  const view = () => (window.EaRoute && window.EaRoute.cur && window.EaRoute.cur()) || 's';
  const suggest = (excl) => {
    const v = view(), pool = TOPICS.filter(t => t.v.includes(v) && t.id !== excl).sort((a, b) => (a.v === v ? 0 : 1) - (b.v === v ? 0 : 1));
    const rest = TOPICS.filter(t => !t.v.includes(v) && t.id !== excl);
    return pool.concat(rest).slice(0, 4);
  };
  const dropChips = () => log.querySelectorAll('.eac-c').forEach(c => c.remove());
  const goTo = v => { try { if (typeof window.show === 'function') window.show(v); else location.hash = ({ s: 'salarie', e: 'entreprise', b: 'banque' })[v]; } catch (e) { } if (matchMedia('(max-width:560px)').matches) close(); window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' }); };

  function showChips(excl, extra) {
    const items = suggest(excl).map(t => [t.l[L], () => ask(t.l[L], t)]);
    if (extra) items.unshift(extra);
    chips(items);
  }
  function reply(r, topic) {
    const t = el('div', { class: 'eac-t', role: 'status', 'aria-label': UI.typing }); t.append(el('i'), el('i'), el('i')); log.appendChild(t); scroll();
    setTimeout(() => {
      t.remove(); addMsg('eac-b', r.t); hist.push({ r: 'b', t: r.t }); save();
      const cur = view(), items = [];
      if (r.go && r.go !== cur) items.push([UI.views[r.go], () => goTo(r.go), 'go']);
      showChips(r.id, items[0]);
    }, reduce() ? 0 : 450 + Math.min(r.t.length, 400));
  }
  async function ask(text, topic) {
    text = String(text || '').trim().slice(0, 1200); if (!text) return;
    dropChips();
    const previous = hist.slice(-8).map(h => ({ role: h.r === 'u' ? 'user' : 'assistant', content: String(h.t || '').slice(0, 1200) }));
    addMsg('eac-u', text); hist.push({ r: 'u', t: text }); save();
    const localResult = topic ? { t: topic.a[L], go: topic.go, id: topic.id } : answer(text);
    const endpoint = typeof window.EA_CHAT_API === 'string' ? window.EA_CHAT_API.trim() : '';
    const deterministicCalculation = !topic && !!calc(text, norm(text));
    /* Les calculs déterministes et les boutons FAQ restent locaux. Les questions libres
       passent par le Worker seulement lorsqu'il est explicitement configuré. */
    if (!topic && endpoint && /^https:\/\//i.test(endpoint) && !deterministicCalculation) {
      const typing = el('div', { class: 'eac-t', role: 'status', 'aria-label': UI.typing });
      typing.append(el('i'), el('i'), el('i')); log.appendChild(typing); scroll(); send.disabled = true; inp.disabled = true;
      try {
        const res = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text, lang: L, audience: view(), history: previous })
        });
        if (!res.ok) throw new Error('AI endpoint HTTP ' + res.status);
        const data = await res.json();
        const generated = String(data.answer || '').trim();
        if (!generated) throw new Error('Empty AI response');
        typing.remove();
        addMsg('eac-b', generated); hist.push({ r: 'b', t: generated }); save();
        showChips(null);
      } catch (err) {
        typing.remove();
        const fallback = localResult || { t: UI.fb, fb: 1 };
        reply(fallback);
      } finally { send.disabled = false; inp.disabled = false; inp.focus({ preventScroll: true }); }
      return;
    }
    reply(localResult || { t: UI.fb, fb: 1 });
  }
  function start() {
    log.textContent = '';
    if (hist.length) { hist.forEach(h => addMsg(h.r === 'u' ? 'eac-u' : 'eac-b', h.t)); showChips(); return; }
    addMsg('eac-b', UI.hello); hist.push({ r: 'b', t: UI.hello }); save(); showChips();
  }

  /* ---------- Ouverture / fermeture ---------- */
  let started = false, opener = null;
  function open() {
    panel.classList.add('on'); btn.setAttribute('aria-expanded', 'true'); opener = document.activeElement;
    if (!started) { started = true; start(); }
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
  }
  function close() { panel.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); if (opener && opener.focus) btn.focus({ preventScroll: true }); }
  btn.onclick = () => panel.classList.contains('on') ? close() : open();
  x.onclick = close;
  clr.onclick = () => { hist = []; save(); log.textContent = ''; started = true; start(); inp.focus(); };
  form.onsubmit = e => { e.preventDefault(); const v = inp.value; inp.value = ''; ask(v); };
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('button,input')].filter(n => !n.disabled && n.offsetParent !== null); if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  const mount = () => { document.body.append(btn, panel); window.EaChat = { open, close, ask: t => { open(); ask(t); }, answer }; };
  /* L'intro illustrée couvre la page au chargement : le bouton n'apparaît qu'après, sans gêner l'animation. */
  const ready = () => { const o = document.getElementById('intro') || document.getElementById('ea-open'); return !o && !document.documentElement.classList.contains('pre'); };
  const wait = () => { if (ready()) { btn.style.display = ''; return; } btn.style.display = 'none'; setTimeout(wait, 400); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { mount(); wait(); }); else { mount(); wait(); }
})();
