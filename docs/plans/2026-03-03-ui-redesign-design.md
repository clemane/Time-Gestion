# UI Redesign — Design Document

**Date**: 2026-03-03
**Objectif**: Refonte complète de l'interface pour une app moderne, chaleureuse, ultra-responsive et simple d'utilisation.

## Direction esthétique

**Ton**: Chaleureuse & organique — comme un carnet en papier recyclé, encre naturelle, plantes d'intérieur.

## Typographie

- **Display/titres**: `DM Serif Display` (Google Fonts) — serif élégant avec du caractère
- **Corps**: `Plus Jakarta Sans` (Google Fonts) — sans-serif géométrique mais doux, très lisible
- **Mono**: `JetBrains Mono` pour les snippets de code éventuels

## Palette — Terre & Sauge

### Light mode
| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-bg` | `#FAF8F5` | Fond principal (crème lin) |
| `--color-bg-secondary` | `#F0EDE8` | Fond secondaire (sable doux) |
| `--color-bg-elevated` | `#FFFFFF` | Cartes, surfaces élevées |
| `--color-text` | `#2C2520` | Texte principal (brun profond) |
| `--color-text-secondary` | `#8C8279` | Texte secondaire (taupe) |
| `--color-text-tertiary` | `#B8AFA6` | Texte tertiaire |
| `--color-primary` | `#7C9A82` | Accent primaire (vert sauge) |
| `--color-primary-dark` | `#5E7D64` | Accent primaire hover |
| `--color-primary-ghost` | `rgba(124, 154, 130, 0.12)` | Fond léger primaire |
| `--color-accent` | `#C4856A` | Accent secondaire (terre cuite) |
| `--color-danger` | `#C45C4A` | Erreur/danger |
| `--color-success` | `#6B9E76` | Succès |
| `--color-warning` | `#D4A547` | Avertissement |
| `--color-border` | `rgba(44, 37, 32, 0.08)` | Bordures subtiles warm |
| `--color-border-subtle` | `rgba(44, 37, 32, 0.04)` | Bordures très subtiles |

### Dark mode
| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-bg` | `#1C1A17` | Fond principal sombre |
| `--color-bg-secondary` | `#262320` | Fond secondaire |
| `--color-bg-elevated` | `#2E2B27` | Cartes sombres |
| `--color-text` | `#E8E2D9` | Texte clair |
| `--color-text-secondary` | `#9C9488` | Texte secondaire |
| `--color-text-tertiary` | `#6B6560` | Texte tertiaire |
| `--color-border` | `rgba(232, 226, 217, 0.1)` | Bordures |

Les accents (sauge, terre cuite) restent identiques en dark mode.

## Formes & espace

- Radius cartes: `16px`
- Radius nav flottante: `24px`
- Radius boutons: `12px`
- Radius pills/chips: `9999px`
- Ombres organiques teintées brun: `0 4px 20px rgba(44, 37, 32, 0.06)`
- Grande ombre: `0 8px 32px rgba(44, 37, 32, 0.1)`
- Légère texture grain/noise sur le fond principal

## Navigation

### Tab bar flottante (mobile/tablette)
- 4 onglets: Notes, Calendrier, Menu, Réglages
- Capsule `border-radius: 24px`, fond glassmorphism teinté crème
- Ombre douce, flotte à ~16px du bas, centrée
- Onglet actif: fond pill vert sauge avec texte blanc
- Icônes Lucide + label en dessous

### Desktop (> 1024px)
- La tab bar disparaît → sidebar verticale permanente à gauche
- Layout master/detail: sidebar nav + zone contenu

### Recherche
- Plus de page/onglet dédié recherche
- Icône loupe dans le header → au tap, champ de recherche qui descend avec animation
- Recherche globale (notes + événements + recettes)

## Responsive breakpoints

| Breakpoint | Comportement |
|-----------|--------------|
| `< 768px` | Mobile: stack vertical, tab bar flottante |
| `768px - 1024px` | Tablette: grilles 2-3 colonnes, tab bar flottante |
| `> 1024px` | Desktop: sidebar permanente + master/detail |

## Simplifications UX

### Notes
- Tap "+" → crée directement une note vide, catégorie choisie depuis l'éditeur
- Cartes compactes avec dot coloré de catégorie (pas de fond coloré entier)
- Filtres chips discrets et horizontaux

### Calendrier
- Segmented control Mois/Semaine/Agenda en style pill organique
- Vue mois compacte avec dots colorés pour événements

### Menu/Recettes
- Sous-tabs Recettes/Planning/Courses en pills horizontales
- Cartes recettes avec image ou placeholder élégant
- Liste de courses avec checkboxes rondes satisfaisantes

### Headers
- Compact: nom section 20px medium + icônes action à droite
- Plus de H1 34px massifs

## Animations

- Transitions spring: `cubic-bezier(0.25, 1, 0.5, 1)`
- Stagger reveal au chargement des listes
- Tab bar: transition pill smooth sur changement d'onglet
- Recherche: slide-down élégant
- Bottom sheets: spring avec handle de drag
