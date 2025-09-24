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
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/exercisetracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Esquemas y modelos
const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Routes

// POST /api/users - Crear usuario
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const newUser = new User({ username });
    await newUser.save();

    res.json({
      username: newUser.username,
      _id: newUser._id
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users - Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/:_id/exercises - Añadir ejercicio (ENDPOINT CRÍTICO)
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    let { description, duration, date } = req.body;

    // Validar usuario
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validaciones requeridas por freeCodeCamp
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!duration) {
      return res.status(400).json({ error: 'Duration is required' });
    }

    // Parsear duración a número
    duration = parseInt(duration);
    if (isNaN(duration)) {
      return res.status(400).json({ error: 'Duration must be a number' });
    }

    // Manejar fecha
    let exerciseDate;
    if (!date || date === '') {
      exerciseDate = new Date();
    } else {
      exerciseDate = new Date(date);
      if (isNaN(exerciseDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    }

    // Crear ejercicio
    const exercise = new Exercise({
      userId: _id,
      description,
      duration,
      date: exerciseDate
    });

    await exercise.save();

    // Respuesta EXACTA que espera freeCodeCamp
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString() // Formato requerido
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:_id/logs - Obtener log (ENDPOINT CRÍTICO)
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    // Validar usuario
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Construir query de fecha
    let dateQuery = {};
    if (from || to) {
      dateQuery.date = {};
      if (from) {
        dateQuery.date.$gte = new Date(from);
      }
      if (to) {
        dateQuery.date.$lte = new Date(to);
      }
    }

    // Obtener ejercicios con filtros
    let exercisesQuery = Exercise.find({ userId: _id, ...dateQuery })
      .select('description duration date -_id');

    // Aplicar límite si existe
    if (limit) {
      exercisesQuery = exercisesQuery.limit(parseInt(limit));
    }

    const exercises = await exercisesQuery;

    // Formatear log EXACTAMENTE como freeCodeCamp espera
    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString() // Formato requerido
    }));

    // Respuesta EXACTA que espera freeCodeCamp
    res.json({
      _id: user._id,
      username: user.username,
      count: log.length, // Propiedad count requerida
      log: log
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
