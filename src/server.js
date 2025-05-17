const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teachersRoutes = require('./routes/teachersRoutes');
const { createUploadsFolder } = require('./utils/fileUtils');


const app = express();
const PORT = process.env.PORT || 5000;

// Настройки CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Убедитесь, что это соответствует URL вашего фронтенда
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Создание папки для загрузок
createUploadsFolder();

// Подключение к MongoDB
mongoose.connect(config.mongoURI, {
})
  .then(() => console.log('Подключение к MongoDB успешно'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Маршруты
app.use('/api/auth', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', teachersRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
