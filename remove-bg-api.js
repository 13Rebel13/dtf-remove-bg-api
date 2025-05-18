require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

const upload = multer({ dest: 'uploads/' });

// Middleware sécurité
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src *; style-src * 'unsafe-inline'; script-src * 'unsafe-inline'; img-src * data: blob:;");
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Page test
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remove-background.html'));
});

// Traitement API + décrémentation
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const image = fs.readFileSync(imagePath);
    const apiKey = process.env.PHOTOROOM_API_KEY;
    const email = req.headers['x-user-email'];

    if (!email) {
      return res.status(400).json({ error: 'Email utilisateur manquant.' });
    }

    // Appel Photoroom
    const response = await axios({
      method: 'post',
      url: 'https://sdk.photoroom.com/v1/segment',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      data: image,
      responseType: 'arraybuffer'
    });

    fs.unlinkSync(imagePath);

    // Vérifier crédits et décrémenter via Outseta
    const outsetaRes = await axios.get(`https://app.outseta.com/api/v1/crm/people?email=${email}`, {
      auth: {
        username: process.env.OUTSETA_API_KEY,
        password: process.env.OUTSETA_API_SECRET
      }
    });

    const user = outsetaRes.data.items[0];
    if (!user) return res.status(403).json({ error: 'Utilisateur non trouvé' });

    if (user.Crédits <= 0) return res.status(403).json({ error: 'Plus de crédits' });

    await axios.put(`https://app.outseta.com/api/v1/crm/people/${user.Uid}`, {
      Crédits: user.Crédits - 1
    }, {
      auth: {
        username: process.env.OUTSETA_API_KEY,
        password: process.env.OUTSETA_API_SECRET
      }
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);

  } catch (error) {
    console.error('Erreur complète :', error);
    res.status(500).json({ error: 'Erreur de traitement' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur remove-bg lancé sur port ${PORT}`);
});
