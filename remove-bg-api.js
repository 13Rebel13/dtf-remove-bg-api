// ✅ Version corrigée et 100% compatible Render + formulaire 
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const PHOTOROOM_API_KEY = process.env.PHOTOROOM_API_KEY || '23ec806c3445329c8e36d6189803194190ea53e3';

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 🔁 Page de test simple (HTML dans dossier public)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔄 Endpoint suppression de fond (POST image)
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const form = new FormData();
    form.append('image_file', fs.createReadStream(imagePath));

    const response = await axios.post('https://sdk.photoroom.com/v1/segment', form, {
      headers: {
        ...form.getHeaders(),
        'x-api-key': PHOTOROOM_API_KEY
      },
      responseType: 'arraybuffer'
    });

    fs.unlinkSync(imagePath); // Nettoyage

    if (response.status !== 200) {
      const errorText = Buffer.from(response.data).toString();
      console.error('Erreur API PhotoRoom :', errorText);
      return res.status(500).json({ error: 'Erreur API PhotoRoom', detail: errorText });
    }

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (err) {
    console.error('Erreur complète :', err);
    res.status(500).json({ error: 'Erreur de traitement' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur actif sur le port ${PORT}`);
});
