// ✅ BACKEND COMPLET POUR REMOVE-BG avec Outseta + Photoroom
// Fichier : remove-bg-api.js

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const Outseta = require('@outseta/sdk');
const outseta = new Outseta({
  subdomain: 'dtfswiss',
  apiKey: process.env.OUTSETA_API_KEY,
  secret: process.env.OUTSETA_API_SECRET
});

const app = express();
const upload = multer({ dest: 'uploads/' });

// ✅ Middleware CORS si besoin en test local
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email');
  next();
});

// ✅ Sert le HTML de test
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remove-background.html'));
});

// ✅ Endpoint API
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const image = fs.readFileSync(imagePath);
    const userEmail = req.headers['x-user-email'];
    const apiKey = process.env.PHOTOROOM_API_KEY;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email utilisateur manquant.' });
    }

    // 🔎 Vérifie l'utilisateur Outseta
    const user = await outseta.people.getByEmail(userEmail);
    const currentCredits = user.data.Crédits || 0;

    if (currentCredits <= 0) {
      return res.status(403).json({ error: 'Pas assez de crédits.' });
    }

    // 📤 Appel à l’API Photoroom
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

    // ✅ Décrémentation 1 crédit
    await outseta.people.update(user.data.Uid, {
      Crédits: currentCredits - 1
    });

    fs.unlinkSync(imagePath);
    res.set('Content-Type', 'image/png');
    res.send(response.data);

  } catch (error) {
    console.error('Erreur complète :', error);
    res.status(500).json({ error: 'Erreur de traitement' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur API remove-bg en ligne sur le port ${PORT}`);
});
