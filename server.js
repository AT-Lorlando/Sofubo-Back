const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const verifyApiKey = require("./middleware");

const PORT = process.env.PORT;
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use("/public", express.static(path.join(__dirname, "public")));

const storiesFile = path.join(__dirname, "stories.json");

app.post("/api/stories", verifyApiKey, (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Aucune image fournie." });
  }

  const randomString = encodeURIComponent(
    Math.random().toString(36).substring(2, 8)
  );
  const filename = `story-${randomString}-${Date.now()}.jpg`;
  const filepath = path.join(__dirname, "public", filename);

  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFile(filepath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Erreur lors de l'enregistrement de l'image :", err);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }

    const newStory = { filename, timestamp: Date.now() };
    const stories = JSON.parse(fs.readFileSync(storiesFile, "utf8"));
    stories.unshift(newStory);
    fs.writeFileSync(storiesFile, JSON.stringify(stories, null, 2));

    res.status(201).json({ message: "Story ajoutée avec succès." });
  });
});

app.get("/api/stories", verifyApiKey, (req, res) => {
  const stories = JSON.parse(fs.readFileSync(storiesFile, "utf8"));
  res.json(
    stories.map((story) => ({
      ...story,
      url: `${req.protocol}://${req.get("host")}/public/${story.filename}`,
    }))
  );
});

app.delete("/api/stories/last", verifyApiKey, (req, res) => {
  const stories = JSON.parse(fs.readFileSync(storiesFile, "utf8"));

  if (stories.length === 0) {
    return res
      .status(404)
      .json({ error: "Aucune story disponible pour suppression." });
  }

  // Récupère la dernière story
  const lastStory = stories[0];
  const filePath = path.join(__dirname, "public", lastStory.filename);

  // Supprime le fichier de l'image
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Erreur lors de la suppression de l'image :", err);
      return res
        .status(500)
        .json({ error: "Erreur interne lors de la suppression." });
    }

    // Supprime la story des métadonnées
    stories.shift();
    fs.writeFileSync(storiesFile, JSON.stringify(stories, null, 2));

    res.status(200).json({ message: "Dernière story supprimée avec succès." });
  });
});

app.delete("/api/stories", verifyApiKey, (req, res) => {
  const stories = JSON.parse(fs.readFileSync(storiesFile, "utf8"));

  if (stories.length === 0) {
    return res
      .status(404)
      .json({ error: "Aucune story disponible pour suppression." });
  }

  // Supprime tous les fichiers d'images
  const deletePromises = stories.map((story) => {
    const filePath = path.join(__dirname, "public", story.filename);
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  Promise.all(deletePromises)
    .then(() => {
      // Réinitialise le fichier JSON
      fs.writeFileSync(storiesFile, "[]", "utf8");
      res.status(200).json({
        message: "Toutes les stories ont été supprimées avec succès.",
      });
    })
    .catch((err) => {
      console.error("Erreur lors de la suppression des fichiers :", err);
      res
        .status(500)
        .json({ error: "Erreur interne lors de la suppression des stories." });
    });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur ${PORT}`);
});
