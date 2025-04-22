const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const { createUploadsFolder } = require('./utils/fileUtils');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

createUploadsFolder();

mongoose.connect(config.mongoURI)
  .then(() => console.log('Подключение к MongoDB успешно'))
  .catch((err) => console.error('Ошибка подключения к MongoDB:', err));

app.use('/api/auth', userRoutes);
app.use('/api/students', studentRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
