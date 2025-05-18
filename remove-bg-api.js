const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Route test HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API de suppression d'arrière-plan
app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
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

    fs.unlinkSync(imagePath); // supprime le fichier temporaire
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Erreur complète :', error);
    res.status(500).json({ error: 'Erreur de traitement' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur actif sur le port ${PORT}`);
});
