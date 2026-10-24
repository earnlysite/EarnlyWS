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

## Fonctionnement

- **Langues** : français, anglais, espagnol, italien (sélecteur en haut de page). Le choix est mémorisé dans le navigateur du visiteur.
- **Intro animée** : une courte animation par parcours, jouée une seule fois par parcours et par visite. Bouton « Passer », touche Échap, ou réglage « réduire les animations » du système pour l'ignorer.
- **Mentions légales** : lien discret tout en bas de page, qui ouvre une fenêtre plein écran dans la langue choisie.
- **Données** : aucune donnée n'est collectée sauf via le formulaire. Aucun cookie publicitaire ni outil d'audience. Les simulations tournent dans le navigateur avec des données fictives.

## Important

Concept en développement : aucune banque connectée, aucune intégration de paie active, aucun partenaire signé. Earnly n'est pas une banque et ne manipule aucun fonds.
