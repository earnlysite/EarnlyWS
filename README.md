# Earnly — site vitrine

Site vitrine statique : le mode local ne nécessite **aucun serveur ni base de données**. Une connexion IA facultative peut être ajoutée avec un Worker Cloudflare séparé. Il suffit de déposer les fichiers du site sur un hébergement (GitHub Pages, Netlify, Vercel, Cloudflare Pages…). Utiliser **https** (obligatoire pour le service worker).

Concept en développement : aucune banque connectée, aucune intégration de paie active, aucun partenaire signé. Earnly n'est pas une banque et ne manipule aucun fonds. Tous les montants et résultats affichés sont fictifs.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | Le site complet : trois parcours (Salarié, Entreprise, Banque), simulateurs, console RH simulée, tableau de bord bancaire fictif, formulaire, mentions légales |
| `chatbot.js` | Assistant local tolérant aux fautes, 4 langues, calculs et recherche dans le site ; connexion IA facultative |
| `earnly-chat-worker.js` | Worker Cloudflare facultatif pour les réponses IA libres (clé API conservée côté serveur) |
| `app.html` | Aperçu du téléphone de la démo seul, plein écran |
| `salarie.html`, `entreprise.html`, `banque.html` | Aperçu de partage propre à chaque public (titre, description, image), puis redirection vers `index.html#…` |
| `favicon.png`, `og-image.png` | Icône de l'onglet et image de partage |
| `robots.txt`, `sitemap.xml` | Référencement (adresse GitHub Pages) |
| `sw.js` | Service worker : chargement rapide et affichage hors ligne |

Les documents de travail internes (suivi des informations à fournir, modèle de rentabilité, hypothèses de coûts) **ne font pas partie de ce dépôt** : ils se conservent dans un espace privé.

## Tester en local

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

On peut aussi ouvrir `index.html` directement : tout fonctionne, sauf le service worker (qui demande `https` ou `localhost`).

## Mettre en ligne

1. Déposer le contenu de ce dossier à la racine du dépôt GitHub Pages (remplacer les fichiers existants).
2. **Après chaque modification du site**, changer `VERSION` dans `sw.js` (actuellement `earnly-v11`) : c'est ce qui force les visiteurs à recevoir la nouvelle version au lieu de l'ancienne gardée en cache.
3. Si un domaine personnalisé est branché, remplacer `https://earnlysite.github.io/EarnlyWS/` dans `index.html`, `salarie.html`, `entreprise.html`, `banque.html`, `sitemap.xml` et `robots.txt`.
4. **Mentions légales** : compléter les passages entre crochets (`[à compléter]`, `[da completare]`, `[to be completed]`, `[por completar]`) dans `index.html` quand les informations seront disponibles, puis faire relire le texte par un juriste.
5. **Formulaire de contact** : les messages partent vers l'adresse du porteur du projet, sans qu'elle soit affichée. Au premier envoi test depuis le vrai domaine, le service de relais FormSubmit envoie un e-mail de confirmation à cette adresse : cliquer sur le lien pour l'activer. Tant que ce n'est pas fait, le site ouvre la messagerie du visiteur avec le message pré-rempli.

## Tests automatisés

Avec Node.js 18 ou une version plus récente, depuis la racine du dépôt :

```bash
node tests/earnly.test.cjs
```

Le test vérifie les principales questions avec fautes, les calculs, les quatre langues, la recherche d’extraits du site et le relais IA avec une réponse API simulée. Il ne remplace pas un test navigateur complet ni un test en conditions réelles après déploiement du Worker.

## Chatbot

`chatbot.js` ajoute l’assistant en bas à droite de `index.html`.

### Mode local (fonctionne sans compte ni clé API)

- Comprend les 4 langues du site : français, anglais, espagnol et italien.
- Tolère les accents manquants, les abréviations courantes, les fautes de frappe et certaines variantes de mots.
- Répond sur les 15 grands sujets Earnly et effectue les calculs déterministes à partir des hypothèses affichées.
- Si une question ne correspond pas à une réponse prédéfinie, recherche un passage pertinent dans les trois parcours du site. Il cite alors un extrait existant au lieu d’inventer une réponse.
- Conserve l’historique dans `sessionStorage` : il reste dans l’onglet du navigateur et n’est pas envoyé à un serveur en mode local.

Ce mode n’est pas un modèle d’IA générative : il ne peut pas répondre de façon fiable à absolument n’importe quelle question. Il est volontairement prudent lorsqu’il ne trouve pas d’information.

### Mode IA (pour les questions vraiment libres)

Un navigateur GitHub Pages ne doit jamais contenir une clé OpenAI : le code source est public. Le fichier `earnly-chat-worker.js` fournit un relais serveur Cloudflare prêt à configurer. Les calculs du salaire et les boutons de sujets restent locaux ; les questions libres sont envoyées au Worker lorsqu’une URL est configurée. En cas d’échec réseau, le chatbot revient à ses réponses locales.

1. Dans Cloudflare, créez un Worker et collez le contenu de `earnly-chat-worker.js`, puis déployez-le.
2. Créez un espace de stockage **Workers KV** et liez-le au Worker sous le nom `CHAT_RATE_LIMIT` (ce binding est requis pour limiter les requêtes à 20 par adresse IP et par minute).
3. Dans les paramètres du Worker, ajoutez `OPENAI_API_KEY` comme **Secret**. Ne mettez jamais cette clé dans GitHub, dans `index.html` ou dans `chatbot.js`.
4. Ajoutez la variable `ALLOWED_ORIGINS` avec `https://earnlysite.github.io`. Ajoutez votre domaine personnalisé éventuel, séparé par une virgule. Vous pouvez définir `OPENAI_MODEL` ; par défaut le Worker utilise `gpt-6-luna`.
5. Vérifiez l’adresse `https://VOTRE-WORKER.workers.dev/health` : elle doit répondre `ok: true`. La route `/chat` n’accepte que l’origine configurée. CORS n’est pas un système d’authentification : conservez le quota KV et surveillez l’usage du Worker.
6. Dans `index.html`, remplacez la valeur vide de `window.EA_CHAT_API` par l’URL du Worker terminant par `/chat`, par exemple `https://VOTRE-WORKER.workers.dev/chat`.

Quand le mode IA est activé, les messages et les derniers échanges sont transmis au Worker puis au fournisseur IA pour produire les réponses. Le pied de chat l’indique. Ne saisissez jamais de coordonnées bancaires, données de paie, identifiants ou informations sensibles. La clé API reste stockée côté Worker. L’utilisation de l’API peut entraîner une facturation séparée selon le compte et le modèle choisis.

### Garde-fous de contenu

Le Worker contient les règles Earnly : concept non lancé, aucun partenaire signé, données fictives, taux et plafond comme hypothèses, rôles des acteurs, circuit de remboursement à valider, et absence de validation juridique/réglementaire. Il demande au modèle de distinguer systématiquement les faits, les hypothèses et les points non validés. Les réponses de l’IA restent à contrôler avant une mise en production commerciale.

Pour modifier les réponses locales, éditer `TOPICS` et `CFG` au début de `chatbot.js`. Pour modifier les règles de l’assistant IA, éditer `EARNLY_RULES` dans `earnly-chat-worker.js`.

## Fonctionnement

- **Langues** : français, anglais, espagnol, italien (sélecteur en haut de page, choix mémorisé dans le navigateur). Les nombres suivent la langue choisie.
- **Intro illustrée** : une courte animation par parcours, jouée une fois par parcours et par visite — le salaire qui se remplit (Salarié), les tâches répétitives barrées pour une seule vérification (Entreprise), le module Earnly qui s'ajoute aux services de la banque (Banque). Bouton « Passer », clic, touche Échap, ou réglage « réduire les animations » du système pour l'ignorer.
- **Mentions légales** : lien discret en bas de page, fenêtre plein écran dans la langue choisie.
- **Données** : aucune donnée n'est collectée sauf via le formulaire. Aucun cookie publicitaire ni outil d'audience. Les simulations tournent dans le navigateur avec des données fictives ; rien n'est enregistré ni transmis.

## Structure des pages

- **Salarié** (`#salarie`) : introduction, l'essentiel (combien, coût en euros, remboursement, données) avec un exemple chiffré, démonstration interactive (téléphone, réglages, détail du calcul), calcul étape par étape, cycle de paie, fonctionnement envisagé, questions, statut du projet. Aucun formulaire de collecte pour les salariés.
- **Entreprise** (`#entreprise`) : l'essentiel, **console RH simulée** (tableau des salariés avec recherche et filtres, confirmation individuelle ou collective, modification, signalements d'anomalie, d'arrêt ou de départ, données obsolètes, import et export fictifs, historique, état du cycle), rôle de l'employeur, parcours et transmission sécurisée, informations nécessaires, ce que cela implique, estimation du temps administratif, questions, contact. La console ne montre ni demandes d'avance, ni historique d'usage, ni données bancaires.
- **Banque** (`#banque`) : proposition de valeur, tableau de bord fictif (aperçu, opérations, rentabilité, pilote, simulation, paramètres, définitions des indicateurs), circuit d'une avance et matrice des responsabilités, qui fait quoi, modèle économique (scénarios A 0,20 % et B 0,70 %, partage 50/50), proposition de pilote, conditions préalables au lancement, questions, contact.

Périmètre de démonstration : salariés en CDI, salaire net de référence hors primes variables, plafond de 40 % du salaire acquis (mois ramené à 30 jours), avance financée par la banque, remboursement par prélèvement SEPA autorisé le jour de la paie (choix de conception, non activé), responsabilité des pertes selon les manquements de chaque partie (modalités à définir avec la banque), transmission des deux données par l'employeur par fichier ou dépôt sécurisé à chaque cycle. Ces choix fixent le périmètre du prototype : ils ne constituent ni une validation juridique, ni une preuve de rentabilité, ni l'engagement d'un partenaire.
