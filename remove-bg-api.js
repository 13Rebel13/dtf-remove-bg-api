require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Autoriser les accès au dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Page HTML de test
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'remove-background.html'));
});

// API de suppression de fond
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const apiKey = process.env.PHOTOROOM_API_KEY;
    const image = fs.readFileSync(imagePath);

    const response = await axios({
      method: 'post',
      url: 'https://sdk.photoroom.com/v1/segment',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      data: image,
      responseType: 'arraybuffer',
    });

    fs.unlinkSync(imagePath); // Nettoyage du fichier temporaire
    res.set('Content-Type', 'image/png');
    res.send(response.data);

  } catch (error) {
    console.error('Erreur traitement :', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression du fond' });
  }
});

// Lancement serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur API remove-bg en ligne sur le port ${PORT}`);
});
