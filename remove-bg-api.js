const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src *; style-src * 'unsafe-inline'; script-src * 'unsafe-inline'; img-src * data: blob:;");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Page de test GET /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remove-background.html'));
});

// Endpoint POST
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const apiKey = process.env.PHOTOROOM_API_KEY || '23ec806c3445329c8e36d6189803194190ea53e3';
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

    fs.unlinkSync(imagePath); // Nettoyer le fichier temporaire

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Erreur traitement :', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression du fond' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur API remove-bg en ligne sur le port ${PORT}`);
});
