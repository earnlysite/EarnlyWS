# Earnly — site vitrine

Site statique d'une seule page : **aucune installation, aucun serveur, aucune base de données**. Il suffit de déposer ces fichiers sur un hébergement.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Le site complet (design, animations, simulateurs, trois parcours Salarié / Entreprise / Banque, formulaire, mentions légales) |
| `app.html` | Aperçu de l'application seule : le téléphone de la démo, plein écran, utilisable à part (lien vers `/app.html`) |
| `favicon.png` | Icône de l'onglet du navigateur (512 × 512, issue du logo) |
| `robots.txt` | Consignes pour les moteurs de recherche |
| `sitemap.xml` | Plan du site pour les moteurs de recherche |
| `sw.js` | Service worker : chargement plus rapide et affichage hors ligne |

## Tester en local

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

On peut aussi double-cliquer sur `index.html` : tout fonctionne, sauf le service worker (qui demande `https` ou `localhost`).

## Mettre en ligne

Déposer le contenu du dossier à la racine du site : Netlify (glisser-déposer), Vercel, GitHub Pages, Cloudflare Pages ou un hébergement classique (OVH, o2switch…). Utiliser **https** (obligatoire pour le service worker).

## À faire avant la mise en ligne

1. **Domaine** : remplacer `https://www.example.com/` par l'adresse réelle dans `robots.txt` et `sitemap.xml`.
2. **Mentions légales** : compléter tous les passages entre crochets (`[à compléter]`, `[da completare]`, `[to be completed]`, `[por completar]`) dans `index.html` : nom ou raison sociale, forme juridique, adresse, SIREN, directeur de la publication, hébergeur. Rechercher « à compléter » dans le fichier. Faire relire le texte par un juriste.
3. **Formulaire de contact** : les messages partent vers l'adresse du porteur du projet, sans qu'elle soit affichée sur le site. Au **premier envoi test** depuis le vrai domaine, le service de relais FormSubmit envoie un e-mail de confirmation à cette adresse : cliquer sur le lien pour activer. Tant que ce n'est pas fait, le site ouvre la messagerie du visiteur avec le message pré-rempli.
4. **Service worker** : après chaque modification du site, changer `VERSION` dans `sw.js` (par exemple `earnly-v2`) pour que les visiteurs reçoivent la nouvelle version.

## Tests

```bash
npm i playwright && npx playwright install chromium   # une fois
node tests/earnly.test.js
```
La suite (86 contrôles) charge le site dans un vrai navigateur : erreurs console dans les 4 langues et les 3 parcours, agrégats du tableau de bord recalculés indépendamment sur 30 j / 90 j / 12 mois, export CSV, paramètres et réinitialisation, cohérence du pilote fictif, simulation de rentabilité contre des valeurs calculées à la main, traductions des nouveaux blocs, absence de défilement horizontal sur mobile. Elle ne teste ni l'envoi réel du formulaire (réseau) ni l'ouverture du CSV dans Excel.

## Fichier interne (ne pas publier)

`interne/modele-interne.html` est une copie du site avec la simulation de rentabilité interne d'Earnly (coûts fixes et variables, trois scénarios, seuil de rentabilité). Ces chiffres concernent l'équipe, pas les banques : **ne pas déposer ce dossier sur GitHub Pages** (un dépôt public l'exposerait).

## Fonctionnement

- **Langues** : français, anglais, espagnol, italien (sélecteur en haut de page). Le choix est mémorisé dans le navigateur du visiteur.
- **Intro animée** : une courte animation par parcours, jouée une seule fois par parcours et par visite. Bouton « Passer », touche Échap, ou réglage « réduire les animations » du système pour l'ignorer.
- **Mentions légales** : lien discret tout en bas de page, qui ouvre une fenêtre plein écran dans la langue choisie.
- **Données** : aucune donnée n'est collectée sauf via le formulaire. Aucun cookie publicitaire ni outil d'audience. Les simulations tournent dans le navigateur avec des données fictives.

## Important

Concept en développement : aucune banque connectée, aucune intégration de paie active, aucun partenaire signé. Earnly n'est pas une banque et ne manipule aucun fonds.

## Structure des pages

- **Salarié** (`#salarie`) : téléphone de simulation en haut, calcul en cinq étapes, calendrier du cycle, fonctionnement envisagé (circuit, éligibilité, frais, données, cas de suspension), questions, statut du projet. Aucun formulaire de collecte pour les salariés.
- **Entreprise** (`#entreprise`) : console RH fictive en haut, bénéfices attendus, rôle de l'employeur, temps administratif, parcours, informations nécessaires, ce que l'intégration impliquerait, questions, contact.
- **Banque** (`#banque`) : tableau de bord fictif en haut (12 mois calendaires, onglet Pilote), bénéfices, circuit de remboursement et maîtrise du risque, modèle économique (scénarios A 0,20 % et B 0,70 %), proposition de pilote, cadre réglementaire, architecture, questions, contact.

Tous les montants et résultats affichés sont fictifs. L'onglet **Simulation** du parcours Banque calcule frais, pertes nettes, coûts, contribution par avance et seuil de rentabilité d'Earnly : toutes les valeurs de départ (partage des pertes 50 %, coût variable 0,05 €, coûts fixes 20 000 €/mois, récupération 99,8 %) sont des hypothèses de travail modifiables, pas des données.

Périmètre de démonstration retenu : CDI, salaire net de référence hors primes variables, plafond de 40 % du salaire acquis (mois ramené à 30 jours), avance financée par la banque, remboursement par prélèvement SEPA autorisé le jour de la paie (choix de conception, non activé), perte nette partagée 50/50 entre la banque et Earnly (choix de conception, sans contrat), transmission des deux données par l'employeur par fichier ou dépôt sécurisé à chaque cycle.

Voir `A-FOURNIR.md` pour les informations manquantes et les points à valider.
