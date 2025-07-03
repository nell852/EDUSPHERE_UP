# Étape 1 : Utiliser une image de base avec Node.js
FROM node:20

# Étape 2 : Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Étape 3 : Copier les fichiers de dépendances
COPY package*.json ./

# Étape 4 : Installer les dépendances
RUN npm install

# Étape 5 : Copier tout le projet
COPY . .

# Étape 6 : Installer Expo CLI
RUN npm install -g expo-cli

# Étape 7 : Exposer les ports Expo
EXPOSE 8081 19000 19001

# Étape 8 : Commande de lancement Expo
CMD ["npx", "expo", "start", "--tunnel"]
