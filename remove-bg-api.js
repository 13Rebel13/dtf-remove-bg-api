const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remove-background.html'));
});

app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const image = fs.readFileSync(imagePath);
    const apiKey = process.env.PHOTOROOM_API_KEY || '23ec806c3445329c8e36d6189803194190ea53e3';

    const formData = new FormData();
    formData.append('image_file', fs.createReadStream(imagePath));
    formData.append('size', 'auto');

    const response = await axios.post('https://sdk.photoroom.com/v1/segment', formData, {
      headers: {
        ...formData.getHeaders(),
        'x-api-key': apiKey,
      },
      responseType: 'arraybuffer',
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
  console.log(`✅ Serveur remove-bg prêt sur le port ${PORT}`);
});
