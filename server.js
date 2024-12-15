const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const PASSWORD = process.env.API_PASSWORD;
const PORT = process.env.PORT;
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" })); // Supporte les images en base64
app.use("/public", express.static(path.join(__dirname, "public")));

// Chemin vers le fichier JSON contenant les métadonnées
const storiesFile = path.join(__dirname, "stories.json");

// Endpoint pour ajouter une story
app.post("/api/stories", (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Aucune image fournie." });
  }

  // Génère un nom de fichier unique pour l'image
  const randomString = encodeURIComponent(
    Math.random().toString(36).substring(2, 8)
  );
  const filename = `story-${randomString}-${Date.now()}.jpg`;
  const filepath = path.join(__dirname, "public", filename);

  // Enregistre l'image sur le disque
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFile(filepath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Erreur lors de l'enregistrement de l'image :", err);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }

    // Ajoute les métadonnées de la story dans stories.json
    const newStory = { filename, timestamp: Date.now() };
    const stories = JSON.parse(fs.readFileSync(storiesFile, "utf8"));
    stories.unshift(newStory); // Ajoute au début du tableau
    fs.writeFileSync(storiesFile, JSON.stringify(stories, null, 2));

    res.status(201).json({ message: "Story ajoutée avec succès." });
  });
});

// Endpoint pour récupérer les stories
app.get("/api/stories", (req, res) => {
  const { password } = req.query;

  if (password !== PASSWORD) {
    return res
      .status(403)
      .json({ error: "Accès refusé : mot de passe invalide." });
  }
  const stories = JSON.parse(fs.readFileSync(storiesFile, "utf8"));
  res.json(
    stories.map((story) => ({
      ...story,
      url: `${req.protocol}://${req.get("host")}/public/${story.filename}`,
    }))
  );
});

// Lance le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
