// Express server qui sert de proxy sécurisé pour Photoroom
const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('image_file', req.file.buffer, req.file.originalname);
    formData.append('output_format', 'png');

    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PHOTOROOM_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Photoroom API failed' });
    }

    const resultBuffer = await response.buffer();
    res.set('Content-Type', 'image/png');
    res.send(resultBuffer);
  } catch (error) {
    console.error('Erreur proxy Photoroom:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur API remove-bg en ligne sur le port ${PORT}`);
});
