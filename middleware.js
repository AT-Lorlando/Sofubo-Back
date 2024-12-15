const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== process.env.API_KEY) {
    console.log("Clé API invalide :", apiKey);
    return res.status(403).json({ error: "Accès refusé : clé API invalide." });
  }

  next();
};

module.exports = verifyApiKey;
