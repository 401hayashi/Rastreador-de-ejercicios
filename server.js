require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercisetracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Rutas
app.use('/api/users', require('./routes/users'));
app.use('/api/exercises', require('./routes/exercises'));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
