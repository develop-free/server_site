const express = require('express');
const app = express();
const clientRoutes = require('./routes/routesPage');

// Используйте маршрутизатор
app.use('/client', clientRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
