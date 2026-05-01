const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const initDatabase = require('./src/database/initDatabase');
const registerApiRoutes = require('./src/routes/apiRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

registerApiRoutes(app);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server berjalan di http://localhost:${port}`);
      console.log(`Untuk akses dari mobile, gunakan: http://[IP-ADDRESS]:${port}`);
      console.log(`Cari IP address dengan command: ipconfig (Windows) atau ifconfig (Mac/Linux)`);
    });
  })
  .catch((error) => {
    console.error('Gagal inisialisasi database:', error);
    process.exit(1);
  });
