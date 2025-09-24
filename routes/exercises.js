const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const User = require('../models/User');

// Agregar ejercicio
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let { description, duration, date } = req.body;

    // Validar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validar campos requeridos
    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    // Parsear fecha
    if (!date || date === '') {
      date = new Date();
    } else {
      date = new Date(date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    }

    // Crear ejercicio
    const exercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Obtener log de ejercicios
router.get('/:userId/log', async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to, limit } = req.query;

    // Validar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Construir query
    let query = { userId };
    
    // Filtrar por fecha
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    // Ejecutar consulta
    let exercisesQuery = Exercise.find(query)
      .select('description duration date -_id')
      .sort({ date: 1 });

    if (limit) {
      exercisesQuery = exercisesQuery.limit(parseInt(limit));
    }

    const exercises = await exercisesQuery;

    // Formatear respuesta
    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
