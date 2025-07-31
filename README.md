# 🔐 Roadtrip Planner API

Cette API vous fournira les données nécessaires pour la réalisation de l'exercice **Roadtrip Planner**.

## 📦 Exigences

- **Node.js v20.6+**
- npm ou yarn

## 🚀 Instructions d'installation

### 1. Cloner le dépôt

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le fichier `.env

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
ACCESS_TOKEN_SECRET=your_secret_key
LOGIN=your_login
PASSWORD=your_password
```

`LOGIN` et `PASSWORD` étant les variables qui vous permettront de vous authentifier à l'API.
`ACCESS_TOKEN_SECRET` peut prendre n'importe quelle valeur. Il sera transmis au front au moment du login et devra être transmis dans le header `Authorization` à chaque appel.

## ▶️ Exécuter le serveur

Démarrez le backend localement :

```bash
npm start
```

Le serveur fonctionnera sur : **http://localhost:3000**.

## 🔌 Swagger

Un swagger documentant l'API est disponible sur la route [/api-docs](http://localhost:3000/api-docs).

## 🔐 Flow d'authentification

Ce backend utilise un **jeton d'accès**, utilisé pour accéder aux routes protégées.

Il vous faudra donc le joindre à vos requêtes aux routes protégées en en-tête de cette façon : `Authorization: Bearer <jeton>`

## 🧠 Note du développeur

1. Toutes les routes sauf `/api/login` nécessitent un jeton d'accès valide.
2. Si vous avez besoin d'un identifiant unique pour chaque pays, utilisez le champ [cca3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3).
3. Pour plus d'information sur les champs des pays, voici [une documentation](https://gitlab.com/restcountries/restcountries/-/blob/master/FIELDS.md?ref_type=heads).

## 👤 Compte de test

Les informations de connexion pour la route `/api/login` sont à renseigner dans le fichier `.env` : **login** et **password**.
