# Mettre à jour votre site / Updating your site

Ce site est construit avec Hugo et publié automatiquement par GitHub Pages à chaque modification de la branche `main`.

## Ajouter une publication

1. Dans `content/publication/`, copiez le dossier d'une publication existante et renommez-le (ex. `2027-mon-article`).
2. Modifiez `index.md` : titre, auteurs, année, type, revue, DOI, résumé.
3. Enregistrez (commit) : le site se reconstruit en 1 à 2 minutes.

Les onglets, filtres, l'export BibTeX et les « Voir aussi » se mettent à jour tout seuls.

## Ajouter une communication

Même principe dans `content/talk/`.

## Modifier la bio, la Chaire, l'enseignement, le contact

Éditez `content/bio/index.md`, `content/chaire/index.md`, `content/teaching/index.md`, `content/contact/index.md`.

## À vérifier absolument

- **Page Co-auteurs** : la liste est générée automatiquement à partir de vos publications. Les liens (`data/coauthors.json`) ont été trouvés par recherche web et **doivent être relus** : seules 7 personnes ont un lien ; les autres apparaissent sans lien. Ajoutez ou corrigez une ligne `"Nom": {"url": "https://…"}` au besoin.
- **Bio** : le paragraphe narratif est un brouillon rédigé à partir de votre CV (voir le commentaire HTML dans le fichier).
- **Coquilles repérées dans le CV** (signalées en commentaires dans les fichiers concernés) : URL du DOI de l'Annuaire, DOI via proxy ulaval, Champs de Mars 2017/2019, titre du mémoire, titre provisoire du numéro spécial.
- Aucun PDF n'est déposé : ajoutez vos fichiers dans `static/files/` et référencez-les dans la publication.

## Pied de page

Le crédit « mysite » et le marqueur invisible sont activés (`params.mysite` dans `hugo.yaml`). Mettez `credit: false` / `discovery: false` pour les retirer.
