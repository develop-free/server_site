const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection URI
const uri = 'mongodb+srv://admin:admin@cluster0.sfjy9.mongodb.net/SITES?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri)
  .then(() => console.log('Подключение к БД успешно'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

app.use(cors()); // Use the cors middleware
app.use(bodyParser.json());
app.use('/api', userRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

