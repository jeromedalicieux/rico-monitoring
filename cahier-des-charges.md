# Cahier des charges — Outil interne de monitoring SEO

## 1. Objectif du projet

Développer un outil **interne et privé** permettant de monitorer l’évolution SEO de sites appartenant au propriétaire de l’outil, **sans utiliser Google Search Console ni aucun outil SEO payant**.

L’outil doit fournir des **signaux de variation fiables** (tendances, alertes), et non une exhaustivité comparable aux outils commerciaux.

---

## 2. Contexte d’utilisation

- Usage strictement interne
- Volume faible :
  - < 10 sites
  - < 10 mots-clés par site
- Fréquence :
  - 1 exécution par jour maximum
- Tolérance aux données approximatives
- Maintenance manuelle acceptée

---

## 3. Contraintes acceptées

- Aucune utilisation de :
  - Google Search Console
  - Outils SEO payants
- Données non exhaustives acceptées
- Précision des positions approximative (±1 à 3 positions)
- Scraping autorisé dans un cadre privé
- Pas d’objectif SaaS ou de revente de données

---

## 4. Fonctionnalités attendues

### 4.1 Suivi de positions Google

**Objectif**
Suivre la position d’un site sur Google pour un ensemble de mots-clés donnés.

**Fonctionnalités**
- Recherche Google via scraping
- Détection de la position du domaine dans les résultats organiques
- Arrêt du scan dès que le domaine est trouvé
- Limite à 1–2 pages de résultats maximum

**Données à stocker**
- Site
- Mot-clé
- Position
- URL classée
- Date
- Requête utilisée

**Contraintes techniques**
- Requêtes ciblées :
  - `mot-clé site:domaine`
  - ou `mot-clé + nom de marque`
- Parsing DOM HTML
- Fréquence faible et délais aléatoires

---

### 4.2 Détection Google Business Profile (GMB)

**Objectif**
Détecter l’existence d’une fiche Google Business Profile associée à un site.

**Fonctionnalités**
- Recherche Google Maps par :
  - nom de l’entreprise
  - ville
- Détection de la fiche
- Validation par matching du domaine du site

**Données à récupérer**
- Nom de l’établissement
- Catégorie
- Note
- Nombre d’avis
- URL du site associée

---

### 4.3 Détection de backlinks

**Objectif**
Identifier les backlinks principaux et leur évolution dans le temps.

**Méthodes acceptées**
- Scraping Google via requête :
  - `"domaine" -site:domaine`
- Extraction des domaines référents
- Crawling des pages sources détectées

**Fonctionnalités**
- Détection de nouveaux backlinks
- Détection de backlinks disparus
- Suivi par domaine référent

**Données à stocker**
- Domaine référent
- URL source
- Date de détection
- Statut (nouveau / existant / disparu)

---

### 4.4 Historique et comparaisons

- Conservation de l’historique de chaque exécution
- Comparaisons automatiques :
  - J-1
  - J-7
  - J-30
- Détection de :
  - gains/pertes de positions
  - nouveaux backlinks
  - backlinks perdus
  - changement de statut GMB

---

### 4.5 Alertes

- Alertes simples déclenchées en cas de :
  - chute de position > X
  - disparition de fiche GMB
  - perte de backlinks
- Alertes affichées dans l’interface
- Envoi email optionnel

---

## 5. Architecture attendue

Claude Code est libre de proposer :
- une architecture alternative
- un autre langage
- une autre base de données
- une autre stratégie de scraping

à condition de respecter :
- la simplicité
- la robustesse
- la maintenabilité
- l’usage interne uniquement

---

## 6. Stack technique initiale (modifiable)

- Backend : Node.js
- Scraping : Playwright
- Base de données : SQLite
- Scheduler : cron
- Frontend : Windsurf
- Environnement : local ou VPS

---

## 7. Données à conserver

Pour chaque exécution :
- Date
- Type de vérification
- Paramètres utilisés
- Résultats structurés
- HTML brut (optionnel mais recommandé)

---

## 8. Sécurité et limitations

- Pas d’exécution parallèle des requêtes Google
- Délais aléatoires entre requêtes
- Logs détaillés
- Possibilité d’activer/désactiver chaque module

---

## 9. Évolutions possibles (non prioritaires)

- Multi-localisation
- Mobile vs Desktop
- Score SEO interne synthétique
- Visualisations graphiques avancées

---

## 10. Critères de réussite

Le projet est considéré comme réussi si :
- les positions sont cohérentes dans le temps
- les variations sont détectées correctement
- l’outil permet d’anticiper des problèmes SEO
- l’outil est utilisé régulièrement

---

## 11. Instruction finale pour Claude Code

Tu es libre de proposer **toute amélioration technique pertinente** (architecture, scraping, algorithmes, stockage), tant que :
- l’outil reste à usage interne
- aucun outil payant n’est utilisé
- Google Search Console n’est pas utilisée
