// ... imports (express, multer, axios, etc.)

const Outseta = require('@outseta/sdk'); // 📦 SDK officiel
const outseta = new Outseta({
  subdomain: 'dtfswiss', // ← adapte si différent
  apiKey: process.env.OUTSETA_API_KEY,
  secret: process.env.OUTSETA_API_SECRET,
});

app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const apiKey = process.env.PHOTOROOM_API_KEY || 'TA_CLE_API_ICI';
    const image = fs.readFileSync(imagePath);

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

    fs.unlinkSync(imagePath); // nettoie fichier temporaire

    // ➕ Décrémenter 1 crédit si réponse OK
    const userEmail = req.headers['x-user-email']; // doit être envoyé depuis frontend
    if (userEmail) {
      const user = await outseta.people.getByEmail(userEmail);
      const currentCredits = user.data.Crédits || 0;

      if (currentCredits > 0) {
        await outseta.people.update(user.data.Uid, {
          Crédits: currentCredits - 1
        });
      } else {
        return res.status(403).json({ error: 'Pas assez de crédits' });
      }
    }

    res.set('Content-Type', 'image/png');
    res.send(response.data);

  } catch (error) {
    console.error('Erreur traitement ou décrémentation :', error.message);
    res.status(500).json({ error: 'Erreur de traitement' });
  }
});
