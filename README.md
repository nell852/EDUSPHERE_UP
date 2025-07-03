# EduSphere - Plateforme d'Apprentissage et de Collaboration pour Étudiants

[![React Native](https://img.shields.io/badge/React%20Native-0.72-blue.svg)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue.svg)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📱 À Propos

EduSphere est une application mobile révolutionnaire conçue pour transformer l'expérience d'apprentissage des étudiants. Notre plateforme unifiée offre un accès riche aux ressources éducatives, des outils de collaboration en temps réel, un profil professionnel évolutif, et une assistance intelligente propulsée par l'intelligence artificielle.

### 🎯 Vision

Créer un écosystème où l'étudiant peut non seulement apprendre et s'exercer, mais aussi collaborer sur des projets concrets et bâtir un portfolio professionnel dès le début de son parcours, le tout dans un environnement fluide et intuitif.

## ✨ Fonctionnalités Principales

### 👤 Gestion de Profil & Portfolio
- **Profil professionnel complet** avec avatar, biographie, liens sociaux
- **Portfolio de projets** avec projets réalisés dans ou hors de l'application
- **Génération de CV automatisée** par l'IA
- **Intégration GitHub** pour pousser des projets directement
- **Gestion des connexions** et du réseau professionnel

### 📚 Bibliothèque & Ressources
- **Bibliothèque numérique** avec livres PDF et ePub
- **Téléchargement hors ligne** pour consultation sans connexion
- **Banque d'épreuves** avec possibilité de tentatives et suivi
- **Système de commentaires** et progression de lecture
- **Protection anti-capture d'écran** pour certains contenus

### 💬 Communauté & Collaboration
- **Groupes et communautés** avec chat en temps réel
- **Messages multimédias** avec statut de lecture
- **Mentions et tags** de ressources et utilisateurs
- **Gestion avancée des messages** (épinglage, modification, suppression)
- **Chat privé** entre utilisateurs

### 🛠️ Ateliers de Travail Collaboratifs
- **Marketplace d'environnements** (éditeurs de code, labos cyber, design)
- **Ateliers cloud** avec collaboration en temps réel
- **Appels vocaux/vidéo intégrés** dans les ateliers
- **Stockage persistant** des projets dans le cloud
- **Co-édition** de code et documents

### 🤖 Assistant IA Intelligent
- **Chatbot omniprésent** dans toute l'application
- **Assistance contextuelle** et exécution d'actions
- **Génération de contenu** (documentation, plans de cours)
- **Aide au codage** et au développement

## 🏗️ Architecture Technique

### Frontend
- **React Native** - Développement mobile multiplateforme
- **WebView** - Rendu des environnements d'ateliers distants
- **WebRTC** - Communication temps réel (appels vocaux/vidéo)

### Backend
- **Supabase** - Base de données PostgreSQL, Auth, Storage, Realtime
- **APIs personnalisées** - Node.js/Python sur DigitalOcean
- **Docker** - Conteneurisation des environnements d'ateliers

### Services Externes
- **Google Gemini API** - Intelligence artificielle
- **GitHub API** - Intégration de contrôle de version
- **DigitalOcean** - Infrastructure cloud et orchestration

## 🚀 Installation et Configuration

### Prérequis
- Node.js (v18+)
- React Native CLI
- Android Studio / Xcode
- Docker Desktop
- Compte Supabase
- Compte DigitalOcean

### Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-org/edusphere-mobile-app.git
   cd edusphere-mobile-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configuration des variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Remplir les variables dans `.env` :
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   GITHUB_CLIENT_ID=your_github_client_id
   DIGITALOCEAN_API_TOKEN=your_do_token
   ```

4. **Configuration iOS (si applicable)**
   ```bash
   cd ios && pod install && cd ..
   ```

5. **Lancer l'application**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

## 📊 Diagrammes UML

Le projet inclut une documentation complète avec diagrammes UML :
- **Diagramme de cas d'utilisation** - Interactions utilisateur-système
- **Diagramme de classes** - Structure de la base de données
- **Diagrammes de séquence** - Flux d'interactions complexes
- **Diagramme de composants** - Architecture logicielle
- **Diagramme de déploiement** - Infrastructure de production

## 🔧 Développement

### Structure du Projet
```
src/
├── components/          # Composants réutilisables
├── screens/            # Écrans de l'application
├── services/           # Services API et logique métier
├── utils/              # Utilitaires et helpers
├── navigation/         # Configuration de navigation
├── hooks/              # Hooks React personnalisés
└── types/              # Définitions TypeScript
```

### Scripts Disponibles
```bash
npm run start          # Démarrer Metro bundler
npm run android        # Lancer sur Android
npm run ios           # Lancer sur iOS
npm run test          # Exécuter les tests
npm run lint          # Vérifier le code
npm run build         # Build de production
```

### Workflow Git
1. Créer une branche feature : `git checkout -b feature/nom-fonctionnalite`
2. Développer et commiter les changements
3. Pousser la branche : `git push origin feature/nom-fonctionnalite`
4. Créer une Pull Request
5. Revue de code et merge

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

## 📈 Roadmap

### Phase 1 : MVP Fondamental (Mois 1-3)
- [x] Authentification et gestion de profil
- [x] Bibliothèque et banque d'épreuves
- [x] Chat en temps réel
- [ ] Gestion du stockage local

### Phase 2 : Ateliers & IA (Mois 4-6)
- [ ] Marketplace d'environnements
- [ ] Premiers ateliers collaboratifs
- [ ] Intégration chatbot IA
- [ ] Notifications

### Phase 3 : Portfolio Pro (Mois 7-9)
- [ ] Portfolio complet
- [ ] Génération CV par IA
- [ ] Intégration GitHub
- [ ] Appels vocaux/vidéo

### Phase 4 : Optimisation (Mois 10+)
- [ ] Performances et scalabilité
- [ ] Nouveaux types d'ateliers
- [ ] Fonctionnalités sociales avancées
- [ ] Monétisation

## 💰 Modèle Économique

### Freemium
- **Gratuit** : Accès aux fonctionnalités de base
- **Premium** : Ateliers avancés, stockage étendu, IA prioritaire
- **Institutionnel** : Solutions pour universités et écoles

## 👥 Équipe

- **Kenmeugne Tchoupo Calixte Franck** - Lead Tech / Architecte
- **Mvele Nyogog Silvan Nell Blaise** - Développeur Frontend Mobile
- **Watong Stengang Kevin Dalma** - Développeur Frontend Mobile  
- **Fonkou Oumbe Booz Melki** - Développeur Backend/DevOps

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez lire notre [guide de contribution](CONTRIBUTING.md) pour commencer.

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

- **Email** : edusphere745@gmail.com
- **Documentation** : [docs.edusphere.app](https://docs.edusphere.app)
- **Issues** : [GitHub Issues](https://github.com/nell852/EDUSPHERE_UP/issues)

## 🔗 Liens Utiles

- [Documentation React Native](https://reactnative.dev/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation DigitalOcean](https://docs.digitalocean.com/)
- [API Google Gemini](https://ai.google.dev/)
- [API GitHub](https://docs.github.com/en/rest)

---

**EduSphere** - Révolutionner l'apprentissage étudiant, un projet à la fois. 🚀
```

