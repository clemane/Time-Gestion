# Partner Sharing — Design Document

## Concept
Système de partage pour couples. Chaque utilisateur a ses données perso mais peut lier son compte à un partenaire via code d'invitation. Une fois liés, ils partagent automatiquement recettes, meal plan et courses. Ils peuvent aussi partager des groupes (calendriers) pour les notes et events.

## Invitation par code
1. User A → Réglages → "Inviter un partenaire" → génère code 6 chiffres (valide 15 min)
2. User B → Réglages → "Rejoindre un partenaire" → tape le code
3. Les comptes sont liés (relation Partner bidirectionnelle)

## Partage automatique (partenaires liés)
- **Recettes** : toutes visibles et éditables par les deux
- **Meal plan** : planning commun
- **Liste de courses** : commune

## Partage manuel (par groupe)
- Bouton "Partager" sur chaque groupe/calendrier dans Réglages
- Partager un calendrier → l'autre voit tous les events et notes dedans
- Égalité totale, pas de lecture seule

## Modèle de données
- Nouveau model `PartnerInvite` : code, userId, expiresAt
- Nouveau champ `partnerId` sur User (relation bidirectionnelle)
- Le sync pull inclut les données du partenaire pour les ressources partagées
