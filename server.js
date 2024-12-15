const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const PASSWORD = process.env.API_PASSWORD;
const PORT = process.env.PORT;
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use("/public", express.static(path.join(__dirname, "public")));

const storiesFile = path.join(__dirname, "stories.json");

app.post("/api/stories", (req, res) => {
  const { password } = req.query;

  if (password !== PASSWORD) {
    console.log("Mot de passe invalide" + password);
    return res
      .status(403)
      .json({ error: "Accès refusé : mot de passe invalide." });
  }
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

app.get("/api/stories", (req, res) => {
  const { password } = req.query;

  if (password !== PASSWORD) {
    console.log("Mot de passe invalide" + password);
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

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
  console.log(`Mot de passe de l'API : ${PASSWORD}`);
});
