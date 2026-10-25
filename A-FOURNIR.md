# Earnly — informations à fournir et points à valider

Ce fichier suit ce qui manque ou reste à décider. Rien de ce qui est listé ici n'a été inventé : les marqueurs sont visibles dans le site.

## A. Informations que seul le porteur du projet peut fournir (mentions légales, section « Éditeur » et « Hébergement »)
- [ ] Dénomination ou nom de l'éditeur — `[à compléter]`
- [ ] Forme juridique — `[à compléter]`
- [ ] Siège social ou domicile — `[à compléter]`
- [ ] Numéro d'immatriculation (SIREN / RCS) — `[à compléter]`
- [ ] TVA intracommunautaire — `[le cas échéant]`
- [ ] Directeur de la publication — `[à compléter]`
- [ ] Hébergeur : nom, adresse, téléphone / site web — `[… à compléter]` (à renseigner d'après le mode d'hébergement réellement retenu, par exemple GitHub Pages)
- [ ] Durées de conservation des messages reçus par le formulaire (à ajouter dans la politique de confidentialité)
- [ ] Vérifier que le relais d'e-mail du formulaire est bien activé (envoyer un message de test depuis la page Entreprise, répondre au mail d'activation si demandé)

## B. Décisions commerciales à confirmer
- [ ] Frais salarié : 0,20 % (client d'une banque partenaire) et 0,70 % (autre banque) — hypothèses
- [ ] Répartition 50 % Earnly / 50 % banque dans les deux scénarios — hypothèse
- [ ] Aucun abonnement ni licence facturé à l'entreprise — hypothèse commerciale à confirmer par contrat
- [ ] Plafond d'avance de 40 % du salaire acquis — hypothèse de travail
- [ ] Répartition du risque d'impayé entre Earnly et la banque — à négocier

## C. Points à valider juridiquement, fiscalement ou techniquement
- [ ] Qualification juridique du produit et du financement
- [ ] Rôle de la banque ; rôle d'Earnly comme fournisseur de technologie
- [ ] Obligations éventuelles liées à l'intermédiation bancaire ou aux services de paiement
- [ ] Mécanisme de remboursement (principal, frais, versement du salaire traités séparément) — aucun prélèvement ni compensation n'est présenté comme autorisé ou opérationnel
- [ ] Traitement des impayés, procédure de régularisation et de recouvrement
- [ ] RGPD : rôles et responsabilités, durées de conservation, information des salariés, droits d'accès par rôle
- [ ] Traitement fiscal des frais et rémunérations, TVA comprise
- [ ] Intégration RH ou paie (aucune n'existe aujourd'hui)

## D. Technique
- Les liens directs sont `…/#salarie`, `…/#entreprise`, `…/#banque` ; les pages `salarie.html`, `entreprise.html`, `banque.html` donnent un aperçu de partage propre à chaque public puis redirigent.
- L'adresse canonique et `og:image` utilisent l'adresse GitHub Pages. Si un domaine personnalisé est branché plus tard, remplacer `https://earnlysite.github.io/EarnlyWS/` dans `index.html`, les trois pages ci-dessus, `sitemap.xml` et `robots.txt`.
- À chaque modification du site, changer `VERSION` dans `sw.js` (actuellement `earnly-v4`).
