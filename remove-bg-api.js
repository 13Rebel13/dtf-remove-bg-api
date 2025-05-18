require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/remove-background.html'));
});

app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const image = fs.readFileSync(imagePath);

    const apiKey = process.env.PHOTOROOM_API_KEY;
    const outsetaKey = process.env.OUTSETA_API_KEY;
    const outsetaSecret = process.env.OUTSETA_API_SECRET;

    // Traitement image avec PhotoRoom
    const photoRoomResponse = await axios({
      method: 'post',
      url: 'https://sdk.photoroom.com/v1/segment',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      data: image,
      responseType: 'arraybuffer'
    });

    fs.unlinkSync(imagePath); // Supprimer le fichier temporaire

    // Vérifie si l'email utilisateur est transmis dans les headers
    const userEmail = req.headers['x-user-email'];

    if (userEmail) {
      const auth = {
        username: outsetaKey,
        password: outsetaSecret
      };

      // 🔍 1. Récupère l'utilisateur
      const userResp = await axios.get(`https://app.outseta.com/api/v1/crm/people?search=${userEmail}`, { auth });

      const user = userResp.data.items[0];
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé dans Outseta' });
      }

      const currentCredits = user.Crédits || 0;
      if (currentCredits <= 0) {
        return res.status(403).json({ error: 'Pas assez de crédits' });
      }

      // ➖ 2. Décrémente les crédits
      await axios.put(`https://app.outseta.com/api/v1/crm/people/${user.Uid}`, {
        Crédits: currentCredits - 1
      }, { auth });
    }

    // ✅ Envoie l'image traitée
    res.set('Content-Type', 'image/png');
    res.send(photoRoomResponse.data);

  } catch (error) {
    console.error('Erreur traitement ou Outseta :', error.message);
    res.status(500).json({ error: 'Erreur pendant le traitement' });
  }
});

// Lancement serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur API remove-bg lancé sur le port ${PORT}`);
});
