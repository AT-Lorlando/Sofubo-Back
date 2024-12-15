const fs = require("fs");
const path = require("path");

// Chemin des fichiers et dossiers
const publicDir = path.join(__dirname, "public");
const storiesFile = path.join(__dirname, "stories.json");

// Création du dossier 'public' s'il n'existe pas
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log("Dossier public créé.");
} else {
  console.log("Dossier public déjà existant.");
}

// Création ou réinitialisation de 'stories.json'
if (!fs.existsSync(storiesFile)) {
  fs.writeFileSync(storiesFile, "[]", "utf8");
  console.log("Fichier stories.json créé.");
} else {
  fs.writeFileSync(storiesFile, "[]", "utf8");
  console.log("Fichier stories.json réinitialisé.");
}
