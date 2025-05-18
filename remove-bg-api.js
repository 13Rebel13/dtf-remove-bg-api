// === 🔧 remove-bg-api.js (complet) ===
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// CORS + CSP
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src *; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:");
  next();
});

// Fichiers publics (HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Page principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remove-background.html'));
});

// Traitement + décrémentation crédit
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const image = fs.readFileSync(imagePath);
    const apiKey = process.env.PHOTOROOM_API_KEY;

    const response = await axios({
      method: 'post',
      url: 'https://sdk.photoroom.com/v1/segment',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      data: image,
      responseType: 'arraybuffer'
    });

    fs.unlinkSync(imagePath); // 🔌 nettoyage image locale

    // ✅ Gestion crédits Outseta
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(400).json({ error: 'Email utilisateur manquant' });
    }

    // Récupérer l'utilisateur
    const getUser = await axios.get(`https://app.outseta.com/api/account/people?email=${userEmail}`, {
      auth: {
        username: process.env.OUTSETA_USER,
        password: process.env.OUTSETA_PASS
      }
    });

    const user = getUser.data[0];
    if (!user || user.Crédits <= 0) {
      return res.status(403).json({ error: 'Pas assez de crédits' });
    }

    // Mise à jour
    await axios.patch(`https://app.outseta.com/api/account/people/${user.Uid}`, {
      Crédits: user.Crédits - 1
    }, {
      auth: {
        username: process.env.OUTSETA_USER,
        password: process.env.OUTSETA_PASS
      }
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Erreur complète :', error);
    res.status(500).json({ error: "Erreur de traitement" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur le port ${PORT}`);
});
