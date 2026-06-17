require('dotenv').config();
const app = require('./app');
const path = require('path');

app.use(require('express').static(path.join(__dirname, 'public')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
