# Earnly — site vitrine

Site statique : **aucune installation, aucun serveur, aucune base de données**. Il suffit de déposer ces fichiers sur un hébergement (GitHub Pages, Netlify, Vercel, Cloudflare Pages…). Utiliser **https** (obligatoire pour le service worker).

Concept en développement : aucune banque connectée, aucune intégration de paie active, aucun partenaire signé. Earnly n'est pas une banque et ne manipule aucun fonds. Tous les montants et résultats affichés sont fictifs.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | Le site complet : trois parcours (Salarié, Entreprise, Banque), simulateurs, console RH simulée, tableau de bord bancaire fictif, formulaire, mentions légales |
| `app.html` | Aperçu du téléphone de la démo seul, plein écran |
| `salarie.html`, `entreprise.html`, `banque.html` | Aperçu de partage propre à chaque public (titre, description, image), puis redirection vers `index.html#…` |
| `favicon.png`, `og-image.png` | Icône de l'onglet et image de partage |
| `robots.txt`, `sitemap.xml` | Référencement (adresse GitHub Pages) |
| `sw.js` | Service worker : chargement rapide et affichage hors ligne |
| `tests/earnly.test.js` | Suite de tests automatisés (voir plus bas) |

Les documents de travail internes (suivi des informations à fournir, modèle de rentabilité, hypothèses de coûts) **ne font pas partie de ce dépôt** : ils se conservent dans un espace privé.

## Tester en local

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

On peut aussi ouvrir `index.html` directement : tout fonctionne, sauf le service worker (qui demande `https` ou `localhost`).

## Mettre en ligne

1. Déposer le contenu de ce dossier à la racine du dépôt GitHub Pages (remplacer les fichiers existants).
2. **Après chaque modification du site**, changer `VERSION` dans `sw.js` (actuellement `earnly-v9`) : c'est ce qui force les visiteurs à recevoir la nouvelle version au lieu de l'ancienne gardée en cache.
3. Si un domaine personnalisé est branché, remplacer `https://earnlysite.github.io/EarnlyWS/` dans `index.html`, `salarie.html`, `entreprise.html`, `banque.html`, `sitemap.xml` et `robots.txt`.
4. **Mentions légales** : compléter les passages entre crochets (`[à compléter]`, `[da completare]`, `[to be completed]`, `[por completar]`) dans `index.html` quand les informations seront disponibles, puis faire relire le texte par un juriste.
5. **Formulaire de contact** : les messages partent vers l'adresse du porteur du projet, sans qu'elle soit affichée. Au premier envoi test depuis le vrai domaine, le service de relais FormSubmit envoie un e-mail de confirmation à cette adresse : cliquer sur le lien pour l'activer. Tant que ce n'est pas fait, le site ouvre la messagerie du visiteur avec le message pré-rempli.

## Tests

```bash
npm i playwright && npx playwright install chromium   # une fois
node tests/earnly.test.js
```

La suite charge le site dans un vrai navigateur (Chromium) et contrôle notamment : les erreurs console dans les 4 langues et les 3 parcours ; les agrégats du tableau de bord recalculés indépendamment (30 j, 90 j, 12 mois) ; l'export CSV, les paramètres et la réinitialisation ; la simulation bancaire contre des valeurs calculées à la main ; la **console RH simulée** (confirmation, recherche, filtres, modification avec contrôle des saisies, signalements, actualisation, import et export fictifs, historique, confidentialité) ; l'**intro illustrée** (dessin réel, passage, fin automatique, respect de « réduire les animations ») ; la disposition de la démo Salarié ; les formats de nombres par langue ; l'ordre des sections ; les traductions des blocs ajoutés ; l'absence de défilement horizontal sur mobile ; les contrastes, le lien d'évitement et l'accessibilité clavier ; le sitemap, le service worker et les liens d'ancrage. Elle ne teste ni l'envoi réel du formulaire (réseau) ni l'ouverture du CSV dans Excel.

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
