# SmartPocket

Application web locale destinée aux étudiants pour suivre un budget mensuel, enregistrer des dépenses et visualiser un objectif d’épargne.

Le projet a été conçu et développé avec l’assistance de **Cursor AI**, puis structuré comme une application HTML / CSS / JavaScript autonome, utilisable hors ligne.

## Objectif

Permettre de gérer simplement :

- un budget mensuel en dinar tunisien (DT / TND) ;
- une liste de dépenses classées par catégorie ;
- un objectif d’épargne avec barre de progression ;
- un aperçu visuel de la consommation du budget.

## Fonctionnalités

- Tableau de bord : budget, total dépensé, solde restant, épargne.
- Barre de progression du budget (états normal / attention / alerte).
- Configuration du budget et d’un objectif d’épargne mensuel optionnel.
- Ajout, modification et suppression de dépenses (avec confirmation).
- Filtre par catégorie et tris (date, montant).
- Graphique de répartition par catégorie (Canvas, sans bibliothèque externe).
- **Smart Assistant** : conseils générés par des **règles JavaScript locales**. Il ne s’agit pas d’un modèle d’intelligence artificielle ni d’une API externe.
- Objectif d’épargne nommé (cible, montant économisé, progression).
- Données de démonstration au premier lancement.
- Bouton de réinitialisation (avec confirmation).
- Sauvegarde automatique dans `localStorage`.

## Technologies

- HTML5
- CSS3
- JavaScript (vanilla)
- `localStorage` du navigateur

Aucun backend, aucun compte utilisateur, aucune base de données distante.

## Lancer le projet

1. Télécharger ou cloner le dossier `smart-pocket`.
2. Ouvrir le fichier `index.html` dans un navigateur moderne (Chrome, Edge, Firefox, etc.).
3. L’application fonctionne immédiatement, sans installation et sans serveur.

Les données restent dans le navigateur utilisé. Vider le stockage du site ou cliquer sur **Réinitialiser les données** restaure l’exemple de démonstration.

## Structure des fichiers

```
smart-pocket/
├── index.html    Interface principale
├── style.css     Mise en page et design responsive
├── script.js     Logique métier, validations et persistance
└── README.md     Documentation du projet
```

## Limites

- Les données ne sont pas synchronisées entre appareils.
- Le Smart Assistant n’utilise pas d’IA externe : uniquement des règles locales.
- L’application est prévue pour un usage pédagogique et personnel, pas pour une comptabilité officielle.
